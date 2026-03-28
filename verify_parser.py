import pandas as pd
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from core.utils import TimetableParser

def test_excel_parsing():
    # Create a dummy Excel file
    data = {
        '9:00 - 10:00': ['CSS\nTE-A\n908', 'SMA\nTE-A\n908', None],
        '10:00 - 11:00': ['CSSL\nTE-A(B1)\n908', None, 'SMA\nTE-A\n908']
    }
    df = pd.DataFrame(data, index=['MON', 'TUE', 'WED'])
    file_path = 'test_timetable.xlsx'
    df.to_excel(file_path)
    
    print("Testing Excel Parsing...")
    entries = TimetableParser.parse_excel(file_path)
    for entry in entries:
        print(f"Day: {entry['day']}, Time: {entry['start_time']}-{entry['end_time']}, Subject: {entry['subject_code']}, Type: {entry['subject_type']}, Room: {entry['room']}, Div: {entry['division']}, Batch: {entry['batch']}")
    
    os.remove(file_path)

if __name__ == "__main__":
    try:
        test_excel_parsing()
    except Exception as e:
        print(f"Error: {e}")
