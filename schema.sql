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
    admin_label TEXT,
    status TEXT NOT NULL DEFAULT 'unverified',
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

  CREATE TABLE IF NOT EXISTS temple_requests (
    id TEXT PRIMARY KEY,
    request_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    state TEXT,
    temple_id INTEGER,
    source_json_id INTEGER,
    admin_label TEXT,
    submitted_by TEXT,
    submitter_email TEXT,
    payload_json TEXT NOT NULL,
    current_db_json TEXT,
    current_public_json TEXT,
    decided_by TEXT,
    decided_at TEXT,
    archived_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_temple_requests_type_status
  ON temple_requests (request_type, status, created_at);

  CREATE INDEX IF NOT EXISTS idx_temple_requests_state
  ON temple_requests (state, request_type, status);
