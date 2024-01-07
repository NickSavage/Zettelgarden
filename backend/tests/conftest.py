import pytest
from app import create_app
import database


@pytest.fixture()
def app():
    app = create_app()
    app.config.update(
        {
            "TESTING": True,
        }
    )

    yield app


@pytest.fixture()
def db(app):
    database.setup_db(app.config["TESTING"])
    db = database.connect_to_database(app.config["TESTING"])
    yield db
    db_cleanup(db)


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

    cursor.close()
