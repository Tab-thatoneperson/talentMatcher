from django.urls import path
from . import views

urlpatterns = [
    path('', views.job_list, name='job_list'),
    path('<int:pk>/', views.job_detail, name='job_detail'),
    path('<int:pk>/apply/', views.apply_job, name='apply_job'),
    path('<int:pk>/save/', views.save_job, name='save_job'),
    path('post/', views.post_job, name='post_job'),
    path('dashboard/employer/', views.employer_dashboard, name='employer_dashboard'),
    path('dashboard/candidate/', views.candidate_dashboard, name='candidate_dashboard'),
]
