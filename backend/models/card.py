full_card_query = (
    "SELECT id, card_id, user_id, title, body, link, created_at, updated_at FROM cards"
)
partial_card_query = "SELECT id, card_id, title FROM cards"


def full_card_query_filtered(search_terms) -> str:
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
    final_query = f"{full_card_query} WHERE is_deleted = FALSE AND {query_condition};"

    return final_query


def partial_card_query_filtered(search_term) -> str:
    return (
        partial_card_query
        + " WHERE is_deleted = FALSE AND title ILIKE '%"
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
        "created_at": card[6],
        "updated_at": card[7],
    }
    return card
    
