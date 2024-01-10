import re

from database import get_db


# Utility to extract backlinks from text
def extract_backlinks(text):
    # find all patterns like [anything here]
    return re.findall(r"\[([^\]]+)\]", text)


def _get_parent_id_alternating(card_id):
    parts = []
    current_part = ""

    # Iterate through each character in the card_id
    for char in card_id:
        if char in ["/", "."]:
            # When a separator is encountered, add the current part to the parts list
            parts.append(current_part)
            current_part = ""
        else:
            current_part += char

    # Add the last part if it's not empty
    if current_part:
        parts.append(current_part)

    # If there's only one part, there's no parent
    if len(parts) <= 1:
        return None

    # Reassemble the parent ID
    parent_id = ""
    for i in range(len(parts) - 1):
        parent_id += parts[i]
        if i < len(parts) - 2:  # Add the separator back
            parent_id += "/" if i % 2 == 0 else "."

    return parent_id


# Test the function with a longer ID
long_id = "SP170/A.1/A.1/A.1/A.1"
assert _get_parent_id_alternating("SP170/A.1/A.1/A.1/A.1") == "SP170/A.1/A.1/A.1/A"


def check_is_card_id_unique(card_id: str) -> bool:
    cur = get_db().cursor()
    cur.execute("SELECT card_id FROM cards WHERE is_deleted = FALSE;")
    ids = cur.fetchall()
    for id in ids:
        if card_id == id[0]:
            return False
    return True


def sort_ids(id):
    # Use regular expressions to split the id into numeric and non-numeric parts
    parts = re.split(r"(\D+)", id)
    # Convert numeric parts to integers
    parts = [part.zfill(5) if part.isdigit() else part for part in parts]
    return parts
