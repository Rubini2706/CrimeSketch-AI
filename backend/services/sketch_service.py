"""
CrimeSketch Backend - Sketch Generation Service
Converts an uploaded photo into a pencil-sketch style image using classic
OpenCV image processing (grayscale -> invert -> blur -> dodge blend).

This module is intentionally isolated from Flask so it can be reused by
other entry points (CLI tools, background workers, tests) and so the
underlying algorithm can later be swapped for a deep-learning model
without touching the route layer.
"""

from __future__ import annotations

import logging
from datetime import datetime
from pathlib import Path
from typing import Union

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# Default output directory for generated sketches. The route layer may pass
# an explicit output_dir instead of relying on this default.
DEFAULT_GENERATED_DIR = Path("generated")

# Gaussian blur kernel size used for the pencil-sketch dodge blend.
# Larger values produce softer, more "hand-drawn" strokes.
BLUR_KERNEL_SIZE = (21, 21)


class SketchGenerationError(Exception):
    """Raised when a sketch cannot be generated from the given image."""


def _ensure_directory(directory: Union[str, Path]) -> Path:
    """
    Ensure a directory exists, creating it (and any parents) if necessary.

    Args:
        directory: Path to the directory.

    Returns:
        The directory as a resolved Path object.
    """
    dir_path = Path(directory)
    dir_path.mkdir(parents=True, exist_ok=True)
    return dir_path


def _build_output_filename() -> str:
    """
    Build a unique, timestamped filename for a generated sketch.

    Returns:
        A filename in the form 'sketch_<timestamp>.png'.
    """
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S%f")
    return f"sketch_{timestamp}.png"


def _dodge_blend(gray_image: np.ndarray, blurred_inverted: np.ndarray) -> np.ndarray:
    """
    Apply the classic "color dodge" blend to produce a pencil-sketch effect.

    This divides the grayscale image by the inverted, blurred grayscale
    image (scaled to 8-bit range), which brightens edges and produces the
    characteristic hand-drawn pencil look.

    Args:
        gray_image: Single-channel grayscale image.
        blurred_inverted: Single-channel, blurred, inverted grayscale image.

    Returns:
        A single-channel sketch image (uint8).
    """
    sketch = cv2.divide(gray_image, 255 - blurred_inverted, scale=256)
    return sketch


def generate_sketch(image_path: Union[str, Path], output_dir: Union[str, Path] = DEFAULT_GENERATED_DIR) -> str:
    """
    Generate a pencil-sketch rendering of the image at `image_path` and
    save it to `output_dir`.

    Pipeline:
        1. Read the source image.
        2. Convert to grayscale.
        3. Invert the grayscale image.
        4. Apply Gaussian blur to the inverted image.
        5. Blend the original grayscale image with the blurred, inverted
           image using a divide-based "dodge" blend to produce pencil
           strokes.
        6. Save the result as a PNG under a unique, timestamped filename.

    # TODO: Replace steps 2-5 with a deep-learning image-to-sketch model
    #       (e.g. a GAN-based sketch generator or a pretrained
    #       image-to-image translation network) once one is integrated.
    #       The function signature and return contract should stay the
    #       same so the route layer requires no changes.

    Args:
        image_path: Filesystem path to the source image.
        output_dir: Directory in which to save the generated sketch.
            Defaults to DEFAULT_GENERATED_DIR ('generated/').

    Returns:
        The filesystem path (as a string) of the generated sketch image.

    Raises:
        SketchGenerationError: If the image cannot be found, read, or
            processed, or if the result cannot be saved.
    """
    source_path = Path(image_path)

    if not source_path.is_file():
        raise SketchGenerationError(f"Source image not found: {source_path}")

    # Step 1: Read the source image.
    image = cv2.imread(str(source_path), cv2.IMREAD_COLOR)
    if image is None:
        raise SketchGenerationError(f"Failed to read image (unsupported or corrupt file): {source_path}")

    try:
        # Step 2: Convert to grayscale.
        gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Step 3: Invert the grayscale image.
        inverted_image = cv2.bitwise_not(gray_image)

        # Step 4: Apply Gaussian blur to the inverted image.
        blurred_image = cv2.GaussianBlur(inverted_image, BLUR_KERNEL_SIZE, sigmaX=0, sigmaY=0)

        # Step 5: Dodge-blend to produce the pencil-sketch effect.
        sketch_image = _dodge_blend(gray_image, blurred_image)
    except cv2.error as e:
        logger.exception("OpenCV processing failed for %s", source_path)
        raise SketchGenerationError(f"Image processing failed: {e}") from e

    # Step 6: Save the result under a unique filename.
    output_directory = _ensure_directory(output_dir)
    output_filename = _build_output_filename()
    output_path = output_directory / output_filename

    success = cv2.imwrite(str(output_path), sketch_image)
    if not success:
        raise SketchGenerationError(f"Failed to write generated sketch to disk: {output_path}")

    logger.info("Generated sketch for '%s' -> '%s'", source_path, output_path)
    return str(output_path)