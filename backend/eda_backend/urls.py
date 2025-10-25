from django.urls import path
from .api.views import current_datetime
from django.urls import include , path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.contrib import admin
from rest_framework.routers import DefaultRouter
from .api.views import DatasetViewSet, RegisterView, current_datetime  , ProjectViewSet

router = DefaultRouter()
router.register(r'register', RegisterView, basename='register')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'datasets', DatasetViewSet, basename='dataset')


urlpatterns = [
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('time/', view= current_datetime), # testing working or not 
    path('api/', include(router.urls)) # url routing user routers 
    

]