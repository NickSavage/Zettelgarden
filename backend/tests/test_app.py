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
    response = client.get("/api/cards", headers=access_headers)
    assert response.status_code == 200
    assert len(response.json) == 20

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

    response = client.get("/api/cards", headers=access_headers)
    assert response.status_code == 200
    assert len(response.json) == 21

def test_create_card_missing_fields(client, access_headers):
    incomplete_data = {
        "title": "Incomplete Card"
    }
    response = client.post("/api/cards", json=incomplete_data, headers=access_headers)
    assert response.status_code == 400  # Assuming 400 Bad Request for incomplete data

def test_get_card(client, access_headers):
    test_id = 1

    response = client.get(f"/api/cards/{test_id}", headers=access_headers)

    assert response.status_code == 200

    assert 'title' in response.json
    assert 'files' in response.json
    assert 'backlinks' in response.json

    assert response.json['id'] == test_id


def test_get_card_error_id(client, access_headers):
    test_card_id = 'test_card_id'

    response = client.get(f"/api/cards/{test_card_id}", headers=access_headers)

    assert response.status_code == 400
    assert 'error' in response.json

def test_update_card(client, access_headers):
    # Define a card ID for testing. Replace 'existing_card_id' with a valid ID from your database
    existing_id = 1

    response = client.get(f"/api/cards/{existing_id}", headers=access_headers)
    assert response.json['id'] == existing_id
    
    # Define the updated card data
    updated_card_data = {
        "title": "asdfasdf",
        "body": "asdfsadf",
        "card_id": response.json['card_id'],
        "link": "asdfadsf",
    }

    # Send a PUT request to the update_card route with the specified card ID and updated data
    response = client.put(f"/api/cards/{existing_id}", json=updated_card_data, headers=access_headers)

    # Check if the response status code is 200 (OK)
    assert response.status_code == 200

    # Parse the response data
    response_data = response.json

    # Assert that the response contains the updated fields
    assert response_data['title'] == updated_card_data['title']
    assert response_data['body'] == updated_card_data['body']
    assert response_data['card_id'] == updated_card_data['card_id']
    assert response_data['link'] == updated_card_data['link']

    response = client.get(f"/api/cards/{existing_id}", headers=access_headers)
    assert response.json['id'] == existing_id
    
    assert response_data['title'] == updated_card_data['title']
    assert response_data['body'] == updated_card_data['body']
    assert response_data['card_id'] == updated_card_data['card_id']
    assert response_data['link'] == updated_card_data['link']


def test_delete_card(client, access_headers):
    test_card_id = 1

    response = client.get(f"/api/cards/{test_card_id}", headers=access_headers)

    assert response.status_code == 200
    assert response.json['children'] == []

    response = client.delete(f"/api/cards/{test_card_id}", headers=access_headers)
    assert response.status_code == 204
    
    response = client.get(f"/api/cards/{test_card_id}", headers=access_headers)

    assert response.status_code == 404
