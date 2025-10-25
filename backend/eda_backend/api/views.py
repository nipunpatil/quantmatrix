from django.http import HttpResponse
import datetime
from rest_framework import viewsets
from rest_framework.permissions import AllowAny , IsAuthenticated
from django.contrib.auth.models import User
from .serializers import UserSerializer , ProjectSerializer , ProfileSerializer , DatasetStatusSerializer , DatasetUploadSerializer


def current_datetime(request):
    now = datetime.datetime.now()
    html = '<html><body textcolor = red>it is now %s</body></html>' % now
    return HttpResponse(html)


class RegisterView(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    

class ProjectViewSet(viewsets.ModelViewSet) :
    permission_classes = [IsAuthenticated]
    serializer_class = ProjectSerializer
    
    def get_queryset(self):
        return self.request.user.projects.all().order_by('-updated_at')
    
    def perform_create(self, serializer):
        serializer.save(owner = self.request.user)

class DatasetViewSet(viewsets.ModelViewSet) : 
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        
        if (self.action == 'create') : 
            return DatasetUploadSerializer 
        else  : 
            return DatasetStatusSerializer 
    
    def perform_create(self, serializer):
        dataset  = serializer.save()

        uploaded_file = self.request.FILES.get('original_file')
        if uploaded_file :
            dataset.file_size_bytes = uploaded_file.size
            dataset.file_mime_bytes = uploaded_file.content_type

            from django.utils import timezone 
            dataset.processing_started_at =timezone.now()
            dataset.save()

       # process_and_store_data.delay(dataset.id)    