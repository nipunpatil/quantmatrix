from rest_framework import serializers
from django.contrib.auth.models import User
from core.models import Profile, Project, Dataset

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new users.
    Handles password validation and secure hashing.
    """
    class Meta:
        model = User
        fields = ('id', 'username', 'password')
        extra_kwargs = {
            'password': {
                'write_only': True, 
                'required': True,
                'min_length': 8
            }
        }

    def create(self, validated_data):
       
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password']
        )
        return user



class ProfileSerializer(serializers.ModelSerializer):
  
    user = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = Profile
        fields = [
            'user',
            'first_name',
            'last_name',
            'job_title',
            'company',
            'profile_picture'
        ]


class ProjectSerializer(serializers.ModelSerializer):
    
    owner = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = Project
        fields = [
            'id',
            'name',
            'description',
            'status',
            'tags',
            'owner',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['owner', 'created_at', 'updated_at']

class DatasetUploadSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Dataset
        fields = [
            'project', 
            'description',
            'original_file'
        ]
       
class DatasetStatusSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Dataset
        fields = [
            'id',
            'project',
            'name',
            'description',
            'status',
            'file_size_bytes',
            'file_mime_type',
            'processing_started_at',
            'processing_completed_at',
            'error_message',
            'data_profile',
            'created_at',
            'updated_at'
        ]
       
        read_only_fields = fields