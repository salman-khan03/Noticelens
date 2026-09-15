-- Optional Neon/PostgreSQL source-only storage. No tenant documents.
CREATE TABLE IF NOT EXISTS legal_sources (
 id text PRIMARY KEY,
 jurisdiction text NOT NULL,
 title text NOT NULL,
 url text NOT NULL,
 passage text NOT NULL,
 retrieved_at timestamptz NOT NULL,
 sha256 text NOT NULL,
 search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || passage)) STORED
);
CREATE INDEX IF NOT EXISTS legal_sources_search ON legal_sources USING gin(search_vector);
-- Query: SELECT * FROM legal_sources WHERE jurisdiction = $1
-- AND search_vector @@ plainto_tsquery('english', $2);
