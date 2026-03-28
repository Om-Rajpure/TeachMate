import pandas as pd
import os
import sys

sys.path.append(os.path.join(os.getcwd(), 'backend'))
from core.utils import TimetableParser

def test_lab_logic():
    data = {
        '10:00 - 11:00': ['CSSL\nTE-A(B1)\n908']
    }
    df = pd.DataFrame(data, index=['MON'])
    file_path = 'lab_test.xlsx'
    df.to_excel(file_path)
    
    print("Testing Lab Logic...")
    entries = TimetableParser.parse_excel(file_path)
    for entry in entries:
        print(f"Subject: {entry['subject_code']}, Type: {entry['subject_type']}, Batch: {entry['batch']}")
    
    os.remove(file_path)

if __name__ == "__main__":
    test_lab_logic()
