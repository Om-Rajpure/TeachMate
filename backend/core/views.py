from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import (
    Subject, Teacher, Division, Batch, Timetable, Lecture,
    Student, Attendance, SyllabusPlan, SyllabusProgress
)
from .serializers import (
    SubjectSerializer, TeacherSerializer, DivisionSerializer, 
    BatchSerializer, TimetableSerializer, LectureSerializer,
    StudentSerializer, AttendanceSerializer, 
    SyllabusPlanSerializer, SyllabusProgressSerializer
)

class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer

class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer

class DivisionViewSet(viewsets.ModelViewSet):
    queryset = Division.objects.all()
    serializer_class = DivisionSerializer

class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer

class TimetableViewSet(viewsets.ModelViewSet):
    queryset = Timetable.objects.all()
    serializer_class = TimetableSerializer

    def get_queryset(self):
        queryset = Timetable.objects.all()
        day = self.request.query_params.get('day', None)
        if day:
            queryset = queryset.filter(day=day)
        return queryset

class LectureViewSet(viewsets.ModelViewSet):
    queryset = Lecture.objects.all().order_by('-date')
    serializer_class = LectureSerializer

    def perform_create(self, serializer):
        lecture = serializer.save()
        # Automatically update syllabus progress if a topic was selected
        if lecture.topic:
            # Topic name is already in the SyllabusPlan model
            progress, created = SyllabusProgress.objects.get_or_create(
                subject=lecture.timetable.subject,
                topic_name=lecture.topic.topic_name
            )
            progress.lectures_completed += 1
            progress.save()

    @action(detail=False, methods=['get'])
    def stats(self, request):
        today = timezone.localdate()
        today_day = today.strftime('%A')
        
        # Today's Lecture Stats
        timetable_entries = Timetable.objects.filter(day=today_day)
        total_today = timetable_entries.count()
        completed_lectures = Lecture.objects.filter(date=today, status='Completed').count()
        skipped_lectures = Lecture.objects.filter(date=today, status='Skipped').count()
        pending_today = total_today - (completed_lectures + skipped_lectures)
        
        # Aggregate Attendance %
        all_students = Student.objects.all()
        att_percents = []
        for s in all_students:
            total_att = Attendance.objects.filter(student=s).count()
            if total_att > 0:
                present = Attendance.objects.filter(student=s, status='Present').count()
                att_percents.append((present / total_att) * 100)
        
        attendance_avg = sum(att_percents) / len(att_percents) if att_percents else 0
        
        # Aggregate Syllabus %
        all_progress = SyllabusProgress.objects.all()
        prog_percents = [p.completion_percentage for p in all_progress]
        syllabus_avg = sum(prog_percents) / len(prog_percents) if prog_percents else 0
        
        return Response({
            'total_today': total_today,
            'completed_today': completed_lectures,
            'pending_today': max(0, pending_today),
            'today_day': today_day,
            'attendance_avg': round(attendance_avg, 1),
            'syllabus_avg': round(syllabus_avg, 1)
        })

    @action(detail=False, methods=['get'])
    def today(self, request):
        today = timezone.localdate()
        today_day = today.strftime('%A')
        timetable_entries = Timetable.objects.filter(day=today_day)
        logged_lectures = Lecture.objects.filter(date=today)
        logged_map = {l.timetable_id: l for l in logged_lectures}
        serializer = TimetableSerializer(timetable_entries, many=True)
        data = serializer.data
        for item in data:
            lecture = logged_map.get(item['id'])
            if lecture:
                item['lecture_status'] = lecture.status
                item['lecture_id'] = lecture.id
            else:
                item['lecture_status'] = None
        return Response(data)

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer

    def get_queryset(self):
        queryset = Student.objects.all()
        division = self.request.query_params.get('division', None)
        batch = self.request.query_params.get('batch', None)
        if division:
            queryset = queryset.filter(division_id=division)
        if batch:
            queryset = queryset.filter(batch_id=batch)
        return queryset

    @action(detail=False, methods=['get'])
    def defaulters(self, request):
        all_students = Student.objects.all()
        defaulters = []
        for student in all_students:
            # Re-using the logic from serializer for consistency
            total = Attendance.objects.filter(student=student).count()
            if total > 0:
                present = Attendance.objects.filter(student=student, status='Present').count()
                percent = (present / total) * 100
                if percent < 75:
                    defaulters.append(StudentSerializer(student).data)
        return Response(defaulters)

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer

    @action(detail=False, methods=['post'], url_path='bulk')
    def bulk_create(self, request):
        lecture_id = request.data.get('lecture_id')
        attendance_data = request.data.get('attendance', []) # List of {student_id, status}
        
        if not lecture_id:
            return Response({'error': 'lecture_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        results = []
        for entry in attendance_data:
            obj, created = Attendance.objects.update_or_create(
                lecture_id=lecture_id,
                student_id=entry['student_id'],
                defaults={'status': entry['status']}
            )
            results.append(AttendanceSerializer(obj).data)
            
        return Response(results, status=status.HTTP_201_CREATED)

class SyllabusPlanViewSet(viewsets.ModelViewSet):
    queryset = SyllabusPlan.objects.all()
    serializer_class = SyllabusPlanSerializer

class SyllabusProgressViewSet(viewsets.ModelViewSet):
    queryset = SyllabusProgress.objects.all()
    serializer_class = SyllabusProgressSerializer
