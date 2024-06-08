from datetime import timedelta
from flask import Flask, request, jsonify, send_from_directory, Blueprint, g, redirect, Response
from flask_mail import Message
from flask_cors import CORS
from urllib.parse import unquote
import psycopg2
import os
import re
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
    decode_token
)
from flask_bcrypt import Bcrypt
import uuid
import stripe
import requests
import json

from database import connect_to_database, get_db

import models.card
import services
import utils

bp = Blueprint("bp", __name__)


def log_card_view(card_pk, user_id):
    conn = get_db()
    cur = conn.cursor()
    try:
        # Assuming 'card_id' is the primary key of the card in your cards table
        if card_pk is not None and card_pk != "null":
            cur.execute(
                "INSERT INTO card_views (card_pk, user_id, created_at) VALUES (%s, %s, CURRENT_TIMESTAMP);",
                (
                    card_pk,
                    user_id,
                ),
            )
            conn.commit()  # Commit the transaction
            return {"success": "View logged"}
        else:
            return {"error": "Invalid card ID"}
    except Exception as e:
        print(e, flush=True)
        return {"error": str(e)}
    finally:
        cur.close()

def log_last_login(user: dict) -> None:
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE users SET last_login = NOW() WHERE id = %s", (user["id"],))
    conn.commit()
    cur.close()

@bp.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = services.query_user_by_email(email, True)

    if not user or "error" in user:
        g.logger.info('Failed login: %s', email)
        return jsonify({"error": "Invalid credentials"}), 401

    #    if user and user['password'] == password:
    if user and g.bcrypt.check_password_hash(user["password"], password):
        access_token = create_access_token(
            identity=user["id"], expires_delta=timedelta(days=15)
        )
        del user["password"]
        print(access_token)
        results = {"access_token": access_token, "user": user}
        g.logger.info('Successful login: id %s, username %s', user['id'], email)
        log_last_login(user)
        return jsonify(results), 200
    else:
        g.logger.info('Failed login: %s', email)
        return jsonify({"message": "Invalid credentials"}), 401

def generate_temp_token(user_id):
    expires = timedelta(minutes=5)  # Token expires in 24 hours
    return create_access_token(identity=user_id, expires_delta=expires)

@bp.route("/api/request-reset", methods=["POST"])
def request_password_reset():
    data = request.get_json()
    email = data.get("email")
    
    user = services.query_user_by_email(email) 
    
    if user and "error" not in user:
        token = generate_temp_token(user["id"])
        reset_url = f"{g.config['ZETTEL_URL']}/reset?token={token}"
        message = Message("Password Reset Request", recipients=[email], body=f"Please go to this link to reset your password: {reset_url}")
        g.logger.info('Password reset: sent email for id %s, username %s, email %s', user['id'], user["username"], email)
        g.mail.send(message)
    g.logger.info('Password reset: Failed for email %s', email)
    return jsonify({"message": "If your email is in our system, you will receive a password reset link."}), 200

@bp.route("/api/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json()
    token = data.get("token")
    new_password = data.get("new_password")
    
    decoded = decode_token(token)
    identity = decoded["sub"]
#    user_id = decode_token(token)["identity"]  # This needs error handling for expired or invalid tokens
    user = services.query_full_user(identity)
    
    if user:
        hashed_password = g.bcrypt.generate_password_hash(new_password).decode('utf-8')

        conn = get_db()
        cur = conn.cursor()

        cur.execute("UPDATE users SET password = %s WHERE id = %s", (hashed_password, user["id"]))

        conn.commit()
        cur.close()
        return jsonify({"message": "Your password has been updated."}), 200
    return jsonify({"error": "Invalid token."}), 400

def send_email_validation(user: dict):

    token = generate_temp_token(user["id"])
    reset_url = f"{g.config['ZETTEL_URL']}/validate?token={token}"
    
    message_body = f"""
    Welcome to ZettelGarden, {user["username"]}.\n\nPlease click the following link to confirm your email address: {reset_url}.\n\nThank you.
    """
    
    message = Message("Please confirm your ZettelGarden email", recipients=[user["email"]], body=message_body)
    g.mail.send(message)
    g.logger.info('Email Validation: sent email for id %s, email %s', user['id'], user['email'])

@bp.route("/api/email-validate", methods=["GET"])
@jwt_required()
def resend_email_validation():
    current_user = get_jwt_identity() 
    user = services.query_full_user(current_user)
    print(user)
    if user["email_validated"]:
        return jsonify({"error": "Email already validated."}), 400
    send_email_validation(user)
    return jsonify({"message": "Email sent, check your inbox."}), 200
    
    
@bp.route("/api/email-validate", methods=["POST"])
def validate_email():
    data = request.get_json()
    token = data.get("token")
    decoded = decode_token(token)

    identity = decoded["sub"]
#    user_id = decode_token(token)["identity"]  # This needs error handling for expired or invalid tokens
    user = services.query_full_user(identity)
    
    if user:
        
        conn = get_db()
        cur = conn.cursor()

        cur.execute("UPDATE users SET email_validated = TRUE WHERE id = %s", (user["id"],))

        conn.commit()
        cur.close()
        return jsonify({"message": "Your email has been validated."}), 200
    return jsonify({"error": "Invalid token."}), 400

@bp.route("/api/auth", methods=["GET"])
@jwt_required()
def check_token():
    return jsonify({}), 200


@bp.route("/api/cards", methods=["GET"])
@jwt_required()
def get_cards():
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return jsonify({"error": "Authorization header is missing"}), 401
    
    search_term = request.args.get("search_term", None)
    partial = request.args.get("partial", False)
    sort_method = request.args.get("sort_method", "id")
    inactive = request.args.get("inactive", False)
    
    headers = {
        "Authorization": auth_header
    }
    
    # Forward the request to the Go backend
    params = {
        "search_term": search_term,
        "partial": partial,
        "sort_method": sort_method,
        "inactive": inactive
    }
    print("http://" + os.getenv("FILES_HOST") + "/api/cards/")
    response = requests.get("http://" + os.getenv("FILES_HOST") + "/api/cards/", params=params, headers=headers)
    print(response)
    
    return jsonify(response.json()), response.status_code

@bp.route("/api/cards/next", methods=["POST"])
@jwt_required()
def generate_next_id():
    user_id = get_jwt_identity()  # Extract the user identity from the token
    card_type = request.json.get("card_type", None)

    if not card_type:
        return jsonify({"error": "Missing field: card_type"}), 400

    if card_type == "reference":
        conn = get_db()
        cur = conn.cursor()

        # Query to get the highest number for reference cards
        cur.execute("""
        SELECT card_id FROM cards WHERE card_id LIKE 'REF%' AND is_deleted = FALSE
        ORDER BY CAST(SUBSTRING(card_id FROM 'REF(.*)$') AS INTEGER) DESC
        LIMIT 1""")
        result = cur.fetchone()
        cur.close()
        
        if result:
            # Extract the numeric part of the ID and increment it
            highest_number = int(result[0][3:])  # Assumes that 'REF' is followed by the number directly
            next_number = highest_number + 1
            new_card_id = f"REF{next_number:03}"  # Pad with zeros if necessary
        else:
            # If there are no reference cards, start numbering from 1
            new_card_id = "REF001"

        return jsonify({"new_id": new_card_id})
    elif card_type == "meeting":
        # Implement similar logic for meeting cards if required
        conn = get_db()
        cur = conn.cursor()

        # Query to get the highest number for reference cards
        cur.execute("""
        SELECT card_id FROM cards WHERE card_id LIKE 'MM%' AND is_deleted = FALSE
        ORDER BY CAST(SUBSTRING(card_id FROM 'MM(.*)$') AS INTEGER) DESC
        LIMIT 1""")
        result = cur.fetchone()
        cur.close()
        
        if result:
            # Extract the numeric part of the ID and increment it
            highest_number = int(result[0][2:])  # Assumes that 'REF' is followed by the number directly
            next_number = highest_number + 1
            new_card_id = f"MM{next_number:02}"  # Pad with zeros if necessary
        else:
            # If there are no reference cards, start numbering from 1
            new_card_name = "MM01"

        return jsonify({"new_id": new_card_id})
        pass
    else:
        return jsonify({"error": "Unknown or unsupported card type. Supported card types are 'reference' and 'meeting', was provided: " + card_type}), 400

@bp.route("/api/cards", methods=["POST"])
@jwt_required()
def create_card():
    card = {
        "title": request.json.get("title"),
        "body": request.json.get("body", ""),
        "card_id": request.json.get("card_id"),
        "link": request.json.get("link", ""),
    }

    headers = {
        "Authorization": request.headers.get("Authorization"),
        "Content-Type": "application/json"
    }
    response = requests.post("http://" + os.getenv("FILES_HOST") + "/api/cards/", headers=headers, json=card)
    print(response.text)
    return jsonify(response.json()), response.status_code


@bp.route("/api/cards/<path:id>", methods=["GET"])
@jwt_required()
def get_card(id):

    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return jsonify({"error": "Authorization header is missing"}), 401
    # Forward the request to the Go backend
    headers = {
        "Authorization": auth_header
    }
    response = requests.get("http://" + os.getenv("FILES_HOST") + "/api/cards/" + str(id) + "/", headers=headers)
    print(response.text)
    return jsonify(response.json()), response.status_code


@bp.route("/api/cards/<path:id>", methods=["PUT"])
@jwt_required()
def update_card(id):
    card = {
        "card_id": request.json.get("card_id"),
        "title": request.json.get("title"),
        "body": request.json.get("body"),
        "link": request.json.get("link"),
    }

    headers = {
        "Authorization": request.headers.get("Authorization"),
        "Content-Type": "application/json"
    }
    response = requests.put("http://" + os.getenv("FILES_HOST") + "/api/cards/" + str(id) + "/", headers=headers, json=card)
    print(response.text)
    return jsonify(response.json()), response.status_code


@bp.route("/api/cards/<path:id>", methods=["DELETE"])
@jwt_required()
def delete_card(id):
    headers = {
        "Authorization": request.headers.get("Authorization"),
    }
    response = requests.delete("http://" + os.getenv("FILES_HOST") + "/api/cards/" + str(id) + "/", headers=headers)
    print(response.text)
    if response.status_code != 204: 
        return jsonify({}), response.status_code
    else: 
        return jsonify(response.text), response.status_code
   


@bp.route("/api/users", methods=["POST"])
def create_user():
    if not request.json.get("password") == request.json.get("confirmPassword"):
        return jsonify({"error": True, "message": "Passwords do not match"}), 400

    user = {
        "username": request.json.get("username"),
        "email": request.json.get("email"),
        "hashed_password": g.bcrypt.generate_password_hash(
            request.json.get("password")
        ).decode("utf-8"),
    }
    result = services.create_user(user)

    user = services.query_full_user(result["new_id"])
    print(user)
    if "error" in result:
        return jsonify(result), 400
    else:
        if not g.testing:
            send_email_validation(user)
        return jsonify({"new_id": result["new_id"], "message": "Check your email for a validation email."}), 200


@bp.route("/api/users/validate", methods=["GET"])
def validate_user():
    user = {"email": request.json.get("email")}
    if not services.validate_unique_email(user["email"]):
        return {"email_exists": True, "message": "Email is already in use."}
    else:
        return {"email_exists": False, "message": "Email is available."}


def admin_only(func):
    def wrapper(*args, **kwargs):

        current_user = get_jwt_identity()  # Extract the user identity from the token
        user = services.query_full_user(current_user)
        if not user["is_admin"]:
            return jsonify({}), 401

        result = func(*args, **kwargs)
        return result
    return wrapper
    
    
@bp.route("/api/users", methods=["GET"])
@jwt_required()
@admin_only
def get_users():
    users = services.query_all_users()
    return jsonify(users)


@bp.route("/api/users/<path:id>", methods=["GET"])
@jwt_required()
def get_user(id):
    headers = {
        "Authorization": request.headers.get("Authorization"),
    }
    response = requests.get("http://" + os.getenv("FILES_HOST") + "/api/users/" + str(id) + "/", headers=headers)
    print(response.text)
    return jsonify(response.json()), response.status_code

@bp.route("/api/users/<path:id>/subscription", methods=["GET"])
@jwt_required()
def get_user_subscription(id: int):

    current_user_id = get_jwt_identity()

    current_user = services.query_full_user(current_user_id)
    if current_user["id"] != int(id):
        if not current_user["is_admin"]:
            return jsonify({}), 403
    
    user = services.query_user_subscription(current_user)
    return jsonify(user)

@bp.route("/api/users/current", methods=["GET"])
@jwt_required()
def get_current_user():
    headers = {
        "Authorization": request.headers.get("Authorization"),
    }
    response = requests.get("http://" + os.getenv("FILES_HOST") + "/api/users/current/", headers=headers)
    print(response.text)
    return jsonify(response.json()), response.status_code

@bp.route("/api/users/<path:id>", methods=["PUT"])
@jwt_required()
def update_user(id):
    # Assuming you have a function to get the full user by id
    user = services.query_full_user(id)
    
    current_user = get_jwt_identity()  # Extract the user identity from the token
    user = services.query_full_user(current_user)
    if not user["is_admin"] or user["id"] != current_user:
        return jsonify({"message": "Unauthorized"}), 403
        
    # Extract the fields to be updated from the request
    is_admin = request.json.get("is_admin")
    username = request.json.get("username")
    email = request.json.get("email")
    
    old_email = user["email"]
    # Validate the input (basic example, you should expand on this)
    if not username or not email:
        return jsonify({"message": "Username and email are required"}), 400
    
    if "is_admin" not in request.json:
        is_admin = user["is_admin"]
    # Prepare the user update dictionary
    user_update = {
        "is_admin": is_admin,
        "username": username,
        "email": email
    }
    
    # Update user in database
    services.update_user(id, user_update)
    
    user = services.query_full_user(id)

    if old_email != email:
        conn = get_db()
        cur = conn.cursor()

        cur.execute("UPDATE users SET email_validated = FALSE WHERE id = %s", (user["id"],))

        conn.commit()
        cur.close()
        send_email_validation(user)
    # Return the updated user information
    return jsonify(services.query_full_user(id))


@bp.route("/api/user/<path:id>/password", methods=["PUT"])
def update_password(id):
    conn = get_db()
    cur = conn.cursor()
    data = request.get_json()
    password = data.get("password")

    user = services.query_full_user(id)

    if "error" in user:
        return jsonify({"message": "Wrong user"}), 401
    hashed_password = g.bcrypt.generate_password_hash(password).decode("utf-8")

    cur.execute("UPDATE users SET password = %s WHERE id = %s", (hashed_password, id))
    conn.commit()
    cur.close()
    return jsonify({"message": "success"})

@bp.route("/api/files/upload", methods=["POST"])
@jwt_required()
def upload_file():
    print("do we reqch here?")
    current_user = get_jwt_identity()  # Extract the user identity from the token

    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    if "card_pk" not in request.form:
        return jsonify({"error": "No PK given"}), 400
        
    file = request.files["file"]
    card_pk = request.form["card_pk"]
    if card_pk == "undefined":
        card_pk = None
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    # Proxy the request to the new backend
    files = {'file': (file.filename, file.stream, file.mimetype)}
    data = {'card_pk': card_pk}
    headers = {
        "Authorization": request.headers.get("Authorization"),
    }

    response = requests.post(f"http://{os.getenv('FILES_HOST')}/api/files/upload/", files=files, data=data, headers=headers)

    print(response)
    print(response.status_code)
    print(response.text)
    if response.status_code != 201:
        return jsonify({"error": response.text}), response.status_code
    print(response.json())

    return jsonify(response.json()), 201

@bp.route("/api/files", methods=["GET"])
@jwt_required()
def get_all_files():
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return jsonify({"error": "Authorization header is missing"}), 401
    # Forward the request to the Go backend
    headers = {
        "Authorization": auth_header
    }
    response = requests.get("http://" + os.getenv("FILES_HOST") + "/api/files", headers=headers)
    print(response)
    print(response.text)
    #print(response.json())

    # Return the response from the Go backend to the client
    return jsonify(response.json()), response.status_code


@bp.route("/api/files/download/<int:file_id>", methods=["GET"])
@jwt_required()
def download_file(file_id):
    current_user = get_jwt_identity()  # Extract the user identity from the token

    # Check file permissions
    if not services.check_file_permission(file_id, current_user):
        return jsonify({}), 401

    # Proxy the request to the Go backend
    auth_header = request.headers.get("Authorization")
    headers = {
        "Authorization": auth_header
    }

    response = requests.get(f"http://{os.getenv('FILES_HOST')}/api/files/download/{file_id}/", headers=headers, stream=True)
    print(response)
    print(response.status_code)

    if response.status_code != 200:
        return jsonify({"error": response.text}), response.status_code


    # Stream the response content back to the client
    return Response(
        response.iter_content(chunk_size=1024),
        content_type=response.headers['Content-Type'],
      )

@bp.route("/api/files/<int:file_id>", methods=["DELETE"])
@jwt_required()
def delete_file(file_id):

    current_user = get_jwt_identity()  # Extract the user identity from the token
    if not services.check_file_permission(file_id, current_user):
        return jsonify({}), 401

    headers = {
        "Authorization": request.headers.get("Authorization"),
    }
    response = requests.delete(f"http://{os.getenv('FILES_HOST')}/api/files/{file_id}/", headers=headers)
    if response.status_code != 200:
        print(response.text)
        return jsonify({"error": response.text}), response.status_code
    return jsonify({}), 200


@bp.route("/api/files/<int:file_id>", methods=["PATCH"])
@jwt_required()
def edit_file(file_id):
    current_user = get_jwt_identity()  # Extract the user identity from the token

    data = request.get_json()
    print(data)
    if not data:
        return jsonify({"error": "No update data provided"}), 400

    # Forward the request to the Go backend
    headers = {
        "Authorization": request.headers.get("Authorization"),
        "Content-Type": "application/json"
    }
    response = requests.patch(f"http://{os.getenv('FILES_HOST')}/api/files/{file_id}/", headers=headers, json=data)

    if response.status_code != 200:
        print(response.text)
        return jsonify({"error": "Failed to update file metadata"}), response.status_code

    updated_file = response.json()
    
    return jsonify(updated_file), response.status_code

@bp.route("/api/admin", methods=["GET"])
@jwt_required()
def check_admin():
    headers = {
        "Authorization": request.headers.get("Authorization"),
    }
    response = requests.get(f"http://{os.getenv('FILES_HOST')}/api/admin/", headers=headers)
    if response.status_code == 400:
        return jsonify(response.json()), response.status_code
    else:
        return jsonify({}), response.status_code

@bp.route("/api/webhook", methods=["POST"])
def webhook():

    payload = request.data
    sig_header = request.headers["Stripe-Signature"]
    endpoint_secret = g.config["STRIPE_ENDPOINT_SECRET"]

    event = stripe.Webhook.construct_event(
        payload, sig_header, endpoint_secret
    )
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError as e:
        # Invalid payload
        return jsonify({}), 400
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        return jsonify({}), 400
    if event['type'] == 'checkout.session.completed':
        session = stripe.checkout.Session.retrieve(
            event["data"]["object"]["id"],
            expand=["line_items"]
        )
        services.fulfill_subscription(request.json, session)
    elif event['type'] == 'customer.subscription.deleted':
        print(request.json)
    return jsonify({}), 200
    
@bp.route("/api/billing/publishable_key", methods=["GET"])
def get_publishable_key():
    stripe_config = {"publicKey": g.config["STRIPE_PUBLISHABLE_KEY"]}
    return jsonify(stripe_config)

@bp.route("/api/billing/create_checkout_session", methods=['POST'])
@jwt_required()
def create_checkout_session():

    current_user = get_jwt_identity() 
    user = services.query_full_user(current_user)

    
    subscription = services.query_user_subscription(user)
    if subscription["stripe_subscription_status"] == "active":
        return jsonify({"error": "User already has an active subscription"}), 400
    data = request.get_json()
    interval = data.get("interval")
    
    services.sync_stripe_plans()
    plan = services.fetch_plan_information(interval)
    try:
        checkout_session = stripe.checkout.Session.create(
            success_url=g.config['ZETTEL_URL'] + "/app/settings/billing/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url=g.config['ZETTEL_URL'] + "/app/settings/billing/cancelled",
            payment_method_types=["card"],
            mode="subscription",
            customer_email=user["email"],
            line_items=[
                {
                    'price': plan["stripe_price_id"],
                    'quantity': 1,
                },
            ],
            subscription_data={
                "trial_settings": {"end_behavior": {"missing_payment_method": "cancel"}},
                "trial_period_days": 30,
            }

        )
        g.logger.info("New subscription: %s", user["email"])
        return jsonify({"url": checkout_session.url}), 200
    except Exception as e:
        return jsonify(error=str(e)), 403

@bp.route("/api/billing/success", methods=["GET"])
@jwt_required()
def get_successful_session_data():
    session = stripe.checkout.Session.retrieve(request.args.get('session_id'))
    customer = stripe.Customer.retrieve(session.customer)

    return jsonify(customer), 200
