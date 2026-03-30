import requests
import datetime

BASE_URL = "http://localhost:8001/api"

def test_attendance_system():
    print("--- testing attendance system ---")
    
    # 1. Test Current Class
    res = requests.get(f"{BASE_URL}/attendance/current-class/")
    if res.status_code == 200:
        print(f"SUCCESS: Ongoing class detected: {res.json()['subject_name']}")
    elif res.status_code == 404:
        print("INFO: No ongoing class detected (Check your timetable vs current time)")
    else:
        print(f"FAIL: Current class check failed: {res.text}")

    # 2. Mark Attendance
    # Find a subject and students first
    subjects = requests.get(f"{BASE_URL}/subjects/").json()
    if not subjects:
        print("FAIL: No subjects found.")
        return
    
    subj = subjects[0]
    subj_id = subj['id']
    students = requests.get(f"{BASE_URL}/students/?subject_id={subj_id}").json()
    if not students:
        print(f"FAIL: No students found for Subject ID {subj_id}")
        return

    print(f"Marking attendance for {len(students)} students in Subject: {subj['name']}")
    payload = {
        "subject_id": subj_id,
        "date": str(datetime.date.today()),
        "attendance": [
            {"student_id": s['id'], "status": "P" if i % 2 == 0 else "A"}
            for i, s in enumerate(students)
        ]
    }
    
    res = requests.post(f"{BASE_URL}/attendance/mark/", json=payload)
    if res.status_code == 200:
        print(f"SUCCESS: {res.json()['message']}")
    else:
        print(f"FAIL: Mark attendance failed: {res.text}")

    # 3. Verify Summary
    res = requests.get(f"{BASE_URL}/attendance/summary/?subject_id={subj_id}")
    if res.status_code == 200:
        summary = res.json()['students']
        print(f"SUCCESS: Summary retrieved for {len(summary)} students")
        if summary:
            print(f"Sample Student: {summary[0]['name']} - {summary[0]['percentage']}%")
    else:
        print(f"FAIL: Summary failed: {res.text}")

if __name__ == "__main__":
    test_attendance_system()
