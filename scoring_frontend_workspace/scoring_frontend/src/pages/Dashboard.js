import React, { useEffect, useState } from "react";
import { apiGetSummary } from "../utils/api";

/**
 * PUBLIC_INTERFACE
 * Dashboard summary page showing high-level analytics and health.
 */
const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState();

  useEffect(() => {
    apiGetSummary()
      .then(setSummary)
      .catch(setErr)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (err) return <div style={{ color: "#D32F2F" }}>Failed to load summary.</div>;

  return (
    <section>
      <h1 style={{ marginBottom: 16, color: "#1976d2" }}>Dashboard Analytics</h1>
      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", marginBottom: 34 }}>
        <StatCard label="Total Students" value={summary.total_students} />
        <StatCard label="Total Scores" value={summary.total_scores} />
        <StatCard label="Average Score" value={summary.avg_score_overall} decimal />
        <StatCard label="Top Student" value={summary.top_student || "-"} />
        <StatCard label="Top Subject" value={summary.top_subject || "-"} />
      </div>
      <HealthCheck />
    </section>
  );
};

/**
 * Inline Stat Card
 */
function StatCard({ label, value, decimal }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 15,
      padding: "1.45rem 2rem",
      minWidth: 180,
      boxShadow: "0 2px 8px rgba(60,60,80,.08)",
      color: "#424242",
      fontWeight: 600
    }}>
      <div style={{ fontSize: 18, marginBottom: 8, color: "#888" }}>{label}</div>
      <div style={{ fontSize: decimal ? 28 : 26, color: "#1976d2" }}>
        {decimal ? value?.toFixed?.(2) : value}
      </div>
    </div>
  );
}

/**
 * Basic DB/App health probe.
 */
function HealthCheck() {
  const [status, setStatus] = useState(null);
  useEffect(() => {
    fetch("/health").then(r => r.json().then(setStatus));
  }, []);
  if (!status) return null;
  return (
    <div style={{
      marginTop: 30, padding: 12, fontWeight: 600,
      background: status.status === "ok" ? "#e0ffe3" : "#ffe0e0",
      borderRadius: 8, color: status.status === "ok" ? "#497C40" : "#D32F2F"
    }}>
      {status.status === "ok"
        ? "Database healthy and reachable ✅"
        : "App/DB health issue: " + (status.detail || "Unreachable")
      }
    </div>
  );
}

export default Dashboard;
