from datetime import timedelta
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from urllib.parse import unquote
import psycopg2
import os
import re
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
import uuid
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.config['JWT_SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER')
jwt = JWTManager(app)
bcrypt = Bcrypt(app)  # app is your Flask app instance

# Database setup
DB_FILE = "zettelkasten.db"
print('start', flush=True)
print([os.getenv('DB_NAME'),os.getenv('DB_USER'),os.getenv('DB_PASS'),os.getenv('DB_HOST'), os.getenv('DB_PORT')], flush=True)

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
                user_id INT,
                title TEXT,
                body TEXT,
                link TEXT,
                created_at TIMESTAMP,
                updated_at TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
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
cur.execute(
    """
        CREATE TABLE IF NOT EXISTS card_views (
            id SERIAL PRIMARY KEY,
            card_pk INT, 
            user_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (card_pk) REFERENCES cards(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """
)
cur.execute(
    """
        CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            user_id INT,
            name TEXT,
            description TEXT,
            regex TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_by INT,
            updated_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (created_by) REFERENCES users(id),
            FOREIGN KEY (updated_by) REFERENCES users(id)
    )
    """
)
cur.execute(
    """
    CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        name TEXT,
        type TEXT,
        path TEXT,
        filename TEXT,
        size INT,
        created_by INT,
        updated_by INT,
        card_pk INT, 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id),
        FOREIGN KEY (card_pk) REFERENCES cards(id)
    )
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

    if not user or "error" in user:
        return jsonify({"error": "Invalid credentials"}), 401
        
#    if user and user['password'] == password:
    if user and bcrypt.check_password_hash(user['password'], password):
        access_token = create_access_token(identity=user["id"], expires_delta=timedelta(days=15))
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
full_file_query = "SELECT id, name, type, path, filename, size, created_by, updated_by, card_pk, created_at, updated_at FROM files"

def full_card_query_filtered(search_terms) -> str:
    # Split the search string into separate terms
    terms = search_terms.split()

    # Create a list to hold individual SQL conditions
    conditions = []

    # For each term, add conditions for both title and body
    for term in terms:
        term_condition = f"(title ILIKE '%{term}%' OR body ILIKE '%{term}%')"
        conditions.append(term_condition)

    # Join the conditions using the AND or OR operator
    # Use 'AND' for more restrictive searches, 'OR' for broader searches
    query_condition = ' AND '.join(conditions)

    # Construct the final query
    final_query = f"{full_card_query} WHERE {query_condition};"

    return final_query
def partial_card_query_filtered(search_term) -> str:
    return partial_card_query + " WHERE title ILIKE '%" + search_term + "%';"


full_user_query = "SELECT id, username, password, created_at, updated_at FROM users"

def log_card_view(card_pk, user_id):
    cur = conn.cursor()
    try:
        # Assuming 'card_id' is the primary key of the card in your cards table
        if card_pk is not None and card_pk != 'null':
            cur.execute("INSERT INTO card_views (card_pk, user_id, created_at) VALUES (%s, %s, CURRENT_TIMESTAMP);", (card_pk, user_id,))
            conn.commit()  # Commit the transaction
            return {"success": "View logged"}
        else:
            return {"error": "Invalid card ID"}
    except Exception as e:
        print(e, flush=True)
        return {"error": str(e)}
    finally:
        cur.close()

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
        "parent": get_parent(card[1]),
        "files": get_files_from_card_id(card[0]),
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

def serialize_category(category: list) -> dict:
    return {
        "id": category[0],
        "user_id": category[1],
        "name": category[2],
        "description": category[3],
        "regex": category[4],
        "is_active": category[5],
        "created_by": category[6],
        "updated_by": category[7],
        "created_at": category[8],
        "updated_at": category[9]
    }   

def serialize_file(file: list) -> dict:
    return {
        "id": file[0],
        "name": file[1],
        "type": file[2],
        "filename": file[4],
        "size": file[5],
        "created_by": file[6],
        "updated_by": file[7],
        "card_pk": file[8],
        "created_at": file[9],
        "updated_at": file[10]
    }

def serialize_internal_file(file: list) -> dict:
    return {
        "id": file[0],
        "name": file[1],
        "type": file[2],
        "path": file[3],
        "filename": file[4],
        "size": file[5],
        "created_by": file[6],
        "updated_by": file[7],
        "card_pk": file[8],
        "created_at": file[9],
        "updated_at": file[10]
    }
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
    
    
def query_partial_card_by_id(id) -> dict:
    cur = conn.cursor()
    
    cur.execute(partial_card_query + " WHERE id = %s;", (id,))
    card = cur.fetchone()
    cur.close()
    if card:
        return serialize_partial_card(card)

def query_partial_card(card_id) -> dict:
    cur = conn.cursor()
    
    cur.execute(partial_card_query + " WHERE card_id = %s;", (card_id,))
    card = cur.fetchone()
    cur.close()
    if card:
        return serialize_partial_card(card)


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


def _get_parent_id_alternating(card_id):
    parts = []
    current_part = ""

    # Iterate through each character in the card_id
    for char in card_id:
        if char in ['/', '.']:
            # When a separator is encountered, add the current part to the parts list
            parts.append(current_part)
            current_part = ""
        else:
            current_part += char

    # Add the last part if it's not empty
    if current_part:
        parts.append(current_part)

    # If there's only one part, there's no parent
    if len(parts) <= 1:
        return None

    # Reassemble the parent ID
    parent_id = ""
    for i in range(len(parts) - 1):
        parent_id += parts[i]
        if i < len(parts) - 2:  # Add the separator back
            parent_id += '/' if i % 2 == 0 else '.'

    return parent_id


# Test the function with a longer ID
long_id = "SP170/A.1/A.1/A.1/A.1"
assert(_get_parent_id_alternating("SP170/A.1/A.1/A.1/A.1") == "SP170/A.1/A.1/A.1/A")

def get_parent(card_id: str) -> dict:
    parent_id = _get_parent_id_alternating(card_id)
    if parent_id is None:
        result = query_partial_card(card_id)
    else:
        result = query_partial_card(parent_id)

    return result

def get_files_from_card_id(card_id: int) -> list:

    cur = conn.cursor()
    cur.execute(full_file_query + " WHERE card_pk = %s;", (card_id,))
    data = cur.fetchall()
    results = [serialize_file(x) for x in data]
    cur.close()
    return results

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
    user_id = get_jwt_identity()  # Extract the user identity from the token
    cur = conn.cursor()
    title = request.json.get("title")
    body = request.json.get("body")
    card_id = request.json.get("card_id")

    if not card_id == "" and not check_is_card_id_unique(card_id):
        return jsonify({"error": "id already used"})
        
    link = request.json.get("link")
    
    # Insert card into database
    try:
        cur.execute("INSERT INTO cards (card_id, user_id, title, body, link, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, NOW(), NOW()) RETURNING id;", (card_id, user_id, title, body, link))
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
    current_user = get_jwt_identity()  # Extract the user identity from the token
    id = unquote(id)
    card = query_full_card(id)
    log_card_view(id, current_user)
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

@app.route('/api/users/<int:user_id>/categories', methods=['GET'])
@jwt_required()
def get_user_categories(user_id):
    cur = conn.cursor()

    # Query to fetch all categories for the specified user
    cur.execute("SELECT * FROM categories WHERE user_id = %s AND is_active = TRUE", (user_id,))
    categories = cur.fetchall()
    cur.close()

    # Formatting the result into a list of dictionaries for better JSON serialization
    categories_list = [serialize_category(category) for category in categories]

    return jsonify(categories_list)

@app.route('/api/categories', methods=['POST'])
@jwt_required()
def create_category():
    cur = conn.cursor()
    data = request.get_json()

    user_id = data.get('user_id')
    name = data.get('name')
    description = data.get('description')
    regex = data.get('regex')
    is_active = data.get('is_active', True)
    created_by = data.get('created_by')

    cur.execute("""
        INSERT INTO categories (user_id, name, description, regex, is_active, created_by, updated_by) 
        VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id;
    """, (user_id, name, description, regex, is_active, created_by, created_by))

    new_category_id = cur.fetchone()[0]
    conn.commit()
    cur.close()

    return jsonify({"message": "success", "category_id": new_category_id}), 201

@app.route('/api/categories/<int:category_id>', methods=['PUT'])
@jwt_required()
def update_category(category_id):
    cur = conn.cursor()
    data = request.get_json()

    # Fields that can be updated
    name = data.get('name')
    description = data.get('description')
    regex = data.get('regex')
    updated_by = data.get('updated_by')

    cur.execute("""
        UPDATE categories
        SET name = %s, description = %s, regex = %s, updated_by = %s, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s;
    """, (name, description, regex, updated_by, category_id))

    conn.commit()
    cur.close()

    return jsonify({"message": "success"}), 200

def query_file(file_id, internal=False) -> dict:
    cur = conn.cursor()
    cur.execute("SELECT * FROM files WHERE id = %s;", (file_id,))
    file_data = cur.fetchone()
    if internal:
        results = serialize_internal_file(file_data)
    else:
        results = serialize_file(file_data)
    cur.close()
    return results
    

@app.route('/api/files/upload', methods=['POST'])
@jwt_required()
def upload_file():
    current_user = get_jwt_identity()  # Extract the user identity from the token
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    card_pk = request.form['card_pk']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file:  # You can add more file validation here
        original_filename = secure_filename(file.filename)
        file_extension = os.path.splitext(original_filename)[1]
        filename = str(uuid.uuid4()) + file_extension  # UUID as filename

        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        cur = conn.cursor()
        cur.execute("INSERT INTO files (name, type, path, filename, size, card_pk, created_by, updated_by, updated_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW()) RETURNING id;", 
                    (original_filename, file.content_type, file_path, filename, os.path.getsize(file_path), card_pk, current_user, current_user))
        file_id = cur.fetchone()[0]
        file = query_file(file_id)
        conn.commit()
        cur.close()

        return jsonify({'message': 'File uploaded successfully', 'file': file}), 201
 
@app.route('/api/files/<int:file_id>', methods=['GET'])
@jwt_required()
def get_file_metadata(file_id):


    file_data = query_file(file_id)
    if file_data:
        return jsonify(file_data)
    else:
        return jsonify({'error': 'File not found'}), 404
    
@app.route('/api/files', methods=['GET'])
@jwt_required()
def get_all_files():

    cur = conn.cursor()
    cur.execute(full_file_query)
    data = cur.fetchall()
    file_data = [serialize_file(x) for x in data]
    cur.close()
    if file_data:
        results = []
        for file in file_data:
            new = file
            print(new)
            new["card"] = query_partial_card_by_id(file["card_pk"])
            results.append(new)
        return jsonify(results)
    else:
        return jsonify({'error': 'File not found'}), 404
@app.route('/api/files/download/<int:file_id>', methods=['GET'])
@jwt_required()
def download_file(file_id):
    file = query_file(file_id, internal=True)

    print(file)
    if file:
        return send_from_directory(app.config['UPLOAD_FOLDER'],
                                   file['filename'])
    else:
        return jsonify({'error': 'File not found'}), 404

if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True)
