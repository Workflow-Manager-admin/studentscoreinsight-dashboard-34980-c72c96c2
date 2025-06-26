import React, { useEffect, useState } from "react";
import {
  apiListScores,
  apiAddScore,
  apiUpdateScore,
  apiDeleteScore,
  apiListStudents,
} from "../utils/api";

/**
 * PUBLIC_INTERFACE
 * Scores CRUD page: list, add, edit, and delete scores with live backend integration.
 * Interactive, reactive, and modern with error/loading states.
 */
const Scores = () => {
  const [scores, setScores] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [modal, setModal] = useState(null); // {mode: 'add' | 'edit', score: {}}
  const [modalError, setModalError] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [deleting, setDeleting] = useState("");
  const [search, setSearch] = useState("");

  // Load all scores and students
  const fetchData = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const [scoresRes, studentsRes] = await Promise.all([
        apiListScores(),
        apiListStudents(),
      ]);
      setScores(scoresRes || []);
      setStudents(studentsRes || []);
    } catch (e) {
      setFetchError(
        e.detail || e.message || "Failed to fetch data. Try again."
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // PUBLIC_INTERFACE
  const openModal = (mode, score) => {
    setModal({ mode, score: score || {} });
    setModalError("");
  };

  // PUBLIC_INTERFACE
  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setModalLoading(true);
    setModalError("");
    let s = modal.score;
    try {
      // Validation
      if (!s.student_id || !s.subject || !s.score) throw new Error("Missing fields");
      if (modal.mode === "add") {
        await apiAddScore({
          student_id: s.student_id,
          subject: s.subject,
          score: Number(s.score),
          date: s.date,
        });
      } else {
        await apiUpdateScore(s.id, {
          subject: s.subject,
          score: Number(s.score),
          date: s.date,
        });
      }
      setModal(null);
      fetchData();
    } catch (e) {
      setModalError(e.detail || e.message || "Failed to save score.");
    }
    setModalLoading(false);
  };

  // PUBLIC_INTERFACE
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this score?")) return;
    setDeleting(id);
    try {
      await apiDeleteScore(id);
      fetchData();
    } catch (e) {
      alert(e.detail || e.message || "Failed to delete score.");
    }
    setDeleting("");
  };

  // Filtering
  const filtered =
    !search?.trim()
      ? scores
      : scores.filter(
          (s) =>
            (students.find((st) => st.student_id === s.student_id)?.name || "")
              .toLowerCase()
              .includes(search.trim().toLowerCase()) ||
            (s.subject || "")
              .toLowerCase()
              .includes(search.trim().toLowerCase())
        );

  return (
    <section>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <h1 style={{ color: "#1976d2", marginBottom: 0 }}>Scores</h1>
        <button style={btnStyle} onClick={() => openModal("add")}>
          ➕ Add Score
        </button>
      </div>
      <div style={{ margin: "16px 0", display: "flex", gap: 12, flexWrap: "wrap" }}>
        <input
          type="search"
          placeholder="Search by student or subject…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: 9,
            borderRadius: 7,
            border: "1.2px solid #d8dde8",
            fontSize: 16,
            minWidth: 180,
            maxWidth: 280,
          }}
        />
        <button
          style={{
            ...btnStyle,
            background: "#E0E7FD",
            color: "#1976d2",
          }}
          onClick={fetchData}
        >
          ↻ Reload
        </button>
      </div>
      {loading ? (
        <div style={{ marginTop: 22, fontSize: 17 }}>Loading scores…</div>
      ) : fetchError ? (
        <div
          style={{
            color: "#D32F2F",
            background: "#ffeeef",
            padding: "1em",
            borderRadius: 7,
            fontWeight: 600,
          }}
        >
          {fetchError}
        </div>
      ) : (
        <ScoresTable
          scores={filtered}
          students={students}
          onEdit={(score) => openModal("edit", score)}
          onDelete={handleDelete}
          deleting={deleting}
        />
      )}

      {modal && (
        <ScoresModal
          mode={modal.mode}
          score={modal.score}
          students={students}
          onClose={() => setModal(null)}
          onChange={(score) =>
            setModal((m) => ({ ...m, score }))
          }
          onSubmit={handleSubmit}
          loading={modalLoading}
          error={modalError}
        />
      )}

      {filtered.length === 0 && !loading && !fetchError ? (
        <div style={{ marginTop: 42, color: "#555", fontStyle: "italic" }}>
          No scores found.
        </div>
      ) : null}
    </section>
  );
};

const btnStyle = {
  background: "#1976d2",
  color: "white",
  fontWeight: 700,
  fontSize: 15,
  border: "none",
  borderRadius: 7,
  padding: "10px 20px",
  boxShadow: "0 2px 6px rgba(30,40,60,0.07)",
  cursor: "pointer",
  transition: "background 0.13s",
};

// PUBLIC_INTERFACE
function ScoresTable({ scores, students, onEdit, onDelete, deleting }) {
  // Get useful student name from id
  function studentName(id) {
    return students.find((s) => s.student_id === id)?.name || "-";
  }
  return (
    <div
      style={{
        overflowX: "auto",
        background: "#fff",
        borderRadius: 14,
        boxShadow: "0 2px 8px rgba(60,60,80,.07)",
        marginBottom: 17,
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#F3FAFF" }}>
            <th style={cellThStyle}>#</th>
            <th style={cellThStyle}>Student</th>
            <th style={cellThStyle}>Subject</th>
            <th style={cellThStyle}>Score</th>
            <th style={cellThStyle}>Date</th>
            <th style={cellThStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {scores.length === 0 ? (
            <tr>
              <td colSpan={6} style={cellTdStyle}>
                No scores.
              </td>
            </tr>
          ) : (
            scores.map((s, i) => (
              <tr key={s.id || i}>
                <td style={cellTdStyle}>{i + 1}</td>
                <td style={cellTdStyle}>{studentName(s.student_id)}</td>
                <td style={cellTdStyle}>{s.subject}</td>
                <td style={cellTdStyle}>{s.score}</td>
                <td style={cellTdStyle}>{s.date || "-"}</td>
                <td style={cellTdStyle}>
                  <button
                    style={{
                      ...btnStyle,
                      fontSize: 13,
                      padding: "6px 16px",
                      background: "#1976d2",
                      marginRight: 6,
                    }}
                    onClick={() => onEdit(s)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    style={{
                      ...btnStyle,
                      fontSize: 13,
                      padding: "6px 14px",
                      background: "#d32f2f",
                      opacity: deleting === s.id ? 0.6 : 1,
                    }}
                    onClick={() => onDelete(s.id)}
                    disabled={deleting === s.id}
                  >
                    {deleting === s.id ? "…" : "🗑 Delete"}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const cellThStyle = {
  padding: "12px 12px",
  borderBottom: "2px solid #E2EAF6",
  textAlign: "left",
  color: "#1976d2",
  fontWeight: 800,
  fontSize: 15.5,
};
const cellTdStyle = {
  padding: "13px 12px",
  borderBottom: "1px solid #F0F0F2",
  fontSize: 15,
};

// PUBLIC_INTERFACE
function ScoresModal({
  mode,
  score,
  students,
  onClose,
  onChange,
  onSubmit,
  loading,
  error,
}) {
  // Build a sorted student options list
  const studentOpts = [...students]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((s) => ({ label: s.name, value: s.student_id }));

  return (
    <div
      style={{
        position: "fixed",
        zIndex: 10000,
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.16)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={onSubmit}
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 14px rgba(60,70,90,.18)",
          padding: "36px 28px 26px 28px",
          minWidth: 310,
          maxWidth: 350,
          display: "flex",
          flexDirection: "column",
          gap: 17,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 800, color: "#1976d2" }}>
          {mode === "add" ? "Add Score" : "Edit Score"}
        </div>
        <label style={{ fontWeight: 600, marginBottom: -8 }}>
          Student
          <select
            value={score.student_id || ""}
            onChange={(e) =>
              onChange({ ...score, student_id: e.target.value })
            }
            style={modalInputStyle}
            disabled={mode === "edit"}
            required
          >
            <option value="">-- Select --</option>
            {studentOpts.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ fontWeight: 600, marginBottom: -8 }}>
          Subject
          <input
            type="text"
            value={score.subject || ""}
            onChange={(e) => onChange({ ...score, subject: e.target.value })}
            style={modalInputStyle}
            required
          />
        </label>
        <label style={{ fontWeight: 600, marginBottom: -8 }}>
          Score
          <input
            type="number"
            min="0"
            max="100"
            step="any"
            value={score.score || ""}
            onChange={(e) =>
              onChange({
                ...score,
                score: e.target.value,
              })
            }
            style={modalInputStyle}
            required
          />
        </label>
        <label style={{ fontWeight: 600, marginBottom: -8 }}>
          Date
          <input
            type="date"
            value={score.date || ""}
            onChange={(e) => onChange({ ...score, date: e.target.value })}
            style={modalInputStyle}
          />
        </label>
        {error && (
          <div
            style={{
              color: "#d32f2f",
              background: "#ffe7e7",
              padding: "8px 10px",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 15,
              marginBottom: 2,
            }}
          >
            {error}
          </div>
        )}
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              ...btnStyle,
              background: "#888",
              fontWeight: 700,
              padding: "10px 17px",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              ...btnStyle,
              opacity: loading ? 0.7 : 1,
              fontWeight: 700,
              padding: "10px 18px",
            }}
          >
            {loading ? "..." : mode === "add" ? "Add Score" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

const modalInputStyle = {
  padding: "11px 10px",
  marginTop: 5,
  marginBottom: 1,
  borderRadius: 7,
  border: "1.2px solid #d1dce6",
  fontSize: 16,
  width: "100%",
  fontWeight: 500,
  boxSizing: "border-box",
};

export default Scores;
