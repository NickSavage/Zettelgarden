from datetime import timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from urllib.parse import unquote
import psycopg2
import os
import re
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.config['JWT_SECRET_KEY'] = 'your_jwt_secret_key'  # Change this!
jwt = JWTManager(app)
bcrypt = Bcrypt(app)  # app is your Flask app instance

# Database setup
DB_FILE = "zettelkasten.db"
print([os.getenv('DB_NAME'),os.getenv('DB_USER'),os.getenv('DB_PASS'),os.getenv('DB_HOST'), os.getenv('DB_PORT')])

conn = psycopg2.connect(
    dbname=os.getenv('DB_NAME'),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASS'),
    host=os.getenv('DB_HOST'),
    port=os.getenv('DB_PORT'),
    options='-c client_encoding=UTF8'
)

cur = conn.cursor()
cur.execute(
        """
            CREATE TABLE IF NOT EXISTS cards (
                id SERIAL PRIMARY KEY,
                card_id TEXT,
                title TEXT,
                body TEXT,
                link TEXT,
                created_at TIMESTAMP,
                updated_at TIMESTAMP
        );
            """
    )
cur.execute(
        """
            CREATE TABLE IF NOT EXISTS backlinks (
                source_id TEXT,
                target_id TEXT,
                created_at TIMESTAMP,
                updated_at TIMESTAMP
            
        );
            """
    )
cur.execute(
        """
            CREATE TABLE IF NOT EXISTS unsorted_cards (
                id SERIAL PRIMARY KEY,
                title TEXT,
                body TEXT,
                created_at TIMESTAMP,
                updated_at TIMESTAMP
            
        );
            """
    )
cur.execute(
        """
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT,
                email TEXT,
                password TEXT,
                created_at TIMESTAMP,
                updated_at TIMESTAMP
        );
            """
    )
conn.commit()
cur.close()

# login

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get('password')
    
    user = query_username(username, True)

    if not user:
        return jsonify({"error": "User not found"}), 404
    if "error" in user:
        return jsonify({"error": "Invalid credentials"}), 401
        
#    if user and user['password'] == password:
    if user and bcrypt.check_password_hash(user['password'], password):
        access_token = create_access_token(identity=username, expires_delta=timedelta(days=15))
        del user['password']
        results = {
            "access_token": access_token,
            "user": user
        }
        return jsonify(results), 200
    else:
        return jsonify({"message": "Invalid credentials"}), 401
    
# Serializers

full_card_query = "SELECT id, card_id, title, body, link, created_at, updated_at FROM cards"
partial_card_query = "SELECT id, card_id, title FROM cards"

def full_card_query_filtered(search_term) -> str:
    return full_card_query + " WHERE title like '%" + search_term + "%' OR body LIKE '%" + search_term +"%';"
def partial_card_query_filtered(search_term) -> str:
    return partial_card_query + " WHERE title like '%" + search_term + "%';"


full_user_query = "SELECT id, username, password, created_at, updated_at FROM users"

def serialize_full_card(card) -> dict:
    card = {
        "id": card[0],
        "card_id": card[1],
        "title": card[2],
        "body": card[3],
        "link": card[4],
        "created_at": card[5],
        "updated_at": card[6],
        "direct_links": get_direct_links(card[3]),
        "backlinks": get_backlinks(card[1]),
        "parent": get_parent(card[1])
    }
    return card

def serialize_partial_card(card) -> dict:
    card = {
        "id": card[0],
        "card_id": card[1],
        "title": card[2],
    }
    return card

def serialize_full_user(user: list, include_password=False) -> dict:
    result = {
        "id": user[0],
        "name": user[1],
        "created_at": user[3],
        "updated_at": user[4],
    }
    if include_password:
        result["password"] = user[2]
    return result
    

def query_full_card(id) -> dict:
    cur = conn.cursor()
    if id == 'null':
        return {"error": "Card not found"}
    try:
        cur.execute(full_card_query + " WHERE id = %s;", (id,))
        card = cur.fetchone()
    except Exception as e:
        return {"error": str(e)}
    if card:
        card = serialize_full_card(card)
    cur.close()
    return card
    
def query_full_user(id: int, include_password=False) -> dict:
    cur = conn.cursor()
    if id == 'null':
        return {"error": "User not found"}
    try:
        cur.execute(full_user_query + " WHERE id = %s;", (id,))
        user = cur.fetchone()
    except Exception as e:
        return {"error": str(e)}
    if user:
        user = serialize_full_user(user, include_password)
    cur.close()
    return user

def query_username(username: str, include_password=False) -> dict:
    cur = conn.cursor()
    if not username:
        return {"error": "User not found"}
    try:
        cur.execute(full_user_query + " WHERE username = %s;", (username,))
        user = cur.fetchone()
    except Exception as e:
        return {"error": str(e)}
    if user:
        user = serialize_full_user(user, include_password)
    cur.close()
    return user
    
def query_all_partial_cards(search_term=None) -> list:
    cur = conn.cursor()
    if search_term:
        cur.execute(partial_card_query_filtered(search_term))
    else:
        cur.execute(partial_card_query)
    cards = cur.fetchall()
    results = []
    for x in cards:
        card = serialize_partial_card(x)
        results.append(card)
    cur.close()
    return results
    

def query_all_full_cards(search_term=None) -> list:
    cur = conn.cursor()
    if search_term:
        cur.execute(full_card_query_filtered(search_term))
    else:
        cur.execute(full_card_query)
    cards = cur.fetchall()
    results = []
    for x in cards:
        card = serialize_full_card(x)
        results.append(card)
    cur.close()
    return results
    
    
def query_partial_card(card_id) -> dict:
    cur = conn.cursor()
    parent_id = card_id.split('/')[0]
    
    cur.execute(partial_card_query + " WHERE card_id = '" + parent_id + "';")
    cards = cur.fetchall()
    results = []
    for x in cards:
        card = serialize_partial_card(x)
        results.append(card)

    cur.close()
    if len(results) > 0:
        return results[0]
    else:
        return {}


def sort_ids(id):
    # Use regular expressions to split the id into numeric and non-numeric parts
    parts = re.split(r'(\D+)', id)
    # Convert numeric parts to integers
    parts = [part.zfill(5) if part.isdigit() else part for part in parts]
    return parts

def get_backlinks(card_id):
    cur = conn.cursor()
    cur.execute("SELECT cards.id, backlinks.source_id, cards.title FROM backlinks JOIN cards ON backlinks.source_id = cards.card_id WHERE target_id = %s;", (card_id,))
    backlinks = [{"id": row[0], "card_id": row[1], "title": row[2]} for row in cur.fetchall()]
    cur.close()
    return backlinks

def update_backlinks(card_id, backlinks):
    cur = conn.cursor()
    # Delete existing backlinks for the card
    cur.execute("DELETE FROM backlinks WHERE source_id = %s;", (card_id,))
    # Insert new backlinks
    for target_id in backlinks:
        cur.execute("INSERT INTO backlinks (source_id, target_id, created_at, updated_at) VALUES (%s, %s, NOW(), NOW());", (card_id, target_id))
        conn.commit()
    cur.close()

# Utility to extract backlinks from text
def extract_backlinks(text):
    # find all patterns like [anything here]
    return re.findall(r'\[([^\]]+)\]', text)

# Routes

def check_is_card_id_unique(card_id: str) -> bool:
    cur = conn.cursor()
    cur.execute("SELECT card_id FROM cards;")
    ids = cur.fetchall()
    for id in ids:
        if card_id == id[0]:
            return False
    return True
    
def get_direct_links(body: str) -> list:
    links = extract_backlinks(body)
    results = []
    for card_id in links:
        x = query_partial_card(card_id)
        results.append(x)
    return results

def get_parent(card_id: str) -> dict:
    if card_id == '':
        return {}
    result = query_partial_card(card_id)
    return result

@app.route('/api/cards', methods=['GET'])
@jwt_required()
def get_cards():
    search_term = request.args.get('search_term', None)
    partial = request.args.get('partial', False)
    try:
        if partial:
            results = query_all_partial_cards(search_term)
        else:
            results = query_all_full_cards(search_term)
        results = sorted(results, key=lambda x: sort_ids(x["card_id"]), reverse=True)
    except Exception as e:
        return jsonify({"error": str(e)})
    return jsonify(results)


@app.route('/api/cards', methods=['POST'])
@jwt_required()
def create_card():
    cur = conn.cursor()
    title = request.json.get("title")
    body = request.json.get("body")
    card_id = request.json.get("card_id")

    if not card_id == "" and not check_is_card_id_unique(card_id):
        return jsonify({"error": "id already used"})
        
    link = request.json.get("link")
    
    # Insert card into database
    try:
        cur.execute("INSERT INTO cards (card_id, title, body, link, created_at, updated_at) VALUES (%s, %s, %s, %s, NOW(), NOW()) RETURNING id;", (card_id, title, body, link))
        new_id = cur.fetchone()[0]
        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)})

    # Update backlinks
    backlinks = extract_backlinks(body)
    update_backlinks(card_id, backlinks)
    cur.close()
    
    result = query_full_card(new_id)
    return jsonify(result)
                                                        

@app.route('/api/cards/<path:id>', methods=['GET'])
@jwt_required()
def get_card(id):
    id = unquote(id)
    card = query_full_card(id)
    return jsonify(card)


@app.route('/api/cards/<path:id>', methods=['PUT'])
@jwt_required()
def update_card(id):
    cur = conn.cursor()
    title = request.json.get("title")
    body = request.json.get("body")
    card_id = request.json.get("card_id")
    link = request.json.get("link")
    
    # Update card in database
    cur.execute("UPDATE cards SET title = %s, body = %s, link = %s, updated_at = NOW(), card_id = %s WHERE id = %s;", (title, body, link, card_id, id))
    conn.commit()
    
    # Update backlinks
    backlinks = extract_backlinks(body)
    update_backlinks(card_id, backlinks)
    
    cur.close()
    return jsonify(query_full_card(id))

@app.route('/api/users/<path:id>', methods=['GET'])
@jwt_required()
def get_user(id):
    id = unquote(id)
    user = query_full_user(id)
    return jsonify(user)
    
@app.route('/api/user/<path:id>/password', methods=['PUT'])
@jwt_required()
def update_password(id):
    cur = conn.cursor()
    data = request.get_json()
    password = data.get('password')

    user = query_full_user(id)

    if "error" in user:
        return jsonify({"message": "Wrong user"}), 401
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    cur.execute("UPDATE users SET password = %s WHERE id = %s", (hashed_password, id))
    conn.commit()
    cur.close()
    return jsonify({"message": "success"})
    

if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True)
