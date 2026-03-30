import os
import sys
import pandas as pd

# Add backend to path to import TimetableParser
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from core.utils.parser import TimetableParser

def test_parser():
    file_path = 'Timetable.xlsx'
    if not os.path.exists(file_path):
        print(f"ERROR: {file_path} not found")
        return

    print(f"Testing TimetableParser.parse_excel with {file_path}...")
    try:
        entries = TimetableParser.parse_excel(file_path)
        print(f"\nSUCCESS: Parsed {len(entries)} slots.")
        
        # Display some results
        if entries:
            print("\nFirst 5 entries:")
            for entry in entries[:5]:
                print(f"Day: {entry['day']} | Slot: {entry['start_time']}-{entry['end_time']} | Subject: {entry['subject_code']} | Room: {entry['room']}")
        
        # Verify Practical logic (Subject ends with L)
        practicals = [e for e in entries if e['subject_type'] == 'practical']
        print(f"\nFound {len(practicals)} practical sessions.")
        if practicals:
            print("First practical entry:")
            print(f"Day: {practicals[0]['day']} | Slot: {practicals[0]['start_time']}-{practicals[0]['end_time']} | Subject: {practicals[0]['subject_code']}")

    except Exception as e:
        print(f"\nFAILED: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_parser()
