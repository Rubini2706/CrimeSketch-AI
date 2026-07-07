"""
CrimeSketch Backend - Subject Model
Data access layer for the `subjects` table (forensic sketch subjects).
"""

import sqlite3
from typing import Any, Dict, List, Optional

from database.db import query_all, query_one, execute

ALLOWED_UPDATE_FIELDS = {"name", "sketch_path", "encoding_path", "notes"}


def _row_to_dict(row: Optional[sqlite3.Row]) -> Optional[Dict[str, Any]]:
    """
    Convert a sqlite3.Row (or a plain dict, or None) into a plain dict.

    Args:
        row: A sqlite3.Row, a dict, or None.

    Returns:
        A dict representation of the row, or None if row is falsy.
    """
    if not row:
        return None
    if isinstance(row, dict):
        return dict(row)
    return dict(row)


def create_subject(
    case_id: int,
    sketch_path: str,
    name: str = "",
    encoding_path: Optional[str] = None,
    notes: str = "",
) -> Dict[str, Any]:
    """
    Create a new subject record tied to a case.

    Args:
        case_id: ID of the parent case. Required.
        sketch_path: Filesystem path to the uploaded sketch image. Required.
        name: Optional display name for the subject.
        encoding_path: Optional path to a stored face-encoding file.
        notes: Optional free-text notes.

    Returns:
        The newly created subject as a dict.

    Raises:
        ValueError: If `case_id` or `sketch_path` is missing/invalid.
    """
    if case_id is None or not isinstance(case_id, int) or case_id <= 0:
        raise ValueError("'case_id' is required and must be a positive integer")
    if not sketch_path or not str(sketch_path).strip():
        raise ValueError("'sketch_path' is required")

    subject_id = execute(
        """
        INSERT INTO subjects (case_id, name, sketch_path, encoding_path, notes)
        VALUES (?, ?, ?, ?, ?)
        """,
        (case_id, name or "", sketch_path.strip(), encoding_path, notes or ""),
    )
    return get_subject_by_id(subject_id)


def get_all_subjects() -> List[Dict[str, Any]]:
    """
    Retrieve all subjects across all cases, most recently created first.

    Returns:
        A list of subject dicts.
    """
    rows = query_all("SELECT * FROM subjects ORDER BY created_at DESC")
    return [_row_to_dict(row) for row in rows]


def get_subjects_by_case(case_id: int) -> List[Dict[str, Any]]:
    """
    Retrieve all subjects belonging to a specific case.

    Args:
        case_id: ID of the parent case. Required.

    Returns:
        A list of subject dicts for the given case.

    Raises:
        ValueError: If `case_id` is missing/invalid.
    """
    if case_id is None or not isinstance(case_id, int) or case_id <= 0:
        raise ValueError("'case_id' is required and must be a positive integer")

    rows = query_all(
        "SELECT * FROM subjects WHERE case_id = ? ORDER BY created_at DESC",
        (case_id,),
    )
    return [_row_to_dict(row) for row in rows]


def get_subject_by_id(subject_id: int) -> Optional[Dict[str, Any]]:
    """
    Retrieve a single subject by its ID.

    Args:
        subject_id: ID of the subject. Required.

    Returns:
        The subject as a dict, or None if not found.

    Raises:
        ValueError: If `subject_id` is missing/invalid.
    """
    if subject_id is None or not isinstance(subject_id, int) or subject_id <= 0:
        raise ValueError("'subject_id' is required and must be a positive integer")

    row = query_one("SELECT * FROM subjects WHERE id = ?", (subject_id,))
    return _row_to_dict(row)


def update_subject(subject_id: int, fields: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update an existing subject with the given fields.

    Args:
        subject_id: ID of the subject to update. Required.
        fields: Dict of fields to update. Only keys in
            {'name', 'sketch_path', 'encoding_path', 'notes'} are applied.

    Returns:
        The updated subject as a dict.

    Raises:
        ValueError: If `subject_id` is invalid, `fields` is empty/not a dict,
            or none of the provided keys are valid updatable fields.
        LookupError: If no subject exists with the given ID.
    """
    if subject_id is None or not isinstance(subject_id, int) or subject_id <= 0:
        raise ValueError("'subject_id' is required and must be a positive integer")
    if not fields or not isinstance(fields, dict):
        raise ValueError("'fields' must be a non-empty dict of updates")

    existing = get_subject_by_id(subject_id)
    if not existing:
        raise LookupError(f"Subject with id {subject_id} does not exist")

    updates = {k: v for k, v in fields.items() if k in ALLOWED_UPDATE_FIELDS}
    if not updates:
        raise ValueError(
            f"No valid fields to update. Allowed fields: {sorted(ALLOWED_UPDATE_FIELDS)}"
        )

    set_clause = ", ".join(f"{key} = ?" for key in updates)
    params = list(updates.values()) + [subject_id]
    execute(f"UPDATE subjects SET {set_clause} WHERE id = ?", tuple(params))

    return get_subject_by_id(subject_id)


def delete_subject(subject_id: int) -> bool:
    """
    Delete a subject by its ID.

    Args:
        subject_id: ID of the subject to delete. Required.

    Returns:
        True if the subject was deleted.

    Raises:
        ValueError: If `subject_id` is missing/invalid.
        LookupError: If no subject exists with the given ID.
    """
    if subject_id is None or not isinstance(subject_id, int) or subject_id <= 0:
        raise ValueError("'subject_id' is required and must be a positive integer")

    existing = get_subject_by_id(subject_id)
    if not existing:
        raise LookupError(f"Subject with id {subject_id} does not exist")

    execute("DELETE FROM subjects WHERE id = ?", (subject_id,))
    return True