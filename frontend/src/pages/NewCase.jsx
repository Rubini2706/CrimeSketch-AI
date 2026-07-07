import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./NewCase.css";

const API_BASE = "/api/cases"; // proxied to Flask via vite.config.js

const STATUS_OPTIONS = ["ACTIVE", "PENDING", "CLOSED"];

const EMPTY_FORM = {
  case_number: "",
  title: "",
  description: "",
  location: "",
  status: "ACTIVE",
};

export default function NewCase() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null); // { type: "success" | "error", message: string }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear the field-level error as soon as the user edits it
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  function validate() {
    const next = {};
    if (!form.case_number.trim()) next.case_number = "Case number is required";
    if (!form.title.trim()) next.title = "Title is required";
    if (!form.location.trim()) next.location = "Location is required";
    if (!STATUS_OPTIONS.includes(form.status)) next.status = "Invalid status";
    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setNotice(null);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_number: form.case_number.trim(),
          title: form.title.trim(),
          description: form.description.trim(),
          location: form.location.trim(),
          status: form.status,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Surface field-specific error (e.g. duplicate case_number) if backend provides one
        if (data.field) {
          setErrors((prev) => ({ ...prev, [data.field]: data.message }));
        }
        throw new Error(data.message || data.error || "Failed to create case");
      }

      setNotice({ type: "success", message: "Case created successfully" });

      // Give the success state a beat to render, then hand off to Case Files
      // with a flag so it knows to refresh its list from the server.
      setTimeout(() => {
        navigate("/cases", { state: { refresh: true } });
      }, 600);
    } catch (err) {
      setNotice({ type: "error", message: err.message || "Backend connection error" });
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    navigate("/cases");
  }

  return (
    <div className="new-case-page">
      <div className="new-case-card">
        <h2 className="new-case-title">New Case</h2>
        <p className="new-case-subtitle">Create a new forensic case record</p>

        {notice && (
          <div className={`new-case-notice new-case-notice--${notice.type}`}>
            {notice.message}
          </div>
        )}

        <form className="new-case-form" onSubmit={handleSubmit} noValidate>
          <div className="new-case-grid">
            <Field
              label="Case Number"
              name="case_number"
              value={form.case_number}
              onChange={handleChange}
              error={errors.case_number}
              placeholder="e.g. CS-2026-0417"
              required
            />
            <Field
              label="Title"
              name="title"
              value={form.title}
              onChange={handleChange}
              error={errors.title}
              placeholder="Short case title"
              required
            />
            <Field
              label="Location"
              name="location"
              value={form.location}
              onChange={handleChange}
              error={errors.location}
              placeholder="City, precinct, or address"
              required
            />
            <div className="new-case-field">
              <label className="new-case-label" htmlFor="status">
                Status <span className="new-case-required">*</span>
              </label>
              <select
                id="status"
                name="status"
                className={`new-case-select ${errors.status ? "has-error" : ""}`}
                value={form.status}
                onChange={handleChange}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {errors.status && <span className="new-case-error-text">{errors.status}</span>}
            </div>
          </div>

          <div className="new-case-field new-case-field--full">
            <label className="new-case-label" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              className="new-case-textarea"
              placeholder="Case details, context, or notes"
              rows={5}
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div className="new-case-actions">
            <button
              type="button"
              className="new-case-btn new-case-btn--ghost"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="new-case-btn new-case-btn--primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="new-case-spinner" aria-hidden="true" />
                  Saving…
                </>
              ) : (
                "Save Case"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, error, placeholder, required }) {
  return (
    <div className="new-case-field">
      <label className="new-case-label" htmlFor={name}>
        {label} {required && <span className="new-case-required">*</span>}
      </label>
      <input
        id={name}
        name={name}
        className={`new-case-input ${error ? "has-error" : ""}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete="off"
      />
      {error && <span className="new-case-error-text">{error}</span>}
    </div>
  );
}