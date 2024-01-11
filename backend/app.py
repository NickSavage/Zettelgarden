from datetime import timedelta
from flask import Flask, request, jsonify, send_from_directory, g
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

from views import bp

import database


def create_app(testing=False):
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})
    app.config["JWT_SECRET_KEY"] = os.getenv("SECRET_KEY")
    app.config["UPLOAD_FOLDER"] = os.getenv("UPLOAD_FOLDER")
    if testing:
        app.config["TESTING"] = True
    jwt = JWTManager(app)
    bcrypt = Bcrypt(app)  # app is your Flask app instance

    database.run_migrations(app.config.get("TESTING", False))
    app.register_blueprint(bp)

    @app.before_request
    def before_request():
        """Connect to the database before each request."""
        g.db = database.connect_to_database(app.config.get("TESTING", False))
        g.bcrypt = bcrypt
        g.config = app.config

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
