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
        "link": "http://example.com",
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
    incomplete_data = {"title": "Incomplete Card"}
    response = client.post("/api/cards", json=incomplete_data, headers=access_headers)
    assert response.status_code == 400  # Assuming 400 Bad Request for incomplete data


def test_get_card(client, access_headers):
    test_id = 1

    response = client.get(f"/api/cards/{test_id}", headers=access_headers)

    assert response.status_code == 200

    assert "title" in response.json
    assert "files" in response.json
    assert "backlinks" in response.json

    assert response.json["id"] == test_id


def test_get_card_error_id(client, access_headers):
    test_card_id = "test_card_id"

    response = client.get(f"/api/cards/{test_card_id}", headers=access_headers)

    assert response.status_code == 400
    assert "error" in response.json

def test_get_card_other_user(client, access_headers_other_user):
    test_id = 1

    response = client.get(f"/api/cards/{test_id}", headers=access_headers_other_user)

    assert response.status_code == 403

def test_update_card(client, access_headers):
    # Define a card ID for testing. Replace 'existing_card_id' with a valid ID from your database
    existing_id = 1

    response = client.get(f"/api/cards/{existing_id}", headers=access_headers)
    assert response.json["id"] == existing_id

    # Define the updated card data
    updated_card_data = {
        "title": "asdfasdf",
        "body": "asdfsadf",
        "card_id": response.json["card_id"],
        "link": "asdfadsf",
    }

    # Send a PUT request to the update_card route with the specified card ID and updated data
    response = client.put(
        f"/api/cards/{existing_id}", json=updated_card_data, headers=access_headers
    )

    # Check if the response status code is 200 (OK)
    assert response.status_code == 200

    # Parse the response data
    response_data = response.json

    # Assert that the response contains the updated fields
    assert response_data["title"] == updated_card_data["title"]
    assert response_data["body"] == updated_card_data["body"]
    assert response_data["card_id"] == updated_card_data["card_id"]
    assert response_data["link"] == updated_card_data["link"]

    response = client.get(f"/api/cards/{existing_id}", headers=access_headers)
    assert response.json["id"] == existing_id

    assert response_data["title"] == updated_card_data["title"]
    assert response_data["body"] == updated_card_data["body"]
    assert response_data["card_id"] == updated_card_data["card_id"]
    assert response_data["link"] == updated_card_data["link"]

def test_update_card_other_user(client, access_headers_other_user):
    # Define a card ID for testing. Replace 'existing_card_id' with a valid ID from your database
    existing_id = 1

    updated_card_data = {
        "title": "asdfasdf",
        "body": "asdfsadf",
        "link": "asdfadsf",
    }

    # Send a PUT request to the update_card route with the specified card ID and updated data
    response = client.put(
        f"/api/cards/{existing_id}", json=updated_card_data, headers=access_headers_other_user
    )
    assert response.status_code == 401

def test_delete_card(client, access_headers):
    test_card_id = 1

    response = client.get(f"/api/cards/{test_card_id}", headers=access_headers)

    assert response.status_code == 200
    assert response.json["children"] == []

    response = client.delete(f"/api/cards/{test_card_id}", headers=access_headers)
    assert response.status_code == 204

    response = client.get(f"/api/cards/{test_card_id}", headers=access_headers)

    assert response.status_code == 404

def test_delete_card_other_user(client, access_headers_other_user):
    
    test_card_id = 1
    response = client.delete(f"/api/cards/{test_card_id}", headers=access_headers_other_user)
    assert response.status_code == 401

def test_validate_unique_email(client, db, access_headers):
    
    cursor = db.cursor()
    cursor.execute("SELECT email FROM users WHERE id = 1")
    email = cursor.fetchone()[0]

    data = {"email": email}

    response = client.get(f"/api/users/validate", json=data, headers=access_headers)

    assert response.status_code == 200
    assert response.json["email_exists"] == True

    data = {"email": email + email}

    response = client.get(f"/api/users/validate", json=data, headers=access_headers)
    assert response.status_code == 200
    assert response.json["email_exists"] == False


def test_create_user(client, access_headers):
    data = {
        "username": "asdf",
        "email": "asdf",
        "password": "asdfasdf",
        "confirmPassword": "asdfasdf",
    }
    response = client.post(f"/api/users", json=data, headers=access_headers)
    assert response.status_code == 200
    assert "new_id" in response.json


def test_create_user_no_username(client, access_headers):
    data = {
        "email": "asdf",
        "password": "asdfasdf",
        "password_verify": "asdfasdf",
    }
    response = client.post(f"/api/users", json=data, headers=access_headers)
    assert response.status_code == 400
    assert "error" in response.json


def test_create_user_no_email(client, access_headers):
    data = {
        "username": "asdf",
        "password": "asdfasdf",
        "password_verify": "asdfasdf",
    }
    response = client.post(f"/api/users", json=data, headers=access_headers)
    assert response.status_code == 400
    assert "error" in response.json


def test_create_user_duplicate_email(client, db, access_headers):
    cursor = db.cursor()
    cursor.execute("SELECT email FROM users WHERE id = 1")
    email = cursor.fetchone()[0]

    data = {
        "username": "asdf",
        "email": email,
        "password": "asdfasdf",
        "password_verify": "asdfasdf",
    }
    response = client.post(f"/api/users", json=data, headers=access_headers)
    cursor.close()
    assert response.status_code == 400
    assert "error" in response.json

def test_get_users(client, db, access_headers):
    response = client.get("/api/users", headers=access_headers)
    assert response.status_code == 200
    assert len(response.json) == 10
    
    
def test_get_users_not_admin(client, db, access_headers_other_user):
    response = client.get("/api/users", headers=access_headers_other_user)
    assert response.status_code == 401
import io

def test_upload_file_success(client, access_headers):
    # Creating a dummy file to upload
    data = {
        'card_pk': 1,  # Simulating form data; (None, value) is required for non-file fields
        'file': (io.BytesIO(b'This is a test file'), 'test.txt'),  # Simulating a file upload
    }

    response = client.post("/api/files/upload", content_type='multipart/form-data', data=data, headers=access_headers)

    assert response.status_code == 201
    assert "message" in response.json
    assert response.json["message"] == "File uploaded successfully"
    # Optionally, you can assert more about the returned "file" info if your application provides it

def test_upload_file_no_file(client, access_headers):
    # Sending a request without a file
    data = {
        'card_pk': 1,  # Only sending form data, no file
    }

    response = client.post("/api/files/upload", content_type='multipart/form-data', data=data, headers=access_headers)

    assert response.status_code == 400
    assert "error" in response.json
    assert response.json["error"] == "No file part"

def test_upload_file_no_card_pk(client, access_headers):
    # Sending a request with a file but without the 'card_pk' form field
    data = {
        'file': (io.BytesIO(b'This is a test file'), 'test.txt'),
    }

    response = client.post("/api/files/upload", content_type='multipart/form-data', data=data, headers=access_headers)

    # Assuming your endpoint requires 'card_pk' and you handle this case,
    # you should adjust the expected response accordingly
    assert response.status_code == 400
    assert "error" in response.json

def test_update_user(client, access_headers):
    # Define a user ID for testing. Replace 'existing_user_id' with a valid ID from your database
    existing_user_id = 1

    # Get the current state of the user for comparison
    response = client.get(f"/api/users/{existing_user_id}", headers=access_headers)
    assert response.status_code == 200
    current_user_data = response.json

    # Define the updated user data
    updated_user_data = {
        "username": "new_username",
        "email": "new_email@example.com",
        "is_admin": not current_user_data["is_admin"],  # Toggling the is_admin flag for test
    }

    # Send a PUT request to the update_user route with the specified user ID and updated data
    response = client.put(
        f"/api/users/{existing_user_id}", json=updated_user_data, headers=access_headers
    )

    # Check if the response status code is 200 (OK)
    assert response.status_code == 200

    # Parse the response data
    response_data = response.json

    # Assert that the response contains the updated fields
    assert response_data["username"] == updated_user_data["username"]
    assert response_data["email"] == updated_user_data["email"]
    assert response_data["is_admin"] == updated_user_data["is_admin"]

    # Fetch the user again to verify updates persist
    response = client.get(f"/api/users/{existing_user_id}", headers=access_headers)
    assert response.status_code == 200
    updated_user_from_db = response.json

    # Verify that the user's data was actually updated in the database
    assert updated_user_from_db["username"] == updated_user_data["username"]
    assert updated_user_from_db["email"] == updated_user_data["email"]
    assert updated_user_from_db["is_admin"] == updated_user_data["is_admin"]

def test_email_validation_process(app, client, access_headers):
    from flask_jwt_extended import create_access_token

    # Assume existing_user_id is an ID of a test user who hasn't validated their email
    existing_user_id = 1
    
    # Step 1: Trigger the email validation request

    response = client.get(f"/api/users/{existing_user_id}", headers=access_headers)
    user = response.json
    assert user is not None  # Ensure user exists
    assert not user.get("email_validated", False)  # Ensure email is not validated yet
    
    # Step 2: Generate a token for the user manually (since we're simulating)
    with app.app_context():
        token = create_access_token(identity=user["id"], expires_delta=False)  # Adjust based on your actual token generation logic
    
    # Step 3: Validate the email using the token
    response = client.post("/api/email-validate", json={"token": token}, headers=access_headers)
    assert response.status_code == 200
    
    # Step 4: Verify the user's email has been marked as validated in the database
    response = client.get(f"/api/users/{existing_user_id}", headers=access_headers)
    user = response.json
    assert user is not None  # Ensure user exists
    assert user.get("email_validated", False)
    
    # Optionally, verify any other side effects, such as log entries or additional database changes.
