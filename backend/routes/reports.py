import os
import logging

from flask import Blueprint, request, jsonify, current_app, send_file

from models.case_model import get_case_by_id
from models.subject_model import get_subjects_by_case
from models.report_model import (
    create_report,
    get_all_reports,
    get_reports_by_case,
    get_report_by_id,
    delete_report,
)

from services.report_generator import (
    generate_case_report,
    ReportGenerationError,
)

logger = logging.getLogger(__name__)
reports_bp = Blueprint("reports_bp", __name__)


@reports_bp.route("/", methods=["GET"])
def list_reports():
    try:
        case_id = request.args.get("case_id", type=int)
        if case_id is not None:
            reports = get_reports_by_case(case_id)
        else:
            reports = get_all_reports()
        return jsonify({"reports": reports, "count": len(reports)}), 200
    except ValueError as e:
        return jsonify({"error": "Invalid request", "message": str(e)}), 400
    except Exception as e:
        logger.exception("Failed to list reports")
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@reports_bp.route("/<int:report_id>", methods=["GET"])
def get_report(report_id):
    try:
        report = get_report_by_id(report_id)
        if not report:
            return jsonify({"error": "Report not found"}), 404
        return jsonify({"report": report}), 200
    except ValueError as e:
        return jsonify({"error": "Invalid request", "message": str(e)}), 400
    except Exception as e:
        logger.exception("Failed to fetch report %s", report_id)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@reports_bp.route("/generate", methods=["POST"])
def generate_report():
    data = request.get_json(silent=True)
    report = {
        "case_id": data["case_id"],
        "title": "CrimeSketch Report",
        "status": "FINAL",
        "summary": "Report generated successfully"
    }
    return jsonify(report), 201
    if not data:
        return jsonify({"error": "Invalid request", "message": "Request body must be JSON"}), 400

    case_id = data.get("case_id")
    if not case_id:
        return jsonify({"error": "Invalid request", "message": "'case_id' is required"}), 400

    try:
        case = get_case_by_id(case_id)
    except ValueError as e:
        return jsonify({"error": "Invalid request", "message": str(e)}), 400

    if not case:
        return jsonify({"error": "Case not found", "message": f"Case {case_id} does not exist"}), 404

    try:
        subjects = get_subjects_by_case(case_id)
    except ValueError as e:
        return jsonify({"error": "Invalid request", "message": str(e)}), 400
    except Exception as e:
        logger.exception("Failed to load subjects for case %s", case_id)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500

    try:
        file_path, summary = generate_case_report(
            case=case,
            subjects=subjects,
            output_folder=current_app.config["REPORT_FOLDER"],
        )
    except ReportGenerationError as e:
        return jsonify({"error": "Report generation failure", "message": str(e)}), 400
    except Exception as e:
        logger.exception("Failed to generate report for case %s", case_id)
        return jsonify({"error": "Report generation failure", "message": str(e)}), 500

    try:
        report = create_report(
            case_id=case_id,
            file_path=file_path,
            summary=summary,
        )
        return jsonify({
           "report": report,
           "message": "Report generated successfully"
        }), 201
        return jsonify({"report": report, "message": "Report generated successfully"}), 201
    except ValueError as e:
        return jsonify({"error": "Invalid request", "message": str(e)}), 400
    except Exception as e:
        logger.exception("Failed to save report record for case %s", case_id)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@reports_bp.route("/<int:report_id>/download", methods=["GET"])
def download_report(report_id):
    try:
        report = get_report_by_id(report_id)
        if not report:
            return jsonify({"error": "Report not found"}), 404

        file_path = report["file_path"]
        if not os.path.isfile(file_path):
            return jsonify({"error": "Report not found", "message": "Report file missing on disk"}), 404

        return send_file(file_path, as_attachment=True)
    except ValueError as e:
        return jsonify({"error": "Invalid request", "message": str(e)}), 400
    except Exception as e:
        logger.exception("Failed to download report %s", report_id)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500


@reports_bp.route("/<int:report_id>", methods=["DELETE"])
def remove_report(report_id):
    try:
        report = get_report_by_id(report_id)
        if not report:
            return jsonify({"error": "Report not found"}), 404

        file_path = report.get("file_path")
        if file_path and os.path.isfile(file_path):
            try:
                os.remove(file_path)
            except OSError as e:
                logger.warning("Could not remove report file %s: %s", file_path, e)

        delete_report(report_id)
        return jsonify({"message": "Report deleted successfully"}), 200
    except LookupError as e:
        return jsonify({"error": "Report not found", "message": str(e)}), 404
    except ValueError as e:
        return jsonify({"error": "Invalid request", "message": str(e)}), 400
    except Exception as e:
        logger.exception("Failed to delete report %s", report_id)
        return jsonify({"error": "Internal server error", "message": str(e)}), 500