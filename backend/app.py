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

    # Database setup
    DB_FILE = "zettelkasten.db"
    print('start', flush=True)
    print([os.getenv('DB_NAME'),os.getenv('DB_USER'),os.getenv('DB_PASS'),os.getenv('DB_HOST'), os.getenv('DB_PORT')], flush=True)

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

    
conn = psycopg2.connect(
    dbname=os.getenv('DB_NAME'),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASS'),
    host=os.getenv('DB_HOST'),
    port=os.getenv('DB_PORT'),
    options='-c client_encoding=UTF8'
)

cur = conn.cursor()
cur.execute(
        """
            CREATE TABLE IF NOT EXISTS cards (
                id SERIAL PRIMARY KEY,
                card_id TEXT,
                user_id INT,
                title TEXT,
                body TEXT,
                link TEXT,
                created_at TIMESTAMP,
                updated_at TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
        );
            """
    )
cur.execute(
        """
            CREATE TABLE IF NOT EXISTS backlinks (
                source_id TEXT,
                target_id TEXT,
                created_at TIMESTAMP,
                updated_at TIMESTAMP
            
        );
            """
    )
cur.execute(
        """
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT,
                email TEXT,
                password TEXT,
                created_at TIMESTAMP,
                updated_at TIMESTAMP
        );
            """
    )
cur.execute(
    """
        CREATE TABLE IF NOT EXISTS card_views (
            id SERIAL PRIMARY KEY,
            card_pk INT, 
            user_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (card_pk) REFERENCES cards(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """
)
cur.execute(
    """
        CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            user_id INT,
            name TEXT,
            description TEXT,
            regex TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_by INT,
            updated_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (created_by) REFERENCES users(id),
            FOREIGN KEY (updated_by) REFERENCES users(id)
    )
    """
)
cur.execute(
    """
    CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        name TEXT,
        type TEXT,
        path TEXT,
        filename TEXT,
        size INT,
        created_by INT,
        updated_by INT,
        card_pk INT, 
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id),
        FOREIGN KEY (card_pk) REFERENCES cards(id)
    )
    """
)
conn.commit()
cur.close()

# login
    
# Serializers



if __name__ == "__main__":
    app = create_app()
    app.run(host='0.0.0.0', debug=True)
