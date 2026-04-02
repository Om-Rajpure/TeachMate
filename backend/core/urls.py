from django.urls import path, include
from . import auth_views
from rest_framework.routers import DefaultRouter
from .views import (
    SubjectViewSet, TeacherViewSet, DivisionViewSet, 
    BatchViewSet, TimetableViewSet, LectureViewSet,
    StudentViewSet, AttendanceViewSet, 
    ChapterViewSet, LecturePlanViewSet,
    TheoryMarkViewSet, PracticalMarkViewSet, MarkUploadView, AnalyticsViewSet,
    NotificationViewSet, ResourceViewSet, ExperimentViewSet, MarksViewSet
)

router = DefaultRouter()
router.register(r'marks', MarksViewSet)
router.register(r'subjects', SubjectViewSet)
router.register(r'teachers', TeacherViewSet)
router.register(r'divisions', DivisionViewSet)
router.register(r'batches', BatchViewSet)
router.register(r'timetable', TimetableViewSet)
router.register(r'lectures', LectureViewSet)
router.register(r'students', StudentViewSet)
router.register(r'attendance', AttendanceViewSet)
router.register(r'syllabus/chapters', ChapterViewSet)
router.register(r'syllabus/lecture-plan', LecturePlanViewSet)
router.register(r'syllabus/experiments', ExperimentViewSet)
router.register(r'marks/theory', TheoryMarkViewSet)
router.register(r'marks/practical', PracticalMarkViewSet)
router.register(r'notifications', NotificationViewSet)
router.register(r'resources', ResourceViewSet)
router.register(r'analytics', AnalyticsViewSet, basename='analytics')

urlpatterns = [
    path('', include(router.urls)),
    path('marks/upload/', MarkUploadView.as_view(), name='marks-upload'),
    path('auth/login/', auth_views.login_view, name='auth-login'),
    path('auth/logout/', auth_views.logout_view, name='auth-logout'),
    path('auth/me/', auth_views.me_view, name='auth-me'),
]
