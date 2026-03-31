import requests
import datetime

BASE_URL = "http://localhost:8001/api"

def test_manual_attendance():
    print("--- testing manual attendance & syllabus (v2) ---")
    
    # 1. Fetch Subjects
    subjects = requests.get(f"{BASE_URL}/subjects/").json()
    if not subjects:
        print("FAIL: No subjects found.")
        return
    subj_id = subjects[0]['id']
    print(f"INFO: Testing with Subject ID {subj_id} ({subjects[0]['name']})")

    # 2. Test Consolidated Syllabus (New sub-action path)
    url = f"{BASE_URL}/attendance/syllabus-all/?subject_id={subj_id}"
    print(f"DEBUG: Calling {url}")
    res = requests.get(url)
    if res.status_code == 200:
        syllabus = res.json()
        print(f"SUCCESS: Syllabus retrieved ({len(syllabus)} items)")
        if syllabus:
            print(f"Sample Item: {syllabus[0]['display']}")
    else:
        print(f"FAIL: Syllabus API failed: {res.status_code}")
        print(f"DEBUG: Response text: {res.text[:500]}")
        return

    # 3. Test Check Existing (Empty Case)
    past_date = str(datetime.date.today() - datetime.timedelta(days=7))
    res = requests.get(f"{BASE_URL}/attendance/check-existing/?subject_id={subj_id}&date={past_date}")
    if res.status_code == 200:
        data = res.json()
        print(f"SUCCESS: Check existing (Negative): exists={data['exists']}")
    else:
        print(f"FAIL: Check existing API failed: {res.text}")

    # 4. Mark Attendance (Manual Backdated)
    if syllabus:
        lesson = syllabus[0]
        lecture_id = lesson['id'] if lesson['type'] == 'theory' else None
        exp_id = lesson['id'] if lesson['type'] == 'practical' else None
        
        students = requests.get(f"{BASE_URL}/students/?subject_id={subj_id}").json()
        if not students:
            print(f"INFO: No students to mark for {subj_id}")
            return

        payload = {
            "subject_id": subj_id,
            "lecture_id": lecture_id,
            "experiment_id": exp_id,
            "date": past_date,
            "attendance": [{"student_id": students[0]['id'], "status": "P"}]
        }
        res = requests.post(f"{BASE_URL}/attendance/mark/", json=payload)
        if res.status_code == 200:
            print(f"SUCCESS: Manual attendance marked for {past_date}")
        else:
            print(f"FAIL: Mark manual failed: {res.text}")

        # 5. Test Check Existing (Positive Case)
        res = requests.get(f"{BASE_URL}/attendance/check-existing/?subject_id={subj_id}&date={past_date}")
        if res.status_code == 200:
            data = res.json()
            print(f"SUCCESS: Check existing (Positive): exists={data['exists']}")
        else:
            print(f"FAIL: Check existing POSITIVE failed: {res.text}")

if __name__ == "__main__":
    test_manual_attendance()
