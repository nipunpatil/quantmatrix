from django.db import connection
from django.contrib.auth.models import User
from rest_framework import viewsets, status, views
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from core.models import Dataset, Project, Profile
from .serializers import (
    UserSerializer, ProjectSerializer, ProfileSerializer,
    DatasetStatusSerializer, DatasetUploadSerializer
)
from core.tasks import process_and_store_data


class RegisterViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    http_method_names = ['post']
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'message': 'User created successfully',
            'user': serializer.data
        }, status=status.HTTP_201_CREATED)


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.request.user.projects.all().order_by('-updated_at')

    def perform_create(self, serializer):
        project = serializer.save(owner=self.request.user)
        file = self.request.FILES.get('file')
        
        if file:
            dataset = Dataset.objects.create(
                project=project,
                name=f"{project.name}_dataset",
                original_file=file,
                status='pending'
            )
            process_and_store_data.delay(dataset.id)
            print(f"@ done -  [API] Project '{project.name}' created with dataset {dataset.id}")


class DatasetViewSet(viewsets.ModelViewSet):
    serializer_class = DatasetUploadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Dataset.objects.filter(project__owner=self.request.user).order_by('-created_at')

    def get_serializer_class(self):
        if self.action in ['retrieve', 'list']:
            return DatasetStatusSerializer
        return DatasetUploadSerializer

    def perform_create(self, serializer):
        dataset = serializer.save()
        process_and_store_data.delay(dataset.id)

    @action(detail=True, methods=['get'], url_path='filters')
    def filters(self, request, pk=None):
        
        dataset = self.get_object()
        
        print(f"📊 [FILTERS] Dataset {dataset.id}, status: {dataset.status}")
        
        if dataset.status != 'completed':
            return Response({
                'status': dataset.status,
                'brand': [],
                'packtype': [],
                'ppg': [],
                'channel': [],
                'year': []
            })
        
        raw_table = f"raw_data_{dataset.id}"
        
        try:
            with connection.cursor() as cursor:
                filters = {}
                # @ done -  FIXED: All column names are lowercase
                filter_columns = ['brand', 'packtype', 'ppg', 'channel', 'year']
                
                for column in filter_columns:
                    try:
                        # Use lowercase column names (no quotes needed)
                        cursor.execute(f"""
                            SELECT DISTINCT {column} 
                            FROM {raw_table} 
                            WHERE {column} IS NOT NULL 
                            ORDER BY {column}
                            LIMIT 500
                        """)
                        filters[column] = [row[0] for row in cursor.fetchall()]
                        print(f"@ done -  [FILTERS] {column}: {len(filters[column])} values")
                    except Exception as e:
                        print(f"⚠️  {column}: {e}")
                        filters[column] = []
            
            return Response(filters)
            
        except Exception as e:
            print(f"~~~ Error [FILTERS] Error: {e}")
            return Response({
                'brand': [],
                'packtype': [],
                'ppg': [],
                'channel': [],
                'year': []
            })


class AnalyticsView(views.APIView):
    
    permission_classes = [IsAuthenticated]

    def get(self, request, dataset_id):
        try:
            dataset = Dataset.objects.get(id=dataset_id, project__owner=request.user)
        except Dataset.DoesNotExist:
            return Response({'error': 'Dataset not found'}, status=status.HTTP_404_NOT_FOUND)

        if dataset.status != 'completed':
            return Response({
                'error': f'Dataset not ready. Status: {dataset.status}',
                'status': dataset.status
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get filter parameters
        brand = request.query_params.get('brand')
        pack_type = request.query_params.get('packType')
        ppg = request.query_params.get('ppg')
        channel = request.query_params.get('channel')
        year = request.query_params.get('year')

        response_data = {
            'dataset_info': {'id': dataset.id, 'name': dataset.name},
            'sales_by_brand_year': self.get_sales_by_brand_year(dataset_id, brand, pack_type, ppg, channel, year),
            'volume_by_brand_year': self.get_volume_by_brand_year(dataset_id, brand, pack_type, ppg, channel, year),
            'yearly_comparison': self.get_yearly_comparison(dataset_id, brand, pack_type, ppg, channel),
            'monthly_trend': self.get_monthly_trend(dataset_id, brand, pack_type, ppg, channel, year),
            'market_share': self.get_market_share(dataset_id, pack_type, ppg, channel, year)
        }

        return Response(response_data)

    def get_sales_by_brand_year(self, dataset_id, brand, pack_type, ppg, channel, year):
        
        raw_table = f"raw_data_{dataset_id}"
        conditions, params = self._build_filters(brand, pack_type, ppg, channel, year)
        where_clause = ' AND '.join(conditions) if conditions else '1=1'
        
        query = f"""
        SELECT 
            brand,
            year,
            ROUND(SUM(salesvalue)::numeric, 2) as total_sales
        FROM {raw_table}
        WHERE {where_clause}
        GROUP BY brand, year
        ORDER BY year, total_sales DESC
        """
        return self._execute_query(query, params)

    def get_volume_by_brand_year(self, dataset_id, brand, pack_type, ppg, channel, year):
        
        raw_table = f"raw_data_{dataset_id}"
        conditions, params = self._build_filters(brand, pack_type, ppg, channel, year)
        where_clause = ' AND '.join(conditions) if conditions else '1=1'
        
        query = f"""
        SELECT 
            brand,
            year,
            ROUND(SUM(volume)::numeric, 2) as total_volume
        FROM {raw_table}
        WHERE {where_clause}
        GROUP BY brand, year
        ORDER BY year, total_volume DESC
        """
        return self._execute_query(query, params)

    def get_yearly_comparison(self, dataset_id, brand, pack_type, ppg, channel):

        raw_table = f"raw_data_{dataset_id}"
        conditions, params = self._build_filters(brand, pack_type, ppg, channel, None)
        where_clause = ' AND '.join(conditions) if conditions else '1=1'
        
        query = f"""
        SELECT 
            brand,
            year,
            ROUND(SUM(salesvalue)::numeric, 2) as total_sales
        FROM {raw_table}
        WHERE {where_clause}
        GROUP BY brand, year
        ORDER BY brand, year
        """
        return self._execute_query(query, params)

    def get_monthly_trend(self, dataset_id, brand, pack_type, ppg, channel, year):
        
        raw_table = f"raw_data_{dataset_id}"
        conditions, params = self._build_filters(brand, pack_type, ppg, channel, year)
        conditions.append('date IS NOT NULL')
        where_clause = ' AND '.join(conditions)
        
        query = f"""
        SELECT 
            date,
            year,
            month,
            ROUND(SUM(salesvalue)::numeric, 2) as total_sales
        FROM {raw_table}
        WHERE {where_clause}
        GROUP BY date, year, month
        ORDER BY date
        """
        return self._execute_query(query, params)

    def get_market_share(self, dataset_id, pack_type, ppg, channel, year):
        
        raw_table = f"raw_data_{dataset_id}"
        conditions, params = self._build_filters(None, pack_type, ppg, channel, year)
        where_clause = ' AND '.join(conditions) if conditions else '1=1'
        
        query = f"""
        SELECT 
            brand,
            ROUND(SUM(salesvalue)::numeric, 2) as total_sales,
            ROUND(SUM(volume)::numeric, 2) as total_volume,
            ROUND((100.0 * SUM(salesvalue)::numeric / NULLIF((SELECT SUM(salesvalue)::numeric FROM {raw_table} WHERE {where_clause}), 0)), 2) as sales_share_pct
        FROM {raw_table}
        WHERE {where_clause}
        GROUP BY brand
        ORDER BY total_sales DESC
        """
        return self._execute_query(query, params)

    def _build_filters(self, brand, pack_type, ppg, channel, year):
        
        conditions = []
        params = []
        
        if brand:
            conditions.append('brand = %s')
            params.append(brand)
        if pack_type:
            conditions.append('packtype = %s')
            params.append(pack_type)
        if ppg:
            conditions.append('ppg = %s')
            params.append(ppg)
        if channel:
            conditions.append('channel = %s')
            params.append(channel)
        if year:
            conditions.append('year = %s')
            params.append(int(year))
        
        return conditions, params

    def _execute_query(self, query, params):
        try:
            with connection.cursor() as cursor:
                cursor.execute(query, params)
                columns = [col[0] for col in cursor.description]
                rows = cursor.fetchall()
            return [dict(zip(columns, row)) for row in rows]
        except Exception as e:
            print(f"~~~ Error Query error: {e}")
            return []
