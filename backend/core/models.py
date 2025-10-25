from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

# user profile
class Profile(models.Model):
    #extra details other than django user 
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    job_title = models.CharField(max_length=100, blank=True)
    company = models.CharField(max_length=100, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    #singal fcntion to auto create profile as soon as a user is registered
    if created:
        Profile.objects.create(user=instance)
    instance.profile.save()


# projects model 
class Project(models.Model):
    #multiple fields of the project 
    class StatusChoices(models.TextChoices):
        ACTIVE = 'active', 'Active'
        ARCHIVED = 'archived', 'Archived'

    name = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    owner = models.ForeignKey(User, related_name='projects', on_delete=models.CASCADE) # many to one relation to user 
    status = models.CharField(max_length=10, choices=StatusChoices.choices, default=StatusChoices.ACTIVE)
    
    
    tags = models.CharField(max_length=255, blank=True, help_text="A comma-separated list of tags.")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
       # for a user not to make two projects with same name 
        unique_together = ('owner', 'name')
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.name} (Owner: {self.owner.username})"


# dataset model for the added files

class Dataset(models.Model):
    """
    Represents a single uploaded CSV file, its processing status, and metadata.
    """
    class StatusChoices(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PROCESSING = 'processing', 'Processing'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'
    
    project = models.ForeignKey(Project, related_name='datasets', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    original_file = models.FileField(upload_to='raw_datasets/')
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.PENDING)
    
    
    file_size_bytes = models.BigIntegerField(null=True, help_text="Size of the file in bytes.")
    file_mime_type = models.CharField(max_length=100, blank=True, help_text="MIME type of the uploaded file.")

    
    processing_started_at = models.DateTimeField(null=True, blank=True)
    processing_completed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)
    data_profile = models.JSONField(blank=True, null=True, help_text="Summary statistics of the processed data.")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.get_status_display()})"