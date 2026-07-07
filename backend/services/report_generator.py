"""
CrimeSketch Backend - Report Generator Service
Builds self-contained, portable HTML forensic case reports embedding
subject sketches and their AI face-match results as base64 images.
"""

import os
import html
import base64
import logging
from datetime import datetime

import cv2

from models.match_model import get_matches_by_subject

logger = logging.getLogger(__name__)


class ReportGenerationError(Exception):
    """Raised when a case report cannot be generated."""


def _image_to_base64(image_path):
    """
    Read an image from disk and return it as a base64-encoded JPEG data URI.
    Returns None if the image cannot be read (report generation continues
    without embedding that particular image).
    """
    if not image_path or not os.path.isfile(image_path):
        return None

    image = cv2.imread(image_path, cv2.IMREAD_COLOR)
    if image is None:
        return None

    success, buffer = cv2.imencode(".jpg", image)
    if not success:
        return None

    encoded = base64.b64encode(buffer).decode("utf-8")
    return f"data:image/jpeg;base64,{encoded}"


def _render_subject_section(subject):
    """Render the HTML block for a single subject, including its matches."""
    name = html.escape(subject.get("name") or f"Subject #{subject['id']}")
    notes = html.escape(subject.get("notes") or "No notes provided.")
    sketch_data_uri = _image_to_base64(subject.get("sketch_path"))

    sketch_html = (
        f'<img class="sketch" src="{sketch_data_uri}" alt="Sketch for {name}">'
        if sketch_data_uri
        else '<p class="missing">Sketch image unavailable</p>'
    )

    try:
        matches = get_matches_by_subject(subject["id"])
    except Exception as e:
        logger.warning("Could not load matches for subject %s: %s", subject["id"], e)
        matches = []

    if matches:
        rows = []
        for m in matches:
            candidate_name = html.escape(m.get("candidate_name") or "Unknown")
            score_pct = f"{m.get('similarity_score', 0) * 100:.1f}%"
            candidate_uri = _image_to_base64(m.get("candidate_image_path"))
            thumb = (
                f'<img class="thumb" src="{candidate_uri}" alt="{candidate_name}">'
                if candidate_uri
                else '<span class="missing">N/A</span>'
            )
            rows.append(
                f"<tr><td>{thumb}</td><td>{candidate_name}</td>"
                f"<td>{score_pct}</td></tr>"
            )
        matches_table = (
            '<table class="matches"><thead><tr>'
            "<th>Candidate</th><th>Name</th><th>Similarity</th>"
            "</tr></thead><tbody>" + "".join(rows) + "</tbody></table>"
        )
    else:
        matches_table = '<p class="missing">No matches recorded for this subject.</p>'

    return f"""
    <section class="subject">
        <h3>{name}</h3>
        {sketch_html}
        <p class="notes"><strong>Notes:</strong> {notes}</p>
        <h4>AI Match Results</h4>
        {matches_table}
    </section>
    """


def _build_summary(case, subjects, all_matches):
    """Build a short plain-text summary describing the report contents."""
    subject_count = len(subjects)
    match_count = sum(len(m) for m in all_matches)
    return (
        f"Report for case '{case.get('case_number', 'N/A')}' — "
        f"{case.get('title', '')}. Includes {subject_count} subject(s) and "
        f"{match_count} recorded match(es)."
    )


def generate_case_report(case, subjects, matches=None, output_folder="."):
    """
    Generate a self-contained HTML report for a case and its subjects.

    Args:
        case: A dict representing the case (from case_model).
        subjects: A list of subject dicts (from subject_model) to include.
        matches: Optional list of pre-fetched match dicts; if not provided,
            matches are looked up per-subject from the database.
        output_folder: Directory in which to write the generated report.

    Returns:
        A tuple of (file_path, summary) where file_path is the absolute
        path to the generated HTML file and summary is a short description
        of the report contents.

    Raises:
        ReportGenerationError: If the case is missing or the report cannot
            be written to disk.
    """
    if not case:
        raise ReportGenerationError("A valid case is required to generate a report")

    try:
        os.makedirs(output_folder, exist_ok=True)
    except OSError as e:
        raise ReportGenerationError(f"Could not create output folder: {e}") from e

    subjects = subjects or []
    all_matches = [get_matches_by_subject(s["id"]) for s in subjects] if subjects else []

    subject_sections = "".join(_render_subject_section(s) for s in subjects) or (
        '<p class="missing">No subjects associated with this case.</p>'
    )

    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    case_title = html.escape(case.get("title", ""))
    case_number = html.escape(case.get("case_number", ""))
    case_status = html.escape(case.get("status", ""))
    case_location = html.escape(case.get("location") or "Not specified")
    case_description = html.escape(case.get("description") or "No description provided.")

    document = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>CrimeSketch Report - {case_number}</title>
<style>
    body {{ font-family: Arial, Helvetica, sans-serif; margin: 40px; color: #1a1a1a; }}
    h1 {{ border-bottom: 3px solid #333; padding-bottom: 8px; }}
    .meta {{ background: #f4f4f4; padding: 16px; border-radius: 6px; margin-bottom: 24px; }}
    .meta p {{ margin: 4px 0; }}
    .subject {{ border: 1px solid #ddd; border-radius: 6px; padding: 16px; margin-bottom: 20px; }}
    img.sketch {{ max-width: 220px; display: block; margin: 8px 0; border: 1px solid #ccc; }}
    table.matches {{ width: 100%; border-collapse: collapse; margin-top: 8px; }}
    table.matches th, table.matches td {{ border: 1px solid #ccc; padding: 6px 10px; text-align: left; }}
    img.thumb {{ max-width: 80px; max-height: 80px; }}
    .missing {{ color: #888; font-style: italic; }}
    footer {{ margin-top: 40px; font-size: 12px; color: #777; }}
</style>
</head>
<body>
    <h1>CrimeSketch Forensic Report</h1>
    <div class="meta">
        <p><strong>Case Number:</strong> {case_number}</p>
        <p><strong>Title:</strong> {case_title}</p>
        <p><strong>Status:</strong> {case_status}</p>
        <p><strong>Location:</strong> {case_location}</p>
        <p><strong>Description:</strong> {case_description}</p>
        <p><strong>Generated At:</strong> {generated_at}</p>
    </div>
    <h2>Subjects</h2>
    {subject_sections}
    <footer>Generated automatically by CrimeSketch AI Backend.</footer>
</body>
</html>
"""

    safe_case_number = "".join(c if c.isalnum() else "_" for c in case_number) or "case"
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"report_{safe_case_number}_{timestamp}.html"
    file_path = os.path.join(output_folder, filename)

    try:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(document)
    except OSError as e:
        raise ReportGenerationError(f"Failed to write report file: {e}") from e

    summary = _build_summary(case, subjects, all_matches)
    logger.info("Generated report for case %s at %s", case.get("case_number"), file_path)
    return file_path, summary