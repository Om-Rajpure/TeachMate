import requests

# Test theory template — CSS TE-A 908 (id=8) with division A (id=1)
print("=== Testing Theory Template ===")
r = requests.get("http://localhost:8000/api/marks/export-template/", params={
    "subject_id": 8,
    "division_id": 1,
})
print(f"Status: {r.status_code}")
if r.status_code == 200:
    print(f"Content-Type: {r.headers.get('Content-Type')}")
    print(f"Content-Disposition: {r.headers.get('Content-Disposition')}")
    with open("C:/Users/omraj/Desktop/TestTheoryTemplate.xlsx", "wb") as f:
        f.write(r.content)
    print(f"SAVED — file size: {len(r.content)} bytes")
else:
    try:
        print(f"Error: {r.json()}")
    except Exception:
        print(f"Response: {r.text[:500]}")

print()

# Check if practical subject has batches
batches = requests.get("http://localhost:8000/api/batches/").json()
print("Batches:", [(b["id"], b["name"]) for b in batches])

# Test practical template — Cloud Computing Lab (id=7), division A (id=1), no batch
print("\n=== Testing Practical Template (no batch) ===")
r2 = requests.get("http://localhost:8000/api/marks/export-template/", params={
    "subject_id": 7,
    "division_id": 1,
})
print(f"Status: {r2.status_code}")
if r2.status_code == 200:
    print(f"Content-Disposition: {r2.headers.get('Content-Disposition')}")
    with open("C:/Users/omraj/Desktop/TestPracticalTemplate.xlsx", "wb") as f:
        f.write(r2.content)
    print(f"SAVED — file size: {len(r2.content)} bytes")
else:
    try:
        print(f"Error: {r2.json()}")
    except Exception:
        print(f"Response: {r2.text[:500]}")
