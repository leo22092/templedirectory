-- One-time migration for an existing templeData D1 database.
-- Run this before deploying the request workflow code.

ALTER TABLE temples ADD COLUMN admin_label TEXT;

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
