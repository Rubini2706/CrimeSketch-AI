"""
CrimeSketch Backend - Application Entry Point
AI-powered forensic face sketch matching system.
"""

import os
import logging
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

from config import Config
from database.db import init_db, close_db

from routes.cases import cases_bp
from routes.subjects import subjects_bp
from routes.reports import reports_bp
from routes.match import match_bp
from routes.sketch import sketch_bp


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    app.logger.setLevel(logging.INFO)

    # CORS - allow the React (Vite) frontend to communicate with the API
    CORS(
        app,
        resources={r"/api/*": {"origins": app.config.get("CORS_ORIGINS", "*")}},
        supports_credentials=True,
    )

    # Ensure required directories exist
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    os.makedirs(app.config["STATIC_FOLDER"], exist_ok=True)
    os.makedirs(app.config["GENERATED_FOLDER"], exist_ok=True)
    os.makedirs(os.path.dirname(app.config["DATABASE_PATH"]), exist_ok=True)

    # Initialize database (creates tables if they do not exist)
    with app.app_context():
        init_db(app.config["DATABASE_PATH"])

    # Teardown - close per-request DB connections
    app.teardown_appcontext(close_db)

    # Register blueprints
    app.register_blueprint(cases_bp, url_prefix="/api/cases")
    app.register_blueprint(subjects_bp, url_prefix="/api/subjects")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")
    print("Reports Blueprint Registered")
    app.register_blueprint(sketch_bp, url_prefix="/api/sketch")
    app.register_blueprint(match_bp, url_prefix="/api/match")
    print(app.url_map)

    # Health check
    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "ok",
            "service": "CrimeSketch Backend",
            "version": "1.0.0",
        }), 200

    # Root
    @app.route("/", methods=["GET"])
    def index():
        return jsonify({
            "message": "CrimeSketch API is running",
            "endpoints": [
                "/api/health",
                "/api/cases",
                "/api/subjects",
                "/api/reports",
                "/api/match",
                "/api/sketch",
            ],
        }), 200

    # Error handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"error": "Bad request", "message": str(error)}), 400

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Not found", "message": str(error)}), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({"error": "Method not allowed", "message": str(error)}), 405

    @app.errorhandler(413)
    def payload_too_large(error):
        return jsonify({
            "error": "Payload too large",
            "message": "Uploaded file exceeds the maximum allowed size."
        }), 413

    @app.errorhandler(500)
    def internal_server_error(error):
        app.logger.exception("Internal server error")
        return jsonify({"error": "Internal server error", "message": str(error)}), 500
    @app.route("/api/generated/<path:filename>")
    def serve_generated(filename):
        return send_from_directory(app.config["GENERATED_FOLDER"], filename)    

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        host=app.config.get("HOST", "0.0.0.0"),
        port=app.config.get("PORT", 5000),
        debug=app.config.get("DEBUG", True),
    )