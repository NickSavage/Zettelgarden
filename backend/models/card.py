full_card_query = (
    "SELECT id, card_id, user_id, title, body, link, created_at, updated_at FROM cards"
)
partial_card_query = "SELECT id, card_id, title, created_at, updated_at FROM cards"


def full_card_query_filtered(user_id: int, search_terms) -> str:
    # Split the search string into separate terms
    terms = search_terms.split()

    # Create a list to hold individual SQL conditions
    conditions = []

    # For each term, add conditions for both title and body
    for term in terms:
        term_condition = f"(title ILIKE '%{term}%' OR body ILIKE '%{term}%')"
        conditions.append(term_condition)

    # Join the conditions using the AND or OR operator
    # Use 'AND' for more restrictive searches, 'OR' for broader searches
    query_condition = " AND ".join(conditions)

    # Construct the final query
    final_query = f"{full_card_query} WHERE user_id = {str(user_id)} AND is_deleted = FALSE AND {query_condition};"

    return final_query


def partial_card_query_filtered(user_id: int, search_term) -> str:
    return (
        partial_card_query
        + " WHERE user_id = " + str(user_id) + " AND is_deleted = FALSE AND title ILIKE '%"
        + search_term
        + "%';"
    )

def serialize_card(card: list) -> dict:
    card = {
        "id": card[0],
        "card_id": card[1],
        "user_id": card[2],
        "title": card[3],
        "body": card[4],
        "link": card[5],
        "created_at": card[6].strftime('%Y-%m-%dT%H:%M:%S.%fZ'),
        "updated_at": card[7].strftime('%Y-%m-%dT%H:%M:%S.%fZ'),
    }
    return card
    
def serialize_partial_card(card) -> dict:
    card = {
        "id": card[0],
        "card_id": card[1],
        "title": card[2],
        "created_at": card[3].strftime('%Y-%m-%dT%H:%M:%S.%fZ'),
        "updated_at": card[4].strftime('%Y-%m-%dT%H:%M:%S.%fZ'),
    }
    return card
