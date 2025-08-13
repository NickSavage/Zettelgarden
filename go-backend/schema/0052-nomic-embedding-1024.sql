ALTER TABLE entities ADD COLUMN embedding_1024 vector(1024);
ALTER TABLE card_embeddings ADD COLUMN embedding_1024 vector(1024);
ALTER TABLE card_chunks ADD COLUMN embedding_1024 vector(1024);
