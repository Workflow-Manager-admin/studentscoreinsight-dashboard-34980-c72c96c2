import React, { useState, useRef } from "react";
/**
 * PUBLIC_INTERFACE
 * Admin Bulk Import Page for Excel upload and sample file download.
 * Provides drag-and-drop/file picker upload, calls backend endpoints,
 * and displays user feedback (success or error details).
 */

function BulkImport() {
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef();

  // PUBLIC_INTERFACE
  // Trigger file picker dialog
  function handleChooseFile() {
    fileInput.current.click();
  }

  // PUBLIC_INTERFACE
  // Handle dropped or selected files
  async function handleFiles(files) {
    if (!files || !files.length) return;
    setUploading(true);
    setImportResult(null);
    setError("");

    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);
    try {
      // Assume endpoint: POST /import/bulk
      const resp = await fetch(
        (process.env.REACT_APP_API_BASE_URL ||
          "https://vscode-internal-3053-qa.qa01.cloud.kavia.ai:3001") +
          "/import/bulk",
        {
          method: "POST",
          headers: {
            Authorization:
              localStorage.getItem("access_token") &&
              `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: formData,
        }
      );
      if (!resp.ok) {
        // Try to get error details if present
        let data;
        try {
          data = await resp.json();
        } catch {
          /* empty */
        }
        throw new Error(
          data?.detail ||
            data?.error ||
            resp.statusText ||
            "Import failed"
        );
      }
      const result = await resp.json();
      setImportResult(result);
    } catch (err) {
      setError(
        err?.message || err?.detail || "Failed to import. Please try again."
      );
    }
    setUploading(false);
  }

  // PUBLIC_INTERFACE
  // Handle drag/drop or file selection
  function onDrop(e) {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer?.files;
    handleFiles(files);
  }
  function onDragOver(e) {
    e.preventDefault();
    setDragActive(true);
  }
  function onDragLeave(e) {
    setDragActive(false);
  }
  function onFileChange(e) {
    handleFiles(e.target.files);
    // clear file picker for repeat upload
    e.target.value = "";
  }

  // PUBLIC_INTERFACE
  // Download sample file from backend endpoint
  async function downloadSample() {
    setError("");
    try {
      // Assume endpoint: GET /import/sample-template (content-disposition=attachment)
      const resp = await fetch(
        (process.env.REACT_APP_API_BASE_URL ||
          "https://vscode-internal-3053-qa.qa01.cloud.kavia.ai:3001") +
          "/import/sample-template",
        {
          headers: {
            Authorization:
              localStorage.getItem("access_token") &&
              `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );
      if (!resp.ok) throw new Error("Failed to download sample template.");
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Default filename
      a.download = "students-scores-sample.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 500);
    } catch (err) {
      setError(
        err?.message ||
          "Failed to download template. Try again later."
      );
    }
  }

  return (
    <section>
      <h1 style={{ marginBottom: 10, color: "#1976d2" }}>
        Bulk Import Students & Scores
      </h1>
      <p>
        Upload an Excel file (.xlsx) in the required format to import student and score data in bulk.
      </p>
      <button
        type="button"
        onClick={downloadSample}
        style={{
          background: "#ffca28",
          color: "#202024",
          fontWeight: 700,
          fontSize: 16,
          padding: "12px 22px",
          marginBottom: 20,
          border: "none",
          borderRadius: 7,
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(90,90,60,.07)"
        }}
      >
        ⬇️ Download Sample Excel Template
      </button>
      <div
        style={{
          border: `2.1px dashed ${dragActive ? "#1976d2" : "#888"}`,
          borderRadius: 14,
          background: dragActive ? "#e3f0fb" : "#f8f9fa",
          padding: "32px 16px",
          margin: "auto",
          marginBottom: 20,
          maxWidth: 500,
          cursor: uploading ? "not-allowed" : "pointer",
          textAlign: "center",
          fontSize: 18,
          color: "#333",
          position: "relative",
          transition: "background 0.13s, border .13s"
        }}
        onClick={uploading ? undefined : handleChooseFile}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        tabIndex={0}
        aria-label="Excel file drop zone"
      >
        <span role="img" aria-label="xlsx" style={{ fontSize: 38 }}>📄</span>
        <div style={{ marginTop: 15, marginBottom: 7 }}>
          {uploading
            ? "Uploading and Importing..."
            : dragActive
            ? "Drop file here to upload"
            : "Drag & drop or click to upload Excel (.xlsx) file"
          }
        </div>
        <input
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          style={{ display: "none" }}
          ref={fileInput}
          onChange={onFileChange}
          disabled={uploading}
        />
      </div>
      {error && (
        <div style={{
          color: "#d32f2f",
          background: "#ffeeef",
          padding: 13,
          borderRadius: 9,
          maxWidth: 500,
          margin: "auto auto 12px auto",
          fontWeight: 600
        }}>
          {error}
        </div>
      )}
      {/* Show import result summary */}
      {importResult && (
        <ImportResultDisplay result={importResult} />
      )}
      <div style={{ color: "#666", fontSize: 15, marginTop: 36 }}>
        <p>
          <b>Excel columns expected:</b> <br />
          <code>
            Student Name, Student ID, Subject, Score, Date
          </code>
          <br />
          (See <b>Sample Excel Template</b> for the format)
        </p>
      </div>
    </section>
  );
}

// PUBLIC_INTERFACE
// Show import result, successes and errors mapped cleanly
function ImportResultDisplay({ result }) {
  // Example result JSON contract:
  // {
  //   "success_count": 21,
  //   "failed_count": 3,
  //   "errors": [
  //     {"row": 5, "error": "Missing Student ID"},
  //     {"row": 9, "error": "Invalid date"},
  //     ...etc.
  //   ]
  // }
  return (
    <div
      style={{
        maxWidth: 500,
        margin: "14px auto 0 auto",
        padding: 18,
        borderRadius: 14,
        background: "#f4fff0",
        border: "1.2px solid #b3efcc",
        color: "#335F44",
        boxShadow: "0 1px 6px rgba(60,120,80,.06)"
      }}
    >
      <div style={{ fontSize: 19, fontWeight: 700 }}>
        Import Complete
      </div>
      <div style={{ marginTop: 8, fontSize: 16 }}>
        ✅ Imported rows: <b>{result.success_count}</b><br />
        {result.failed_count > 0 && (
          <>
            ❌ Failed rows: <b style={{ color: "#d32f2f" }}>{result.failed_count}</b>
          </>
        )}
      </div>
      {result.errors && result.errors.length > 0 && (
        <div
          style={{
            marginTop: 13,
            color: "#d32f2f",
            background: "#fff5f5",
            padding: "11px 16px",
            borderRadius: 7
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Import Errors:</div>
          <ul style={{ margin: 0, paddingLeft: 22 }}>
            {result.errors.map((err, idx) => (
              <li key={idx} style={{ marginBottom: 4, fontSize: 15 }}>
                Row {err.row}: {err.error}
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.failed_count === 0 && (
        <div style={{ marginTop: 12, color: "#38863c", fontWeight: 600 }}>
          All rows imported successfully!
        </div>
      )}
    </div>
  );
}

export default BulkImport;
