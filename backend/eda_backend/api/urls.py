from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import current_datetime, RegisterView , ProjectViewSet , DatasetViewSet

router = DefaultRouter() # router implemented for simpler navigatoin
router.register(r'register', RegisterView.show, basename='register')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'dataset' , DatasetViewSet , basename='dataset' )

urlpatterns = [
    path('time/', current_datetime, name='current_datetime'),
    path('', include(router.urls)),
      
]