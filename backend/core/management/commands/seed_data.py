from django.core.management.base import BaseCommand
from core.models import Subject, Teacher, Division, Batch, Timetable, Lecture
from django.utils import timezone
import datetime

class Command(BaseCommand):
    help = 'Seeds the database with demo data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding data...')

        # 1. Create Teacher
        teacher, _ = Teacher.objects.get_or_create(
            name='Omkar',
            email='omkar@teachmate.com'
        )

        # 2. Create Subjects
        subjects_data = [
            {'name': 'Mathematics', 'code': 'MATH101'},
            {'name': 'Computer Science', 'code': 'CS202'},
            {'name': 'Physics', 'code': 'PHY303'},
        ]
        subjects = []
        for s in subjects_data:
            obj, _ = Subject.objects.get_or_create(name=s['name'], code=s['code'])
            subjects.append(obj)

        # 3. Create Division
        division, _ = Division.objects.get_or_create(name='A')

        # 4. Create Batches
        batch1, _ = Batch.objects.get_or_create(name='A1', division=division)
        batch2, _ = Batch.objects.get_or_create(name='A2', division=division)

        # 5. Create Timetable
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        
        # Create some sample timetable entries
        timetable_entries = [
            # Monday
            {'day': 'Monday', 'start': '09:00', 'end': '10:00', 'sub': subjects[0], 'batch': None},
            {'day': 'Monday', 'start': '10:15', 'end': '11:15', 'sub': subjects[1], 'batch': batch1},
            # Tuesday
            {'day': 'Tuesday', 'start': '11:30', 'end': '12:30', 'sub': subjects[2], 'batch': None},
            # Wednesday
            {'day': 'Wednesday', 'start': '09:00', 'end': '10:00', 'sub': subjects[0], 'batch': batch2},
            # Thursday
            {'day': 'Thursday', 'start': '14:00', 'end': '15:00', 'sub': subjects[1], 'batch': None},
            # Friday
            {'day': 'Friday', 'start': '10:15', 'end': '11:15', 'sub': subjects[0], 'batch': None},
            # Saturday
            {'day': 'Saturday', 'start': '09:00', 'end': '10:00', 'sub': subjects[2], 'batch': batch1},
        ]

        # Add an entry for "Today" if not already covered (just to be sure)
        today_name = timezone.localdate().strftime('%A')
        if not any(e['day'] == today_name for e in timetable_entries):
            timetable_entries.append({
                'day': today_name, 'start': '09:00', 'end': '10:00', 'sub': subjects[0], 'batch': None
            })

        for entry in timetable_entries:
            Timetable.objects.get_or_create(
                day=entry['day'],
                start_time=entry['start'],
                end_time=entry['end'],
                teacher=teacher,
                subject=entry['sub'],
                division=division,
                batch=entry['batch']
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded demo data!'))
