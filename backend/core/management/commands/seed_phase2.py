from django.core.management.base import BaseCommand
from core.models import Student, Division, Batch, Subject, SyllabusPlan, SyllabusProgress
import random

class Command(BaseCommand):
    help = 'Seed Phase 2 data: Students and Syllabus Plans'

    def handle(self, *args, **options):
        self.stdout.write('Seeding Phase 2 data...')

        # Get existing division and batches
        div_a = Division.objects.get(name='A')
        batch_a = Batch.objects.get(name='A1', division=div_a)
        batch_b = Batch.objects.get(name='A2', division=div_a)
        batches = [batch_a, batch_b]

        # 1. Seed Students (25 students)
        names = [
            'Aarav Sharma', 'Aditi Verma', 'Akash Gupta', 'Ananya Iyer', 'Arjun Malhotra',
            'Avni Reddy', 'Deepak Singh', 'Ishani Rao', 'Kabir Das', 'Meera Nair',
            'Neil Kapoor', 'Pooja Bhatia', 'Pranav Joshi', 'Riya Sen', 'Rohan Mehra',
            'Sanya Singhania', 'Shaan Mukherjee', 'Sneha Kulkarni', 'Tanvi Desai', 'Utkarsh Bajpai',
            'Vanya Trivedi', 'Varun Prasad', 'Yash Chawla', 'Zoya Khan', 'Aman Gupta'
        ]

        for i, name in enumerate(names):
            roll = f"24CS{str(i+1).zfill(2)}"
            student, created = Student.objects.get_or_create(
                roll_number=roll,
                defaults={
                    'name': name,
                    'division': div_a,
                    'batch': random.choice(batches)
                }
            )
            if created:
                self.stdout.write(f'Created student: {roll} - {name}')

        # 2. Seed Syllabus Plans
        subjects_data = {
            'Mathematics': [
                ('Linear Algebra', 8),
                ('Calculus II', 12),
                ('Probability & Statistics', 10),
                ('Differential Equations', 15)
            ],
            'Computer Science': [
                ('Data Structures', 15),
                ('Algorithms', 20),
                ('Operating Systems', 12),
                ('Database Systems', 10)
            ],
            'Physics': [
                ('Quantum Mechanics', 15),
                ('Electromagnetism', 12),
                ('Thermodynamics', 10)
            ]
        }

        for sub_name, topics in subjects_data.items():
            try:
                subject = Subject.objects.get(name=sub_name)
                for topic_name, total_lecs in topics:
                    plan, plan_created = SyllabusPlan.objects.get_or_create(
                        subject=subject,
                        topic_name=topic_name,
                        defaults={'total_lectures_required': total_lecs}
                    )
                    
                    # Also initialize progress entry
                    progress, prog_created = SyllabusProgress.objects.get_or_create(
                        subject=subject,
                        topic_name=topic_name,
                        defaults={'lectures_completed': 0}
                    )
                    
                    if plan_created:
                        self.stdout.write(f'Created plan: {sub_name} - {topic_name}')
            except Subject.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'Subject {sub_name} not found, skipping.'))

        self.stdout.write(self.style.SUCCESS('Phase 2 seeding completed!'))
