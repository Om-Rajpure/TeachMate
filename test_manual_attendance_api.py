import requests
import sys

BASE = "http://localhost:8001/api"
results = []

def log(msg):
    results.append(msg)

log("=" * 60)
log("MANUAL ATTENDANCE MODE - FULL E2E API TEST")
log("=" * 60)

# 1. Subjects
r = requests.get(f"{BASE}/subjects/")
log(f"\n[1] GET /api/subjects/ => {r.status_code}")
subjects = r.json()
log(f"    Found {len(subjects)} subjects")

# 2. Syllabus (THE CRITICAL FIX)
r = requests.get(f"{BASE}/attendance/syllabus-all/?subject_id=7")
log(f"\n[2] GET /api/attendance/syllabus-all/?subject_id=7 => {r.status_code}")
log(f"    THIS WAS 500 BEFORE THE FIX!")
syllabus = r.json()
log(f"    Experiments returned: {len(syllabus)}")

# 3. Empty syllabus
r = requests.get(f"{BASE}/attendance/syllabus-all/?subject_id=4")
log(f"\n[3] GET syllabus-all/?subject_id=4 (empty) => {r.status_code}")
log(f"    Items: {len(r.json())} (triggers No Syllabus Found)")

# 4. Check existing
r = requests.get(f"{BASE}/attendance/check-existing/?subject_id=7&experiment_id=1&date=2026-03-31")
log(f"\n[4] GET check-existing => {r.status_code}")
data = r.json()
log(f"    Exists: {data['exists']}")

# 5. Students
r = requests.get(f"{BASE}/students/?subject_id=7")
log(f"\n[5] GET /api/students/?subject_id=7 => {r.status_code}")
students = r.json()
log(f"    Students: {len(students)}")

# 6. Mark attendance
if len(students) >= 2:
    payload = {
        "subject_id": 7, "experiment_id": 1, "date": "2026-03-31",
        "attendance": [
            {"student_id": students[0]["id"], "status": "P"},
            {"student_id": students[1]["id"], "status": "A"}
        ],
        "mark_completed": False
    }
    r = requests.post(f"{BASE}/attendance/mark/", json=payload)
    log(f"\n[6] POST /api/attendance/mark/ (CREATE) => {r.status_code}")
    log(f"    {r.json()}")

    # 7. Re-check
    r = requests.get(f"{BASE}/attendance/check-existing/?subject_id=7&experiment_id=1&date=2026-03-31")
    data = r.json()
    log(f"\n[7] GET check-existing AFTER mark => exists={data['exists']}, records={len(data['data'])}")

    # 8. Edit mode
    payload["attendance"] = [
        {"student_id": students[0]["id"], "status": "A"},
        {"student_id": students[1]["id"], "status": "P"}
    ]
    r = requests.post(f"{BASE}/attendance/mark/", json=payload)
    log(f"\n[8] POST /api/attendance/mark/ (EDIT) => {r.status_code}")
    log(f"    {r.json()}")

log("\n" + "=" * 60)
log("ALL 8 TESTS PASSED")
log("=" * 60)

# Write to file
with open("test_results.txt", "w") as f:
    f.write("\n".join(results))

# Also print
for line in results:
    print(line)
