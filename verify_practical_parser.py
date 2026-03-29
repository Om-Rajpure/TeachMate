import os
import sys
import django
import pandas as pd

# Set up Django environment
sys.path.append(r'c:\Users\omraj\OneDrive\Desktop\TeachMate\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from core.utils.parser import TimetableParser

def verify_practical_parser(file_path):
    print(f"--- Testing Practical Parser for: {file_path} ---")
    try:
        if not os.path.exists(file_path):
            print(f"Error: File not found at {file_path}")
            return

        entries = TimetableParser.parse_practical(file_path)
        print(f"Successfully extracted {len(entries)} experiments.")
        
        for entry in entries[:10]:
            print(f"  Exp {entry['experiment_number']}: {entry['title']}")
            
        if len(entries) > 10:
            print(f"  ... and {len(entries) - 10} more.")
            
    except Exception as e:
        print(f"Critical Error during parsing: {str(e)}")

if __name__ == "__main__":
    file_path = r'c:\Users\omraj\OneDrive\Desktop\TeachMate\Cloud_Computing_Practical_CSL605.xlsx'
    verify_practical_parser(file_path)
