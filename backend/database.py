from flask import g
import os
import psycopg2


def connect_to_database():
    """Create a database connection."""
    return psycopg2.connect(
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASS"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        options="-c client_encoding=UTF8",
    )


def get_db():
    """Get a database connection from the global object, g."""
    if "db" not in g:
        g.db = connect_to_database()
    return g.db


conn = connect_to_database()

cur = conn.cursor()
cur.execute(
    """
            CREATE TABLE IF NOT EXISTS cards (
                id SERIAL PRIMARY KEY,
                card_id TEXT,
                user_id INT,
                title TEXT,
                body TEXT,
                link TEXT,
                created_at TIMESTAMP,
                updated_at TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
        );
            """
)
cur.execute(
    """
            CREATE TABLE IF NOT EXISTS backlinks (
                source_id TEXT,
                target_id TEXT,
                created_at TIMESTAMP,
                updated_at TIMESTAMP
            
        );
            """
)
cur.execute(
    """
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT,
                email TEXT,
                password TEXT,
                created_at TIMESTAMP,
                updated_at TIMESTAMP
        );
            """
)
cur.execute(
    """
        CREATE TABLE IF NOT EXISTS card_views (
            id SERIAL PRIMARY KEY,
            card_pk INT, 
            user_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (card_pk) REFERENCES cards(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """
)
cur.execute(
    """
    CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        name TEXT,
        type TEXT,
        path TEXT,
        filename TEXT,
        size INT,
        created_by INT,
        updated_by INT,
        card_pk INT, 
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id),
        FOREIGN KEY (card_pk) REFERENCES cards(id)
    )
    """
)
conn.commit()
cur.close()
