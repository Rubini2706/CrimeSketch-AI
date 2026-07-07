"""
CrimeSketch Backend - Case Routes
REST endpoints for creating, retrieving, updating, and deleting cases.
"""

import logging
from flask import Blueprint, request, jsonify

from models.case_model import (
    create_case,
    get_all_cases,
    get_case_by_id,
    update_case,
    delete_case,
)

logger = logging.getLogger(__name__)
cases_bp = Blueprint("cases", __name__)

VALID_STATUSES = {
    "ACTIVE",
    "PENDING",
    "CLOSED"
}


@cases_bp.route("", methods=["GET"])
def list_cases():
    try:
        status = request.args.get("status")
        search = request.args.get("search")
        cases = get_all_cases(status=status, search=search)
        return jsonify({"cases": cases, "count": len(cases)}), 200
    except Exception as e:
        logger.exception("Failed to list cases")
        return jsonify({"error": "Failed to retrieve cases", "message": str(e)}), 500


@cases_bp.route("/<int:case_id>", methods=["GET"])
def get_case(case_id):
    try:
        case = get_case_by_id(case_id)
        if not case:
            return jsonify({"error": "Case not found"}), 404
        return jsonify({"case": case}), 200
    except Exception as e:
        logger.exception("Failed to fetch case %s", case_id)
        return jsonify({"error": "Failed to retrieve case", "message": str(e)}), 500


@cases_bp.route("", methods=["POST"])
def add_case():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    title = data.get("title")
    case_number = data.get("case_number")

    if not title or not str(title).strip():
        return jsonify({"error": "'title' is required"}), 400
    if not case_number or not str(case_number).strip():
        return jsonify({"error": "'case_number' is required"}), 400

    status = data.get("status", "open")
    if status not in VALID_STATUSES:
        return jsonify({"error": f"'status' must be one of {sorted(VALID_STATUSES)}"}), 400

    try:
        new_case = create_case(
            case_number=case_number.strip(),
            title=title.strip(),
            description=data.get("description", ""),
            status=status,
            location=data.get("location", ""),
            reported_by=data.get("reported_by", ""),
        )
        return jsonify({"case": new_case, "message": "Case created successfully"}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 409
    except Exception as e:
        logger.exception("Failed to create case")
        return jsonify({"error": "Failed to create case", "message": str(e)}), 500


@cases_bp.route("/<int:case_id>", methods=["PUT", "PATCH"])
def edit_case(case_id):
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    if "status" in data and data["status"] not in VALID_STATUSES:
        return jsonify({"error": f"'status' must be one of {sorted(VALID_STATUSES)}"}), 400

    try:
        existing = get_case_by_id(case_id)
        if not existing:
            return jsonify({"error": "Case not found"}), 404

        updated = update_case(case_id, data)
        return jsonify({"case": updated, "message": "Case updated successfully"}), 200
    except Exception as e:
        logger.exception("Failed to update case %s", case_id)
        return jsonify({"error": "Failed to update case", "message": str(e)}), 500


@cases_bp.route("/<int:case_id>", methods=["DELETE"])
def remove_case(case_id):
    try:
        existing = get_case_by_id(case_id)
        if not existing:
            return jsonify({"error": "Case not found"}), 404

        delete_case(case_id)
        return jsonify({"message": "Case deleted successfully"}), 200
    except Exception as e:
        logger.exception("Failed to delete case %s", case_id)
        return jsonify({"error": "Failed to delete case", "message": str(e)}), 500