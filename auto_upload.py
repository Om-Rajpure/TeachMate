import requests
import os

BASE_URL = "http://127.0.0.1:8000/api"

def upload_timetable(file_path):
    print(f"Uploading Timetable: {file_path}")
    with open(file_path, 'rb') as f:
        files = {'file': f}
        # Step 1: Parse
        response = requests.post(f"{BASE_URL}/timetable/parse/", files=files)
        if response.status_code != 200:
            print(f"Error parsing timetable: {response.text}")
            return
        
        entries = response.json()
        print(f"Parsed {len(entries)} slots. Committing...")
        
        # Step 2: Commit
        response = requests.post(f"{BASE_URL}/timetable/commit/", json=entries)
        print(f"Commit response: {response.json()}")

def upload_syllabus(file_path, subject_id, subject_type='theory'):
    print(f"Uploading Syllabus ({subject_type}) for subject {subject_id}: {file_path}")
    with open(file_path, 'rb') as f:
        files = {'file': f}
        data = {'type': subject_type}
        # Step 1: Parse
        response = requests.post(f"{BASE_URL}/syllabus/lecture-plan/parse/", files=files, data=data)
        if response.status_code != 200:
            print(f"Error parsing syllabus: {response.text}")
            return
        
        entries = response.json()
        print(f"Parsed {len(entries)} syllabus entries. Committing...")
        
        # Step 2: Commit
        if subject_type == 'theory':
            response = requests.post(f"{BASE_URL}/syllabus/lecture-plan/commit/", json={'subject_id': subject_id, 'entries': entries})
        else:
            # For practical, we might need to transform entries to match ExperimentViewSet.commit
            # Looking at the code, it expects experiment_number and title
            transformed = []
            for entry in entries:
                 transformed.append({
                     'experiment_number': entry.get('experiment_number') or entry.get('number'),
                     'title': entry.get('title') or entry.get('topic')
                 })
            response = requests.post(f"{BASE_URL}/syllabus/experiments/commit/", json={'subject_id': subject_id, 'entries': transformed})
            
        print(f"Commit response: {response.json()}")

def upload_students(file_path, subject_id, division_id, starting_roll=1, mode='replace'):
    print(f"Uploading Students for subject {subject_id}, division {division_id}: {file_path}")
    with open(file_path, 'rb') as f:
        files = {'file': f}
        data = {
            'subject_id': subject_id,
            'division_id': division_id,
            'starting_roll': starting_roll,
            'mode': mode
        }
        response = requests.post(f"{BASE_URL}/students/upload/", files=files, data=data)
        print(f"Upload response: {response.json()}")

if __name__ == "__main__":
    # 1. Timetable
    upload_timetable(r"c:\Users\omraj\OneDrive\Desktop\TeachMate\Timetable.xlsx")
    
    # Need to get subject IDs from backend after timetable upload
    resp = requests.get(f"{BASE_URL}/subjects/")
    subjects = resp.json()
    print("\nSubjects detected:")
    for s in subjects:
        print(f"ID: {s['id']}, Name: {s['name']}, Type: {s['subject_type']}")
    
    # Find a theory and a practical subject
    theory_sub = next((s for s in subjects if s['subject_type'] == 'theory'), None)
    practical_sub = next((s for s in subjects if s['subject_type'] == 'practical'), None)
    
    # Get Division ID
    div_resp = requests.get(f"{BASE_URL}/divisions/")
    divisions = div_resp.json()
    division_id = divisions[0]['id'] if divisions else 1
    
    if theory_sub:
        upload_syllabus(r"c:\Users\omraj\OneDrive\Desktop\TeachMate\Syllabus.xlsx", theory_sub['id'], 'theory')
        upload_students(r"c:\Users\omraj\OneDrive\Desktop\TeachMate\theory_students.xlsx", theory_sub['id'], division_id)
        
    if practical_sub:
        upload_syllabus(r"c:\Users\omraj\OneDrive\Desktop\TeachMate\Practical.xlsx", practical_sub['id'], 'practical')
        # For practical we usually have batches, but let's just upload for the division first
        upload_students(r"c:\Users\omraj\OneDrive\Desktop\TeachMate\lab_students.xlsx", practical_sub['id'], division_id)
