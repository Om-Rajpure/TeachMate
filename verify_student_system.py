import os
import requests
import pandas as pd
from io import BytesIO

BASE_URL = "http://localhost:8001/api"

def test_student_system():
    print("--- testing student management system ---")
    
    # 1. Get subjects
    subjects = requests.get(f"{BASE_URL}/subjects/").json()
    if not subjects:
        print("FAIL: No subjects found. Please upload a timetable first.")
        return
    
    subj = subjects[0]
    subj_id = subj['id']
    print(f"Using subject: {subj['name']} (ID: {subj_id})")

    # 2. Add a student manually
    payload = {
        "name": "Test Student 1",
        "division": "TE-A",
        "batch": "B1",
        "subject_id": subj_id
    }
    res = requests.post(f"{BASE_URL}/students/", json=payload)
    if res.status_code == 201:
        print("SUCCESS: Manually added student")
    else:
        print(f"FAIL: Add student failed: {res.text}")

    # 3. Verify student list for subject
    students = requests.get(f"{BASE_URL}/students/?subject_id={subj_id}").json()
    if any(s['name'] == "Test Student 1" for s in students):
        print(f"SUCCESS: Verified student in list (Count: {len(students)})")
    else:
        print("FAIL: Student not in list")

    # 4. Test Excel Upload (Append)
    df = pd.DataFrame([
        {"Name": "Excel Student A", "Division": "TE-A", "Batch": "B2"},
        {"Name": "Excel Student B", "Division": "TE-A", "Batch": "B2"}
    ])
    excel_file = BytesIO()
    df.to_excel(excel_file, index=False, engine='openpyxl')
    excel_file.seek(0)
    
    files = {'file': ('students.xlsx', excel_file, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
    data = {'subject_id': subj_id, 'mode': 'append'}
    
    res = requests.post(f"{BASE_URL}/students/upload/", files=files, data=data)
    if res.status_code == 200:
        print(f"SUCCESS: Excel Upload (Append): {res.json()['message']}")
    else:
        print(f"FAIL: Excel Upload failed: {res.text}")

    # 5. Test Excel Upload (Replace)
    df_replace = pd.DataFrame([
        {"Name": "Replacement Student", "Division": "BE-B", "Batch": "B3"}
    ])
    excel_replace = BytesIO()
    df_replace.to_excel(excel_replace, index=False, engine='openpyxl')
    excel_replace.seek(0)
    
    files_rep = {'file': ('replacement.xlsx', excel_replace, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
    data_rep = {'subject_id': subj_id, 'mode': 'replace'}
    
    res = requests.post(f"{BASE_URL}/students/upload/", files=files_rep, data=data_rep)
    if res.status_code == 200:
        print(f"SUCCESS: Excel Upload (Replace): {res.json()['message']}")
        
        # Verify only 1 student now
        students_after = requests.get(f"{BASE_URL}/students/?subject_id={subj_id}").json()
        if len(students_after) == 1 and students_after[0]['name'] == "Replacement Student":
            print("SUCCESS: Replace mode verified")
        else:
            print(f"FAIL: Replace mode failed. Count: {len(students_after)}")
    else:
        print(f"FAIL: Excel Replace failed: {res.text}")

if __name__ == "__main__":
    test_student_system()
