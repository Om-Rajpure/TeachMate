import pandas as pd
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from core.utils import TimetableParser

def test_real_syllabus():
    file_path = 'Syllabus.xlsx'
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    print(f"Testing real syllabus parsing for: {file_path}")
    try:
        entries = TimetableParser.parse_syllabus(file_path)
        print(f"Successfully extracted {len(entries)} lectures.")
        
        # Group by chapter for cleaner output
        chapters = {}
        for e in entries:
            ch = e['chapter_name']
            if ch not in chapters:
                chapters[ch] = []
            chapters[ch].append(e)
        
        for ch_name, lecs in chapters.items():
            print(f"\nChapter: {ch_name} (CO: {lecs[0]['co']}, Planned Lecs: {lecs[0]['lecture_count']})")
            for l in lecs:
                print(f"  [{l['lecture_number']}] {l['topic_name']}")
                
    except Exception as e:
        print(f"Error during parsing: {e}")

if __name__ == "__main__":
    test_real_syllabus()
