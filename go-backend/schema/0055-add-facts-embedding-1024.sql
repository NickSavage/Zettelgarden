-- Migration 0055: Add embedding_1024 column to facts
ALTER TABLE facts
ADD COLUMN embedding_1024 vector(1024);
