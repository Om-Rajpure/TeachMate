from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import (
    Subject, Teacher, Division, Batch, Timetable, Lecture, Student, StudentSubject,
    Attendance, Chapter, LecturePlan, MarkType, Mark,
    Notification, ResourceFile, Experiment
)
from .serializers import (
    SubjectSerializer, TeacherSerializer, DivisionSerializer, 
    BatchSerializer, TimetableSerializer, LectureSerializer,
    StudentSerializer, AttendanceSerializer, 
    ChapterSerializer, LecturePlanSerializer,
    MarkTypeSerializer, MarkSerializer,
    NotificationSerializer, ResourceFileSerializer,
    ExperimentSerializer
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
    queryset = Subject.objects.filter(is_active=True)
    serializer_class = SubjectSerializer

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()

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


    @action(detail=False, methods=['post'])
    def parse(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Logging for debugging
        print(f"DEBUG: Receiving file: {file_obj.name}, Size: {file_obj.size} bytes")
        
        # Ensure we read from start if stream was consumed
        file_obj.seek(0)
        
        # Generate a unique temp path but preserve extension to help detection
        name_only, ext = os.path.splitext(file_obj.name)
        if not ext and file_obj.name.endswith('.xlsx'):
             ext = '.xlsx' # Fallback for some weird cases
             
        path = default_storage.save(f'tmp/{name_only}{ext}', ContentFile(file_obj.read()))
        full_path = os.path.join(settings.MEDIA_ROOT, path)
        
        try:
            print(f"DEBUG: Processing at {full_path}")
            if file_obj.name.endswith('.xlsx'):
                entries = TimetableParser.parse_excel(full_path)
            elif file_obj.name.endswith('.pdf'):
                entries = TimetableParser.parse_pdf(full_path)
            else:
                return Response({'error': 'Unsupported file format (must be .xlsx or .pdf)'}, status=status.HTTP_400_BAD_REQUEST)
            
            return Response(entries)
        except Exception as e:
            print(f"DEBUG ERROR in View: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            if os.path.exists(full_path):
                os.remove(full_path)

    def get_queryset(self):
        return Timetable.objects.all().order_by('day', 'start_time')

    @action(detail=False, methods=['get'])
    def exists(self, request):
        has_timetable = Timetable.objects.exists()
        return Response({'exists': has_timetable})

    @action(detail=False, methods=['get'])
    def all_grouped(self, request):
        from collections import defaultdict
        slots = Timetable.objects.all().order_by('day', 'start_time')
        grouped = defaultdict(list)
        for slot in slots:
            grouped[slot.day.lower()].append(TimetableSerializer(slot).data)
        return Response(grouped)

    @action(detail=False, methods=['get'])
    def all(self, request):
        return self.all_grouped(request)

    @action(detail=False, methods=['get'])
    def today(self, request):
        import datetime
        day = datetime.datetime.now().strftime('%A')
        slots = Timetable.objects.filter(day=day).order_by('start_time')
        return Response(TimetableSerializer(slots, many=True).data)

    @action(detail=False, methods=['get'])
    def current(self, request):
        import datetime
        now = datetime.datetime.now()
        day = now.strftime('%A')
        current_time = now.time()
        
        slot = Timetable.objects.filter(
            day=day, 
            start_time__lte=current_time, 
            end_time__gte=current_time
        ).first()
        
        if slot:
            return Response(TimetableSerializer(slot).data)
        return Response({'message': 'No active lecture'}, status=status.HTTP_404_NOT_FOUND)


    @action(detail=False, methods=['post'])
    def commit(self, request):
        entries = request.data
        if not isinstance(entries, list):
            return Response({'error': 'Expected a list of entries'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Clear existing timetable for this teacher (Global for now in this prototype)
        Timetable.objects.all().delete()
        
        created_count = 0
        warnings = []
        
        for entry in entries:
            try:
                # Subject mapping (Ensure theory/practical types match)
                subject_type = entry['subject_type'].lower()
                subject, _ = Subject.objects.get_or_create(
                    code=entry['subject_code'],
                    defaults={
                        'name': entry['subject_code'],
                        'subject_type': subject_type
                    }
                )
                
                division, _ = Division.objects.get_or_create(name=entry['division'])
                batch = None
                if entry.get('batch'):
                    batch, _ = Batch.objects.get_or_create(
                        name=entry['batch'],
                        division=division
                    )
                
                teacher = Teacher.objects.first() or Teacher.objects.create(name="Default Teacher", email="teacher@teachmate.ai")
                
                Timetable.objects.create(
                    day=entry['day'],
                    start_time=entry['start_time'],
                    end_time=entry['end_time'],
                    subject=subject,
                    subject_type=subject_type,
                    division=division,
                    batch=batch,
                    room=entry.get('room', ''),
                    teacher=teacher
                )
                created_count += 1
            except Exception as e:
                warnings.append(f"Error saving {entry.get('subject_code')}: {str(e)}")
        
        return Response({
            'message': 'Timetable uploaded successfully',
            'slots_created': created_count,
            'warnings': warnings
        })

class ExperimentViewSet(viewsets.ModelViewSet):
    queryset = Experiment.objects.all().order_by('experiment_number')
    serializer_class = ExperimentSerializer

    def get_queryset(self):
        queryset = Experiment.objects.all().order_by('experiment_number')
        subject = self.request.query_params.get('subject')
        if subject:
            queryset = queryset.filter(subject_id=subject)
        return queryset

    @action(detail=False, methods=['post'])
    def commit(self, request):
        entries = request.data.get('entries', [])
        subject_id = request.data.get('subject_id')
        
        if not subject_id:
            return Response({'error': 'subject_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            subject = Subject.objects.get(id=subject_id)
        except Subject.DoesNotExist:
            return Response({'error': 'Subject not found'}, status=status.HTTP_404_NOT_FOUND)

        Experiment.objects.filter(subject=subject).delete()
        created_count = 0
        for entry in entries:
            Experiment.objects.create(
                subject=subject,
                experiment_number=entry['experiment_number'],
                title=entry['title']
            )
            created_count += 1
        return Response({'status': 'success', 'created_count': created_count})

    @action(detail=False, methods=['post'])
    def reset(self, request):
        subject_id = request.data.get('subject_id')
        if not subject_id:
            return Response({'error': 'subject_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        Experiment.objects.filter(subject_id=subject_id).delete()
        return Response({'status': 'success', 'message': 'Experiments reset successfully'})

class LectureViewSet(viewsets.ModelViewSet):
    queryset = Lecture.objects.all().order_by('-date')
    serializer_class = LectureSerializer

    def perform_create(self, serializer):
        lecture = serializer.save()
        if lecture.topic:
            lecture.topic.status = 'Completed'
            lecture.topic.save()
        if lecture.experiment:
            lecture.experiment.status = 'Completed'
            lecture.experiment.save()

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
        total_p = LecturePlan.objects.count() + Experiment.objects.count()
        done_p = LecturePlan.objects.filter(status='Completed').count() + Experiment.objects.filter(status='Completed').count()
        syllabus_avg = round((done_p / total_p) * 100, 1) if total_p > 0 else 0
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
    queryset = Student.objects.all().order_by('name')
    serializer_class = StudentSerializer

    def get_queryset(self):
        from django.db import models
        subject_id = self.request.query_params.get('subject_id')
        queryset = Student.objects.all()
        
        if subject_id:
            # Filter by subject and annotate with subject-specific roll number for sorting
            queryset = queryset.filter(subject_links__subject_id=subject_id).annotate(
                subject_roll=models.F('subject_links__roll_number')
            ).order_by('subject_roll', 'name')
            
            # Filter by division/batch if provided
            division = self.request.query_params.get('division')
            batch = self.request.query_params.get('batch')
            if division:
                queryset = queryset.filter(subject_links__division_id=division)
            if batch:
                queryset = queryset.filter(subject_links__batch_id=batch)
        else:
            queryset = queryset.order_by('name')
            
        return queryset.distinct()

    def create(self, request, *args, **kwargs):
        subject_id = request.data.get('subject_id')
        if not subject_id:
            return Response({'error': 'subject_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        name = request.data.get('name', '').strip()
        div_id = request.data.get('division_id') # Expecting ID now from frontend
        batch_id = request.data.get('batch_id')
        roll_number = request.data.get('roll_number')

        if not name or not div_id or roll_number is None:
            return Response({'error': 'Name, Division, and Roll Number are required'}, status=status.HTTP_400_BAD_REQUEST)

        # Create or find global student
        student, _ = Student.objects.get_or_create(name=name)
        
        # Link to Subject with metadata
        StudentSubject.objects.update_or_create(
            student=student, 
            subject_id=subject_id,
            defaults={
                'roll_number': roll_number,
                'division_id': div_id,
                'batch_id': batch_id
            }
        )
        
        return Response(StudentSerializer(student, context={'request': request}).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        subject_id = request.data.get('subject_id')
        student = self.get_object()
        
        # Update name if provided
        name = request.data.get('name')
        if name:
            student.name = name.strip()
            student.save()
            
        if subject_id:
            div_id = request.data.get('division_id')
            batch_id = request.data.get('batch_id')
            roll_number = request.data.get('roll_number')
            
            if div_id and roll_number is not None:
                StudentSubject.objects.update_or_create(
                    student=student, 
                    subject_id=subject_id,
                    defaults={
                        'roll_number': roll_number,
                        'division_id': div_id,
                        'batch_id': batch_id
                    }
                )
        
        return Response(StudentSerializer(student, context={'request': request}).data)

    def destroy(self, request, *args, **kwargs):
        subject_id = self.request.query_params.get('subject_id')
        student = self.get_object()
        
        if subject_id:
            # Remove link only
            StudentSubject.objects.filter(student=student, subject_id=subject_id).delete()
            return Response({'message': 'Student removed from subject'}, status=status.HTTP_200_OK)
        
        # Fallback to global delete (existing feature)
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['post'])
    def upload(self, request):
        import pandas as pd
        file_obj = request.FILES.get('file')
        subject_id = request.data.get('subject_id')
        div_id = request.data.get('division_id')
        starting_roll = int(request.data.get('starting_roll', 1))
        mode = request.data.get('mode', 'append') 

        if not file_obj or not subject_id or not div_id:
            return Response({'error': 'File, subject_id, and division are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            subject = Subject.objects.get(id=subject_id)
            division = Division.objects.get(id=div_id)
        except (Subject.DoesNotExist, Division.DoesNotExist):
            return Response({'error': 'Subject or Division not found'}, status=status.HTTP_404_NOT_FOUND)

        if mode == 'replace':
            StudentSubject.objects.filter(subject=subject, division=division).delete()

        # Save and read excel
        path = default_storage.save('tmp/' + file_obj.name, ContentFile(file_obj.read()))
        full_path = os.path.join(settings.MEDIA_ROOT, path)

        try:
            df = pd.read_excel(full_path, engine='openpyxl')
            
            # Find name column
            name_col = None
            for col in df.columns:
                if 'name' in str(col).lower():
                    name_col = col
                    break

            if not name_col:
                return Response({'error': 'Excel must contain a "Name" column'}, status=status.HTTP_400_BAD_REQUEST)

            created_count = 0
            current_roll = starting_roll
            
            for _, row in df.iterrows():
                name = str(row[name_col]).strip()
                if not name or name == 'nan': continue

                student, _ = Student.objects.get_or_create(name=name)
                
                # Lookup by (student, subject) only — matches the unique_together constraint.
                # Division, roll_number, batch go into defaults to avoid UNIQUE violations.
                StudentSubject.objects.update_or_create(
                    student=student,
                    subject=subject,
                    defaults={
                        'roll_number': current_roll,
                        'division': division,
                    }
                )
                current_roll += 1
                created_count += 1

            return Response({
                'message': f'Successfully processed {created_count} students.',
                'students_added': created_count,
                'last_roll': current_roll - 1
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            if os.path.exists(full_path):
                os.remove(full_path)

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
    queryset = Attendance.objects.all().order_by('-date')
    serializer_class = AttendanceSerializer

    def list(self, request, *args, **kwargs):
        from django.db.models import Count, Q
        
        queryset = self.get_queryset()
        
        # Group by session identifiers
        sessions = queryset.values(
            'subject_id', 
            'subject__name', 
            'date', 
            'lecture_plan_id', 
            'lecture_plan__lecture_number',
            'lecture_plan__topic_name',
            'experiment_id',
            'experiment__experiment_number',
            'experiment__title'
        ).annotate(
            total_students=Count('id'),
            present_count=Count('id', filter=Q(status='P')),
            absent_count=Count('id', filter=Q(status='A'))
        ).order_by('-date', 'subject_id')

        # Attach student lists to each session
        result = []
        for session in sessions:
            # Re-fetch specific students for this session
            filters = {
                'subject_id': session['subject_id'],
                'date': session['date'],
                'lecture_plan_id': session['lecture_plan_id'],
                'experiment_id': session['experiment_id']
            }
            session_students = Attendance.objects.filter(**filters).select_related('student').order_by('student__subject_links__roll_number')
            
            students_list = []
            for record in session_students:
                # Find the roll number for this subject/division context
                # Note: This assumes the student is linked to the subject
                roll = record.student.subject_links.filter(subject_id=session['subject_id']).first()
                students_list.append({
                    'name': record.student.name,
                    'roll_number': roll.roll_number if roll else None,
                    'status': record.status
                })

            result.append({
                'subject_id': session['subject_id'],
                'subject_name': session['subject__name'],
                'date': session['date'].isoformat(),
                'lecture_number': session['lecture_plan__lecture_number'],
                'topic': session['lecture_plan__topic_name'] or session['experiment__title'] or "General Session",
                'type': 'PRACTICAL' if session['experiment_id'] else 'THEORY',
                'total_students': session['total_students'],
                'present_count': session['present_count'],
                'absent_count': session['absent_count'],
                'students': students_list
            })

        return Response(result)

    def get_queryset(self):
        queryset = Attendance.objects.all().order_by('-date')
        subject_id = self.request.query_params.get('subject_id')
        date = self.request.query_params.get('date')
        division = self.request.query_params.get('division')
        batch = self.request.query_params.get('batch')

        try:
            if subject_id and subject_id != 'undefined' and subject_id.isdigit():
                queryset = queryset.filter(subject_id=int(subject_id))
            if date and date != 'undefined' and date != '':
                queryset = queryset.filter(date=date)
            if division and division != 'undefined' and division != '':
                queryset = queryset.filter(student__subject_links__division__name=division)
            if batch and batch != 'undefined' and batch != '':
                queryset = queryset.filter(student__subject_links__batch__name=batch)
        except Exception as e:
            print(f"Error filtering attendance: {e}")
            return Attendance.objects.none()
        
        return queryset.distinct()

    @action(detail=False, methods=['get'], url_path='current-class')
    def current_class(self, request):
        import datetime
        now = datetime.datetime.now()
        day = now.strftime('%A')
        current_time = now.time()
        
        slot = Timetable.objects.filter(
            day=day, 
            start_time__lte=current_time, 
            end_time__gte=current_time
        ).select_related('subject', 'division', 'batch').first()
        
        if not slot:
            return Response({'message': 'No ongoing lecture detected'}, status=status.HTTP_404_NOT_FOUND)
            
        data = {
            'subject_id': slot.subject.id,
            'subject_name': slot.subject.name,
            'subject_code': slot.subject.code,
            'type': slot.subject_type.upper(),
            'division': slot.division.name,
            'batch': slot.batch.name if slot.batch else None,
            'start_time': slot.start_time.strftime('%H:%M'),
            'end_time': slot.end_time.strftime('%H:%M')
        }
        
        if slot.subject_type == 'theory':
            next_topic = LecturePlan.objects.filter(subject=slot.subject, status='Pending').first()
            if next_topic:
                data.update({
                    'lecture_id': next_topic.id,
                    'topic_or_title': next_topic.topic_name
                })
        else:
            next_exp = Experiment.objects.filter(subject=slot.subject, status='Pending').first()
            if next_exp:
                data.update({
                    'experiment_id': next_exp.id,
                    'topic_or_title': next_exp.title
                })
                
        return Response(data)

    @action(detail=False, methods=['post'])
    def mark(self, request):
        subject_id = request.data.get('subject_id')
        lecture_id = request.data.get('lecture_id')
        experiment_id = request.data.get('experiment_id')
        date = request.data.get('date', timezone.localdate())
        attendance_data = request.data.get('attendance', [])

        print(f"DEBUG: Marking attendance for subject={subject_id}, lecture={lecture_id}, date={date}, count={len(attendance_data)}")

        if not subject_id:
            return Response({'error': 'subject_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not attendance_data:
             return Response({'error': 'attendance data is empty or missing'}, status=status.HTTP_400_BAD_REQUEST)

        results = []
        try:
            for entry in attendance_data:
                student_id = entry['student_id']
                status_val = entry['status']
                
                print(f"DEBUG: Saving attendance for: {student_id} - status: {status_val}")
                
                obj, created = Attendance.objects.update_or_create(
                    student_id=student_id,
                    subject_id=subject_id,
                    lecture_plan_id=lecture_id,  # Points to syllabus topic
                    experiment_id=experiment_id, # Points to experiment title
                    date=date,
                    defaults={'status': status_val}
                )
                
                print(f"DEBUG: Saved successfully - {'created' if created else 'updated'}")
                results.append(AttendanceSerializer(obj).data)
                
            if request.data.get('mark_completed'):
                if lecture_id:
                    LecturePlan.objects.filter(id=lecture_id).update(status='Completed')
                if experiment_id:
                    Experiment.objects.filter(id=experiment_id).update(status='Completed')
                    
            return Response({'message': 'Attendance saved successfully', 'count': len(results)})
        except Exception as e:
            print(f"ERROR finalizing attendance: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        subject_id = request.query_params.get('subject_id')
        if not subject_id:
            return Response({'error': 'subject_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        students = Student.objects.filter(subject_links__subject_id=subject_id).order_by('name')
        summary_data = []
        for student in students:
            present_count = Attendance.objects.filter(student=student, subject_id=subject_id, status='P').count()
            total_student_sessions = Attendance.objects.filter(student=student, subject_id=subject_id).count()
            
            percentage = round((present_count / total_student_sessions * 100), 2) if total_student_sessions > 0 else 0
            
            summary_data.append({
                'name': student.name,
                'total_classes': total_student_sessions,
                'present': present_count,
                'percentage': percentage
            })
            
        return Response({'students': summary_data})

    @action(detail=False, methods=['get'], url_path='check-existing')
    def check_existing(self, request):
        subject_id = request.query_params.get('subject_id')
        lecture_id = request.query_params.get('lecture_id')
        experiment_id = request.query_params.get('experiment_id')
        date = request.query_params.get('date')

        if not subject_id or not date:
            return Response({'error': 'subject_id and date are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Build filter (ensure we only check for non-None IDs)
        filters = {'subject_id': subject_id, 'date': date}
        if lecture_id:
            filters['lecture_id'] = lecture_id
        if experiment_id:
            filters['experiment_id'] = experiment_id
        
        records = Attendance.objects.filter(**filters)
        
        if records.exists():
            return Response({
                'exists': True,
                'data': AttendanceSerializer(records, many=True).data
            })
        
        return Response({'exists': False, 'data': []})
        
    @action(detail=False, methods=['get'], url_path='syllabus-all')
    def syllabus_all(self, request):
        print(f"DEBUG: syllabus_all called for subject_id={request.query_params.get('subject_id')}")
        subject_id = request.query_params.get('subject_id')
        if not subject_id:
            return Response({'error': 'subject_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        subject = get_object_or_404(Subject, id=subject_id)
        
        data = []
        if subject.subject_type == 'theory':
            lectures = LecturePlan.objects.filter(subject_id=subject_id).order_by('lecture_number')
            for l in lectures:
                data.append({
                    'id': l.id,
                    'type': 'theory',
                    'number': l.lecture_number,
                    'topic': l.topic_name,
                    'display': f"Lecture {l.lecture_number} — {l.topic_name}",
                    'status': l.status
                })
        else:
            experiments = Experiment.objects.filter(subject_id=subject_id).order_by('experiment_number')
            for e in experiments:
                data.append({
                    'id': e.id,
                    'type': 'practical',
                    'number': e.experiment_number,
                    'topic': e.title,
                    'display': f"Experiment {e.experiment_number} — {e.title}",
                    'status': e.status
                })
        
        return Response(data)

class ChapterViewSet(viewsets.ModelViewSet):
    queryset = Chapter.objects.all()
    serializer_class = ChapterSerializer

    def get_queryset(self):
        queryset = Chapter.objects.all()
        subject = self.request.query_params.get('subject')
        if subject:
            queryset = queryset.filter(subject_id=subject)
        return queryset

class LecturePlanViewSet(viewsets.ModelViewSet):
    queryset = LecturePlan.objects.all().order_by('lecture_number')
    serializer_class = LecturePlanSerializer

    def get_queryset(self):
        queryset = LecturePlan.objects.all().order_by('lecture_number')
        subject = self.request.query_params.get('subject')
        if subject:
            queryset = queryset.filter(subject_id=subject)
        return queryset

    @action(detail=False, methods=['post'])
    def parse(self, request):
        file_obj = request.FILES.get('file')
        subject_type = request.data.get('type', 'theory')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        path = default_storage.save('tmp/' + file_obj.name, ContentFile(file_obj.read()))
        full_path = os.path.join(settings.MEDIA_ROOT, path)
        try:
            if subject_type == 'practical':
                entries = TimetableParser.parse_practical(full_path)
            else:
                entries = TimetableParser.parse_syllabus(full_path)
            return Response(entries)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            if os.path.exists(full_path):
                os.remove(full_path)

    @action(detail=False, methods=['post'])
    def commit(self, request):
        entries = request.data.get('entries', [])
        subject_id = request.data.get('subject_id')
        if not subject_id:
            return Response({'error': 'subject_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            subject = Subject.objects.get(id=subject_id)
        except Subject.DoesNotExist:
            return Response({'error': 'Subject not found'}, status=status.HTTP_404_NOT_FOUND)
        Chapter.objects.filter(subject=subject).delete()
        created_count = 0
        warnings = []
        for entry in entries:
            try:
                chapter, _ = Chapter.objects.get_or_create(
                    subject=subject,
                    name=entry['chapter_name'],
                    defaults={
                        'co_covered': entry.get('co', ''),
                        'total_lectures_required': entry.get('lecture_count', 1)
                    }
                )
                LecturePlan.objects.create(
                    subject=subject,
                    chapter=chapter,
                    lecture_number=entry['lecture_number'],
                    topic_name=entry['topic_name']
                )
                created_count += 1
            except Exception as e:
                warnings.append(f"Error saving L{entry.get('lecture_number')}: {str(e)}")
        return Response({'status': 'success', 'created_count': created_count, 'warnings': warnings})

    @action(detail=False, methods=['post'])
    def reset(self, request):
        subject_id = request.data.get('subject_id')
        if not subject_id:
            return Response({'error': 'subject_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        Chapter.objects.filter(subject_id=subject_id).delete()
        LecturePlan.objects.filter(subject_id=subject_id).delete()
        return Response({'status': 'success', 'message': 'Syllabus reset successfully'})

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
