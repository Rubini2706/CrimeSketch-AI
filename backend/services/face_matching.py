"""
CrimeSketch Backend - Face Matching Service
Exposes match_face(image_path) for comparing an uploaded/generated sketch
or photo against the subject database.

This module currently returns deterministic dummy data so the API contract
is stable while the AI matching pipeline is built out. The function
signature and return shape are designed to stay the same once a real model
is plugged in.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import TypedDict, Union

logger = logging.getLogger(__name__)


class MatchResult(TypedDict):
    """Shape of the result returned by match_face()."""
    matched: bool
    confidence: float
    subject_id: int
    subject_name: str


class FaceMatchingError(Exception):
    """Raised when face matching cannot be completed."""


def match_face(image_path: Union[str, Path]) -> MatchResult:
    """
    Compare the image at `image_path` against known subjects and return a
    match result.

    Currently returns fixed dummy data so downstream routes and the
    frontend can be built and tested against a stable contract before the
    real matching model is integrated.

    # TODO: Replace this dummy implementation with a real face-matching
    #       pipeline, e.g.:
    #         - DeepFace.verify() / DeepFace.find() against a subject
    #           embedding database
    #         - face_recognition.face_encodings() + face_distance()
    #         - A custom OpenCV DNN embedding model (e.g. OpenFace/ArcFace
    #           ONNX model) with cosine-similarity search over stored
    #           subject embeddings
    #       The function should keep returning a MatchResult dict with the
    #       same keys (matched, confidence, subject_id, subject_name) so
    #       routes/match.py requires no changes.

    Args:
        image_path: Filesystem path to the image to match.

    Returns:
        A MatchResult dict describing whether a match was found, the
        confidence score (0-100), and the matched subject's ID and name.

    Raises:
        FaceMatchingError: If the image file does not exist or cannot be
            accessed.
    """
    source_path = Path(image_path)

    if not source_path.is_file():
        raise FaceMatchingError(f"Image file not found: {source_path}")

    logger.info("Running face match for '%s' (dummy implementation)", source_path)

    # TODO: Load the image (e.g. cv2.imread / DeepFace preprocessing) and
    #       compute a real embedding here once a model is integrated.

    # Dummy, deterministic result for development/testing purposes.
    result: MatchResult = {
        "matched": True,
        "confidence": 94.7,
        "subject_id": 3,
        "subject_name": "Unknown Suspect",
    }

    logger.info("Match result for '%s': %s", source_path, result)
    return result