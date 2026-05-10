import sys
import os
import requests

def test_api():
    # 1. Login as Admin
    res = requests.post("http://localhost:8000/api/auth/login", data={"username": "admin@operio.dev", "password": "Operio123!"})
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Get Staff User ID
    res = requests.get("http://localhost:8000/api/users/team", headers=headers)
    team = res.json()
    staff_user_id = None
    for member in team:
        if member["email"] == "staff@operio.dev":
            staff_user_id = member["user_id"]
            break
            
    print(f"Found Staff User ID: {staff_user_id}")
    
    # 3. Create Task via API
    payload = {
        "title": "API Notification Test Task",
        "priority": "normal",
        "status": "todo",
        "assignee_user_id": staff_user_id
    }
    res = requests.post("http://localhost:8000/api/tasks/", json=payload, headers=headers)
    task = res.json()
    print(f"Created Task ID: {task.get('id')}")
    
    # 4. Login as Staff
    res = requests.post("http://localhost:8000/api/auth/login", data={"username": "staff@operio.dev", "password": "Operio123!"})
    staff_token = res.json()["access_token"]
    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    
    # 5. Check Unread Count
    res = requests.get("http://localhost:8000/api/notifications/unread-count", headers=staff_headers)
    print("Unread count for staff:", res.json())

if __name__ == "__main__":
    test_api()
