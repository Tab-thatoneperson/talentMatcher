from django import forms
from .models import Job


class JobForm(forms.ModelForm):
    class Meta:
        model = Job
        fields = [
            'title', 'industry', 'location', 'job_type', 'work_mode',
            'experience_level', 'description', 'responsibilities',
            'required_skills', 'salary_min', 'salary_max',
            'show_salary', 'deadline', 'status',
        ]
        widgets = {
            'description': forms.Textarea(attrs={'rows': 4}),
            'responsibilities': forms.Textarea(attrs={'rows': 3}),
            'deadline': forms.DateInput(attrs={'type': 'date'}),
        }
