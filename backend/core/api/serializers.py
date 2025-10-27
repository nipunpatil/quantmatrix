from rest_framework import serializers
from django.contrib.auth.models import User
from core.models import Profile, Project, Dataset

class UserSerializer(serializers.ModelSerializer):
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
        fields = ['user', 'first_name', 'last_name', 'job_title', 'company', 'profile_picture']

class ProjectSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')
    datasets = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    dataset_count = serializers.SerializerMethodField()
    file = serializers.FileField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'owner', 'datasets', 'dataset_count', 
                  'created_at', 'updated_at', 'file']
        read_only_fields = ['created_at', 'updated_at']

    def get_dataset_count(self, obj):
        return obj.datasets.count()
    
    def create(self, validated_data):
        # Remove 'file' from validated_data before creating Project
        validated_data.pop('file', None)
        project = Project.objects.create(**validated_data)
        return project

class DatasetUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields = ['id', 'project', 'name', 'original_file', 'created_at']
        read_only_fields = ['created_at']

class DatasetStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields = ['id', 'name', 'status', 'error_message', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
