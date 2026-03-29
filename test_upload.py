import os
import sys
import django
import pandas as pd

# Set up Django environment
sys.path.append(r'c:\Users\omraj\OneDrive\Desktop\TeachMate\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from core.models import Subject, Chapter, LecturePlan
from core.utils import TimetableParser

def test_syllabus_upload(subject_id, file_path):
    print(f"--- Starting Sync for Subject ID: {subject_id} ---")
    try:
        subject = Subject.objects.get(id=subject_id)
        print(f"Found Subject: {subject.name} ({subject.subject_type})")
        
        # Step 1: Parse
        print(f"Parsing {file_path}...")
        entries = TimetableParser.parse_syllabus(file_path)
        print(f"Extracted {len(entries)} topics.")

        # Step 2: Delete Old Data (as per views.py logic)
        print("Clearing old syllabus data...")
        Chapter.objects.filter(subject=subject).delete()
        LecturePlan.objects.filter(subject=subject).delete()

        # Step 3: Insert New Data
        print("Inserting new syllabus data...")
        created_count = 0
        for entry in entries:
            chapter, _ = Chapter.objects.get_or_create(
                subject=subject,
                name=entry['chapter_name']
            )
            LecturePlan.objects.create(
                subject=subject,
                chapter=chapter,
                lecture_number=entry['lecture_number'],
                topic_name=entry['topic_name']
            )
            created_count += 1
        
        print(f"Successfully synced {created_count} items.")
        
        # Step 4: Verify Order
        plans = LecturePlan.objects.filter(subject=subject).order_by('lecture_number')
        print("Order Verification:")
        for p in plans[:5]:
            print(f"  L{p.lecture_number}: {p.topic_name[:30]}...")
            
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_syllabus_upload(5, r'c:\Users\omraj\OneDrive\Desktop\TeachMate\Syllabus.xlsx')
