from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import User, CandidateProfile, EmployerProfile
from .forms import CandidateRegisterForm, EmployerRegisterForm, LoginForm


def login_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
    form = LoginForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        user = authenticate(
            request,
            username=form.cleaned_data['email'],
            password=form.cleaned_data['password']
        )
        if user:
            login(request, user)
            return redirect('dashboard')
        messages.error(request, 'Invalid email or password.')
    return render(request, 'accounts/login.html', {'form': form})


def logout_view(request):
    logout(request)
    return redirect('login')


def register_candidate(request):
    form = CandidateRegisterForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        user = form.save(commit=False)
        user.role = User.CANDIDATE
        user.username = form.cleaned_data['email']
        user.save()
        CandidateProfile.objects.create(user=user)
        login(request, user)
        return redirect('candidate_setup')
    return render(request, 'accounts/register_candidate.html', {'form': form})


def register_employer(request):
    form = EmployerRegisterForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        user = form.save(commit=False)
        user.role = User.EMPLOYER
        user.username = form.cleaned_data['email']
        user.save()
        EmployerProfile.objects.create(
            user=user,
            company_name=form.cleaned_data['company_name'],
            company_website=form.cleaned_data.get('company_website', '')
        )
        login(request, user)
        return redirect('dashboard')
    return render(request, 'accounts/register_employer.html', {'form': form})


@login_required
def dashboard(request):
    if request.user.is_candidate():
        return redirect('candidate_dashboard')
    return redirect('employer_dashboard')


@login_required
def candidate_setup(request):
    """Profile setup step after candidate registration."""
    profile = request.user.candidate_profile
    if request.method == 'POST':
        profile.resume = request.FILES.get('resume', profile.resume)
        profile.skills = request.POST.get('skills', '')
        profile.location = request.POST.get('location', '')
        profile.save()
        return redirect('candidate_dashboard')
    return render(request, 'accounts/candidate_setup.html', {'profile': profile})
