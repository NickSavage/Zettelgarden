CREATE TABLE IF NOT EXISTS chat_completions (
       id SERIAL PRIMARY KEY,
       user_id int,
       conversation_id UUID,
       sequence_number INT,  -- position in conversation (1, 2, 3, etc.)
       role text,
       content text,
       refusal text,
       model text,
       tokens int,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (user_id) REFERENCES users(id),
       UNIQUE (conversation_id, sequence_number) -- ensures order numbers are unique per conversation
)
