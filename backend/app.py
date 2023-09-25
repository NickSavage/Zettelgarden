from flask import Flask, request, jsonify
from flask_cors import CORS
from urllib.parse import unquote
import sqlite3
import re

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})


# Database setup
DB_FILE = "zettelkasten.db"
conn = sqlite3.connect(DB_FILE, check_same_thread=False)
cur = conn.cursor()
cur.execute(
        """
            CREATE TABLE IF NOT EXISTS cards (
                id TEXT PRIMARY KEY,
                title TEXT,
                body TEXT
            
        );
            """
    )
cur.execute(
        """
            CREATE TABLE IF NOT EXISTS backlinks (
                source_id TEXT,
                target_id TEXT,
                FOREIGN KEY (source_id) REFERENCES cards (id),
                FOREIGN KEY (target_id) REFERENCES cards (id)
            
        );
            """
    )
conn.commit()
cur.close()


def sort_ids(id):
    # Use regular expressions to split the id into numeric and non-numeric parts
    parts = re.split(r'(\D+)', id)
    # Convert numeric parts to integers
    parts = [part.zfill(5) if part.isdigit() else part for part in parts]
    return parts

def get_backlinks(card_id):
    cur = conn.cursor()
    cur.execute("SELECT backlinks.source_id, cards.title FROM backlinks JOIN cards ON backlinks.source_id = cards.id WHERE target_id = ?;", (card_id,))
    backlinks = [{"target_id": row[0], "title": row[1]} for row in cur.fetchall()]
    cur.close()
    return backlinks

def update_backlinks(id, backlinks):
    print(id, backlinks)
    cur = conn.cursor()
    # Delete existing backlinks for the card
    cur.execute("DELETE FROM backlinks WHERE source_id = ?;", (id,))
    # Insert new backlinks
    for target_id in backlinks:
        cur.execute("INSERT INTO backlinks (source_id, target_id) VALUES (?, ?);", (id, target_id))
        conn.commit()
    cur.close()

# Utility to extract backlinks from text
def extract_backlinks(text):
    # find all patterns like [anything here]
    return re.findall(r'\[([^\]]+)\]', text)

# Routes

@app.route('/cards', methods=['GET'])
def get_cards():
    cur = conn.cursor()
    cur.execute("SELECT id, title, body FROM cards;")
    cards = cur.fetchall()
    results = []
    for x in cards:
        id = x[0]
        card = {
            "id": x[0],
            "title": x[1],
            "body": x[2],
            "backlinks": get_backlinks(x[0])
        }
        results.append(card)
    results = sorted(results, key=lambda x: sort_ids(x["id"]))
    cur.close()
    return jsonify(results)


@app.route('/cards', methods=['POST'])
def create_card():
    cur = conn.cursor()
    id = request.json.get("id")
    title = request.json.get("title")
    body = request.json.get("body")
    
    # Insert card into database
    try:
        cur.execute("INSERT INTO cards (id, title, body) VALUES (?, ?, ?);", (id, title, body))
        conn.commit()
    except sqlite3.IntegrityError:
        return jsonify({"error": "id already used"})

    # Update backlinks
    backlinks = extract_backlinks(body)
    update_backlinks(id, backlinks)
    cur.close()
    
    return jsonify({"id": id, "title": title, "body": body})
                                                        

@app.route('/cards/<path:id>', methods=['GET'])
def get_card(id):
    id = unquote(id)
    print(id)
    cur = conn.cursor()
    cur.execute("SELECT * FROM cards WHERE id = ?;", (id,))
    card = cur.fetchone()
    if card:
        card = {
            "id": card[0],
            "title": card[1],
            "body": card[2],
            "backlinks": get_backlinks(card[0])
            
        }
    cur.close()
    return jsonify(card)


@app.route('/cards/<path:id>', methods=['PUT'])
def update_card(id):
    cur = conn.cursor()
    title = request.json.get("title")
    body = request.json.get("body")
    
    # Update card in database
    cur.execute("UPDATE cards SET title = ?, body = ? WHERE id = ?;", (title, body, id))
    conn.commit()
    
    # Update backlinks
    backlinks = extract_backlinks(body)
    update_backlinks(id, backlinks)
    
    cur.close()
    return jsonify({"id": id, "title": title, "body": body})


if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True)
