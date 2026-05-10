import requests

staff_token = requests.post("http://localhost:8000/api/auth/login", data={"username": "staff@operio.dev", "password": "Operio123!"}).json()["access_token"]
staff_headers = {"Authorization": f"Bearer {staff_token}"}

res = requests.get("http://localhost:8000/api/notifications/", headers=staff_headers)
print(res.json())
