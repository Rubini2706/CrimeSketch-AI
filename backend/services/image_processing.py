"""
CrimeSketch Backend - Image Processing Service
Handles validation, normalization, and persistence of uploaded images
(forensic sketches and candidate photos) using OpenCV.
"""

import os
import uuid
import logging

import numpy as np
import cv2
from werkzeug.utils import secure_filename

logger = logging.getLogger(__name__)

MAX_DIMENSION = 1024  # longest side, in pixels, after normalization


class ImageProcessingError(Exception):
    """Raised when an uploaded image fails validation or cannot be processed."""


def allowed_file(filename, allowed_extensions):
    """
    Check whether a filename has an extension in the allowed set.

    Args:
        filename: The original filename of the uploaded file.
        allowed_extensions: An iterable of allowed lowercase extensions
            (without the leading dot), e.g. {'png', 'jpg'}.

    Returns:
        True if the extension is allowed, False otherwise.
    """
    if not filename or "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower()
    return ext in allowed_extensions


def _resize_if_needed(image):
    """Downscale an image so its longest side does not exceed MAX_DIMENSION."""
    height, width = image.shape[:2]
    longest_side = max(height, width)
    if longest_side <= MAX_DIMENSION:
        return image

    scale = MAX_DIMENSION / float(longest_side)
    new_size = (int(width * scale), int(height * scale))
    return cv2.resize(image, new_size, interpolation=cv2.INTER_AREA)


def save_uploaded_image(file_storage, upload_folder, prefix="img"):
    """
    Validate, normalize, and persist an uploaded image file to disk.

    The image is read into memory, decoded with OpenCV to confirm it is a
    valid, readable image, optionally downscaled, and re-encoded to disk
    under a unique filename to avoid collisions and path traversal.

    Args:
        file_storage: A werkzeug FileStorage object (e.g. from
            request.files['sketch']).
        upload_folder: Directory path where the image should be saved.
        prefix: Prefix used to build the saved filename.

    Returns:
        The absolute filesystem path of the saved image.

    Raises:
        ImageProcessingError: If the file is missing, unreadable, or
            cannot be decoded as a valid image.
    """
    if file_storage is None or file_storage.filename == "":
        raise ImageProcessingError("No file provided")

    raw_bytes = file_storage.read()
    if not raw_bytes:
        raise ImageProcessingError("Uploaded file is empty")

    np_buffer = np.frombuffer(raw_bytes, dtype=np.uint8)
    image = cv2.imdecode(np_buffer, cv2.IMREAD_COLOR)

    if image is None:
        raise ImageProcessingError("File could not be decoded as a valid image")

    image = _resize_if_needed(image)

    os.makedirs(upload_folder, exist_ok=True)

    original_name = secure_filename(file_storage.filename) or "upload"
    ext = os.path.splitext(original_name)[1].lower() or ".jpg"
    if ext not in (".jpg", ".jpeg", ".png", ".bmp", ".webp"):
        ext = ".jpg"

    unique_name = f"{prefix}_{uuid.uuid4().hex}{ext}"
    output_path = os.path.join(upload_folder, unique_name)

    success = cv2.imwrite(output_path, image)
    if not success:
        raise ImageProcessingError("Failed to write processed image to disk")

    logger.info("Saved uploaded image to %s", output_path)
    return output_path


def load_image(image_path):
    """
    Load an image from disk as a BGR OpenCV array.

    Args:
        image_path: Filesystem path to the image.

    Returns:
        The decoded image as a NumPy array (BGR).

    Raises:
        ImageProcessingError: If the file does not exist or cannot be read.
    """
    if not image_path or not os.path.isfile(image_path):
        raise ImageProcessingError(f"Image file not found: {image_path}")

    image = cv2.imread(image_path, cv2.IMREAD_COLOR)
    if image is None:
        raise ImageProcessingError(f"Failed to read image: {image_path}")

    return image


def to_grayscale(image):
    """
    Convert a BGR image to single-channel grayscale.

    Args:
        image: A BGR NumPy array.

    Returns:
        A single-channel grayscale NumPy array.
    """
    if image is None:
        raise ImageProcessingError("Cannot convert a None image to grayscale")
    return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)