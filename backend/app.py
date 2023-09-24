from flask import Flask, request, jsonify
from flask_cors import CORS
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


def update_backlinks(id, backlinks):
    # Delete existing backlinks for the card
    cur.execute("DELETE FROM backlinks WHERE source_id = ?;", (id,))
    # Insert new backlinks
    for target_id in backlinks:
        cur.execute("INSERT INTO backlinks (source_id, target_id) VALUES (?, ?);", (id, target_id))
        conn.commit()

# Utility to extract backlinks from text
def extract_backlinks(text):
        # find all patterns like [A.1]
        return re.findall(r'\[(\w+\.\d+)\]', text)

# Routes

@app.route('/cards', methods=['GET'])
def get_cards():
    cur.execute("SELECT id, title, body FROM cards;")
    cards = cur.fetchall()
    results = []
    for x in cards:
        id = x[0]
        cur.execute("SELECT target_id FROM backlinks WHERE source_id = ?;", (id,))
        backlinks = [row[0] for row in cur.fetchall()]
        card = {
            "id": x[0],
            "title": x[1],
            "body": x[2],
            "backlinks": backlinks
            
        }
        results.append(card)
    results = sorted(results, key=lambda x: x["id"])
    print(results)
    return jsonify(results)


@app.route('/cards', methods=['POST'])
def create_card():
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
    
    return jsonify({"id": id, "title": title, "body": body})
                                                        

@app.route('/cards/<id>', methods=['GET'])
def get_card(id):
    cur.execute("SELECT * FROM cards WHERE id = ?;", (id,))
    card = cur.fetchone()
    if card:
        cur.execute("SELECT target_id FROM backlinks WHERE source_id = ?;", (id,))
        backlinks = [row[0] for row in cur.fetchall()]
        card = {
            "id": card[0],
            "title": card[1],
            "body": card[2],
            "backlinks": backlinks
            
        }
        return jsonify(card)


@app.route('/cards/<id>', methods=['PUT'])
def update_card(id):
    title = request.json.get("title")
    body = request.json.get("body")
    
    # Update card in database
    cur.execute("UPDATE cards SET title = ?, body = ? WHERE id = ?;", (title, body, id))
    conn.commit()
    
    # Update backlinks
    backlinks = extract_backlinks(body)
    update_backlinks(id, backlinks)
    
    return jsonify({"id": id, "title": title, "body": body})


if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True)
