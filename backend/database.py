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


def run_migrations(testing=False):
    conn = connect_to_database(testing)
    cur = conn.cursor()

    if testing:
        cur.execute("SELECT current_database()")
        name = cur.fetchone()
        assert name[0] == "zettelkasten_testing"
        
        cur.execute("DROP TABLE IF EXISTS users CASCADE;")
        cur.execute("DROP TABLE IF EXISTS cards CASCADE;")
        cur.execute("DROP TABLE IF EXISTS backlinks CASCADE;")
        cur.execute("DROP TABLE IF EXISTS card_views CASCADE;")
        cur.execute("DROP TABLE IF EXISTS files CASCADE;")
        cur.execute("DROP TABLE IF EXISTS migrations CASCADE;")

        cur.execute("""

        CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        conn.commit()
        
    query_string = "SELECT * FROM migrations WHERE migration_name = %s"
    insert_string = "INSERT INTO migrations (migration_name) VALUES (%s);"
    
    files = os.listdir("schema")
    files.sort()
    for file in files:
        cur.execute(query_string, (file,))
        results = cur.fetchone()
        
        if results:
            continue

        try:
            with open("schema/" + file, "r") as f:
                content = f.read()
                cur.execute(content)
                cur.execute(insert_string, (file,))
                conn.commit()
                print("Running migration: " + str(file))
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
            conn.rollback()
