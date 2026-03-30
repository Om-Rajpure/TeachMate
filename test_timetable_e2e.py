import os
import django
import sys

sys.path.append(os.path.join(os.getcwd(), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from core.models import Timetable

def clear_timetable():
    count = Timetable.objects.all().count()
    Timetable.objects.all().delete()
    print(f"Cleared {count} timetable records.")

if __name__ == "__main__":
    clear_timetable()
