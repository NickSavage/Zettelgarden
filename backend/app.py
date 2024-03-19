from datetime import timedelta
from flask import Flask, request, jsonify, send_from_directory, g
from flask_mail import Mail
from flask_cors import CORS
from urllib.parse import unquote
import psycopg2
import os
import re
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
)
from flask_bcrypt import Bcrypt
import uuid
from werkzeug.utils import secure_filename
from logging.config import dictConfig

from views import bp

import database


def create_app(testing=False):

    if not testing:
        dictConfig({
            'version': 1,
            'formatters': {'default': {
                'format': '[%(asctime)s] %(levelname)s in %(module)s: %(message)s',
            }},'handlers': {
                'file': {
                    'class': 'logging.FileHandler',
                    'filename': os.getenv('ZETTEL_LOG_LOCATION'),
                    'formatter': 'default'
                }
            },
            'root': {
                'level': 'INFO',
                'handlers': ['file']
            }
            
        })
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})
    app.config["ZETTEL_URL"] = os.getenv("ZETTEL_URL")
    app.config["JWT_SECRET_KEY"] = os.getenv("SECRET_KEY")
    app.config["UPLOAD_FOLDER"] = os.getenv("UPLOAD_FOLDER")
    app.config['MAIL_SERVER'] = os.getenv('ZETTEL_MAIL_SERVER')
    app.config['MAIL_PORT'] = os.getenv('ZETTEL_MAIL_PORT')
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USE_SSL'] = False
    app.config['MAIL_USERNAME'] = os.getenv('ZETTEL_MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('ZETTEL_MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('ZETTEL_MAIL_DEFAULT_SENDER')
    if testing:
        app.config["TESTING"] = True
    jwt = JWTManager(app)
    bcrypt = Bcrypt(app)  # app is your Flask app instance
    mail = Mail(app)

    database.run_migrations(app.config.get("TESTING", False))
    app.register_blueprint(bp)

    @app.before_request
    def before_request():
        """Connect to the database before each request."""
        g.db = database.connect_to_database(app.config.get("TESTING", False))
        g.bcrypt = bcrypt
        g.mail = mail
        g.config = app.config
        g.logger = app.logger
        g.testing = app.config.get("TESTING", False)

    @app.teardown_request
    def teardown_request(exception=None):
        """Close the database connection after each request."""
        db = getattr(g, "db", None)
        if db is not None:
            db.close()

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", debug=True)
