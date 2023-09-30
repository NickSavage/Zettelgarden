from flask import Flask, request, jsonify
from flask_cors import CORS
from urllib.parse import unquote
import sqlite3
import re

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})


# Database setup
DB_FILE = "/opt/zettelkasten.db"
conn = sqlite3.connect(DB_FILE, check_same_thread=False)
cur = conn.cursor()
cur.execute(
        """
            CREATE TABLE IF NOT EXISTS cards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                card_id TEXT,
                title TEXT,
                body TEXT,
                is_reference INT DEFAULT 0,
                link TEXT,
                created_at TEXT,
                updated_at TEXT
        );
            """
    )
cur.execute(
        """
            CREATE TABLE IF NOT EXISTS backlinks (
                source_id TEXT,
                target_id TEXT,
                created_at TEXT,
                updated_at TEXT,
                FOREIGN KEY (source_id) REFERENCES cards (card_id),
                FOREIGN KEY (target_id) REFERENCES cards (card_id)
            
        );
            """
    )
cur.execute(
        """
            CREATE TABLE IF NOT EXISTS unsorted_cards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                body TEXT,
                created_at TEXT,
                updated_at TEXT
            
        );
            """
    )
conn.commit()
cur.close()

# Serializers

full_card_query = "SELECT id, card_id, title, body, is_reference, link, created_at, updated_at FROM cards"
partial_card_query = "SELECT id, card_id, title FROM cards"

def serialize_full_card(card) -> dict:
    is_ref = False
    if card[3] == 1:
        is_ref = True
    card = {
        "id": card[0],
        "card_id": card[1],
        "title": card[2],
        "body": card[3],
        "is_reference": is_ref,
        "link": card[5],
        "created_at": card[6],
        "updated_at": card[7],
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

def query_full_card(id) -> dict:
    print(id)
    cur = conn.cursor()
    cur.execute(full_card_query + " WHERE id = ?;", (id,))
    card = cur.fetchone()
    if card:
        card = serialize_full_card(card)
    cur.close()
    return card
    
def query_all_full_cards() -> list:
    cur = conn.cursor()
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
    cur.execute("SELECT cards.id, backlinks.source_id, cards.title FROM backlinks JOIN cards ON backlinks.source_id = cards.card_id WHERE target_id = ?;", (card_id,))
    backlinks = [{"id": row[0], "card_id": row[1], "title": row[2]} for row in cur.fetchall()]
    cur.close()
    return backlinks

def update_backlinks(id, backlinks):
    print(id, backlinks)
    cur = conn.cursor()
    # Delete existing backlinks for the card
    cur.execute("DELETE FROM backlinks WHERE source_id = ?;", (id,))
    # Insert new backlinks
    for target_id in backlinks:
        cur.execute("INSERT INTO backlinks (source_id, target_id, created_at, updated_at) VALUES (?, ?, datetime('now'), datetime('now'));", (id, target_id))
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
        print(id)
        if card_id == id[0]:
            return False
    return True
    
def get_parent(card_id: str) -> dict:
    if card_id == '':
        return {}
    result = query_partial_card(card_id)
    return result

@app.route('/api/cards', methods=['GET'])
def get_cards():
    results = query_all_full_cards()
    results = sorted(results, key=lambda x: sort_ids(x["card_id"]), reverse=True)
    return jsonify(results)


@app.route('/api/cards', methods=['POST'])
def create_card():
    cur = conn.cursor()
    title = request.json.get("title")
    body = request.json.get("body")
    card_id = request.json.get("card_id")
    is_reference = request.json.get("is_reference")

    if not card_id == "" and not check_is_card_id_unique(card_id):
        return jsonify({"error": "id already used"})
        
    if is_reference:
        is_reference = 1
    else:
        is_reference = 0
    link = request.json.get("link")
    
    # Insert card into database
    try:
        cur.execute("INSERT INTO cards (card_id, title, body, is_reference, link, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'));", (card_id, title, body, is_reference, link))
        conn.commit()
    except sqlite3.IntegrityError:
        return jsonify({"error": "id already used"})

    # Update backlinks
    backlinks = extract_backlinks(body)
    update_backlinks(card_id, backlinks)
    cur.close()
    
    return jsonify({"card_id":card_id, "title": title, "body": body})
                                                        

@app.route('/api/cards/<path:id>', methods=['GET'])
def get_card(id):
    id = unquote(id)
    card = query_full_card(id)
    return jsonify(card)


@app.route('/api/cards/<path:id>', methods=['PUT'])
def update_card(id):
    cur = conn.cursor()
    title = request.json.get("title")
    body = request.json.get("body")
    card_id = request.json.get("card_id")
    is_reference = request.json.get("is_reference")
    if is_reference:
        is_reference = 1
    else:
        is_reference = 0
    link = request.json.get("link")
    
    # Update card in database
    cur.execute("UPDATE cards SET title = ?, body = ?, is_reference = ?, link = ?, updated_at = datetime('now'), card_id = ? WHERE id = ?;", (title, body, is_reference, link, card_id, id))
    conn.commit()
    
    # Update backlinks
    backlinks = extract_backlinks(body)
    print(backlinks)
    update_backlinks(id, backlinks)
    
    cur.close()
    return jsonify({"id": id, "card_id": card_id, "title": title, "body": body, "is_reference": is_reference, "link": link})


if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True)
