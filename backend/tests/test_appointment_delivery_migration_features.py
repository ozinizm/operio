from datetime import datetime, timedelta


def test_service_rejects_staff_from_another_workspace(api_env, owner_headers):
    client, ids = api_env
    db = ids["Session"]()
    try:
        from app.models.appointment import AppointmentStaff

        outsider = AppointmentStaff(
            workspace_id=ids["workspace_b"],
            name="Other Workspace Specialist",
            is_active=True,
        )
        db.add(outsider)
        db.commit()
        outsider_id = outsider.id
    finally:
        db.close()

    response = client.post(
        "/api/appointments/services",
        headers=owner_headers,
        json={
            "name": "Workspace-safe service",
            "duration_minutes": 30,
            "staff_ids": [outsider_id],
        },
    )
    assert response.status_code == 422


def test_delivery_contact_email_is_transaction_specific(api_env, owner_headers):
    client, ids = api_env
    response = client.post(
        "/api/delivery-services/",
        headers=owner_headers,
        json={
            "title": "Email contact test",
            "type": "delivery",
            "scheduled_at": (datetime.utcnow() + timedelta(days=1)).isoformat(),
            "customer_id": ids["customer_a"],
            "contact_person": "Transaction Contact",
            "contact_phone": "+905551112233",
            "contact_email": "transaction@example.test",
        },
    )
    assert response.status_code == 200
    assert response.json()["contact_email"] == "transaction@example.test"

    customer = client.get(f"/api/customers/{ids['customer_a']}", headers=owner_headers)
    assert customer.status_code == 200
    assert customer.json().get("email") != "transaction@example.test"
