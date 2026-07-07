"""
CrimeSketch Backend - Case Model
Data access layer for the `cases` table.
"""

from database.db import query_all, query_one, execute


def _row_or_none(row):
    return dict(row) if row else None


def create_case(case_number, title, description="", status="open", location="", reported_by=""):
    existing = query_one("SELECT id FROM cases WHERE case_number = ?", (case_number,))
    if existing:
        raise ValueError(f"Case number '{case_number}' already exists")

    case_id = execute(
        """
        INSERT INTO cases (case_number, title, description, status, location, reported_by)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (case_number, title, description, status, location, reported_by),
    )
    return get_case_by_id(case_id)


def get_all_cases(status=None, search=None):
    query = "SELECT * FROM cases"
    conditions = []
    params = []

    if status:
        conditions.append("status = ?")
        params.append(status)

    if search:
        conditions.append("(title LIKE ? OR case_number LIKE ? OR location LIKE ?)")
        like_term = f"%{search}%"
        params.extend([like_term, like_term, like_term])

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY created_at DESC"
    return query_all(query, tuple(params))


def get_case_by_id(case_id):
    return query_one("SELECT * FROM cases WHERE id = ?", (case_id,))


def update_case(case_id, fields):
    allowed_fields = {"title", "description", "status", "location", "reported_by"}
    updates = {k: v for k, v in fields.items() if k in allowed_fields}

    if updates:
        set_clause = ", ".join(f"{key} = ?" for key in updates)
        params = list(updates.values()) + [case_id]
        execute(
            f"UPDATE cases SET {set_clause}, updated_at = datetime('now') WHERE id = ?",
            tuple(params),
        )

    return get_case_by_id(case_id)


def delete_case(case_id):
    execute("DELETE FROM cases WHERE id = ?", (case_id,))
    return True