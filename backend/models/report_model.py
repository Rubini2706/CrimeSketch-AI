"""
CrimeSketch Backend - Report Model
Data access layer for the `reports` table (generated case reports).
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


def create_report(
    case_id: int,
    file_path: str,
    subject_id: Optional[int] = None,
    summary: str = "",
) -> Dict[str, Any]:
    """
    Persist a record for a generated report file.

    Args:
        case_id: ID of the case the report belongs to. Required.
        file_path: Filesystem path to the generated report file. Required.
        subject_id: Optional ID of the subject the report focuses on.
        summary: Optional short summary of the report contents.

    Returns:
        The newly created report as a dict.

    Raises:
        ValueError: If required inputs are missing or invalid.
    """
    if case_id is None or not isinstance(case_id, int) or case_id <= 0:
        raise ValueError("'case_id' is required and must be a positive integer")
    if not file_path or not str(file_path).strip():
        raise ValueError("'file_path' is required")
    if subject_id is not None and (not isinstance(subject_id, int) or subject_id <= 0):
        raise ValueError("'subject_id' must be a positive integer when provided")

    report_id = execute(
        """
        INSERT INTO reports (case_id, subject_id, file_path, summary)
        VALUES (?, ?, ?, ?)
        """,
        (case_id, subject_id, file_path.strip(), summary or ""),
    )
    return get_report_by_id(report_id)


def get_all_reports() -> List[Dict[str, Any]]:
    """
    Retrieve all reports across all cases, most recent first.

    Returns:
        A list of report dicts.
    """
    rows = query_all("SELECT * FROM reports ORDER BY generated_at DESC")
    return [_row_to_dict(row) for row in rows]


def get_reports_by_case(case_id: int) -> List[Dict[str, Any]]:
    """
    Retrieve all reports belonging to a specific case.

    Args:
        case_id: ID of the parent case. Required.

    Returns:
        A list of report dicts for the given case.

    Raises:
        ValueError: If `case_id` is missing/invalid.
    """
    if case_id is None or not isinstance(case_id, int) or case_id <= 0:
        raise ValueError("'case_id' is required and must be a positive integer")

    rows = query_all(
        "SELECT * FROM reports WHERE case_id = ? ORDER BY generated_at DESC",
        (case_id,),
    )
    return [_row_to_dict(row) for row in rows]


def get_report_by_id(report_id: int) -> Optional[Dict[str, Any]]:
    """
    Retrieve a single report by its ID.

    Args:
        report_id: ID of the report. Required.

    Returns:
        The report as a dict, or None if not found.

    Raises:
        ValueError: If `report_id` is missing/invalid.
    """
    if report_id is None or not isinstance(report_id, int) or report_id <= 0:
        raise ValueError("'report_id' is required and must be a positive integer")

    row = query_one("SELECT * FROM reports WHERE id = ?", (report_id,))
    return _row_to_dict(row)


def delete_report(report_id: int) -> bool:
    """
    Delete a report by its ID.

    Args:
        report_id: ID of the report to delete. Required.

    Returns:
        True if the report was deleted.

    Raises:
        ValueError: If `report_id` is missing/invalid.
        LookupError: If no report exists with the given ID.
    """
    if report_id is None or not isinstance(report_id, int) or report_id <= 0:
        raise ValueError("'report_id' is required and must be a positive integer")

    existing = get_report_by_id(report_id)
    if not existing:
        raise LookupError(f"Report with id {report_id} does not exist")

    execute("DELETE FROM reports WHERE id = ?", (report_id,))
    return True