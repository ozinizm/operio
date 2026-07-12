import pytest


@pytest.mark.parametrize(
    ("method", "path", "payload_key"),
    [
        ("post", "/api/customers/", "customer_create"),
        ("patch", "/api/customers/{customer_a}", "customer_update"),
        ("delete", "/api/customers/{customer_a}", None),
    ],
)
def test_staff_customer_mutations_return_403(api_env, staff_headers, method, path, payload_key):
    client, ids = api_env
    payloads = {
        "customer_create": {"name": "Forbidden Customer"},
        "customer_update": {"name": "Forbidden Update"},
    }
    response = client.request(
        method,
        path.format(**ids),
        headers=staff_headers,
        json=payloads.get(payload_key) if payload_key else None,
    )
    assert response.status_code == 403


@pytest.mark.parametrize(
    ("method", "path", "payload_key"),
    [
        ("post", "/api/jobs/", "job_create"),
        ("patch", "/api/jobs/{job_a}", "job_update"),
        ("delete", "/api/jobs/{job_a}", None),
    ],
)
def test_staff_job_mutations_return_403(api_env, staff_headers, method, path, payload_key):
    client, ids = api_env
    payloads = {
        "job_create": {"title": "Forbidden Job", "customer_id": ids["customer_a"]},
        "job_update": {"title": "Forbidden Update"},
    }
    response = client.request(
        method,
        path.format(**ids),
        headers=staff_headers,
        json=payloads.get(payload_key) if payload_key else None,
    )
    assert response.status_code == 403


def test_staff_report_export_returns_403(api_env, staff_headers):
    client, _ = api_env
    response = client.get("/api/reports/export/summary", headers=staff_headers)
    assert response.status_code == 403


def test_staff_can_delete_own_comment(api_env, staff_headers):
    client, ids = api_env
    response = client.delete(
        f"/api/comments/{ids['own_comment']}",
        headers=staff_headers,
    )
    assert response.status_code == 200


def test_staff_cannot_delete_another_users_comment(api_env, staff_headers):
    client, ids = api_env
    response = client.delete(
        f"/api/comments/{ids['other_comment']}",
        headers=staff_headers,
    )
    assert response.status_code == 403


@pytest.mark.parametrize("endpoint", ["comments", "watchers/watch"])
def test_cross_workspace_comment_and_watch_return_404(api_env, staff_headers, endpoint):
    client, ids = api_env
    payload = {
        "entity_type": "customer",
        "entity_id": ids["customer_b"],
    }
    if endpoint == "comments":
        payload["body"] = "Must not cross workspace"
    response = client.post(f"/api/{endpoint}/", headers=staff_headers, json=payload)
    assert response.status_code == 404


def test_owner_customer_and_job_mutations_succeed(api_env, owner_headers):
    client, ids = api_env

    customer = client.post(
        "/api/customers/",
        headers=owner_headers,
        json={"name": "Owner Customer"},
    )
    assert customer.status_code == 200
    customer_id = customer.json()["id"]
    assert client.patch(
        f"/api/customers/{customer_id}",
        headers=owner_headers,
        json={"name": "Owner Customer Updated"},
    ).status_code == 200

    job = client.post(
        "/api/jobs/",
        headers=owner_headers,
        json={"title": "Owner Job", "customer_id": customer_id},
    )
    assert job.status_code == 200
    job_id = job.json()["id"]
    assert client.patch(
        f"/api/jobs/{job_id}",
        headers=owner_headers,
        json={"title": "Owner Job Updated"},
    ).status_code == 200
    assert client.delete(f"/api/jobs/{job_id}", headers=owner_headers).status_code == 200
    assert client.delete(f"/api/customers/{customer_id}", headers=owner_headers).status_code == 200


def test_owner_report_export_succeeds(api_env, owner_headers):
    client, _ = api_env
    response = client.get("/api/reports/export/summary", headers=owner_headers)
    assert response.status_code == 200


@pytest.mark.parametrize(
    ("path_key", "path"),
    [
        ("customer_b", "/api/customers/{customer_b}"),
        ("job_b", "/api/jobs/{job_b}"),
    ],
)
def test_cross_workspace_customer_and_job_return_404(api_env, staff_headers, path_key, path):
    client, ids = api_env
    response = client.get(path.format(**ids), headers=staff_headers)
    assert response.status_code == 404


def test_customer_watcher_gets_update_notification(api_env, staff_headers, owner_headers):
    client, ids = api_env
    watch = client.post(
        "/api/watchers/watch",
        headers=staff_headers,
        json={"entity_type": "customer", "entity_id": ids["customer_a"]},
    )
    assert watch.status_code == 200

    updated = client.patch(
        f"/api/customers/{ids['customer_a']}",
        headers=owner_headers,
        json={"name": "Customer A Updated"},
    )
    assert updated.status_code == 200

    notifications = client.get("/api/notifications", headers=staff_headers)
    assert notifications.status_code == 200
    matching = [
        item for item in notifications.json()
        if item["type"] == "customer_updated" and item["entity_id"] == ids["customer_a"]
    ]
    assert len(matching) == 1
    assert matching[0]["workspace_id"] == ids["workspace_a"]
    assert matching[0]["actor_user_id"] == ids["owner"]
    assert matching[0]["entity_type"] == "customer"
    assert matching[0]["is_read"] is False
    assert matching[0]["message"] == "Owner, Customer A Updated müşteri bilgilerini güncelledi."


def test_customer_comment_notifies_only_active_same_workspace_watchers(api_env, staff_headers, owner_headers):
    client, ids = api_env
    assert client.post(
        "/api/watchers/watch",
        headers=staff_headers,
        json={"entity_type": "customer", "entity_id": ids["customer_a"]},
    ).status_code == 200
    # Even if the actor follows the customer, the actor must not be notified.
    assert client.post(
        "/api/watchers/watch",
        headers=owner_headers,
        json={"entity_type": "customer", "entity_id": ids["customer_a"]},
    ).status_code == 200

    response = client.post(
        "/api/comments",
        headers=owner_headers,
        json={"entity_type": "customer", "entity_id": ids["customer_a"], "body": "Test comment"},
    )
    assert response.status_code == 200

    staff_notifications = client.get("/api/notifications", headers=staff_headers).json()
    comments = [item for item in staff_notifications if item["type"] == "comment_added"]
    assert len(comments) == 1
    assert comments[0]["entity_type"] == "customer"
    assert comments[0]["entity_id"] == ids["customer_a"]
    assert comments[0]["message"] == "Owner, Customer A müşterisine yorum ekledi."

    assert client.get("/api/notifications", headers=owner_headers).json() == []
    other_headers = {"X-Test-User-Id": str(ids["other_staff"])}
    assert client.get("/api/notifications", headers=other_headers).json() == []
    outsider_headers = {"X-Test-User-Id": str(ids["outsider"])}
    outsider_response = client.get("/api/notifications", headers=outsider_headers)
    assert outsider_response.status_code == 403

    db = ids["Session"]()
    try:
        from app.models.notification import Notification
        inactive_count = db.query(Notification).filter(Notification.user_id == ids["inactive_staff"]).count()
        outsider_count = db.query(Notification).filter(Notification.user_id == ids["outsider"]).count()
        assert inactive_count == 0
        assert outsider_count == 0
    finally:
        db.close()


def test_customer_notification_marks_read_and_routes_to_customer(api_env, staff_headers, owner_headers):
    client, ids = api_env
    client.post(
        "/api/watchers/watch", headers=staff_headers,
        json={"entity_type": "customer", "entity_id": ids["customer_a"]},
    )
    client.patch(
        f"/api/customers/{ids['customer_a']}", headers=owner_headers,
        json={"name": "Route Customer"},
    )
    notification = client.get("/api/notifications", headers=staff_headers).json()[0]
    assert notification["entity_type"] == "customer"
    assert notification["entity_id"] == ids["customer_a"]
    assert f"/customers/{notification['entity_id']}" == f"/customers/{ids['customer_a']}"
    marked = client.post(f"/api/notifications/{notification['id']}/read", headers=staff_headers)
    assert marked.status_code == 200
    assert client.get("/api/notifications/unread-count", headers=staff_headers).json()["count"] == 0


def test_platform_admin_can_manage_selected_workspace(api_env):
    client, ids = api_env
    headers = {
        "X-Test-User-Id": str(ids["platform_admin"]),
        "X-Active-Workspace-Id": str(ids["workspace_a"]),
    }
    response = client.patch(
        f"/api/customers/{ids['customer_a']}",
        headers=headers,
        json={"name": "Platform Updated"},
    )
    assert response.status_code == 200


def test_owner_can_deactivate_customer(api_env, owner_headers):
    client, ids = api_env
    response = client.post(
        f"/api/customers/{ids['customer_a']}/deactivate",
        headers=owner_headers,
    )
    assert response.status_code == 200
    assert response.json()["status"] == "passive"


def test_staff_cannot_deactivate_customer(api_env, staff_headers):
    client, ids = api_env
    response = client.post(
        f"/api/customers/{ids['customer_a']}/deactivate",
        headers=staff_headers,
    )
    assert response.status_code == 403


def test_other_workspace_owner_cannot_access_customer(api_env):
    client, ids = api_env
    headers = {"X-Test-User-Id": str(ids["owner_b"])}
    response = client.patch(
        f"/api/customers/{ids['customer_a']}",
        headers=headers,
        json={"name": "Forbidden cross workspace update"},
    )
    assert response.status_code == 404


def test_legacy_roles_are_normalized_to_canonical_permissions():
    from app.core.permissions import Permission, has_permission, normalize_role

    assert normalize_role("founder") == "owner"
    assert normalize_role("kurucu") == "owner"
    assert normalize_role("personnel") == "staff"
    assert has_permission("founder", Permission.CUSTOMER_UPDATE)
    assert not has_permission("personnel", Permission.CUSTOMER_UPDATE)


def test_disabled_module_rejects_direct_api_access(api_env, owner_headers):
    client, ids = api_env
    db = ids["Session"]()
    try:
        from app.models.workspace_module import WorkspaceModule
        module = db.query(WorkspaceModule).filter_by(workspace_id=ids["workspace_a"], module_key="inventory").one()
        module.is_enabled = False
        db.commit()
    finally:
        db.close()
    assert client.get("/api/inventory/summary", headers=owner_headers).status_code == 403


def test_owner_cannot_self_enable_module(api_env, owner_headers):
    client, _ = api_env
    assert client.post("/api/modules/inventory/enable", headers=owner_headers).status_code == 403


def test_platform_admin_can_assign_module_pack(api_env):
    client, ids = api_env
    headers = {"X-Test-User-Id": str(ids["platform_admin"])}
    response = client.post(f"/api/platform/workspaces/{ids['workspace_a']}/module-packs/starter", headers=headers)
    assert response.status_code == 200
    assert response.json()["modules"] == ["tasks", "notifications", "files"]
    db = ids["Session"]()
    try:
        from app.models.workspace_module import WorkspaceModule
        states = {item.module_key: item.is_enabled for item in db.query(WorkspaceModule).filter_by(workspace_id=ids["workspace_a"]).all()}
        assert states["tasks"] is True
        assert states["inventory"] is False
    finally:
        db.close()
