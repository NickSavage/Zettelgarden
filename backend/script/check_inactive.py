import os
import psycopg2
import smtplib
from email.message import EmailMessage

conn = psycopg2.connect(
    dbname="zettelkasten",
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASS"),
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT"),
    options="-c client_encoding=UTF8",
)

cur = conn.cursor()
cur.execute(
    """
    SELECT c.*
    FROM cards c
    LEFT JOIN (
        SELECT card_pk, MAX(created_at) AS recent_view
        FROM card_views
        GROUP BY card_pk
        ) cv ON c.id = cv.card_pk
    WHERE c.title != '' AND c.card_id NOT LIKE 'MM%' AND c.card_id NOT LIKE 'READ%'
    ORDER BY cv.recent_view DESC, RANDOM()
    LIMIT 30;
    
    """
)
results = cur.fetchall()

results_string = ""
for i in results:
    results_string += str(i[1]) + " - " + str(i[2]) + "\n"
    print([i[1], i[2]])

# Create the email message
msg = EmailMessage()
msg["Subject"] = "Least Active Zettel Cards"
msg["From"] = "zettel@nicksavage.ca"
msg["To"] = "nick@nicksavage.ca"
msg.set_content(
    "The following are some of least viewed zettel cards. Consider if there are some new connections that can be made from these:\n\n"
    + results_string
)

# Send the email
with smtplib.SMTP_SSL("smtp.fastmail.com", 465) as server:
    server.login("nick@nicksavage.ca", os.getenv("SMTP_PASSWORD"))
    server.send_message(msg)
