from database import get_db

import models.card
import utils

full_file_query = "SELECT id, name, type, path, filename, size, created_by, updated_by, card_pk, created_at, updated_at FROM files"
full_user_query = "SELECT id, username, password, created_at, updated_at FROM users"

def get_direct_links(body: str) -> list:
    links = utils.extract_backlinks(body)
    results = []
    for card_id in links:
        x = query_partial_card(card_id)
        results.append(x)
    return results

def get_backlinks(card_id):
    cur = get_db().cursor()
    cur.execute("SELECT cards.id, backlinks.source_id, cards.title FROM backlinks JOIN cards ON backlinks.source_id = cards.card_id WHERE target_id = %s;", (card_id,))
    backlinks = [{"id": row[0], "card_id": row[1], "title": row[2]} for row in cur.fetchall()]
    cur.close()
    return backlinks

def update_backlinks(card_id, backlinks):
    conn = get_db()
    cur = conn.cursor()
    # Delete existing backlinks for the card
    cur.execute("DELETE FROM backlinks WHERE source_id = %s;", (card_id,))
    # Insert new backlinks
    for target_id in backlinks:
        cur.execute("INSERT INTO backlinks (source_id, target_id, created_at, updated_at) VALUES (%s, %s, NOW(), NOW());", (card_id, target_id))
        conn.commit()
    cur.close()

def get_parent(card_id: str) -> dict:
    parent_id = utils._get_parent_id_alternating(card_id)
    if parent_id is None:
        result = query_partial_card(card_id)
    else:
        result = query_partial_card(parent_id)

    return result

def get_files_from_card_id(card_id: int) -> list:

    cur = get_db().cursor()
    cur.execute(full_file_query + " WHERE is_deleted = FALSE AND card_pk = %s;", (card_id,))
    data = cur.fetchall()
    results = [serialize_file(x) for x in data]
    cur.close()
    return results


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
def query_all_partial_cards(search_term=None) -> list:
    cur = get_db().cursor()
    if search_term:
        cur.execute(models.card.partial_card_query_filtered(search_term))
    else:
        cur.execute(models.card.partial_card_query)
    cards = cur.fetchall()
    results = []
    for x in cards:
        card = serialize_partial_card(x)
        results.append(card)
    cur.close()
    return results
    

def query_all_full_cards(search_term=None) -> list:
    cur = get_db().cursor()
    if search_term:
        cur.execute(models.card.full_card_query_filtered(search_term))
    else:
        cur.execute(models.card.full_card_query)
    cards = cur.fetchall()
    results = []
    for x in cards:
        card = serialize_full_card(x)
        results.append(card)
    cur.close()
    return results
    
    
def query_partial_card_by_id(id) -> dict:
    cur = get_db().cursor()
    
    cur.execute(models.card.partial_card_query + " WHERE id = %s;", (id,))
    card = cur.fetchone()
    cur.close()
    if card:
        return serialize_partial_card(card)
    return {}

def query_partial_card(card_id) -> dict:
    cur = get_db().cursor()
    
    cur.execute(models.card.partial_card_query + " WHERE card_id = %s;", (card_id,))
    card = cur.fetchone()
    cur.close()
    if card:
        return serialize_partial_card(card)
    return {}

def query_full_card(id) -> dict:
    cur = get_db().cursor()
    if id == 'null':
        return {"error": "Card not found"}
    try:
        cur.execute(models.card.full_card_query + " WHERE id = %s;", (id,))
        card = cur.fetchone()
    except Exception as e:
        return {"error": str(e)}
    if card:
        card = serialize_full_card(card)
    cur.close()
    return card
    
def query_full_user(id: int, include_password=False) -> dict:
    cur = get_db().cursor()
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
