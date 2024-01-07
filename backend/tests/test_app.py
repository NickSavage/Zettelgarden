import conftest


def test_load_test_db(db):
    cur = db.cursor()
    cur.execute("SELECT current_database()")
    result = cur.fetchone()
    print(result)
    assert result[0] == "zettelkasten_testing"


def test_hello(app, db):
    cur = db.cursor()
    cur.execute("SELECT * FROM cards")
    results = cur.fetchall()
    assert len(results) == 20
