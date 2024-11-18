CREATE TABLE IF NOT EXISTS mailing_list (
    id SERIAL PRIMARY KEY,
    email TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)