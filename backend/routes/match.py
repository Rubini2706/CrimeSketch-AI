"""
CrimeSketch Backend - Match Routes
REST endpoint for uploading an image and running it through
services.face_matching.match_face() to find a candidate subject match.
"""

from __future__ import annotations

import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple

from flask import Blueprint, current_app, jsonify, request
from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename

from services.face_matching import match_face, FaceMatchingError

logger = logging.getLogger(__name__)

match_bp = Blueprint("match_bp", __name__)

# Supported image extensions (without the leading dot).
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}

# Default upload directory, used when not configured on the Flask app
# (e.g. app.config["UPLOAD_FOLDER"]).
DEFAULT_UPLOAD_DIR = Path("uploads")


def _allowed_file(filename: str) -> bool:
    """
    Check whether a filename has one of the supported image extensions.

    Args:
        filename: The original filename of the uploaded file.

    Returns:
        True if the extension is allowed, False otherwise.
    """
    if not filename or "." not in filename:
        return False
    extension = filename.rsplit(".", 1)[1].lower()
    return extension in ALLOWED_EXTENSIONS


def _get_upload_dir() -> Path:
    """Resolve the upload directory from app config, falling back to a default."""
    configured = current_app.config.get("UPLOAD_FOLDER")
    upload_dir = Path(configured) if configured else DEFAULT_UPLOAD_DIR
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


def _validate_upload(file_storage: Optional[FileStorage]) -> Tuple[bool, str]:
    """
    Validate an uploaded file for presence and allowed extension.

    Args:
        file_storage: The FileStorage object from request.files, or None.

    Returns:
        A tuple of (is_valid, error_message). error_message is empty when
        is_valid is True.
    """
    if file_storage is None or file_storage.filename == "":
        return False, "No image file was provided."

    if not _allowed_file(file_storage.filename):
        allowed = ", ".join(sorted(ALLOWED_EXTENSIONS))
        return False, f"Unsupported file extension. Allowed formats: {allowed}."

    return True, ""


def _save_upload(file_storage: FileStorage, upload_dir: Path) -> Path:
    """
    Securely save an uploaded file to the upload directory under a unique,
    sanitized filename.

    Args:
        file_storage: The validated FileStorage object to save.
        upload_dir: Directory in which to save the file.

    Returns:
        The full filesystem path where the file was saved.
    """
    safe_name = secure_filename(file_storage.filename) or "upload"

    unique_prefix = datetime.now().strftime("%Y%m%d%H%M%S%f")
    final_name = f"{unique_prefix}_{safe_name}"

    destination = upload_dir / final_name
    file_storage.save(str(destination))
    return destination


@match_bp.route("", methods=["POST"])
def match() -> Tuple[dict, int]:
    """
    POST /api/match

    Accepts a multipart/form-data upload under the 'image' field, saves it
    to the uploads directory, and runs it through
    services.face_matching.match_face() to find a candidate subject match.

    Returns:
        A JSON response containing the match result on success, or an
        error message on failure.
    """
    uploaded_file = request.files.get("image")

    is_valid, error_message = _validate_upload(uploaded_file)
    if not is_valid:
        logger.warning("Match request rejected: %s", error_message)
        return jsonify({"success": False, "message": error_message}), 400

    try:
        upload_dir = _get_upload_dir()
    except OSError as e:
        logger.exception("Failed to prepare upload directory")
        return jsonify({
            "success": False,
            "message": f"Server storage error: {e}",
        }), 500

    try:
        saved_path = _save_upload(uploaded_file, upload_dir)
    except OSError as e:
        logger.exception("Failed to save uploaded image")
        return jsonify({
            "success": False,
            "message": f"Failed to save uploaded image: {e}",
        }), 500

    # TODO: Once a real matching model is integrated in face_matching.py,
    #       this call site does not need to change - match_face() keeps
    #       the same signature and return contract.
    try:
        match_result = match_face(saved_path)
    except FaceMatchingError as e:
        logger.warning("Face matching failed for %s: %s", saved_path, e)
        return jsonify({"success": False, "message": str(e)}), 400
    except Exception as e:  # noqa: BLE001 - safety net for unexpected matching errors
        logger.exception("Unexpected error matching face for %s", saved_path)
        return jsonify({
            "success": False,
            "message": f"Internal error while matching face: {e}",
        }), 500

    return jsonify({
        "success": True,
        "match": match_result,
    }), 200