from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    CANDIDATE = 'candidate'
    EMPLOYER = 'employer'
    ROLE_CHOICES = [
        (CANDIDATE, 'Candidate'),
        (EMPLOYER, 'Employer'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=CANDIDATE)

    def is_candidate(self):
        return self.role == self.CANDIDATE

    def is_employer(self):
        return self.role == self.EMPLOYER

    def __str__(self):
        return f"{self.username} ({self.role})"


class CandidateProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='candidate_profile')
    bio = models.TextField(blank=True)
    location = models.CharField(max_length=100, blank=True)
    skills = models.TextField(blank=True, help_text="Comma-separated skills")
    experience_years = models.PositiveIntegerField(default=0)
    resume = models.FileField(upload_to='resumes/', blank=True, null=True)
    availability = models.CharField(max_length=50, blank=True)
    expected_salary_min = models.PositiveIntegerField(null=True, blank=True)
    expected_salary_max = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def get_skills_list(self):
        return [s.strip() for s in self.skills.split(',') if s.strip()]

    def __str__(self):
        return f"{self.user.get_full_name()} - Candidate"


class EmployerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employer_profile')
    company_name = models.CharField(max_length=200)
    company_website = models.URLField(blank=True)
    company_description = models.TextField(blank=True)
    location = models.CharField(max_length=100, blank=True)
    logo = models.ImageField(upload_to='logos/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.company_name
