"""
CrimeSketch Backend - Match Model
Data access layer for the `matches` table (AI face-matching results).
"""

import sqlite3
from typing import Any, Dict, List, Optional

from database.db import query_all, query_one, execute


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


def create_match(
    subject_id: int,
    candidate_image_path: str,
    similarity_score: float,
    candidate_name: str = "",
) -> Dict[str, Any]:
    """
    Persist a single face-match result for a subject.

    Args:
        subject_id: ID of the subject the match belongs to. Required.
        candidate_image_path: Filesystem path to the candidate image. Required.
        similarity_score: Similarity score in the range [0.0, 1.0]. Required.
        candidate_name: Optional display name for the candidate.

    Returns:
        The newly created match as a dict.

    Raises:
        ValueError: If required inputs are missing or invalid.
    """
    if subject_id is None or not isinstance(subject_id, int) or subject_id <= 0:
        raise ValueError("'subject_id' is required and must be a positive integer")
    if not candidate_image_path or not str(candidate_image_path).strip():
        raise ValueError("'candidate_image_path' is required")
    if similarity_score is None or not isinstance(similarity_score, (int, float)):
        raise ValueError("'similarity_score' is required and must be numeric")

    match_id = execute(
        """
        INSERT INTO matches (subject_id, candidate_image_path, candidate_name, similarity_score)
        VALUES (?, ?, ?, ?)
        """,
        (subject_id, candidate_image_path.strip(), candidate_name or "", float(similarity_score)),
    )
    return get_match_by_id(match_id)


def get_matches_by_subject(subject_id: int) -> List[Dict[str, Any]]:
    """
    Retrieve all matches for a given subject, best score first.

    Args:
        subject_id: ID of the subject. Required.

    Returns:
        A list of match dicts ordered by descending similarity score.

    Raises:
        ValueError: If `subject_id` is missing/invalid.
    """
    if subject_id is None or not isinstance(subject_id, int) or subject_id <= 0:
        raise ValueError("'subject_id' is required and must be a positive integer")

    rows = query_all(
        "SELECT * FROM matches WHERE subject_id = ? ORDER BY similarity_score DESC",
        (subject_id,),
    )
    return [_row_to_dict(row) for row in rows]


def get_match_by_id(match_id: int) -> Optional[Dict[str, Any]]:
    """
    Retrieve a single match by its ID.

    Args:
        match_id: ID of the match. Required.

    Returns:
        The match as a dict, or None if not found.

    Raises:
        ValueError: If `match_id` is missing/invalid.
    """
    if match_id is None or not isinstance(match_id, int) or match_id <= 0:
        raise ValueError("'match_id' is required and must be a positive integer")

    row = query_one("SELECT * FROM matches WHERE id = ?", (match_id,))
    return _row_to_dict(row)


def delete_matches_by_subject(subject_id: int) -> bool:
    """
    Delete all matches associated with a given subject.

    Args:
        subject_id: ID of the subject. Required.

    Returns:
        True if the operation completed successfully.

    Raises:
        ValueError: If `subject_id` is missing/invalid.
    """
    if subject_id is None or not isinstance(subject_id, int) or subject_id <= 0:
        raise ValueError("'subject_id' is required and must be a positive integer")

    execute("DELETE FROM matches WHERE subject_id = ?", (subject_id,))
    return True


def delete_match(match_id: int) -> bool:
    """
    Delete a single match by its ID.

    Args:
        match_id: ID of the match to delete. Required.

    Returns:
        True if the match was deleted.

    Raises:
        ValueError: If `match_id` is missing/invalid.
        LookupError: If no match exists with the given ID.
    """
    if match_id is None or not isinstance(match_id, int) or match_id <= 0:
        raise ValueError("'match_id' is required and must be a positive integer")

    existing = get_match_by_id(match_id)
    if not existing:
        raise LookupError(f"Match with id {match_id} does not exist")

    execute("DELETE FROM matches WHERE id = ?", (match_id,))
    return True