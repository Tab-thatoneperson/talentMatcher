from django.db import models
from accounts.models import EmployerProfile


class Job(models.Model):
    JOB_TYPE_CHOICES = [
        ('full_time', 'Full-time'),
        ('part_time', 'Part-time'),
        ('contract', 'Contract'),
        ('internship', 'Internship'),
    ]
    EXPERIENCE_CHOICES = [
        ('entry', 'Entry Level'),
        ('mid', 'Mid Level'),
        ('senior', 'Senior'),
    ]
    WORK_MODE_CHOICES = [
        ('onsite', 'On-site'),
        ('hybrid', 'Hybrid'),
        ('remote', 'Remote'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('draft', 'Draft'),
        ('closed', 'Closed'),
    ]

    employer = models.ForeignKey(EmployerProfile, on_delete=models.CASCADE, related_name='jobs')
    title = models.CharField(max_length=200)
    industry = models.CharField(max_length=100)
    location = models.CharField(max_length=100)
    job_type = models.CharField(max_length=20, choices=JOB_TYPE_CHOICES, default='full_time')
    work_mode = models.CharField(max_length=20, choices=WORK_MODE_CHOICES, default='onsite')
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_CHOICES, default='mid')
    description = models.TextField()
    responsibilities = models.TextField(blank=True)
    required_skills = models.TextField(help_text="Comma-separated skills")
    salary_min = models.PositiveIntegerField(null=True, blank=True)
    salary_max = models.PositiveIntegerField(null=True, blank=True)
    show_salary = models.BooleanField(default=True)
    deadline = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_skills_list(self):
        return [s.strip() for s in self.required_skills.split(',') if s.strip()]

    def salary_display(self):
        if self.show_salary and self.salary_min and self.salary_max:
            return f"${self.salary_min:,}–${self.salary_max:,}"
        return "Salary not disclosed"

    def __str__(self):
        return f"{self.title} @ {self.employer.company_name}"

    class Meta:
        ordering = ['-created_at']


class Application(models.Model):
    STATUS_CHOICES = [
        ('applied', 'Applied'),
        ('in_review', 'In Review'),
        ('interview', 'Interview'),
        ('rejected', 'Rejected'),
        ('accepted', 'Accepted'),
    ]
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    candidate = models.ForeignKey('accounts.CandidateProfile', on_delete=models.CASCADE, related_name='applications')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='applied')
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('job', 'candidate')
        ordering = ['-applied_at']

    def __str__(self):
        return f"{self.candidate.user.get_full_name()} → {self.job.title}"


class SavedJob(models.Model):
    candidate = models.ForeignKey('accounts.CandidateProfile', on_delete=models.CASCADE, related_name='saved_jobs')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='saved_by')
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('candidate', 'job')
