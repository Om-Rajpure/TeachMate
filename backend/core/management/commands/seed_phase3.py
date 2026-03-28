import random
from django.core.management.base import BaseCommand
from core.models import Subject, Student, MarkType, Mark

class Command(BaseCommand):
    help = 'Seed Phase 3 data (MarkTypes and Marks)'

    def handle(self, *args, **options):
        self.stdout.write('Seeding MarkTypes and Marks...')

        subjects = Subject.objects.all()
        students = Student.objects.all()

        if not subjects.exists() or not students.exists():
            self.stdout.write(self.style.ERROR('Please run seed_data and seed_phase2 first.'))
            return

        mark_type_names = [
            ('IA1', 20),
            ('IA2', 20),
            ('Viva', 10),
            ('Assignment', 10),
            ('EndSem', 40),
        ]

        # Create MarkTypes for each subject
        for subject in subjects:
            for name, max_marks in mark_type_names:
                mt, created = MarkType.objects.get_or_create(
                    subject=subject,
                    name=name,
                    defaults={'max_marks': max_marks}
                )
                if created:
                    self.stdout.write(f'Created MarkType: {mt}')

        # Create Marks for each student
        all_mark_types = MarkType.objects.all()
        marks_created = 0
        
        # We only seed marks for a subset of subjects to make it realistic
        # but for at least 20-30 students
        target_students = students[:30]
        
        for student in target_students:
            for mt in all_mark_types:
                # 90% chance of having a mark (some might be missing)
                if random.random() < 0.95:
                    # Realistic marks based on max_marks
                    # Using a bell-like distribution for marks
                    perf_factor = random.uniform(0.4, 1.0) # Student's general ability for this specific mark
                    obtained = round(mt.max_marks * perf_factor, 1)
                    
                    Mark.objects.update_or_create(
                        student=student,
                        subject=mt.subject,
                        mark_type=mt,
                        defaults={'marks_obtained': obtained}
                    )
                    marks_created += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {marks_created} marks for {len(target_students)} students.'))
