from rest_framework import serializers
from .models import (
    Subject, Teacher, Division, Batch, Timetable, Lecture, 
    Student, Attendance, Chapter, LecturePlan, MarkType, Mark,
    Notification, ResourceFile
)

# ... (rest of serializers)

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
    division_name = serializers.CharField(source='division.name', read_only=True)
    batch_name = serializers.CharField(source='batch.name', read_only=True, allow_null=True)
    attendance_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = '__all__'

    def get_attendance_percentage(self, obj):
        total = Attendance.objects.filter(student=obj).count()
        if total == 0: return 0
        present = Attendance.objects.filter(student=obj, status='Present').count()
        return round((present / total) * 100, 2)

class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    roll_number = serializers.CharField(source='student.roll_number', read_only=True)

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
    attendance_count = serializers.SerializerMethodField()

    class Meta:
        model = Lecture
        fields = '__all__'

    def get_attendance_count(self, obj):
        return {
            'present': obj.attendance.filter(status='Present').count(),
            'absent': obj.attendance.filter(status='Absent').count()
        }

class MarkTypeSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model = MarkType
        fields = '__all__'

class MarkSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    roll_number = serializers.CharField(source='student.roll_number', read_only=True)
    mark_type_name = serializers.CharField(source='mark_type.name', read_only=True)
    max_marks = serializers.IntegerField(source='mark_type.max_marks', read_only=True)

    class Meta:
        model = Mark
        fields = '__all__'
