import os
import django
from django.utils import timezone
import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from core.models import Notification, Timetable, Subject, Teacher, Division
from django.contrib.auth.models import User
from core.tasks import run_periodic_tasks

def test_notifications():
    user = User.objects.first()
    if not user:
        print("No user found. Create a superuser first.")
        return

    print(f"Testing notifications for user: {user.username}")

    # 1. Clear existing notifications for clean test
    Notification.objects.filter(user=user).delete()
    print("Cleared existing notifications.")

    # 2. Inject manual notifications of each type to test UI/Icons
    types = [
        ('lecture_reminder', 'Lecture starting in 5m', 'Your Mathematics lecture starts soon in Room 402.'),
        ('attendance_alert', 'Low Attendance', '5 students are below 75% attendance in Physics.'),
        ('marks_alert', 'Performance Warning', '3 students scored below 40% in IA1.'),
        ('syllabus_alert', 'Syllabus behind', 'Practical sessions for Chemistry are 2 weeks behind schedule.'),
        ('system_alert', 'Welcome', 'Your notification system is now active!')
    ]

    for n_type, title, msg in types:
        Notification.objects.create(
            user=user,
            type=n_type,
            title=title,
            message=msg
        )
    print("Injected 5 manual test notifications.")

    # 3. Simulate a real lecture reminder
    # Create a dummy timetable slot starting in 5 minutes
    subject, _ = Subject.objects.get_or_create(name="Test Subject", code="TS101")
    teacher = Teacher.objects.first() or Teacher.objects.create(name="Tester", email="test@test.com")
    division, _ = Division.objects.get_or_create(name="A")
    
    now = timezone.now()
    start_time = (now + datetime.timedelta(minutes=5)).time()
    end_time = (now + datetime.timedelta(hours=1)).time()
    day = now.strftime('%A')

    # Remove duplicates for this test
    Timetable.objects.filter(subject=subject, day=day).delete()
    
    slot = Timetable.objects.create(
        day=day,
        start_time=start_time,
        end_time=end_time,
        subject=subject,
        teacher=teacher,
        division=division,
        room="TEST_ROOM"
    )
    print(f"Created test timetable slot at {start_time} for {day}.")

    # 4. Trigger the automated task
    print("Running automated task engine...")
    run_periodic_tasks()
    
    # 5. Verify results
    notifs = Notification.objects.filter(user=user).order_by('-created_at')
    print(f"\nFinal Notification Count: {notifs.count()}")
    for n in notifs:
        print(f"[{'UNREAD' if not n.is_read else 'READ'}] {n.type}: {n.title}")

if __name__ == "__main__":
    test_notifications()
