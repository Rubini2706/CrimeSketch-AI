"""
CrimeSketch Backend - Configuration
Centralized application configuration loaded from environment variables
with sensible defaults for local development.
"""

import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


def _env_bool(name, default=False):
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in ("1", "true", "yes", "on")


def _env_list(name, default=None):
    value = os.environ.get(name)
    if not value:
        return default or []
    return [item.strip() for item in value.split(",") if item.strip()]


class Config:
    # Core Flask settings
    SECRET_KEY = os.environ.get("SECRET_KEY", "crimesketch-dev-secret-key-change-me")
    DEBUG = _env_bool("FLASK_DEBUG", True)
    HOST = os.environ.get("FLASK_HOST", "0.0.0.0")
    PORT = int(os.environ.get("FLASK_PORT", 5000))

    # CORS - Vite dev server defaults
    CORS_ORIGINS = _env_list(
        "CORS_ORIGINS",
        ["http://localhost:5173", "http://127.0.0.1:5173"],
    )

    # Database
    DATABASE_PATH = os.environ.get(
        "DATABASE_PATH", os.path.join(BASE_DIR, "database", "crimeSketch.db")
    )

    # Filesystem
    UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", os.path.join(BASE_DIR, "uploads"))
    STATIC_FOLDER = os.environ.get("STATIC_FOLDER", os.path.join(BASE_DIR, "static"))
    GENERATED_FOLDER = os.environ.get(
    "GENERATED_FOLDER", os.path.join(BASE_DIR, "generated")
)
    REPORT_FOLDER = os.environ.get(
        "REPORT_FOLDER", os.path.join(BASE_DIR, "static", "reports")
    )

    # Uploads
    MAX_CONTENT_LENGTH = int(
        os.environ.get("MAX_CONTENT_LENGTH", 16 * 1024 * 1024)
    )  # 16 MB
    ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "bmp", "webp"}

    # Face matching
    FACE_MATCH_THRESHOLD = float(os.environ.get("FACE_MATCH_THRESHOLD", 0.55))
    FACE_MATCH_TOP_K = int(os.environ.get("FACE_MATCH_TOP_K", 5))
    HAAR_CASCADE_PATH = os.environ.get("HAAR_CASCADE_PATH", "")  # falls back to cv2 default if empty


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


class TestingConfig(Config):
    TESTING = True
    DATABASE_PATH = os.path.join(BASE_DIR, "database", "crimeSketch_test.db")


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}