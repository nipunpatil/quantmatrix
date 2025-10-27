import os
import pandas as pd
from celery import shared_task
from django.conf import settings
from sqlalchemy import create_engine, text
from .models import Dataset

@shared_task(bind=True)
def process_and_store_data(self, dataset_id):
    print(f"\n@ done - [CELERY] Starting processing for dataset_id: {dataset_id}")
    
    dataset = Dataset.objects.get(id=dataset_id)
    
    try:
        dataset.status = 'processing'
        dataset.save(update_fields=['status'])
        
        # Load CSV
        file_path = dataset.original_file.path
        df = pd.read_csv(file_path)
        print(f"@ done -  [CELERY] Loaded {len(df)} rows from {os.path.basename(file_path)}")
        
        # Cleaning column names
        df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')
        
        # remove rows with all nulls
        for col in df.columns:
            if df[col].dtype in ['float64', 'int64']:
                df[col].fillna(df[col].median(), inplace=True)
            else:
                df[col].fillna('Unknown', inplace=True)
        
        # removing duplicates
        initial_rows = len(df)
        df.drop_duplicates(inplace=True)
        print(f"@ done -  [CELERY] Removed {initial_rows - len(df)} duplicate rows")
        
        # laoding to psql
        db_config = settings.DATABASES['default']
        connection_string = f"postgresql://{db_config['USER']}:{db_config['PASSWORD']}@{db_config['HOST']}:{db_config['PORT']}/{db_config['NAME']}"
        engine = create_engine(connection_string)
        
        raw_table_name = f"raw_data_{dataset_id}"
        df.to_sql(raw_table_name, engine, if_exists='replace', index=False, method='multi', chunksize=5000)
        print(f"@ done -  [CELERY] Raw data stored in table '{raw_table_name}'")
        
        # Create indexes
        with engine.connect() as conn:
            index_columns = ['brand', 'packtype', 'ppg', 'channel', 'year', 'month', 'date']
            for col in index_columns:
                if col in df.columns:
                    try:
                        conn.execute(text(f'CREATE INDEX IF NOT EXISTS idx_{raw_table_name}_{col} ON {raw_table_name} ({col})'))
                        conn.commit()
                    except Exception as e:
                        print(f">>>>  Index creation warning for {col}: {e}")
        
        print(f"@ done -  [CELERY] Indexes created")
        
        # Create aggregation tables
        create_aggregation_tables(engine, dataset_id, raw_table_name, df.columns.tolist())
        
        dataset.status = 'completed'
        dataset.error_message = None
        dataset.save(update_fields=['status', 'error_message'])
        print(f"@ done -  [CELERY] Dataset {dataset_id} completed successfully!")
        
    except Exception as e:
        print(f"~~X Error [CELERY ERROR] {str(e)}")
        dataset.status = 'failed'
        dataset.error_message = str(e)
        dataset.save(update_fields=['status', 'error_message'])
        raise e
    
    return f"Dataset {dataset_id} processed"


def create_aggregation_tables(engine, dataset_id, raw_table_name, columns):
    print(f"@ done -  [CELERY] Creating aggregation tables...")
    
    has_salesvalue = 'salesvalue' in columns
    has_volume = 'volume' in columns
    has_brand = 'brand' in columns
    has_year = 'year' in columns
    has_month = 'month' in columns
    has_date = 'date' in columns
    
    with engine.connect() as conn:
        # Market Share Table 
        if has_brand and has_salesvalue and has_volume:
            agg_table = f"agg_market_share_{dataset_id}"
            query = f"""
            CREATE TABLE {agg_table} AS
            SELECT 
                brand,
                ROUND(SUM(salesvalue)::numeric, 2) as brand_sales,
                ROUND(SUM(volume)::numeric, 2) as brand_volume,
                ROUND((100.0 * SUM(salesvalue)::numeric / NULLIF((SELECT SUM(salesvalue)::numeric FROM {raw_table_name}), 0)), 2) as sales_share_pct,
                ROUND((100.0 * SUM(volume)::numeric / NULLIF((SELECT SUM(volume)::numeric FROM {raw_table_name}), 0)), 2) as volume_share_pct
            FROM {raw_table_name}
            GROUP BY brand
            ORDER BY brand_sales DESC
            """
            try:
                conn.execute(text(f"DROP TABLE IF EXISTS {agg_table}"))
                conn.execute(text(query))
                conn.commit()
                print(f"@ done -  Created: {agg_table}")
            except Exception as e:
                print(f">>>>  Skipped {agg_table}: {e}")
    
    print(f"@ done -  [CELERY] All aggregation tables created")
