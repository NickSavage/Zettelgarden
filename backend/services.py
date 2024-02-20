import os
import uuid

from flask import g
from werkzeug.utils import secure_filename

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
    cur.execute(
        "SELECT cards.id, backlinks.source_id, cards.title FROM backlinks JOIN cards ON backlinks.source_id = cards.card_id WHERE target_id = %s;",
        (card_id,),
    )
    backlinks = [
        {"id": row[0], "card_id": row[1], "title": row[2]} for row in cur.fetchall()
    ]
    cur.close()
    return backlinks

def get_references(card_id: str, body: str) -> list:
    
    backlinks = get_backlinks(card_id)
    direct_links = get_direct_links(body)

    unique_dict = {d['id']: d for d in backlinks + direct_links}.values()
    results = list(unique_dict)
    return results

def update_backlinks(card_id, backlinks):
    conn = get_db()
    cur = conn.cursor()
    # Delete existing backlinks for the card
    cur.execute("DELETE FROM backlinks WHERE source_id = %s;", (card_id,))
    # Insert new backlinks
    for target_id in backlinks:
        cur.execute(
            "INSERT INTO backlinks (source_id, target_id, created_at, updated_at) VALUES (%s, %s, NOW(), NOW());",
            (card_id, target_id),
        )
        conn.commit()
    cur.close()


def get_parent(card_id: str) -> dict:
    parent_id = utils._get_parent_id_alternating(card_id)
    if parent_id is None:
        result = query_partial_card(card_id)
    else:
        result = query_partial_card(parent_id)

    return result


def get_files_from_card_pk(card_pk: int) -> list:
    cur = get_db().cursor()
    cur.execute(
        full_file_query + " WHERE is_deleted = FALSE AND card_pk = %s;", (card_pk,)
    )
    data = cur.fetchall()
    results = [serialize_file(x) for x in data]
    cur.close()
    return results


def create_card(card, user_id) -> dict:
    if not card["card_id"] == "" and not utils.check_is_card_id_unique(card["card_id"]):
        return {"error": "id already used"}

    conn = get_db()
    cur = conn.cursor()

    try:
        cur.execute(
            "INSERT INTO cards (card_id, user_id, title, body, link, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, NOW(), NOW()) RETURNING id;",
            (card["card_id"], user_id, card["title"], card["body"], card["link"]),
        )
        new_id = cur.fetchone()[0]
        conn.commit()
    except Exception as e:
        return {"error": str(e)}

    cur.close()

    backlinks = utils.extract_backlinks(card["body"])
    update_backlinks(card["card_id"], backlinks)

    return {"new_id": new_id}


def update_card(id, card):
    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        "UPDATE cards SET title = %s, body = %s, link = %s, updated_at = NOW(), card_id = %s WHERE id = %s;",
        (card["title"], card["body"], card["link"], card["card_id"], id),
    )
    conn.commit()

    cur.close()
    backlinks = utils.extract_backlinks(card["body"])
    update_backlinks(card["card_id"], backlinks)

def delete_card(id) -> dict:
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT card_id FROM cards WHERE id = %s", (id,))
    card = cur.fetchone()
    if len(card) == 0:
        return {"error": "Card not found", "code": 404}
    card_id = card[0]
    backlinks = get_backlinks(card_id)
    if len(backlinks) > 0:
        return {"error": "Card has backlinks, cannot be deleted", "code": 400}
    children = get_children(card_id)
    if len(children) > 0:
        return {"error": "Card has children, cannot be deleted", "code": 400}
    files = get_files_from_card_pk(id)
    if len(children) > 0:
        return {"error": "Card has files, cannot be deleted", "code": 400}
    cur.execute("UPDATE cards SET is_deleted = TRUE, updated_at = NOW() WHERE id = %s;", (id,))


    conn.commit()
    cur.close()
    
    return {"code": 204}
    
def get_children(card_id: str) -> list:
    cards = query_all_partial_cards()
    results = []
    for card in cards:
        if card["card_id"].startswith(card_id + ".") or card["card_id"].startswith(card_id + "/"):
            results.append(card)
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
        "references": get_references(card[1], card[3]),
        "parent": get_parent(card[1]),
        "files": get_files_from_card_pk(card[0]),
        "children": get_children(card[1]),
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


def query_file(file_id, internal=False) -> dict:
    cur = get_db().cursor()
    cur.execute("SELECT * FROM files WHERE is_deleted = FALSE AND id = %s;", (file_id,))
    file_data = cur.fetchone()
    print(file_data)
    if not file_data:
        return {}
    if internal:
        results = serialize_internal_file(file_data)
    else:
        results = serialize_file(file_data)
    cur.close()
    return results


def query_all_files(internal=False) -> list:
    cur = get_db().cursor()
    cur.execute(full_file_query + " WHERE is_deleted = FALSE")
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
    return results


def update_file(file_id, data) -> None:
    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        "UPDATE files SET name = %s, updated_at = NOW() WHERE id = %s;",
        (data["name"], file_id),
    )
    conn.commit()

    cur.close()


def delete_file(file_id) -> None:
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "UPDATE files SET is_deleted = TRUE, updated_at = NOW() WHERE id = %s",
        (file_id,),
    )
    if cur.rowcount == 0:
        cur.close()
        raise ValueError
    conn.commit()
    cur.close()


def upload_file(card_pk: str, file: dict, current_user: int) -> int:
    original_filename = secure_filename(file.filename)
    file_extension = os.path.splitext(original_filename)[1]
    filename = str(uuid.uuid4()) + file_extension  # UUID as filename

    file_path = os.path.join(g.config["UPLOAD_FOLDER"], filename)
    file.save(file_path)

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO files (name, type, path, filename, size, card_pk, created_by, updated_by, updated_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW()) RETURNING id;",
        (
            original_filename,
            file.content_type,
            file_path,
            filename,
            os.path.getsize(file_path),
            card_pk,
            current_user,
            current_user,
        ),
    )
    file_id = cur.fetchone()[0]
    conn.commit()
    cur.close()

    result = query_file(file_id)
    return result


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
        "updated_at": file[10],
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
        "updated_at": file[10],
    }


def query_all_partial_cards(search_term=None) -> list:
    cur = get_db().cursor()
    if search_term:
        cur.execute(models.card.partial_card_query_filtered(search_term))
    else:
        cur.execute(models.card.partial_card_query + " WHERE is_deleted = FALSE")
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

    cur.execute(models.card.partial_card_query + " WHERE is_deleted = FALSE AND id = %s;", (id,))
    card = cur.fetchone()
    cur.close()
    if card:
        return serialize_partial_card(card)
    return {}


def query_partial_card(card_id) -> dict:
    cur = get_db().cursor()

    cur.execute(models.card.partial_card_query + " WHERE is_deleted = FALSE AND card_id = %s;", (card_id,))
    card = cur.fetchone()
    cur.close()
    if card:
        return serialize_partial_card(card)
    return {}


def query_full_card(id) -> dict:
    cur = get_db().cursor()
    if id == "null":
        return {"error": "Card not found"}
    try:
        cur.execute(models.card.full_card_query + " WHERE is_deleted = FALSE AND id = %s;", (id,))
        card = cur.fetchone()
    except Exception as e:
        return {"error": str(e)}
    if card:
        card = serialize_full_card(card)
    cur.close()
    return card


def query_full_user(id: int, include_password=False) -> dict:
    cur = get_db().cursor()
    if id == "null":
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


def query_user_by_username(username: str, include_password=False) -> dict:
    cur = get_db().cursor()
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
