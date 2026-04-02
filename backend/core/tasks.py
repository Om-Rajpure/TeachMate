from django.utils import timezone
from .models import Notification, Timetable, Student, Subject, StudentSubject, Attendance, LecturePlan, Experiment, Teacher
from django.contrib.auth.models import User
import datetime

def run_periodic_tasks():
    """
    Simulates a background task runner to generate notifications.
    Can be run every minute via CRON or Management Command.
    """
    now = timezone.now()
    current_time = now.time()
    today_day = now.strftime('%A')
    
    # We'll assume the first user is the teacher for this prototype
    user = User.objects.first()
    if not user:
        return

    subjects = Subject.objects.filter(is_active=True)

    # 1. LECTURE REMINDER (Starts in 5 minutes)
    reminder_window_start = (now + datetime.timedelta(minutes=4)).time()
    reminder_window_end = (now + datetime.timedelta(minutes=6)).time()
    
    upcoming_slots = Timetable.objects.filter(
        day=today_day,
        start_time__gte=reminder_window_start,
        start_time__lte=reminder_window_end
    )
    
    for slot in upcoming_slots:
        title = "Lecture Starting Soon"
        message = f"Your {slot.subject.name} ({slot.subject_type}) starts in 5 minutes in Room {slot.room or 'TBD'}."
        
        # Duplicate Prevention: Same slot, same day
        exists = Notification.objects.filter(
            user=user,
            type='lecture_reminder',
            title=title,
            created_at__date=now.date(),
            metadata__slot_id=slot.id
        ).exists()
        
        if not exists:
            Notification.objects.create(
                user=user,
                type='lecture_reminder',
                title=title,
                message=message,
                metadata={'slot_id': slot.id}
            )

    # 2. ATTENDANCE ALERT (< 75%)
    # Only run this once a day to avoid spam
    if current_time.hour == 9 and current_time.minute == 0:
        for subject in subjects:
            low_att_students = []
            all_students = Student.objects.filter(subject_links__subject=subject)
            
            for student in all_students:
                total = Attendance.objects.filter(student=student, subject=subject).count()
                if total >= 5: # Only alert if there's enough data
                    present = Attendance.objects.filter(student=student, subject=subject, status='P').count()
                    percent = (present / total) * 100
                    if percent < 75:
                        low_att_students.append(student.name)
            
            if low_att_students:
                count = len(low_att_students)
                title = "Low Attendance Alert"
                message = f"{count} students have attendance below 75% in {subject.name}."
                
                Notification.objects.get_or_create(
                    user=user,
                    type='attendance_alert',
                    title=title,
                    message=message,
                    created_at__date=now.date()
                )

    # 3. SYLLABUS ALERT (Behind progress)
    # Check if more than 50% of the semester has passed but less than 40% syllabus is done
    # For prototype: Check if more than 5 lectures are pending when they should be done
    for subject in subjects:
        total_p = LecturePlan.objects.filter(subject=subject).count()
        done_p = LecturePlan.objects.filter(subject=subject, status='Completed').count()
        
        if total_p > 0:
            progress = (done_p / total_p) * 100
            # Simple logic: If it's late in the week but progress is low
            if today_day in ['Thursday', 'Friday'] and progress < 30:
                title = "Syllabus Progress Lagging"
                message = f"Syllabus for {subject.name} is only {round(progress)}% complete. Consider accelerating."
                
                Notification.objects.get_or_create(
                    user=user,
                    type='syllabus_alert',
                    title=title,
                    message=message,
                    created_at__date=now.date()
                )

    # 4. SYSTEM ALERT (Daily Summary)
    if current_time.hour == 18 and current_time.minute == 0:
        done_today = Attendance.objects.filter(date=now.date()).values('subject').distinct().count()
        Notification.objects.create(
            user=user,
            type='system_alert',
            title="Daily Summary",
            message=f"You successfully marked attendance for {done_today} sessions today."
        )
