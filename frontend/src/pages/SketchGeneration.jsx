import { useState, useRef, useCallback } from "react";
import styles from "./SketchGeneration.module.css";

// Base URL for the Flask backend
const API_BASE_URL = "http://127.0.0.1:5000";

const SketchGeneration = () => {
  // ---- State ----
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [generatedSketch, setGeneratedSketch] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  // ---- Handlers ----

  // Handle file selection (input or drag/drop)
  const handleFileSelect = useCallback((file) => {
    if (!file) return;

    // Basic client-side validation
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid image file (JPG, PNG, or WEBP).");
      return;
    }

    const maxSizeMB = 10;
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Image size must be under ${maxSizeMB}MB.`);
      return;
    }

    setError(null);
    setGeneratedSketch(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, []);

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    handleFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setGeneratedSketch(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Submit the image to the backend for sketch generation
  const handleGenerateSketch = async () => {
    if (!selectedFile) {
      setError("Please select an image before generating a sketch.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedSketch(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch(`${API_BASE_URL}/api/sketch/generate`, {
        method: "POST",
        body: formData,
      });

      // Try to parse JSON regardless of status for a useful error message
      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Unexpected response from server.");
      }

      if (!response.ok || !data.success) {
        throw new Error(data?.message || "Failed to generate sketch.");
      }

      // generated_sketch is a relative path e.g. "generated/sketch_xxx.png"
      // generated_sketch is a relative path e.g. "generated/sketch_xxx.png"
setGeneratedSketch(`${API_BASE_URL}/api/${data.generated_sketch}`);
setGeneratedSketch(`${API_BASE_URL}/generated/${fileName}`);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Unable to reach the server. Is the Flask backend running?"
          : err.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
  if (!generatedSketch) return;

  const link = document.createElement("a");
  link.href = generatedSketch;
  link.download = `sketch_${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  // ---- Render ----
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Sketch Generation</h1>
        <p className={styles.subtitle}>
          Upload a reference photograph to generate a forensic pencil sketch.
        </p>
      </header>

      <div className={styles.workspace}>
        {/* Upload Section */}
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Upload Image</h2>

          <div
            className={styles.dropzone}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={handleBrowseClick}
            role="button"
            tabIndex={0}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Selected preview"
                className={styles.previewImage}
              />
            ) : (
              <div className={styles.dropzoneHint}>
                <span className={styles.uploadIcon}>⬆</span>
                <p>Drag & drop an image here, or click to browse</p>
                <span className={styles.hintSmall}>
                  JPG, PNG or WEBP — max 10MB
                </span>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            onChange={handleInputChange}
            className={styles.hiddenInput}
          />

          <div className={styles.buttonRow}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleGenerateSketch}
              disabled={!selectedFile || isLoading}
            >
              {isLoading ? (
                <>
                  <span className={styles.spinner} />
                  Generating...
                </>
              ) : (
                "Generate Sketch"
              )}
            </button>

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleReset}
              disabled={isLoading || (!selectedFile && !generatedSketch)}
            >
              Reset
            </button>
          </div>

          {error && (
            <div className={styles.errorBox} role="alert">
              <span className={styles.errorIcon}>⚠</span>
              {error}
            </div>
          )}
        </section>

        {/* Result Section */}
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Generated Sketch</h2>

          <div className={styles.resultArea}>
            {isLoading && (
              <div className={styles.loadingState}>
                <span className={styles.spinnerLarge} />
                <p>Processing image with OpenCV...</p>
              </div>
            )}

            {!isLoading && generatedSketch && (
              <img
                src={generatedSketch}
                alt="Generated forensic sketch"
                className={styles.sketchImage}
              />
            )}

            {!isLoading && !generatedSketch && (
              <div className={styles.emptyState}>
                <span className={styles.sketchIcon}>✏</span>
                <p>Your generated sketch will appear here</p>
              </div>
            )}
          </div>

          <button
            type="button"
            className={styles.downloadButton}
            onClick={handleDownload}
            disabled={!generatedSketch || isLoading}
          >
            Download Sketch
          </button>
        </section>
      </div>
    </div>
  );
};

export default SketchGeneration;