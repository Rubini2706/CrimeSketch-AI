import { useEffect, useState, useCallback } from "react";

const API_BASE = "http://127.0.0.1:5000/api/reports";

/**
 * Reports page
 * - Lists generated reports (GET /api/reports/ or /api/reports/?case_id=)
 * - Generates a new report for a case (POST /api/reports/generate)
 * - Downloads / deletes existing reports
 */
export default function Reports() {
  const [reports, setReports] = useState([]);
  const [count, setCount] = useState(0);
  const [caseIdFilter, setCaseIdFilter] = useState("");
  const [generateCaseId, setGenerateCaseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const fetchReports = useCallback(async (caseId) => {
    setLoading(true);
    setError(null);
    try {
      const url = caseId
        ? `${API_BASE}/?case_id=${encodeURIComponent(caseId)}`
        : `${API_BASE}/`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to load reports");
      }

      setReports(data.reports || []);
      setCount(data.count ?? (data.reports ? data.reports.length : 0));
    } catch (err) {
      setError(err.message);
      setReports([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  async function handleGenerate(e) {
    e.preventDefault();
    if (!generateCaseId) {
      setError("Enter a case ID to generate a report");
      return;
    }

    setGenerating(true);
    setError(null);
    setNotice(null);

    try {
      const res = await fetch(`${API_BASE}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case_id: Number(generateCaseId) }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Report generation failed");
      }

      setNotice(data.message || "Report generated successfully");
      setGenerateCaseId("");
      // Re-fetch so the new row (created by the backend, with a real id
      // and generated_at) shows up instead of trusting the POST response.
      await fetchReports(caseIdFilter || undefined);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(reportId) {
    if (!window.confirm("Delete this report? This cannot be undone.")) return;

    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${reportId}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to delete report");
      }

      setReports((prev) => prev.filter((r) => r.id !== reportId));
      setCount((prev) => Math.max(0, prev - 1));
      setNotice(data.message || "Report deleted");
    } catch (err) {
      setError(err.message);
    }
  }

  function handleFilterSubmit(e) {
    e.preventDefault();
    fetchReports(caseIdFilter || undefined);
  }

  function handleClearFilter() {
    setCaseIdFilter("");
    fetchReports();
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.h1}>Reports</h1>

      {/* Generate a new report */}
      <form onSubmit={handleGenerate} style={styles.row}>
        <input
          type="number"
          min="1"
          placeholder="Case ID"
          value={generateCaseId}
          onChange={(e) => setGenerateCaseId(e.target.value)}
          style={styles.input}
        />
        <button type="submit" disabled={generating} style={styles.buttonPrimary}>
          {generating ? "Generating…" : "Generate report"}
        </button>
      </form>

      {/* Filter by case */}
      <form onSubmit={handleFilterSubmit} style={styles.row}>
        <input
          type="number"
          min="1"
          placeholder="Filter by case ID"
          value={caseIdFilter}
          onChange={(e) => setCaseIdFilter(e.target.value)}
          style={styles.input}
        />
        <button type="submit" style={styles.buttonSecondary}>
          Filter
        </button>
        <button type="button" onClick={handleClearFilter} style={styles.buttonGhost}>
          Clear
        </button>
      </form>

      {error && <div style={styles.error}>{error}</div>}
      {notice && <div style={styles.notice}>{notice}</div>}

      <p style={styles.count}>{count} report{count === 1 ? "" : "s"}</p>

      {loading ? (
        <p>Loading reports…</p>
      ) : reports.length === 0 ? (
        <p style={styles.empty}>No reports yet. Generate one for a case above.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Case</th>
              <th style={styles.th}>Summary</th>
              <th style={styles.th}>Generated</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id}>
                <td style={styles.td}>{r.id}</td>
                <td style={styles.td}>{r.case_id}</td>
                <td style={styles.td}>{r.summary}</td>
                <td style={styles.td}>{r.generated_at}</td>
                <td style={styles.td}>
                  <a
                    href={`${API_BASE}/${r.id}/download`}
                    style={styles.link}
                  >
                    Download
                  </a>
                  {" · "}
                  <button
                    onClick={() => handleDelete(r.id)}
                    style={styles.buttonDanger}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// Palette matched to the existing CrimeSketch console (dark sidebar, blue accent)
const colors = {
  bg: "#0f1117",
  panel: "#171a23",
  border: "#2a2e3a",
  text: "#e8eaf0",
  muted: "#8b90a0",
  accent: "#2f6fed",
  accentText: "#ffffff",
  danger: "#f16368",
  dangerBg: "#3a1f22",
  success: "#4ade80",
  successBg: "#1c3324",
};

const styles = {
  page: {
    maxWidth: 900,
    margin: "0 auto",
    padding: 24,
    fontFamily: "system-ui, sans-serif",
    background: colors.bg,
    color: colors.text,
    minHeight: "100%",
  },
  h1: { marginBottom: 16, color: colors.text },
  row: { display: "flex", gap: 8, marginBottom: 12 },
  input: {
    padding: "8px 10px",
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    flex: "0 0 220px",
    background: colors.panel,
    color: colors.text,
  },
  buttonPrimary: {
    padding: "8px 14px",
    borderRadius: 6,
    border: "none",
    background: colors.accent,
    color: colors.accentText,
    cursor: "pointer",
    fontWeight: 500,
  },
  buttonSecondary: {
    padding: "8px 14px",
    borderRadius: 6,
    border: `1px solid ${colors.border}`,
    background: colors.panel,
    color: colors.text,
    cursor: "pointer",
  },
  buttonGhost: {
    padding: "8px 14px",
    borderRadius: 6,
    border: `1px solid ${colors.border}`,
    background: "transparent",
    color: colors.muted,
    cursor: "pointer",
  },
  buttonDanger: {
    border: "none",
    background: "none",
    color: colors.danger,
    cursor: "pointer",
    padding: 0,
  },
  error: {
    background: colors.dangerBg,
    color: colors.danger,
    padding: "10px 14px",
    borderRadius: 6,
    marginBottom: 12,
    border: `1px solid ${colors.danger}33`,
  },
  notice: {
    background: colors.successBg,
    color: colors.success,
    padding: "10px 14px",
    borderRadius: 6,
    marginBottom: 12,
    border: `1px solid ${colors.success}33`,
  },
  count: { color: colors.muted, marginBottom: 8 },
  empty: { color: colors.muted, fontStyle: "italic" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    borderBottom: `2px solid ${colors.border}`,
    padding: "8px 6px",
    color: colors.muted,
    fontWeight: 500,
  },
  td: {
    borderBottom: `1px solid ${colors.border}`,
    padding: "8px 6px",
    verticalAlign: "top",
    color: colors.text,
  },
  link: { color: colors.accent, textDecoration: "none" },
};