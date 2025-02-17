ALTER TABLE entities ADD COLUMN embedding_nomic vector(768);
ALTER TABLE card_embeddings ADD COLUMN embedding_nomic vector(768);
ALTER TABLE card_chunks ADD COLUMN embedding_nomic vector(768);