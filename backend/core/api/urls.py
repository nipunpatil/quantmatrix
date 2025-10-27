from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterViewSet, 
    ProjectViewSet, 
    DatasetViewSet,
    AnalyticsView
)

router = DefaultRouter()
router.register('register', RegisterViewSet, basename='register')
router.register('projects', ProjectViewSet, basename='projects')
router.register('datasets', DatasetViewSet, basename='datasets')

urlpatterns = [
    path('', include(router.urls)),
    path('datasets/<int:dataset_id>/analytics/', AnalyticsView.as_view(), name='analytics'),
]
