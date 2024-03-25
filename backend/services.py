import os
import uuid

from flask import g
from werkzeug.utils import secure_filename
import stripe

from database import get_db
import models.card
import utils

full_file_query = "SELECT id, name, type, path, filename, size, created_by, updated_by, card_pk, created_at, updated_at FROM files"
full_user_query = """
SELECT 
    u.id, 
    u.username, 
    u.password,
    u.created_at, 
    u.updated_at, 
    u.is_admin,
    (SELECT COUNT(*) FROM cards t1 WHERE t1.user_id = u.id) AS table1_count,
    u.email,
    u.email_validated,
    u.stripe_customer_id
FROM 
    users as u
"""


def get_direct_links(body: str, user_id: int) -> list:
    links = utils.extract_backlinks(body)
    results = []
    for card_id in links:
        x = query_partial_card(card_id, user_id)
        if x == {}:
            continue
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
    backlinks = list(filter(lambda x: x != {}, backlinks))
    cur.close()
    return backlinks


def get_references(card_id: str, body: str, user_id: int) -> list:
    backlinks = get_backlinks(card_id)
    direct_links = get_direct_links(body, user_id)
    links = backlinks + direct_links
    if links == []:
        return []
    else:
        unique_dict = {d["id"]: d for d in links}.values()
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


def get_parent(card_id: str, user_id: int) -> dict:
    parent_id = utils._get_parent_id_alternating(card_id)
    print(parent_id)
    if parent_id is None:
        result = query_partial_card(card_id, user_id)
    else:
        result = query_partial_card(parent_id, user_id)

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
    if not card["card_id"] == "" and not utils.check_is_card_id_unique(card["card_id"], user_id):
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

    cur.execute("SELECT card_id, user_id FROM cards WHERE id = %s", (id,))
    card = cur.fetchone()
    if len(card) == 0:
        return {"error": "Card not found", "code": 404}
    card_id = card[0]
    user_id = card[1]
    backlinks = get_backlinks(card_id)
    if len(backlinks) > 0:
        return {"error": "Card has backlinks, cannot be deleted", "code": 400}
    children = get_children(card_id, user_id)
    if len(children) > 0:
        return {"error": "Card has children, cannot be deleted", "code": 400}
    files = get_files_from_card_pk(id)
    if len(children) > 0:
        return {"error": "Card has files, cannot be deleted", "code": 400}
    cur.execute(
        "UPDATE cards SET is_deleted = TRUE, updated_at = NOW() WHERE id = %s;", (id,)
    )

    conn.commit()
    cur.close()

    return {"code": 204}


def get_children(card_id: str, user_id: int) -> list:
    cards = query_all_partial_cards(user_id)
    results = []
    for card in cards:
        if card["card_id"].startswith(card_id + ".") or card["card_id"].startswith(
            card_id + "/"
        ):
            results.append(card)
    return results


def serialize_full_card(data) -> dict:
    card = models.card.serialize_card(data)

    card["parent"] = get_parent(card["card_id"], card["user_id"])
    card["direct_links"] = get_direct_links(card["body"], card["user_id"])
    card["files"] = get_files_from_card_pk(card["id"])
    card["children"] = get_children(card["card_id"], card["user_id"])
    card["references"] = get_references(card["card_id"], card["body"], card["user_id"])
    card["backlinks"] = get_backlinks(card["card_id"])
    return card


def serialize_full_user(user: list, include_password=False) -> dict:
    result = {
        "id": user[0],
        "username": user[1],
        "created_at": user[3],
        "updated_at": user[4],
        "is_admin": user[5],
        "cards": user[6],
        "email": user[7],
        "email_validated": user[8],
        "stripe_customer_id": user[9]
    }
    if include_password:
        result["password"] = user[2]
    return result


def check_file_permission(file_id: int, user_id: int) -> bool:
    cur = get_db().cursor()
    cur.execute("SELECT c.user_id FROM cards c JOIN files f ON c.id = f.card_pk WHERE f.id = %s;", (str(file_id),))
    card_user_id = cur.fetchone()[0]
    cur.close()
    if card_user_id == user_id:
        return True
    else:
        return False


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


def query_all_files(user_id, internal=False) -> list:
    cur = get_db().cursor()
    # Updated query with explicit table names for each column
    query = f"""
    SELECT files.id, files.name, files.type, files.path, files.filename, files.size, files.created_by, files.updated_by, files.card_pk, files.created_at, files.updated_at
    FROM files
    JOIN cards ON files.card_pk = cards.id
    WHERE files.is_deleted = FALSE AND cards.user_id = %s
    """
    cur.execute(query, (user_id,))
    data = cur.fetchall()
    file_data = [serialize_file(x) for x in data]
    cur.close()
    
    results = []
    if file_data:
        for file in file_data:
            new = file
            new["card"] = query_partial_card_by_id(file["card_pk"], user_id)
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


def query_all_partial_cards(user_id: int, search_term=None) -> list:
    cur = get_db().cursor()
    if search_term:
        cur.execute(models.card.partial_card_query_filtered(search_term))
    else:
        cur.execute(models.card.partial_card_query + " WHERE user_id = %s AND is_deleted = FALSE", (str(user_id),))
    cards = cur.fetchall()
    results = []
    for x in cards:
        card = models.card.serialize_partial_card(x)
        results.append(card)
    cur.close()
    return results


def query_all_full_cards(user_id: int, search_term=None) -> list:
    cur = get_db().cursor()
    if search_term:
        cur.execute(models.card.full_card_query_filtered(user_id, search_term))
    else:
        cur.execute(models.card.full_card_query + " WHERE user_id = %s", (str(user_id),))
    cards = cur.fetchall()
    results = []
    for x in cards:
        card = serialize_full_card(x)
        results.append(card)
    cur.close()
    return results


def query_partial_card_by_id(id, user_id:int) -> dict:
    cur = get_db().cursor()

    cur.execute(
        models.card.partial_card_query + " WHERE is_deleted = FALSE AND id = %s AND user_id = %s;", (id, user_id)
    )
    card = cur.fetchone()
    cur.close()
    if card:
        return models.card.serialize_partial_card(card)
    return {}


def query_partial_card(card_id: str, user_id: int) -> dict:
    cur = get_db().cursor()

    cur.execute(
        models.card.partial_card_query + " WHERE is_deleted = FALSE AND card_id = %s AND user_id = %s;",
        (card_id, user_id),
    )
    card = cur.fetchone()
    cur.close()
    if card:
        return models.card.serialize_partial_card(card)
    return {}


def query_full_card(id) -> dict:
    cur = get_db().cursor()
    if id == "null":
        return {"error": "Card not found"}
    try:
        cur.execute(
            models.card.full_card_query + " WHERE is_deleted = FALSE AND id = %s;",
            (id,),
        )
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

def query_user_subscription(user: dict) -> dict:
    update_user_subscription_info(user["stripe_customer_id"])
    cur = get_db().cursor()
    cur.execute("""
    SELECT
        u.id,
        u.stripe_customer_id,
        u.stripe_subscription_id,
        u.stripe_subscription_status,
        u.stripe_subscription_frequency,
        u.stripe_current_plan
    FROM
        users as u
    WHERE
        u.id = %s
    """, (user["id"],))

    result = cur.fetchone()
    results = {
        "id": result[0],
        "stripe_customer_id": result[1],
        "stripe_subscription_id": result[2],
        "stripe_subscription_status": result[3],
        "stripe_subscription_frequency": result[4],
        "stripe_current_plan": result[5]
    }
    cur.close()
    return results

def query_user_by_id(id: int, include_password=False) -> dict:
    cur = get_db().cursor()
    if not username:
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

def query_user_by_email(email: str, include_password=False) -> dict:
    cur = get_db().cursor()
    if not email:
        return {"error": "User not found"}
    try:
        cur.execute(full_user_query + " WHERE email = %s;", (email,))
        user = cur.fetchone()
    except Exception as e:
        return {"error": str(e)}
    if user:
        user = serialize_full_user(user, include_password)
    cur.close()
    return user

def query_all_users():
    cur = get_db().cursor()
    cur.execute(full_user_query)
    users = cur.fetchall()
    results = [serialize_full_user(user) for user in users]
    cur.close()
    return results


def validate_unique_email(email: str) -> bool:
    cur = get_db().cursor()
    cur.execute(full_user_query + " WHERE email = %s", (email,))
    user = cur.fetchone()

    result = user is None

    cur.close()
    return result


def create_user(data: dict) -> dict:
    if not validate_unique_email(data["email"]):
        return {"error": True, "message": "Email already exists."}
    if not "hashed_password" in data:
        return {"error": True, "message": "Something is wrong with the password."}

    if data["username"] is None:
        return {"error": True, "message": "Username is blank."}
    if data["email"] is None:
        return {"error": True, "message": "Email is blank."}

    conn = get_db()
    cur = conn.cursor()
    query = "INSERT INTO users (username, email, password, created_at, updated_at) VALUES (%s, %s, %s, NOW(), NOW()) RETURNING id;"
    cur.execute(query, (data["username"], data["email"], data["hashed_password"]))
    new_id = cur.fetchone()[0]
    conn.commit()
    cur.close()

    return {"new_id": new_id}

def update_user(id, user_update):
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute(
        """
        UPDATE users SET username = %s, email = %s, is_admin = %s, updated_at = NOW()
        WHERE id = %s;
        """,
        (user_update["username"], user_update["email"], user_update["is_admin"], id),
    )
    conn.commit()
    
    cur.close()
    
    
def fulfill_subscription(payload: dict, session):
    
    user = query_user_by_email(payload["data"]["object"]["customer_details"]["email"])
    cus_id = payload["data"]["object"]["customer"]
    sub_id = payload["data"]["object"]["subscription"]
    frequency = session.line_items["data"][0]["description"]
    status = "Active"

    conn = get_db()
    cur = conn.cursor()
    
    cur.execute(
        """
        UPDATE users SET
        stripe_customer_id = %s, stripe_subscription_id = %s, stripe_subscription_status = %s,
        stripe_subscription_frequency = %s, updated_at = NOW()
        WHERE id = %s;
        """, (cus_id, sub_id, status, frequency, user["id"]))
    conn.commit()
    cur.close()

def update_all_plan_information():
    products = stripe.Products.list()
    prices = stripe.Prices.list()
    
def fetch_plan_information(interval: str):
    print(interval)
    if interval != "month" and interval != "year":
        raise ValueError("Interval must be either month or year")
    cur = get_db().cursor()

    query = """
    SELECT id, stripe_price_id, name, description, unit_amount, currency, interval
    FROM stripe_plans
    WHERE interval = %s
    """

    cur.execute(query, (interval,))
    fetched = cur.fetchone()

    cur.close()
    result = {
        "id": fetched[0],
        "stripe_price_id": fetched[1],
        "name": fetched[2],
        "description": fetched[3],
        "unit_amount": fetched[4],
        "currency": fetched[5],
        "interval": fetched[6],
    }
    return result

def sync_stripe_plans():
    conn = get_db()
    cursor = conn.cursor()

    # Fetch all prices and their related product data from Stripe
    prices = stripe.Price.list(active=True, expand=['data.product'])
    
    for price in prices.auto_paging_iter():
        product = price.product
        # Prepare data for insertion or update
        data = {
            'stripe_product_id': product.id,
            'stripe_price_id': price.id,
            'name': product.name,
            'description': product.description,
            'active': product.active,
            'unit_amount': price.unit_amount,
            'currency': price.currency,
            'interval': price.recurring.interval if price.recurring else None,
            'interval_count': price.recurring.interval_count if price.recurring else None,
            'trial_days': price.recurring.trial_period_days if price.recurring else None,
            'metadata': str(product.metadata)
        }
        
        # Upsert query (PostgreSQL 9.5+)
        query = """
        INSERT INTO stripe_plans (stripe_product_id, stripe_price_id, name, description, active, unit_amount, currency, interval, interval_count, trial_days, metadata)
        VALUES (%(stripe_product_id)s, %(stripe_price_id)s, %(name)s, %(description)s, %(active)s, %(unit_amount)s, %(currency)s, %(interval)s, %(interval_count)s, %(trial_days)s, %(metadata)s)
        ON CONFLICT (stripe_price_id)
        DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            active = EXCLUDED.active,
            unit_amount = EXCLUDED.unit_amount,
            currency = EXCLUDED.currency,
            interval = EXCLUDED.interval,
            interval_count = EXCLUDED.interval_count,
            trial_days = EXCLUDED.trial_days,
            metadata = EXCLUDED.metadata,
            updated_at = CURRENT_TIMESTAMP;
        """
        # Execute the query
        cursor.execute(query, data)
    
    conn.commit()
    cursor.close()
def update_user_subscription_info(stripe_customer_id):
    # Fetch the latest subscription for the customer from Stripe
    subscriptions = stripe.Subscription.list(customer=stripe_customer_id, limit=1)
    if subscriptions and len(subscriptions.data) > 0:
        subscription = subscriptions.data[0]

        # Extract necessary details
        stripe_subscription_id = subscription.id
        stripe_subscription_status = subscription.status
        stripe_subscription_frequency = subscription.plan.interval
        stripe_current_plan = subscription.plan.id

        # Connect to your database and update the user record
        conn = get_db()  # Ensure this function returns a connection object
        cursor = conn.cursor()
        sql = """
        UPDATE users
        SET stripe_subscription_id = %s,
        stripe_subscription_status = %s,
        stripe_subscription_frequency = %s,
        stripe_current_plan = %s
        WHERE stripe_customer_id = %s;
        """
        cursor.execute(sql, (
            stripe_subscription_id, 
            stripe_subscription_status, 
            stripe_subscription_frequency, 
            stripe_current_plan, 
            stripe_customer_id
        ))
        conn.commit()
        cursor.close()

        print("User subscription info updated successfully.")
    else:
        print("No subscription found for this customer.")

