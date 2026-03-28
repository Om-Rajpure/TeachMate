from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import Timetable, Lecture, Attendance, Student, Notification, SyllabusProgress
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def send_realtime_notification(title, message, notification_type):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        'notifications',
        {
            'type': 'send_notification',
            'title': title,
            'message': message,
            'notification_type': notification_type
        }
    )

@shared_task
def check_upcoming_lectures():
    now = timezone.localtime()
    ten_minutes_later = now + timedelta(minutes=10)
    
    # Check for lectures starting soon
    upcoming = Timetable.objects.filter(
        day=now.strftime('%A'),
        start_time__range=(now.time(), ten_minutes_later.time())
    )
    
    for entry in upcoming:
        # Check if already notified or already logged
        if not Lecture.objects.filter(timetable=entry, date=now.date()).exists():
            msg = f"Your {entry.subject.name} lecture for {entry.division.name} starts in 10 minutes."
            Notification.objects.create(
                title="Upcoming Lecture",
                message=msg,
                type="Reminder"
            )
            send_realtime_notification("Upcoming Lecture", msg, "Reminder")

@shared_task
def daily_academic_summary():
    today = timezone.localdate()
    lectures_count = Lecture.objects.filter(date=today, status='Completed').count()
    
    msg = f"You completed {lectures_count} lectures today. Keep up the good work!"
    Notification.objects.create(
        title="Daily Summary",
        message=msg,
        type="Info"
    )
    send_realtime_notification("Daily Summary", msg, "Info")

@shared_task
def audit_attendance_and_performance():
    students = Student.objects.all()
    for student in students:
        # Attendance Check
        total_att = Attendance.objects.filter(student=student).count()
        if total_att > 5: # Only audit if enough data
            present = Attendance.objects.filter(student=student, status='Present').count()
            percent = (present / total_att) * 100
            if percent < 75:
                msg = f"Critical: {student.name} has dropped below 75% attendance ({round(percent, 1)}%)."
                Notification.objects.create(
                    title="Low Attendance Alert",
                    message=msg,
                    type="Warning"
                )
                send_realtime_notification("Low Attendance Alert", msg, "Warning")

@shared_task
def check_syllabus_delay():
    all_progress = SyllabusProgress.objects.all()
    for prog in all_progress:
        if prog.completion_percentage < 20: # Example logic
             msg = f"Syllabus for {prog.subject.name} (Topic: {prog.topic_name}) is delayed."
             Notification.objects.create(
                title="Syllabus Delay",
                message=msg,
                type="Warning"
             )
             send_realtime_notification("Syllabus Delay", msg, "Warning")
