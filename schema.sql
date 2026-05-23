 CREATE TABLE IF NOT EXISTS temples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    state TEXT NOT NULL,
    source_json_id INTEGER,
    name TEXT NOT NULL,
    deity TEXT,
    district TEXT,
    location TEXT,
    lat REAL,
    lng REAL,
    timing TEXT,
    phone TEXT,
    description TEXT,
    famous INTEGER NOT NULL DEFAULT 0,
    tags TEXT,
    status TEXT NOT NULL DEFAULT 'unverified',
    verification_count INTEGER NOT NULL DEFAULT 0,
    submitted_by TEXT,
    submitted_at TEXT,
    approved_at TEXT,
    approved_by TEXT,
    source_url TEXT,
    raw_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_temples_state_status
  ON temples (state, status);

  CREATE INDEX IF NOT EXISTS idx_temples_district
  ON temples (state, district);

  CREATE TABLE IF NOT EXISTS temple_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    temple_id INTEGER NOT NULL,
    verifier_key TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (temple_id, verifier_key),
    FOREIGN KEY (temple_id) REFERENCES temples(id)
  );

