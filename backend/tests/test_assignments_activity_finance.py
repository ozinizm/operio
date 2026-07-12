def test_staff_can_create_own_task_but_cannot_assign_another_user(api_env, staff_headers):
    client, ids = api_env
    own = client.post(
        "/api/tasks/", headers=staff_headers,
        json={"title": "Kendi görevim", "assignee_user_id": ids["staff"]},
    )
    assert own.status_code == 200
    forbidden = client.post(
        "/api/tasks/", headers=staff_headers,
        json={"title": "Başkasına görev", "assignee_user_id": ids["other_staff"]},
    )
    assert forbidden.status_code == 403


def test_task_assignment_is_workspace_safe_and_notified_once(api_env, owner_headers):
    client, ids = api_env
    outside = client.post(
        "/api/tasks/", headers=owner_headers,
        json={"title": "Dış workspace", "assignee_user_id": ids["outsider"]},
    )
    assert outside.status_code == 422

    created = client.post(
        "/api/tasks/", headers=owner_headers,
        json={"title": "Tek bildirim", "assignee_user_id": ids["staff"]},
    )
    assert created.status_code == 200
    notifications = client.get("/api/notifications", headers=staff_headers_for(ids)).json()
    matching = [item for item in notifications if item["type"] == "task_assigned" and item["entity_id"] == created.json()["id"]]
    assert len(matching) == 1


def test_customer_activity_created_when_linked_task_completed(api_env, owner_headers):
    client, ids = api_env
    created = client.post(
        "/api/tasks/", headers=owner_headers,
        json={"title": "Teklif Hazırla", "customer_id": ids["customer_a"]},
    ).json()
    completed = client.put(
        f"/api/tasks/{created['id']}", headers=owner_headers, json={"status": "completed"},
    )
    assert completed.status_code == 200
    db = ids["Session"]()
    try:
        from app.models.activity import Activity
        activity = db.query(Activity).filter_by(
            workspace_id=ids["workspace_a"], entity_type="customer",
            entity_id=ids["customer_a"], action="customer.task_completed",
        ).one()
        assert activity.description == "Owner, Customer A müşterisine bağlı “Teklif Hazırla” görevini tamamladı."
    finally:
        db.close()


def test_job_responsible_is_workspace_safe_and_receives_notification(api_env, owner_headers):
    client, ids = api_env
    outside = client.post(
        "/api/jobs/", headers=owner_headers,
        json={"title": "Dış sorumlu", "customer_id": ids["customer_a"], "responsible_user_id": ids["outsider"]},
    )
    assert outside.status_code == 422
    created = client.post(
        "/api/jobs/", headers=owner_headers,
        json={"title": "Atanmış iş", "customer_id": ids["customer_a"], "responsible_user_id": ids["staff"]},
    )
    assert created.status_code == 200
    notifications = client.get("/api/notifications", headers=staff_headers_for(ids)).json()
    assert len([item for item in notifications if item["type"] == "job_assigned" and item["entity_id"] == created.json()["id"]]) == 1


def test_job_income_is_workspace_safe_and_deduplicated(api_env, owner_headers):
    client, ids = api_env
    payload = {
        "type": "income", "title": "İş geliri", "amount": 1250,
        "customer_id": ids["customer_a"], "job_id": ids["job_a"],
    }
    assert client.post("/api/finance/entries", headers=owner_headers, json=payload).status_code == 200
    assert client.post("/api/finance/entries", headers=owner_headers, json=payload).status_code == 409
    outside = {**payload, "title": "Dış iş", "job_id": ids["job_b"]}
    assert client.post("/api/finance/entries", headers=owner_headers, json=outside).status_code == 404


def staff_headers_for(ids):
    return {"X-Test-User-Id": str(ids["staff"])}
