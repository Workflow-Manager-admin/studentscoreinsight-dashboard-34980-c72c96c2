import React, { useEffect, useState } from "react";
import {
  apiListStudents,
  apiAddStudent,
  apiUpdateStudent,
  apiDeleteStudent,
  apiGetStudent,
} from "../utils/api";

/**
 * PUBLIC_INTERFACE
 * Students CRUD page: list, search, add, edit, delete students with live backend integration.
 * Modern, minimal, responsive, with error/loading UI.
 */
const Students = () => {
  // State
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [modal, setModal] = useState(null); // {mode: 'add'|'edit', student: {}}
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(""); // student_id while deleting

  // Fetch students from backend
  const fetchStudents = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await apiListStudents();
      setStudents(res || []);
    } catch (e) {
      setFetchError(
        e.detail || e.message || "Failed to fetch students. Try again."
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Filtering for search
  const filtered = !search
    ? students
    : students.filter(
        (s) =>
          (s.name || "")
            .toLowerCase()
            .includes(search.trim().toLowerCase()) ||
          (s.student_id || "")
            .toLowerCase()
            .includes(search.trim().toLowerCase())
      );

  // PUBLIC_INTERFACE
  // Show modal for adding or editing
  const openModal = (mode, student) => {
    setModal({ mode, student: student || {} });
    setModalError("");
  };

  // PUBLIC_INTERFACE
  // Submit add/edit
  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setModalLoading(true);
    setModalError("");
    try {
      let body = {
        name: modal.student.name,
        student_id: modal.student.student_id,
      };
      if (!body.name || !body.student_id)
        throw new Error("Both Name and ID are required");
      if (modal.mode === "add") {
        await apiAddStudent(body);
      } else {
        await apiUpdateStudent(modal.student.student_id, body);
      }
      setModal(null);
      fetchStudents();
    } catch (e) {
      setModalError(
        e.detail ||
          e.message ||
          "Failed to save student. Please check your input and try again."
      );
    }
    setModalLoading(false);
  };

  // PUBLIC_INTERFACE
  // Delete student with confirmation
  const handleDelete = async (student_id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this student? This action cannot be undone."
      )
    )
      return;
    setDeleting(student_id);
    try {
      await apiDeleteStudent(student_id);
      fetchStudents();
    } catch (e) {
      alert(
        e.detail || e.message || "Failed to delete student. Try again later."
      );
    }
    setDeleting("");
  };

  // PUBLIC_INTERFACE
  // Preload student details for editing
  const handleEdit = async (student) => {
    // Optionally pull fresh details
    try {
      const detail = await apiGetStudent(student.student_id);
      openModal("edit", detail);
    } catch {
      openModal("edit", student); // fallback
    }
  };

  return (
    <section>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <h1 style={{ color: "#1976d2", marginBottom: 0 }}>Students</h1>
        <button
          style={btnStyle}
          onClick={() => openModal("add")}
          tabIndex={0}
          aria-label="Add student"
        >
          ➕ Add Student
        </button>
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          type="search"
          placeholder="Search name or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: 9,
            borderRadius: 7,
            border: "1.2px solid #d8dde8",
            fontSize: 16,
            minWidth: 180,
            maxWidth: 280,
          }}
          aria-label="Search students"
        />
        <button
          style={{
            ...btnStyle,
            background: "#E0E7FD",
            color: "#1976d2",
          }}
          onClick={fetchStudents}
          aria-label="Reload students"
        >
          ↻ Reload
        </button>
      </div>
      {loading ? (
        <div style={{ marginTop: 22, fontSize: 17 }}>Loading students…</div>
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
        <StudentTable
          students={filtered}
          onEdit={handleEdit}
          onDelete={handleDelete}
          deleting={deleting}
        />
      )}

      {modal && (
        <StudentModal
          mode={modal.mode}
          student={modal.student}
          onClose={() => setModal(null)}
          onChange={(s) => setModal((m) => ({ ...m, student: s }))}
          onSubmit={handleSubmit}
          loading={modalLoading}
          error={modalError}
        />
      )}

      {filtered.length === 0 && !loading && !fetchError ? (
        <div style={{ marginTop: 42, color: "#555", fontStyle: "italic" }}>
          No students found. Try another search or add a new student.
        </div>
      ) : null}
    </section>
  );
};

// Button Style
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
// Table of students with edit/delete
function StudentTable({ students, onEdit, onDelete, deleting }) {
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
            <th style={cellThStyle}>Name</th>
            <th style={cellThStyle}>Student ID</th>
            <th style={cellThStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan={4} style={cellTdStyle}>
                No students.
              </td>
            </tr>
          ) : (
            students.map((s, i) => (
              <tr key={s.student_id || i}>
                <td style={cellTdStyle}>{i + 1}</td>
                <td style={cellTdStyle}>{s.name}</td>
                <td style={cellTdStyle}>{s.student_id}</td>
                <td style={cellTdStyle}>
                  <button
                    style={{
                      ...btnStyle,
                      fontSize: 13,
                      padding: "6px 16px",
                      marginRight: 6,
                      background: "#1976d2",
                    }}
                    onClick={() => onEdit(s)}
                    aria-label={`Edit student ${s.name}`}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    style={{
                      ...btnStyle,
                      fontSize: 13,
                      padding: "6px 14px",
                      background: "#d32f2f",
                      opacity: deleting === s.student_id ? 0.6 : 1,
                    }}
                    onClick={() => onDelete(s.student_id)}
                    disabled={deleting === s.student_id}
                    aria-label={`Delete student ${s.name}`}
                  >
                    {deleting === s.student_id ? "…" : "🗑 Delete"}
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
  fontSize: 16,
};
const cellTdStyle = {
  padding: "13px 12px",
  borderBottom: "1px solid #F0F0F2",
  fontSize: 15,
};

// PUBLIC_INTERFACE
// Modal dialog for add/edit
function StudentModal({
  mode,
  student,
  onClose,
  onChange,
  onSubmit,
  loading,
  error,
}) {
  return (
    <div
      style={{
        position: "fixed",
        zIndex: 10000,
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.17)",
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
          minWidth: 300,
          maxWidth: 350,
          display: "flex",
          flexDirection: "column",
          gap: 17,
        }}
      >
        <div style={{ fontSize: 23, fontWeight: 800, color: "#1976d2" }}>
          {mode === "add" ? "Add New Student" : "Edit Student"}
        </div>
        <label style={{ fontWeight: 600, marginBottom: -8 }}>
          Name
          <input
            type="text"
            value={student.name || ""}
            onChange={(e) => onChange({ ...student, name: e.target.value })}
            style={modalInputStyle}
            autoFocus
            required
          />
        </label>
        <label style={{ fontWeight: 600, marginBottom: -8 }}>
          Student ID
          <input
            type="text"
            value={student.student_id || ""}
            onChange={(e) => onChange({ ...student, student_id: e.target.value })}
            style={modalInputStyle}
            disabled={mode === "edit"}
            required
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
            {loading ? "..." : mode === "add" ? "Add Student" : "Save Changes"}
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

export default Students;
