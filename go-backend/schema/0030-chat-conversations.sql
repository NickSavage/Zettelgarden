CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID,
    title text,
    user_id int,
    model text,
    message_count int,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
