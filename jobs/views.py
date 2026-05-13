from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Job, Application, SavedJob
from .forms import JobForm


def job_list(request):
    """Browse all jobs — search + filter."""
    jobs = Job.objects.filter(status='active')

    query = request.GET.get('q', '')
    location = request.GET.get('location', '')
    job_type = request.GET.get('job_type', '')
    industry = request.GET.get('industry', '')
    experience = request.GET.get('experience', '')

    if query:
        jobs = jobs.filter(title__icontains=query)
    if location:
        jobs = jobs.filter(location__icontains=location)
    if job_type:
        jobs = jobs.filter(job_type=job_type)
    if industry:
        jobs = jobs.filter(industry__icontains=industry)
    if experience:
        jobs = jobs.filter(experience_level=experience)

    return render(request, 'jobs/job_list.html', {
        'jobs': jobs,
        'query': query,
        'location': location,
        'job_type': job_type,
        'industry': industry,
        'experience': experience,
        'total': jobs.count(),
    })


def job_detail(request, pk):
    """Job detail page — candidate view."""
    job = get_object_or_404(Job, pk=pk, status='active')
    has_applied = False
    is_saved = False

    if request.user.is_authenticated and hasattr(request.user, 'candidate_profile'):
        profile = request.user.candidate_profile
        has_applied = Application.objects.filter(job=job, candidate=profile).exists()
        is_saved = SavedJob.objects.filter(job=job, candidate=profile).exists()

    return render(request, 'jobs/job_detail.html', {
        'job': job,
        'has_applied': has_applied,
        'is_saved': is_saved,
    })


@login_required
def apply_job(request, pk):
    job = get_object_or_404(Job, pk=pk, status='active')
    if not request.user.is_candidate():
        messages.error(request, 'Only candidates can apply for jobs.')
        return redirect('job_detail', pk=pk)
    profile = request.user.candidate_profile
    Application.objects.get_or_create(job=job, candidate=profile)
    messages.success(request, f'Successfully applied to {job.title}!')
    return redirect('job_detail', pk=pk)


@login_required
def save_job(request, pk):
    job = get_object_or_404(Job, pk=pk)
    profile = request.user.candidate_profile
    saved, created = SavedJob.objects.get_or_create(job=job, candidate=profile)
    if not created:
        saved.delete()
    return redirect('job_detail', pk=pk)


@login_required
def post_job(request):
    """Post a new job — employer only."""
    if not request.user.is_employer():
        messages.error(request, 'Only employers can post jobs.')
        return redirect('job_list')
    form = JobForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        job = form.save(commit=False)
        job.employer = request.user.employer_profile
        job.save()
        messages.success(request, 'Job posted successfully!')
        return redirect('employer_dashboard')
    return render(request, 'jobs/post_job.html', {'form': form})


@login_required
def employer_dashboard(request):
    """Employer dashboard — posted jobs + recent applicants."""
    if not request.user.is_employer():
        return redirect('candidate_dashboard')
    employer = request.user.employer_profile
    jobs = employer.jobs.all()
    recent_applications = Application.objects.filter(
        job__employer=employer
    ).select_related('candidate__user', 'job').order_by('-applied_at')[:10]

    active_count = jobs.filter(status='active').count()
    total_applicants = Application.objects.filter(job__employer=employer).count()

    return render(request, 'employer/dashboard.html', {
        'jobs': jobs,
        'recent_applications': recent_applications,
        'active_count': active_count,
        'total_applicants': total_applicants,
    })


@login_required
def candidate_dashboard(request):
    """Candidate dashboard — applications + saved jobs + recommendations."""
    if not request.user.is_candidate():
        return redirect('employer_dashboard')
    profile = request.user.candidate_profile
    applications = profile.applications.select_related('job__employer').all()
    saved_jobs = profile.saved_jobs.select_related('job__employer').all()
    recommended = Job.objects.filter(status='active').exclude(
        applications__candidate=profile
    )[:5]

    return render(request, 'candidates/dashboard.html', {
        'profile': profile,
        'applications': applications,
        'saved_jobs': saved_jobs,
        'recommended': recommended,
    })
