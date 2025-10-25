import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eda_backend.settings')

app = Celery('eda_backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()