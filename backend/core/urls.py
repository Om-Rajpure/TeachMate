from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SubjectViewSet, TeacherViewSet, DivisionViewSet, 
    BatchViewSet, TimetableViewSet, LectureViewSet,
    StudentViewSet, AttendanceViewSet, 
    SyllabusPlanViewSet, SyllabusProgressViewSet
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

urlpatterns = [
    path('', include(router.urls)),
]
