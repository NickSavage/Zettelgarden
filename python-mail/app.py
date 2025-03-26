from flask import Flask, request, jsonify, g
from flask_mail import Mail, Message
import os
import logging

def check_required_env_vars():
    required_vars = {
        'ZETTEL_MAIL_SERVER': os.getenv('ZETTEL_MAIL_SERVER'),
        'ZETTEL_MAIL_USERNAME': os.getenv('ZETTEL_MAIL_USERNAME'),
        'ZETTEL_MAIL_PASSWORD': os.getenv('ZETTEL_MAIL_PASSWORD'),
        'ZETTEL_MAIL_DEFAULT_SENDER': os.getenv('ZETTEL_MAIL_DEFAULT_SENDER'),
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
app.config['DEFAULT_SENDER'] = os.getenv('ZETTEL_MAIL_DEFAULT_SENDER')

mail = Mail(app)

# Configure logging
logging.basicConfig(
    filename=os.getenv('ZETTEL_MAIL_LOG', 'mail.log'),
    level=logging.INFO,            # Log level
    format='%(asctime)s - %(levelname)s - %(message)s',  # Log format
    datefmt='%Y-%m-%d %H:%M:%S'    # Date format in logs
)

@app.route("/api/send/mailing-list", methods=["POST"])
def send_mailing_list():
    data = request.get_json()
    subject = data.get("subject")
    to_recipients = data.get("to_recipients", [])  # Main visible recipients
    bcc_recipients = data.get("bcc_recipients", [])  # BCC recipients
    body = data.get("body")
    is_html = data.get("is_html", False)

    if not subject or (not to_recipients and not bcc_recipients):
        return jsonify({"message": "Email needs a subject and at least one recipient (TO or BCC)"}), 400

    # Create the email message with BCC support
    message = Message(
        subject,
        sender=("Zettelgarden", app.config['DEFAULT_SENDER']),
        recipients=to_recipients,
        bcc=bcc_recipients,
    )

    # Set body based on whether it's HTML or plain text
    if is_html:
        message.html = body
    else:
        message.body = body

    # Send the email
    with app.app_context():
        try:
            mail.send(message)
            total_recipients = len(to_recipients) + len(bcc_recipients)
            logging.info("Mailing list email sent successfully to %d recipients", total_recipients)
            return jsonify({
                "message": "Mailing list email sent successfully",
                "recipients_count": total_recipients
            }), 200
        except Exception as e:
            logging.error("Error sending mailing list email: %s", str(e))
            return jsonify({"error": str(e)}), 500

            # Set default socket timeout globally
socket.setdefaulttimeout(30)  # 30 seconds timeout for all socket operations

@app.route("/api/send", methods=["POST"])
def send_mail():
    start_time = time.time()
    data = request.get_json()
    subject = data.get("subject")
    recipient = data.get("recipient")
    body = data.get("body")
    is_html = data.get("is_html", False)
    
    if not subject or not recipient:
        return jsonify({"message": "Email needs a subject and recipient"}), 400
    
    # Create the email message
    message = Message(
        subject,
        sender=("Zettelgarden", app.config['DEFAULT_SENDER']),
        recipients=[recipient]
    )
    
    # Set body based on whether it's HTML or plain text
    if is_html:
        message.html = body
    else:
        message.body = body
    
    # Send the email with proper timeout handling
    with app.app_context():
        try:
            logging.info(f"Attempting to send email to {recipient}")
            
            # Override the Connection class to add timeout
            with mail.connect() as conn:
                # If you need to set specific timeouts on the connection:
                if hasattr(conn, 'host'):
                    conn.host.timeout = 20  # Set timeout for SMTP operations
                
                conn.send(message)
            
            elapsed = time.time() - start_time
            logging.info(f"Email sent successfully to {recipient} in {elapsed:.2f} seconds")
            return jsonify({"message": "Email sent successfully"}), 200
            
        except smtplib.SMTPServerDisconnected as e:
            logging.error(f"SMTP server disconnected: {str(e)}\n{traceback.format_exc()}")
            return jsonify({"error": "Mail server connection error, please try again later"}), 503
            
        except smtplib.SMTPException as e:
            logging.error(f"SMTP error: {str(e)}\n{traceback.format_exc()}")
            return jsonify({"error": "Email could not be sent due to mail server issues"}), 500
            
        except socket.timeout as e:
            logging.error(f"Socket timeout sending email: {str(e)}")
            return jsonify({"error": "Connection to mail server timed out"}), 504
            
        except Exception as e:
            logging.error(f"Unexpected error sending email: {str(e)}\n{traceback.format_exc()}")
            return jsonify({"error": "An unexpected error occurred"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8081, debug=True)

@app.route("/api/test-mail-connection", methods=["GET"])
def test_mail_connection():
    try:
        with smtplib.SMTP(app.config['MAIL_SERVER'], app.config['MAIL_PORT'], timeout=10) as smtp:
            if app.config['MAIL_USE_TLS']:
                smtp.starttls()
            smtp.login(app.config['MAIL_USERNAME'], app.config['MAIL_PASSWORD'])
            return jsonify({"status": "Mail server connection successful"}), 200
    except Exception as e:
        return jsonify({"error": f"Mail server connection failed: {str(e)}"}), 500