from rest_framework import serializers
from .models import (
    Subject, Teacher, Division, Batch, Timetable, Lecture, 
    Student, StudentSubject, Attendance, Chapter, LecturePlan,
    Notification, ResourceFile, Experiment, TheoryMark, PracticalMark, Marks
)

class ExperimentSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model = Experiment
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class ResourceFileSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ResourceFile
        fields = ['id', 'title', 'file', 'file_url', 'subject', 'subject_name', 'uploaded_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = '__all__'

class TeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = '__all__'

class DivisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Division
        fields = '__all__'

class BatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Batch
        fields = '__all__'

class TimetableSerializer(serializers.ModelSerializer):
    subject_details = SubjectSerializer(source='subject', read_only=True)
    teacher_name = serializers.CharField(source='teacher.name', read_only=True)
    division_name = serializers.CharField(source='division.name', read_only=True)
    batch_name = serializers.CharField(source='batch.name', read_only=True, allow_null=True)

    class Meta:
        model = Timetable
        fields = '__all__'

class StudentSerializer(serializers.ModelSerializer):
    roll_number = serializers.SerializerMethodField()
    division_name = serializers.SerializerMethodField()
    batch_name = serializers.SerializerMethodField()
    attendance_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = ['id', 'name', 'roll_number', 'division_name', 'batch_name', 'attendance_percentage', 'created_at']

    def _get_link(self, obj):
        request = self.context.get('request')
        if not request: return None
        subject_id = request.query_params.get('subject_id')
        if not subject_id: return None
        return obj.subject_links.filter(subject_id=subject_id).select_related('division', 'batch').first()

    def get_roll_number(self, obj):
        link = self._get_link(obj)
        return link.roll_number if link else None

    def get_division_name(self, obj):
        link = self._get_link(obj)
        return link.division.name if link and link.division else None

    def get_batch_name(self, obj):
        link = self._get_link(obj)
        return link.batch.name if link and link.batch else None

    def get_attendance_percentage(self, obj):
        total = Attendance.objects.filter(student=obj).count()
        if total == 0: return 0
        present = Attendance.objects.filter(student=obj, status='Present').count()
        return round((present / total) * 100, 2)

class StudentSubjectSerializer(serializers.ModelSerializer):
    student_details = StudentSerializer(source='student', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model = StudentSubject
        fields = '__all__'

class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    lecture_topic = serializers.CharField(source='lecture_plan.topic_name', read_only=True, allow_null=True)
    experiment_title = serializers.CharField(source='experiment.title', read_only=True, allow_null=True)

    class Meta:
        model = Attendance
        fields = '__all__'

class ChapterSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model = Chapter
        fields = '__all__'

class LecturePlanSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    chapter_name = serializers.CharField(source='chapter.name', read_only=True)

    class Meta:
        model = LecturePlan
        fields = '__all__'

class LectureSerializer(serializers.ModelSerializer):
    timetable_details = TimetableSerializer(source='timetable', read_only=True)
    topic_details = LecturePlanSerializer(source='topic', read_only=True)
    experiment_details = ExperimentSerializer(source='experiment', read_only=True)
    attendance_count = serializers.SerializerMethodField()

    class Meta:
        model = Lecture
        fields = '__all__'

    def get_attendance_count(self, obj):
        # Filter related attendance by status mapping Present/Absent
        # Backend Attendance model uses 'P'/'A' or 'Present'/'Absent'? 
        # Models.py says 'Present'/'Absent'? Let me check attendance model.
        return {
            'present': obj.attendance.filter(status='Present').count(),
            'absent': obj.attendance.filter(status='Absent').count()
        }

class TheoryMarkSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    roll_number = serializers.SerializerMethodField()
    percentage = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = TheoryMark
        fields = '__all__'

    def get_roll_number(self, obj):
        link = StudentSubject.objects.filter(student=obj.student, subject=obj.subject).first()
        return link.roll_number if link else None

    def get_percentage(self, obj):
        if obj.max_marks > 0:
            return round((obj.marks_obtained / obj.max_marks) * 100, 2)
        return 0

    def get_status(self, obj):
        return "PASS" if obj.marks_obtained >= obj.pass_marks else "FAIL"

class PracticalMarkSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    roll_number = serializers.SerializerMethodField()
    total_marks = serializers.ReadOnlyField()

    class Meta:
        model = PracticalMark
        fields = '__all__'

    def get_roll_number(self, obj):
        link = StudentSubject.objects.filter(student=obj.student, subject=obj.subject).first()
        return link.roll_number if link else None
class MarksSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    roll_number = serializers.SerializerMethodField()

    class Meta:
        model = Marks
        fields = '__all__'

    def get_roll_number(self, obj):
        link = StudentSubject.objects.filter(student=obj.student, subject=obj.subject).first()
        return link.roll_number if link else None
