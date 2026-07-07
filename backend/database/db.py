"""
CrimeSketch Backend - Database Layer
Handles SQLite connection management and schema initialization.
"""

import sqlite3
import logging
from flask import g

logger = logging.getLogger(__name__)

_DB_PATH = None  # set by init_db, used by get_db when outside app context init


SCHEMA = """
CREATE TABLE IF NOT EXISTS cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    location TEXT,
    reported_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL,
    name TEXT,
    sketch_path TEXT NOT NULL,
    encoding_path TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (case_id) REFERENCES cases (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL,
    candidate_image_path TEXT NOT NULL,
    candidate_name TEXT,
    similarity_score REAL NOT NULL,
    matched_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL,
    subject_id INTEGER,
    file_path TEXT NOT NULL,
    summary TEXT,
    generated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (case_id) REFERENCES cases (id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_subjects_case_id ON subjects (case_id);
CREATE INDEX IF NOT EXISTS idx_matches_subject_id ON matches (subject_id);
CREATE INDEX IF NOT EXISTS idx_reports_case_id ON reports (case_id);
"""


def init_db(db_path):
    """Create tables if they do not already exist. Safe to call multiple times."""
    global _DB_PATH
    _DB_PATH = db_path
    conn = sqlite3.connect(db_path)
    try:
        conn.execute("PRAGMA foreign_keys = ON")
        conn.executescript(SCHEMA)
        conn.commit()
        logger.info("Database initialized at %s", db_path)
    finally:
        conn.close()


def get_db():
    """Return a request-scoped SQLite connection, creating it if needed."""
    if "db" not in g:
        if _DB_PATH is None:
            raise RuntimeError("Database has not been initialized. Call init_db() first.")
        g.db = sqlite3.connect(_DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


def close_db(exception=None):
    """Close the request-scoped SQLite connection, if any."""
    db = g.pop("db", None)
    if db is not None:
        db.close()


def query_all(query, params=()):
    db = get_db()
    cursor = db.execute(query, params)
    rows = cursor.fetchall()
    return [dict(row) for row in rows]


def query_one(query, params=()):
    db = get_db()
    cursor = db.execute(query, params)
    row = cursor.fetchone()
    return dict(row) if row else None


def execute(query, params=()):
    """Execute an INSERT/UPDATE/DELETE and commit. Returns the lastrowid."""
    db = get_db()
    cursor = db.execute(query, params)
    db.commit()
    return cursor.lastrowid