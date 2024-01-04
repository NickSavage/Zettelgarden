from datetime import timedelta
from flask import Flask, request, jsonify, send_from_directory, g
from flask_cors import CORS
from urllib.parse import unquote
import psycopg2
import os
import re
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
import uuid
from werkzeug.utils import secure_filename

from views import bp
from database import connect_to_database, get_db

def create_app(test_config=None):
    
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})
    app.config['JWT_SECRET_KEY'] = os.getenv('SECRET_KEY')
    app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER')
    jwt = JWTManager(app)
    bcrypt = Bcrypt(app)  # app is your Flask app instance

    app.register_blueprint(bp)

    @app.before_request
    def before_request():
        """Connect to the database before each request."""
        g.db = connect_to_database()

    @app.teardown_request
    def teardown_request(exception=None):
        """Close the database connection after each request."""
        db = getattr(g, 'db', None)
        if db is not None:
            db.close()

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host='0.0.0.0', debug=True)
