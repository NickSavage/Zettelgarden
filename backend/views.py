from datetime import timedelta
from flask import Flask, request, jsonify, send_from_directory, Blueprint, g
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
)
from flask_bcrypt import Bcrypt
import uuid

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


@bp.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    user = services.query_user_by_username(username, True)

    if not user or "error" in user:
        return jsonify({"error": "Invalid credentials"}), 401

    #    if user and user['password'] == password:
    if user and g.bcrypt.check_password_hash(user["password"], password):
        access_token = create_access_token(
            identity=user["id"], expires_delta=timedelta(days=15)
        )
        del user["password"]
        results = {"access_token": access_token, "user": user}
        return jsonify(results), 200
    else:
        return jsonify({"message": "Invalid credentials"}), 401


@bp.route("/api/auth", methods=["GET"])
@jwt_required()
def check_token():
    return jsonify({}), 200
    

@bp.route("/api/cards", methods=["GET"])
@jwt_required()
def get_cards():
    search_term = request.args.get("search_term", None)
    partial = request.args.get("partial", False)
    try:
        if partial:
            results = services.query_all_partial_cards(search_term)
        else:
            results = services.query_all_full_cards(search_term)
        results = sorted(
            results, key=lambda x: utils.sort_ids(x["card_id"]), reverse=True
        )
    except Exception as e:
        return jsonify({"error": str(e)})
    return jsonify(results)


@bp.route("/api/cards", methods=["POST"])
@jwt_required()
def create_card():
    user_id = get_jwt_identity()  # Extract the user identity from the token

    # Validate input data
    required_fields = ["title", "body", "card_id"]
    missing_fields = [field for field in required_fields if field not in request.json]
    if missing_fields:
        return jsonify({"error": f"Missing fields: {', '.join(missing_fields)}"}), 400

    conn = get_db()
    cur = conn.cursor()
    card = {
        "title": request.json.get("title"),
        "body": request.json.get("body"),
        "card_id": request.json.get("card_id"),
        "link": request.json.get("link"),
    }

    print(card)
    # Insert card into database
    result = services.create_card(card, user_id)
    if "error" in result:
        return jsonify(result), 400
    elif "new_id" in result:
        new_id = result["new_id"]
    else:
        return jsonify({"error": "Unknown error"}), 500

    # Update backlinks
    cur.close()

    result = services.query_full_card(new_id)
    return jsonify(result)


@bp.route("/api/cards/<path:id>", methods=["GET"])
@jwt_required()
def get_card(id):
    current_user = get_jwt_identity()  # Extract the user identity from the token
    id = unquote(id)
    card = services.query_full_card(id)
    if not card:
        return "Card not found", 404
    print(card)
    if "error" in card:
        return jsonify(card), 400
    log_card_view(id, current_user)
    return jsonify(card)


@bp.route("/api/cards/<path:id>", methods=["PUT"])
@jwt_required()
def update_card(id):
    card = {
        "title": request.json.get("title"),
        "body": request.json.get("body"),
        "card_id": request.json.get("card_id"),
        "link": request.json.get("link"),
    }

    # Update card in database
    services.update_card(id, card)

    # Update backlinks
    return jsonify(services.query_full_card(id))

@bp.route("/api/cards/<path:id>", methods=["DELETE"])
@jwt_required()
def delete_card(id):
    results = services.delete_card(id)
    if "error" in results:
        print(results)
        return jsonify({"error": results["error"]}), results["code"]

    return "", 204

@bp.route("/api/users/<path:id>", methods=["GET"])
@jwt_required()
def get_user(id):
    id = unquote(id)
    user = services.query_full_user(id)
    return jsonify(user)


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
    current_user = get_jwt_identity()  # Extract the user identity from the token
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    card_pk = request.form["card_pk"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if file:  # You can add more file validation here
        file = services.upload_file(card_pk, file, current_user)
        return jsonify({"message": "File uploaded successfully", "file": file}), 201
    else:
        return jsonify({"error": "Unspecified Problem"}), 400


@bp.route("/api/files/<int:file_id>", methods=["GET"])
@jwt_required()
def get_file_metadata(file_id):
    file_data = services.query_file(file_id)
    if file_data:
        return jsonify(file_data)
    else:
        return jsonify({"error": "File not found"}), 404


@bp.route("/api/files", methods=["GET"])
@jwt_required()
def get_all_files():
    results = services.query_all_files()
    if results:
        return jsonify(results)
    else:
        return jsonify({"error": "File not found"}), 404


@bp.route("/api/files/download/<int:file_id>", methods=["GET"])
@jwt_required()
def download_file(file_id):
    file = services.query_file(file_id, internal=True)

    print(file)
    if file:
        return send_from_directory(g.config["UPLOAD_FOLDER"], file["filename"])
    else:
        return jsonify({"error": "File not found"}), 404


@bp.route("/api/files/<int:file_id>", methods=["DELETE"])
@jwt_required()
def delete_file(file_id):
    print(file_id)
    file = services.query_file(file_id)

    if file:
        try:
            services.delete_file(file_id)
        except ValueError:
            return jsonify({"error": "File not found"}), 404
        return jsonify({"message": "File successfully deleted"}), 200
    else:
        return jsonify({"error": "File not found"}), 404


@bp.route("/api/files/<int:file_id>", methods=["PATCH"])
@jwt_required()
def edit_file(file_id):
    data = request.get_json()

    if not data:
        return jsonify({"error": "No update data provided"}), 400

    data = {"name": data["name"]}
    services.update_file(file_id, data)

    updated_file = services.query_file(file_id)
    updated_file["card"] = services.query_partial_card_by_id(updated_file["card_pk"])
    return jsonify(updated_file), 200

@bp.route("/api/admin", methods=["GET"])
@jwt_required()
def check_admin():
    current_user = get_jwt_identity()  # Extract the user identity from the token
    user = services.query_full_user(current_user)
    if user["is_admin"]:
        return jsonify({}), 204
    else:
        return jsonify({}), 401
        

    
