"""
CrimeSketch Backend - Subject Routes
REST endpoints for uploading and managing forensic sketch subjects
associated with a case.
"""

import os
import logging
from flask import Blueprint, request, jsonify, current_app, send_from_directory

from models.case_model import get_case_by_id
from models.subject_model import (
    create_subject,
    get_subjects_by_case,
    get_subject_by_id,
    get_all_subjects,
    update_subject,
    delete_subject,
)
from services.image_processing import save_uploaded_image, allowed_file, ImageProcessingError

logger = logging.getLogger(__name__)
subjects_bp = Blueprint("subjects", __name__)


@subjects_bp.route("", methods=["GET"])
def list_subjects():
    try:
        case_id = request.args.get("case_id", type=int)
        if case_id is not None:
            subjects = get_subjects_by_case(case_id)
        else:
            subjects = get_all_subjects()
        return jsonify({"subjects": subjects, "count": len(subjects)}), 200
    except Exception as e:
        logger.exception("Failed to list subjects")
        return jsonify({"error": "Failed to retrieve subjects", "message": str(e)}), 500


@subjects_bp.route("/<int:subject_id>", methods=["GET"])
def get_subject(subject_id):
    try:
        subject = get_subject_by_id(subject_id)
        if not subject:
            return jsonify({"error": "Subject not found"}), 404
        return jsonify({"subject": subject}), 200
    except Exception as e:
        logger.exception("Failed to fetch subject %s", subject_id)
        return jsonify({"error": "Failed to retrieve subject", "message": str(e)}), 500


@subjects_bp.route("", methods=["POST"])
def add_subject():
    if "sketch" not in request.files:
        return jsonify({"error": "'sketch' file is required (multipart/form-data)"}), 400

    file = request.files["sketch"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(file.filename, current_app.config["ALLOWED_IMAGE_EXTENSIONS"]):
        return jsonify({
            "error": "Unsupported file type",
            "allowed": sorted(current_app.config["ALLOWED_IMAGE_EXTENSIONS"]),
        }), 400

    case_id = request.form.get("case_id", type=int)
    if not case_id:
        return jsonify({"error": "'case_id' is required"}), 400

    case = get_case_by_id(case_id)
    if not case:
        return jsonify({"error": f"Case {case_id} does not exist"}), 404

    name = request.form.get("name", "")
    notes = request.form.get("notes", "")

    try:
        sketch_path = save_uploaded_image(
            file,
            current_app.config["UPLOAD_FOLDER"],
            prefix=f"case{case_id}_sketch",
        )
    except ImageProcessingError as e:
        return jsonify({"error": "Image processing failed", "message": str(e)}), 400
    except Exception as e:
        logger.exception("Failed to save sketch upload")
        return jsonify({"error": "Failed to save uploaded file", "message": str(e)}), 500

    try:
        subject = create_subject(
            case_id=case_id,
            name=name,
            sketch_path=sketch_path,
            notes=notes,
        )
        return jsonify({"subject": subject, "message": "Subject created successfully"}), 201
    except Exception as e:
        logger.exception("Failed to create subject")
        return jsonify({"error": "Failed to create subject", "message": str(e)}), 500


@subjects_bp.route("/<int:subject_id>", methods=["PUT", "PATCH"])
def edit_subject(subject_id):
    existing = get_subject_by_id(subject_id)
    if not existing:
        return jsonify({"error": "Subject not found"}), 404

    updates = {}
    if request.form:
        updates["name"] = request.form.get("name", existing.get("name"))
        updates["notes"] = request.form.get("notes", existing.get("notes"))
    elif request.is_json:
        data = request.get_json(silent=True) or {}
        if "name" in data:
            updates["name"] = data["name"]
        if "notes" in data:
            updates["notes"] = data["notes"]

    if "sketch" in request.files and request.files["sketch"].filename != "":
        file = request.files["sketch"]
        if not allowed_file(file.filename, current_app.config["ALLOWED_IMAGE_EXTENSIONS"]):
            return jsonify({
                "error": "Unsupported file type",
                "allowed": sorted(current_app.config["ALLOWED_IMAGE_EXTENSIONS"]),
            }), 400
        try:
            updates["sketch_path"] = save_uploaded_image(
                file,
                current_app.config["UPLOAD_FOLDER"],
                prefix=f"case{existing['case_id']}_sketch",
            )
        except ImageProcessingError as e:
            return jsonify({"error": "Image processing failed", "message": str(e)}), 400

    try:
        updated = update_subject(subject_id, updates)
        return jsonify({"subject": updated, "message": "Subject updated successfully"}), 200
    except Exception as e:
        logger.exception("Failed to update subject %s", subject_id)
        return jsonify({"error": "Failed to update subject", "message": str(e)}), 500


@subjects_bp.route("/<int:subject_id>", methods=["DELETE"])
def remove_subject(subject_id):
    try:
        existing = get_subject_by_id(subject_id)
        if not existing:
            return jsonify({"error": "Subject not found"}), 404

        delete_subject(subject_id)
        return jsonify({"message": "Subject deleted successfully"}), 200
    except Exception as e:
        logger.exception("Failed to delete subject %s", subject_id)
        return jsonify({"error": "Failed to delete subject", "message": str(e)}), 500


@subjects_bp.route("/<int:subject_id>/image", methods=["GET"])
def get_subject_image(subject_id):
    try:
        subject = get_subject_by_id(subject_id)
        if not subject:
            return jsonify({"error": "Subject not found"}), 404

        sketch_path = subject["sketch_path"]
        directory = os.path.dirname(sketch_path)
        filename = os.path.basename(sketch_path)
        return send_from_directory(directory, filename)
    except Exception as e:
        logger.exception("Failed to serve subject image %s", subject_id)
        return jsonify({"error": "Failed to retrieve image", "message": str(e)}), 500