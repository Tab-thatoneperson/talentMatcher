from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('register/candidate/', views.register_candidate, name='register_candidate'),
    path('register/employer/', views.register_employer, name='register_employer'),
    path('setup/', views.candidate_setup, name='candidate_setup'),
    path('dashboard/', views.dashboard, name='dashboard'),
]
