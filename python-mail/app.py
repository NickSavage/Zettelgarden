from flask import Flask, request, jsonify, g
from flask_mail import Mail, Message
import os
import logging

# Initialize Flask app
app = Flask(__name__)

# Configure mail settings
app.config['MAIL_SERVER'] = os.getenv('ZETTEL_MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.getenv('ZETTEL_MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('ZETTEL_MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('ZETTEL_MAIL_PASSWORD')
mail = Mail(app)

# Configure logging
logging.basicConfig(
    filename='/app/logs/zettel-mail.log',            # Log file name
    level=logging.INFO,            # Log level
    format='%(asctime)s - %(levelname)s - %(message)s',  # Log format
    datefmt='%Y-%m-%d %H:%M:%S'    # Date format in logs
)

def protected(func):
    def mail_wrapper(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or auth_header != os.getenv("ZETTEL_MAIL_PASSWORD"):
            return jsonify({"error": "Unauthorized"}), 401
        return func(*args, **kwargs)
    return mail_wrapper

@app.route("/api/send", methods=["POST"])
def send_mail():
    data = request.get_json()
    subject = data.get("subject")
    recipient = data.get("recipient")
    body = data.get("body")

    if not subject or not recipient:
        return jsonify({"message": "Email needs a subject and recipient"}), 400

    # Create the email message
    message = Message(subject, sender=('nick@nicksavage.ca', 'nick@nicksavage.ca'), recipients=[recipient], body=body)

    # Send the email
    with app.app_context():
        try:
            mail.send(message)
            logging.info("Email sent successfully to %s", recipient)
            return jsonify({"message": "Email sent successfully"}), 200
        except Exception as e:
            logging.error("Error sending email: %s", str(e))
            return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8081, debug=True)
