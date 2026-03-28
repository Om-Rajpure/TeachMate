from django.urls import path, include
from . import auth_views
from rest_framework.routers import DefaultRouter
from .views import (
    SubjectViewSet, TeacherViewSet, DivisionViewSet, 
    BatchViewSet, TimetableViewSet, LectureViewSet,
    StudentViewSet, AttendanceViewSet, 
    SyllabusPlanViewSet, SyllabusProgressViewSet,
    MarkTypeViewSet, MarkViewSet, AnalyticsViewSet,
    NotificationViewSet, ResourceFileViewSet
)

router = DefaultRouter()
router.register(r'subjects', SubjectViewSet)
router.register(r'teachers', TeacherViewSet)
router.register(r'divisions', DivisionViewSet)
router.register(r'batches', BatchViewSet)
router.register(r'timetable', TimetableViewSet)
router.register(r'lectures', LectureViewSet)
router.register(r'students', StudentViewSet)
router.register(r'attendance', AttendanceViewSet)
router.register(r'syllabus/plan', SyllabusPlanViewSet)
router.register(r'syllabus/progress', SyllabusProgressViewSet)
router.register(r'mark-types', MarkTypeViewSet)
router.register(r'marks', MarkViewSet)
router.register(r'notifications', NotificationViewSet)
router.register(r'files', ResourceFileViewSet)
router.register(r'analytics', AnalyticsViewSet, basename='analytics')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', auth_views.login_view, name='auth-login'),
    path('auth/logout/', auth_views.logout_view, name='auth-logout'),
    path('auth/me/', auth_views.me_view, name='auth-me'),
]
