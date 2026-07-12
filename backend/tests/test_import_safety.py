def test_inventory_import_rejects_files_over_ten_mb(api_env, owner_headers):
    client, _ = api_env
    response = client.post(
        "/api/imports/inventory/preview",
        headers=owner_headers,
        files={"file": ("large.csv", b"x" * (10 * 1024 * 1024 + 1), "text/csv")},
    )
    assert response.status_code == 413


def test_inventory_import_accepts_uppercase_csv_extension(api_env, owner_headers):
    client, _ = api_env
    response = client.post(
        "/api/imports/inventory/preview",
        headers=owner_headers,
        files={"file": ("STOK.CSV", "Ürün Adı,Birim,Miktar\nVida,adet,10\n".encode("utf-8"), "text/csv")},
    )
    assert response.status_code == 200
    assert response.json()["valid_rows"] == 1
