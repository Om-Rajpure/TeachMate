import os
import sys
import django
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.conf import settings

# Setup Django
sys.path.append(os.path.join(os.getcwd(), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from core.utils import TimetableParser

def simulate_parse_v2():
    file_path = 'Timetable.xlsx'
    if not os.path.exists(file_path):
        print("ERROR: Timetable.xlsx not found")
        return

    with open(file_path, 'rb') as f:
        # Simulate the Django UploadedFile behavior
        content = f.read()
        print(f"Read {len(content)} bytes from {file_path}")
    
    # Simulate the view logic exactly
    tmp_name = 'test_v2.xlsx'
    # In views.py we do: ContentFile(file_obj.read())
    # If the file_obj was already read, we need seek(0)
    # Our 'content' variable here contains the whole file already.
    
    path = default_storage.save(f'tmp/{tmp_name}', ContentFile(content))
    full_path = os.path.join(settings.MEDIA_ROOT, path)
    
    print(f"Simulating parse on {full_path} with engine='openpyxl'...")
    try:
        entries = TimetableParser.parse_excel(full_path)
        print(f"SUCCESS: {len(entries)} entries found.")
        for e in entries[:2]:
             print(f"  Entry: {e['day']} {e['start_time']} {e['subject_code']}")
    except Exception as e:
        print(f"FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        if os.path.exists(full_path):
            os.remove(full_path)

if __name__ == "__main__":
    simulate_parse_v2()
