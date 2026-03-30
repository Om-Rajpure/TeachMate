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

def simulate_parse():
    file_path = 'Timetable.xlsx'
    if not os.path.exists(file_path):
        print("ERROR: Timetable.xlsx not found")
        return

    with open(file_path, 'rb') as f:
        content = f.read()
    
    # Simulate the view logic
    tmp_path = default_storage.save('tmp/test_upload.xlsx', ContentFile(content))
    full_path = os.path.join(settings.MEDIA_ROOT, tmp_path)
    
    print(f"Simulating parse on {full_path}...")
    try:
        entries = TimetableParser.parse_excel(full_path)
        print(f"SUCCESS: {len(entries)} entries found.")
    except Exception as e:
        print(f"FAILED: {str(e)}")
    finally:
        if os.path.exists(full_path):
            os.remove(full_path)

if __name__ == "__main__":
    simulate_parse()
