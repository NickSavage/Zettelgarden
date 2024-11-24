from flask import Flask, request, jsonify, g
from flask_mail import Mail, Message
import os
import logging

def check_required_env_vars():
    required_vars = {
        'ZETTEL_MAIL_SERVER': os.getenv('ZETTEL_MAIL_SERVER'),
        'ZETTEL_MAIL_USERNAME': os.getenv('ZETTEL_MAIL_USERNAME'),
        'ZETTEL_MAIL_PASSWORD': os.getenv('ZETTEL_MAIL_PASSWORD')
    }
    
    missing_vars = [var for var, value in required_vars.items() if not value]
    
    if missing_vars:
        error_msg = f"Missing required environment variables: {', '.join(missing_vars)}"
        raise EnvironmentError(error_msg)

# Check environment variables before initializing app
check_required_env_vars()

# Initialize Flask app
app = Flask(__name__)

# Configure mail settings
app.config['MAIL_SERVER'] = os.getenv('ZETTEL_MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.getenv('ZETTEL_MAIL_PORT', 587))  # 587 as default
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('ZETTEL_MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('ZETTEL_MAIL_PASSWORD')

mail = Mail(app)

# Configure logging
logging.basicConfig(
    filename=os.getenv('ZETTEL_MAIL_LOG', 'mail.log'),
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
