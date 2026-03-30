import os
import django
import sys
import pandas as pd
import json

# Setup Django for model access if needed, but here we just test the parser
sys.path.append(os.path.join(os.getcwd(), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')

from core.utils import TimetableParser

def test_parser():
    file_path = 'Timetable.xlsx'
    if not os.path.exists(file_path):
        print(f"File {file_path} not found!")
        return

    print(f"Testing TimetableParser.parse_excel with {file_path}...")
    try:
        entries = TimetableParser.parse_excel(file_path)
        print(f"\nSuccessfully parsed {len(entries)} entries.")
        
        # Group by day for readability
        from collections import defaultdict
        grouped = defaultdict(list)
        for e in entries:
            grouped[e['day']].append(e)
            
        for day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']:
            print(f"\n--- {day.upper()} ({len(grouped[day])} slots) ---")
            for e in sorted(grouped[day], key=lambda x: x['start_time']):
                batch_info = f" | Batch: {e['batch']}" if e['batch'] else ""
                room_info = f" | Room: {e['room']}" if e['room'] else ""
                print(f"{e['start_time']} - {e['end_time']} | {e['subject_code']} ({e['subject_type']}){batch_info}{room_info}")
                
        # Save to JSON for inspection if needed
        with open('timetable_data.json', 'w') as f:
            json.dump(entries, f, indent=2)
            
    except Exception as e:
        print(f"PARSING FAILED: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_parser()
