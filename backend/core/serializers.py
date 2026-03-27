from rest_framework import serializers
from .models import (
    Subject, Teacher, Division, Batch, Timetable, Lecture, 
    Student, Attendance, SyllabusPlan, SyllabusProgress
)

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

class SyllabusPlanSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model = SyllabusPlan
        fields = '__all__'

class SyllabusProgressSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    completion_percentage = serializers.SerializerMethodField()

    class Meta:
        model = SyllabusProgress
        fields = '__all__'

    def get_completion_percentage(self, obj):
        plan = SyllabusPlan.objects.filter(subject=obj.subject, topic_name=obj.topic_name).first()
        if not plan or plan.total_lectures_required == 0:
            return 0
        return round((obj.lectures_completed / plan.total_lectures_required) * 100, 2)

class LectureSerializer(serializers.ModelSerializer):
    timetable_details = TimetableSerializer(source='timetable', read_only=True)
    topic_details = SyllabusPlanSerializer(source='topic', read_only=True)
    attendance_count = serializers.SerializerMethodField()

    class Meta:
        model = Lecture
        fields = '__all__'

    def get_attendance_count(self, obj):
        return {
            'present': obj.attendance.filter(status='Present').count(),
            'absent': obj.attendance.filter(status='Absent').count()
        }
