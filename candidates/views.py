from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from accounts.models import CandidateProfile


def candidate_list(request):
    """Browse all candidates — employer view with search + filter."""
    candidates = CandidateProfile.objects.select_related('user').all()

    query = request.GET.get('q', '')
    location = request.GET.get('location', '')
    availability = request.GET.get('availability', '')
    experience = request.GET.get('experience', '')

    if query:
        candidates = candidates.filter(skills__icontains=query) | \
                     candidates.filter(user__first_name__icontains=query) | \
                     candidates.filter(user__last_name__icontains=query)
    if location:
        candidates = candidates.filter(location__icontains=location)
    if availability:
        candidates = candidates.filter(availability__icontains=availability)

    return render(request, 'candidates/candidate_list.html', {
        'candidates': candidates.distinct(),
        'query': query,
        'location': location,
        'total': candidates.count(),
    })


def candidate_profile(request, pk):
    """Candidate profile detail — employer view."""
    candidate = get_object_or_404(CandidateProfile, pk=pk)
    return render(request, 'candidates/candidate_profile.html', {
        'candidate': candidate,
    })
