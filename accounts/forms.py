from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import User


class LoginForm(forms.Form):
    email = forms.EmailField(widget=forms.EmailInput(attrs={'placeholder': 'Email Address'}))
    password = forms.CharField(widget=forms.PasswordInput(attrs={'placeholder': 'Password'}))


class CandidateRegisterForm(UserCreationForm):
    first_name = forms.CharField(max_length=50)
    last_name = forms.CharField(max_length=50)
    email = forms.EmailField()

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'password1', 'password2']


class EmployerRegisterForm(UserCreationForm):
    email = forms.EmailField()
    company_name = forms.CharField(max_length=200)
    company_website = forms.URLField(required=False)

    class Meta:
        model = User
        fields = ['email', 'company_name', 'company_website', 'password1', 'password2']
