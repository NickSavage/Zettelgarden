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
    u.stripe_customer_id,
    u.stripe_subscription_status,
    u.last_login,
    u.can_upload_files,
    u.max_file_storage
FROM 
    users as u
"""


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
        "stripe_customer_id": user[9],
        "stripe_subscription_status": user[10],
        "is_active": True if user[10] == "active" or user[10] == "trialing" else False,
        "last_login": user[11],
        "can_upload_files": user[12],
        "max_file_storage": user[13],
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


def fulfill_subscription(payload: dict, session):
    
    user = query_user_by_email(payload["data"]["object"]["customer_details"]["email"])
    cus_id = payload["data"]["object"]["customer"]
    sub_id = payload["data"]["object"]["subscription"]
    frequency = session.line_items["data"][0]["description"]
    status = "active"

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

