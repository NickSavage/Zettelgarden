import conftest


def test_load_test_db(db):
    cur = db.cursor()
    cur.execute("SELECT current_database()")
    result = cur.fetchone()
    print(result)
    assert result[0] == "zettelkasten_testing"


def test_read_test_data(app, db):
    cur = db.cursor()
    cur.execute("SELECT * FROM cards")
    results = cur.fetchall()
    assert len(results) == 20

def test_get_cards(client, access_headers):
    response = client.get("/api/cards", headers=access_headers)
    assert response.status_code == 200
    assert len(response.json) == 20

def test_create_card(client, access_headers):
    response = client.get("/api/cards", headers=access_headers)
    assert response.status_code == 200
    assert len(response.json) == 20

def test_create_card(client, access_headers):
    card_data = {
        "title": "Test Card",
        "body": "This is a test card body.",
        "card_id": "12345",
        "link": "http://example.com"
    }

    response = client.post("/api/cards", json=card_data, headers=access_headers)

    assert response.status_code == 200

    response_data = response.json

    # Assert that the response contains the expected fields
    assert "id" in response.json
    assert response.json["title"] == card_data["title"]
    assert response.json["body"] == card_data["body"]
    assert response.json["card_id"] == card_data["card_id"]
    assert response.json["link"] == card_data["link"]

def test_create_card_missing_fields(client, access_headers):
    incomplete_data = {
        "title": "Incomplete Card"
    }
    response = client.post("/api/cards", json=incomplete_data, headers=access_headers)
    assert response.status_code == 400  # Assuming 400 Bad Request for incomplete data
