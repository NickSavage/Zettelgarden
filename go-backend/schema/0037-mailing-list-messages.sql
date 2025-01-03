CREATE TABLE IF NOT EXISTS mailing_list_messages (
    id SERIAL PRIMARY KEY,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_recipients INT
);

CREATE TABLE IF NOT EXISTS mailing_list_recipients (
    id SERIAL PRIMARY KEY,
    message_id INT NOT NULL,
    recipient_email TEXT NOT NULL,
    recipient_type TEXT NOT NULL, -- 'to' or 'bcc'
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES mailing_list_messages(id)
);

-- Add indexes for better query performance
CREATE INDEX idx_mailing_list_messages_sent_at ON mailing_list_messages(sent_at);
CREATE INDEX idx_mailing_list_recipients_message_id ON mailing_list_recipients(message_id);
CREATE INDEX idx_mailing_list_recipients_email ON mailing_list_recipients(recipient_email); 