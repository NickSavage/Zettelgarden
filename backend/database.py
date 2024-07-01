from flask import g
import os
import psycopg2


def connect_to_database(testing=False):
    if testing:
        db_name = "zettelkasten_testing"
    else:
        db_name = os.getenv("DB_NAME")
    return psycopg2.connect(
        dbname=db_name,
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASS"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        options="-c client_encoding=UTF8",
    )


def get_db():
    """Get a database connection from the global object, g."""
    if "db" not in g:
        g.db = connect_to_database(g.config.get("TESTING", False))
    return g.db