import requests

BASE_URL = "http://localhost:8001/api"

def upload_file(filename, subject_id):
    url = f"{BASE_URL}/students/upload/"
    with open(filename, 'rb') as f:
        files = {'file': (filename, f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        data = {'subject_id': subject_id, 'mode': 'replace'}
        res = requests.post(url, files=files, data=data)
        if res.status_code == 200:
            print(f"SUCCESS: Uploaded {filename} to Subject ID {subject_id}: {res.json()['message']}")
        else:
            print(f"FAILED: Uploading {filename} to Subject ID {subject_id}: {res.text}")

if __name__ == "__main__":
    upload_file('theory_students.xlsx', 4)  # AI
    upload_file('lab_students.xlsx', 7)     # Cloud Computing Lab
