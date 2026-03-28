from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import (
    Subject, Teacher, Division, Batch, Timetable, Lecture, Student,
    Attendance, Chapter, LecturePlan, MarkType, Mark,
    Notification, ResourceFile
)
from .serializers import (
    SubjectSerializer, TeacherSerializer, DivisionSerializer, 
    BatchSerializer, TimetableSerializer, LectureSerializer,
    StudentSerializer, AttendanceSerializer, 
    ChapterSerializer, LecturePlanSerializer,
    MarkTypeSerializer, MarkSerializer,
    NotificationSerializer, ResourceFileSerializer
)
from .utils import TimetableParser
import os
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all().order_by('-created_at')
    serializer_class = NotificationSerializer

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'notification marked as read'})

    @action(detail=False, methods=['post'], url_path='read-all')
    def read_all(self, request):
        Notification.objects.filter(is_read=False).update(is_read=True)
        return Response({'status': 'all notifications marked as read'})

class ResourceFileViewSet(viewsets.ModelViewSet):
    queryset = ResourceFile.objects.all().order_by('-uploaded_at')
    serializer_class = ResourceFileSerializer

    def get_queryset(self):
        queryset = ResourceFile.objects.all()
        subject_id = self.request.query_params.get('subject', None)
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)
        return queryset

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

    @action(detail=False, methods=['post'])
    def parse(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Save temporary file
        path = default_storage.save('tmp/' + file_obj.name, ContentFile(file_obj.read()))
        full_path = os.path.join(settings.MEDIA_ROOT, path)
        
        try:
            if file_obj.name.endswith('.xlsx'):
                entries = TimetableParser.parse_excel(full_path)
            elif file_obj.name.endswith('.pdf'):
                entries = TimetableParser.parse_pdf(full_path)
            else:
                return Response({'error': 'Unsupported file format'}, status=status.HTTP_400_BAD_REQUEST)
            
            return Response(entries)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            if os.path.exists(full_path):
                os.remove(full_path)

    @action(detail=False, methods=['post'])
    def commit(self, request):
        entries = request.data
        if not isinstance(entries, list):
            return Response({'error': 'Expected a list of entries'}, status=status.HTTP_400_BAD_REQUEST)
        
        created_count = 0
        warnings = []
        
        for entry in entries:
            try:
                # 1. Get or Create Subject
                subject, _ = Subject.objects.get_or_create(
                    code=entry['subject_code'],
                    defaults={'name': entry['subject_code']}
                )
                
                # 2. Get or Create Division
                division, _ = Division.objects.get_or_create(name=entry['division'])
                
                # 3. Get or Create Batch (if provided)
                batch = None
                if entry.get('batch'):
                    batch, _ = Batch.objects.get_or_create(
                        name=entry['batch'],
                        division=division
                    )
                
                # 4. Teacher (Default to first teacher or create dummy for now)
                # In real app, we'd use request.user.teacher or search by name
                teacher = Teacher.objects.first()
                if not teacher:
                    teacher = Teacher.objects.create(name="Default Teacher", email="teacher@techmate.ai")

                # 5. Check for conflicts (Warning only)
                conflict = Timetable.objects.filter(
                    day=entry['day'],
                    start_time=entry['start_time'],
                    room=entry['room']
                ).exists()
                if conflict:
                    warnings.append(f"Conflict detected for {entry['subject_code']} on {entry['day']} at {entry['start_time']}. Entry still saved.")

                # 6. Create Timetable Entry
                Timetable.objects.create(
                    day=entry['day'],
                    start_time=entry['start_time'],
                    end_time=entry['end_time'],
                    subject=subject,
                    subject_type=entry['subject_type'],
                    division=division,
                    batch=batch,
                    room=entry.get('room', ''),
                    teacher=teacher
                )
                created_count += 1
            except Exception as e:
                warnings.append(f"Error saving {entry.get('subject_code')}: {str(e)}")
        
        return Response({
            'status': 'success',
            'created_count': created_count,
            'warnings': warnings
        })

class LectureViewSet(viewsets.ModelViewSet):
    queryset = Lecture.objects.all().order_by('-date')
    serializer_class = LectureSerializer

    def perform_create(self, serializer):
        lecture = serializer.save()
        if lecture.topic:
            lecture.topic.status = 'Completed'
            lecture.topic.save()

    @action(detail=False, methods=['get'])
    def stats(self, request):
        today = timezone.localdate()
        today_day = today.strftime('%A')
        timetable_entries = Timetable.objects.filter(day=today_day)
        total_today = timetable_entries.count()
        completed_lectures = Lecture.objects.filter(date=today, status='Completed').count()
        skipped_lectures = Lecture.objects.filter(date=today, status='Skipped').count()
        pending_today = total_today - (completed_lectures + skipped_lectures)
        
        all_students = Student.objects.all()
        att_percents = []
        for s in all_students:
            total_att = Attendance.objects.filter(student=s).count()
            if total_att > 0:
                present = Attendance.objects.filter(student=s, status='Present').count()
                att_percents.append((present / total_att) * 100)
        attendance_avg = sum(att_percents) / len(att_percents) if att_percents else 0
        
        all_planned = LecturePlan.objects.count()
        all_completed = LecturePlan.objects.filter(status='Completed').count()
        syllabus_avg = round((all_completed / all_planned) * 100, 1) if all_planned > 0 else 0
        
        return Response({
            'total_today': total_today,
            'completed_today': completed_lectures,
            'pending_today': max(0, pending_today),
            'today_day': today_day,
            'attendance_avg': round(attendance_avg, 1),
            'syllabus_avg': syllabus_avg
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
        attendance_data = request.data.get('attendance', [])
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

class ChapterViewSet(viewsets.ModelViewSet):
    queryset = Chapter.objects.all()
    serializer_class = ChapterSerializer

class LecturePlanViewSet(viewsets.ModelViewSet):
    queryset = LecturePlan.objects.all()
    serializer_class = LecturePlanSerializer

    @action(detail=False, methods=['post'])
    def parse(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Save temporary file
        path = default_storage.save('tmp/' + file_obj.name, ContentFile(file_obj.read()))
        full_path = os.path.join(settings.MEDIA_ROOT, path)
        
        try:
            if file_obj.name.endswith('.xlsx'):
                entries = TimetableParser.parse_syllabus(full_path)
            else:
                return Response({'error': 'Unsupported file format'}, status=status.HTTP_400_BAD_REQUEST)
            
            return Response(entries)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            if os.path.exists(full_path):
                os.remove(full_path)

    @action(detail=False, methods=['post'])
    def commit(self, request):
        entries = request.data
        if not isinstance(entries, list):
            return Response({'error': 'Expected a list of entries'}, status=status.HTTP_400_BAD_REQUEST)
        
        created_count = 0
        warnings = []
        
        # 1. Identify Subject
        subject = Subject.objects.first() 
        if not subject:
            return Response({'error': 'No subject found in database. Please create a subject first.'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. STRICT DELETE: Wipe existing syllabus for this subject
        # This prevents UNIQUE constraint (subject, lecture_number) errors
        try:
            Chapter.objects.filter(subject=subject).delete()
        except Exception as e:
            return Response({'error': f'Failed to clear old syllabus data: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # 3. CLEAN INSERT: Process new entries
        for entry in entries:
            try:
                # Get or Create Chapter
                chapter, _ = Chapter.objects.get_or_create(
                    subject=subject,
                    name=entry['chapter_name'],
                    defaults={
                        'co_covered': entry.get('co', ''),
                        'total_lectures_required': entry.get('lecture_count', 1)
                    }
                )
                
                # Create Lecture Plan Entry
                # Field mapping: backend 'topic_name' matches 'topic_name' from parser
                LecturePlan.objects.create(
                    subject=subject,
                    chapter=chapter,
                    lecture_number=entry['lecture_number'],
                    topic_name=entry['topic_name']
                )
                created_count += 1
            except Exception as e:
                warnings.append(f"Error saving L{entry.get('lecture_number')}: {str(e)}")
        
        return Response({
            'status': 'success',
            'created_count': created_count,
            'warnings': warnings
        })

class MarkTypeViewSet(viewsets.ModelViewSet):
    queryset = MarkType.objects.all()
    serializer_class = MarkTypeSerializer

    def get_queryset(self):
        queryset = MarkType.objects.all()
        subject = self.request.query_params.get('subject', None)
        if subject:
            queryset = queryset.filter(subject_id=subject)
        return queryset

class MarkViewSet(viewsets.ModelViewSet):
    queryset = Mark.objects.all()
    serializer_class = MarkSerializer

    def get_queryset(self):
        queryset = Mark.objects.all()
        student = self.request.query_params.get('student', None)
        subject = self.request.query_params.get('subject', None)
        mark_type = self.request.query_params.get('mark_type', None)
        if student:
            queryset = queryset.filter(student_id=student)
        if subject:
            queryset = queryset.filter(subject_id=subject)
        if mark_type:
            queryset = queryset.filter(mark_type_id=mark_type)
        return queryset

    @action(detail=False, methods=['post'], url_path='bulk')
    def bulk_update(self, request):
        subject_id = request.data.get('subject_id')
        mark_type_id = request.data.get('mark_type_id')
        marks_data = request.data.get('marks', [])
        if not subject_id or not mark_type_id:
            return Response({'error': 'subject_id and mark_type_id are required'}, status=status.HTTP_400_BAD_REQUEST)
        results = []
        for entry in marks_data:
            obj, created = Mark.objects.update_or_create(
                student_id=entry['student_id'],
                subject_id=subject_id,
                mark_type_id=mark_type_id,
                defaults={'marks_obtained': entry['marks_obtained']}
            )
            results.append(MarkSerializer(obj).data)
        return Response(results, status=status.HTTP_201_CREATED)

class AnalyticsViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['get'], url_path='class_analytics')
    def class_analytics(self, request):
        students = Student.objects.all()
        subjects = Subject.objects.all()
        if not students.exists():
            return Response({'error': 'No students found'}, status=404)
        student_performances = []
        for student in students:
            total_obtained = 0
            total_max = 0
            for subject in subjects:
                sub_obtained = 0
                sub_max = 0
                marks = Mark.objects.filter(student=student, subject=subject)
                for m in marks:
                    sub_obtained += m.marks_obtained
                    sub_max += m.mark_type.max_marks
                total_obtained += sub_obtained
                total_max += sub_max
            percentage = round((total_obtained / total_max * 100), 2) if total_max > 0 else 0
            student_performances.append({
                'id': student.id,
                'name': student.name,
                'roll_number': student.roll_number,
                'total_marks': total_obtained,
                'max_possible': total_max,
                'percentage': percentage,
                'grade': self._get_grade(percentage)
            })
        student_performances.sort(key=lambda x: x['percentage'], reverse=True)
        for i, p in enumerate(student_performances):
            p['rank'] = i + 1
        class_avg = sum(p['percentage'] for p in student_performances) / len(student_performances) if student_performances else 0
        subject_avgs = []
        for subject in subjects:
            sub_marks = Mark.objects.filter(subject=subject)
            sub_total = sum(m.marks_obtained for m in sub_marks)
            sub_max_total = sum(m.mark_type.max_marks for m in sub_marks)
            if sub_max_total > 0:
                subject_avgs.append({
                    'subject': subject.name,
                    'avg_percentage': round((sub_total / sub_max_total) * 100, 2)
                })
        return Response({
            'class_average': round(class_avg, 2),
            'total_students': len(student_performances),
            'toppers': student_performances[:3],
            'weak_students': [p for p in student_performances if p['percentage'] < 60],
            'subject_performance': subject_avgs,
            'student_performances': student_performances
        })

    def _get_grade(self, percentage):
        if percentage >= 90: return 'A+'
        if percentage >= 80: return 'A'
        if percentage >= 70: return 'B'
        if percentage >= 60: return 'C'
        if percentage >= 40: return 'D'
        return 'F'
