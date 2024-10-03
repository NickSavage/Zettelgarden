CREATE TABLE IF NOT EXISTS card_embeddings (
    id SERIAL PRIMARY KEY,
    card_pk int,
    user_id int,
    chunk int,
    embedding vector(1024),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (card_pk) REFERENCES cards(id)
)
