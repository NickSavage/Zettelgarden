import random
import string
from datetime import datetime, timedelta

import pytest
from flask_jwt_extended import (
    create_access_token,
)
from app import create_app
import database


@pytest.fixture()
def app():
    app = create_app(testing=True)

    yield app


@pytest.fixture()
def db(app):
    db = database.connect_to_database(app.config["TESTING"])
    import_test_data(db)
    yield db
    db_cleanup(db)


@pytest.fixture()
def client(app, db):
    return app.test_client()


@pytest.fixture
def access_headers(app, client):
    with app.app_context():
        access_token = create_access_token(identity=1)

        headers = {"Authorization": "Bearer {}".format(access_token)}
        return headers


def import_test_data(db) -> None:
    cursor = db.cursor()

    data = generate_data()
    users = data["users"]
    cards = data["cards"]
    backlinks = data["backlinks"]

    user_ids = []
    for user in users:
        cursor.execute(
            "INSERT INTO users (username, email, password) VALUES (%s, %s, %s) RETURNING id",
            (user["username"], user["email"], user["password"]),
        )
        user_ids.append(cursor.fetchone()[0])

    db.commit()
    for card in cards:
        cursor.execute(
            "INSERT INTO cards (card_id, user_id, title, body, link) VALUES (%s, %s, %s, %s, %s)",
            (
                card["card_id"],
                card["user_id"],
                card["title"],
                card["body"],
                card["link"],
            ),
        )

    db.commit()
    # for backlink in backlinks:
    #     cursor.execute("INSERT INTO backlinks (source_id, target_id) VALUES (%s, %s)", (backlink["source_id"], backlink["target_id"]))

    # db.commit()


def db_cleanup(db):
    cursor = db.cursor()

    cursor.execute("SELECT current_database()")
    name = cursor.fetchone()
    assert name[0] == "zettelkasten_testing"

    cursor.execute("DROP TABLE users CASCADE")
    cursor.execute("DROP TABLE cards CASCADE")
    cursor.execute("DROP TABLE backlinks CASCADE")
    cursor.execute("DROP TABLE card_views CASCADE")
    cursor.execute("DROP TABLE files CASCADE")

    db.commit()
    cursor.close()


def generate_data() -> list:
    def random_string(length=10):
        return "".join(random.choice(string.ascii_letters) for _ in range(length))

    def random_email():
        return f"{random_string(5)}@{random_string(5)}.com"

    def random_date(start, end):
        return start + timedelta(
            seconds=random.randint(0, int((end - start).total_seconds())),
        )

    # Generate test data for users
    users = []
    for i in range(1, 11):  # Adjust the range for more users
        users.append(
            {
                "id": i,
                "username": random_string(),
                "email": random_email(),
                "password": random_string(15),
                "created_at": random_date(datetime(2020, 1, 1), datetime(2024, 1, 1)),
                "updated_at": random_date(datetime(2024, 1, 1), datetime(2024, 12, 31)),
            }
        )

    # Generate test data for cards
    cards = []
    for i in range(1, 21):  # Adjust the range for more cards
        cards.append(
            {
                "id": i,
                "card_id": random_string(20),
                "user_id": 1,
                "title": random_string(20),
                "body": random_string(100),
                "link": f"https://{random_string(10)}.com",
                "created_at": random_date(datetime(2020, 1, 1), datetime(2024, 1, 1)),
                "updated_at": random_date(datetime(2024, 1, 1), datetime(2024, 12, 31)),
            }
        )

    # Generate test data for backlinks
    backlinks = []
    for i in range(1, 31):  # Adjust the range for more backlinks
        backlinks.append(
            {
                "source_id": random.choice(cards)["card_id"],
                "target_id": random.choice(cards)["card_id"],
                "created_at": random_date(datetime(2020, 1, 1), datetime(2024, 1, 1)),
                "updated_at": random_date(datetime(2024, 1, 1), datetime(2024, 12, 31)),
            }
        )

    results = {
        "users": users,
        "cards": cards,
        "backlinks": backlinks,
    }
    return results
