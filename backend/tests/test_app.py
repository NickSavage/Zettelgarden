import conftest


def test_load_test_db(db):
    cur = db.cursor()
    cur.execute("SELECT current_database()")
    result = cur.fetchone()
    print(result)
    assert result[0] == "zettelkasten_testing"


def test_read_test_data(app, db):
    cur = db.cursor()
    cur.execute("SELECT * FROM cards")
    results = cur.fetchall()
    assert len(results) == 20

def test_get_cards(db, client, access_token):
    headers = {
        'Authorization': 'Bearer {}'.format(access_token)
    }
    response = client.get("/api/cards", headers=headers)
    cur = db.cursor()
    cur.execute("SELECT * FROM cards")
    results = cur.fetchall()
    import pdb; pdb.set_trace()
    assert response.status_code == 200
    assert len(response.json) == 20
