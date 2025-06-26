import React, { useState, useEffect } from "react";
import {
  apiGetSummary,
  apiListScores,
  apiGetSubjectTrends,
  apiGetSubjectDistribution,
} from "../utils/api";

/**
 * PUBLIC_INTERFACE
 * Analytics page: shows subject-level trends, score distribution, and overall summary using simple charts, modern minimal UI.
 */
const Analytics = () => {
  const [summary, setSummary] = useState(null);
  const [scores, setScores] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subject, setSubject] = useState("");
  const [trends, setTrends] = useState(null);
  const [dist, setDist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [loadingDist, setLoadingDist] = useState(false);

  // Initial load (get summary, scores to identify all subjects)
  useEffect(() => {
    setLoading(true);
    Promise.all([apiGetSummary(), apiListScores()])
      .then(([sum, sc]) => {
        setSummary(sum || {});
        setScores(sc || []);
        const subjSet = new Set((sc || []).map((s) => s.subject));
        setSubjects(Array.from(subjSet));
        setSubject(Array.from(subjSet)[0] || "");
      })
      .catch((e) =>
        setErr(
          e.detail ||
            e.message ||
            "Failed to fetch analytics. Check backend connectivity."
        )
      )
      .finally(() => setLoading(false));
  }, []);

  // Fetch trends when subject changes
  useEffect(() => {
    if (!subject) return;
    setLoadingTrends(true);
    setLoadingDist(true);
    apiGetSubjectTrends(subject)
      .then((tr) => setTrends(tr))
      .catch(() => setTrends(null))
      .finally(() => setLoadingTrends(false));
    apiGetSubjectDistribution(subject)
      .then((d) => setDist(d))
      .catch(() => setDist(null))
      .finally(() => setLoadingDist(false));
  }, [subject]);

  return (
    <section>
      <h1 style={{ color: "#1976d2", marginBottom: 6 }}>Analytics</h1>
      {loading ? (
        <div>Loading analytics…</div>
      ) : err ? (
        <div
          style={{
            color: "#D32F2F",
            background: "#ffeeef",
            padding: "1em",
            borderRadius: 7,
            fontWeight: 600,
            marginBottom: 14,
          }}
        >
          {err}
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              gap: "2.5rem",
              flexWrap: "wrap",
              marginBottom: 22,
            }}
          >
            <StatCard label="Total Students" value={summary.total_students} />
            <StatCard label="Total Scores" value={summary.total_scores} />
            <StatCard label="Average Score" value={summary.avg_score_overall} decimal />
            <StatCard label="Top Subject" value={summary.top_subject || "-"} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 600, fontSize: 17, marginRight: 13 }}>
              Subject:
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{
                padding: "7px 13px",
                borderRadius: 6,
                border: "1.1px solid #b9c3db",
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 38 }}>
            <div style={{ minWidth: 360, flex: "2" }}>
              <h3 style={{ margin: "7px 0 8px 0" }}>Trend Over Time</h3>
              {loadingTrends ? (
                <div>Loading trends…</div>
              ) : trends && trends.data && trends.data.length > 0 ? (
                <LineChart
                  data={trends.data}
                  xKey="date"
                  yKey="avg_score"
                  color="#1976d2"
                  width={390}
                  height={170}
                  label="Avg. Score"
                />
              ) : (
                <div style={{ color: "#888" }}>No trend data.</div>
              )}
            </div>
            <div style={{ minWidth: 320, flex: "1" }}>
              <h3 style={{ margin: "7px 0 8px 0" }}>Score Distribution</h3>
              {loadingDist ? (
                <div>Loading distribution…</div>
              ) : dist && dist.data && dist.data.length > 0 ? (
                <BarChart
                  data={dist.data}
                  xKey="score_range"
                  yKey="count"
                  color="#ffca28"
                  width={280}
                  height={140}
                  label="Count"
                />
              ) : (
                <div style={{ color: "#888" }}>No distribution data.</div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
};

function StatCard({ label, value, decimal }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 15,
        padding: "1.15rem 2rem",
        minWidth: 170,
        boxShadow: "0 2px 8px rgba(60,60,80,.08)",
        color: "#424242",
        fontWeight: 600,
      }}
    >
      <div style={{ fontSize: 17, marginBottom: 4, color: "#888" }}>{label}</div>
      <div style={{ fontSize: decimal ? 25 : 22, color: "#1976d2" }}>
        {decimal ? value?.toFixed?.(2) : value}
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
// Minimal SVG Line Chart
function LineChart({ data, xKey, yKey, color, width, height, label }) {
  // Find bounds
  const pad = 26;
  if (data.length < 2) return <div style={{ color: "#888" }}>Not enough data.</div>;
  let minY = Math.min(...data.map((d) => d[yKey]));
  let maxY = Math.max(...data.map((d) => d[yKey]));
  const rangeY = maxY - minY || 1;
  const stepX = (width - 2 * pad) / (data.length - 1);

  function getY(v) {
    return height - pad - ((v - minY) / rangeY) * (height - 2 * pad);
  }
  return (
    <svg width={width} height={height} style={{ background: "#F8FBFF", borderRadius: 10 }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="3"
        points={data.map((d, i) => `${pad + i * stepX},${getY(d[yKey])}`).join(" ")}
      />
      {/* Circles */}
      {data.map((d, i) => (
        <circle
          key={i}
          cx={pad + i * stepX}
          cy={getY(d[yKey])}
          r={3.5}
          fill={color}
        />
      ))}
      {/* X axis labels */}
      {data.map((d, i) => (
        <text
          key={i}
          x={pad + i * stepX}
          y={height - 7}
          fontSize={12}
          textAnchor="middle"
          fill="#888"
        >
          {(d[xKey] || "").substr(5)}
        </text>
      ))}
      {/* Y axis min/max */}
      <text x="8" y={getY(maxY) + 3} fontSize={12} fill="#444">
        {maxY}
      </text>
      <text x="8" y={getY(minY) + 3} fontSize={12} fill="#888">
        {minY}
      </text>
      <text
        x={width / 2}
        y={pad / 2 + 4}
        fontSize={13}
        fill="#1976d2"
        textAnchor="middle"
        fontWeight={700}
      >
        {label}
      </text>
    </svg>
  );
}

// PUBLIC_INTERFACE
// Minimal SVG Bar Chart
function BarChart({ data, xKey, yKey, color, width, height, label }) {
  const pad = 23,
    bw = 25;
  let maxY = Math.max(...data.map((d) => d[yKey])) || 1;
  let N = data.length;
  function getY(v) {
    return height - pad - (v / maxY) * (height - 2 * pad);
  }
  return (
    <svg width={width} height={height} style={{ background: "#FFFBF3", borderRadius: 10 }}>
      {data.map((d, i) => (
        <rect
          key={i}
          x={pad + i * (bw + 11)}
          y={getY(d[yKey])}
          width={bw}
          height={height - pad - getY(d[yKey])}
          fill={color}
          rx={3}
        />
      ))}
      {data.map((d, i) => (
        <text
          key={i}
          x={pad + i * (bw + 11) + bw / 2}
          y={height - 6}
          fontSize={12}
          textAnchor="middle"
          fill="#888"
        >
          {d[xKey]}
        </text>
      ))}
      {data.map((d, i) =>
        d[yKey] === 0 ? null : (
          <text
            key={i}
            x={pad + i * (bw + 11) + bw / 2}
            y={getY(d[yKey]) - 6}
            fontSize={13}
            textAnchor="middle"
            fill="#1976d2"
            fontWeight={700}
          >
            {d[yKey]}
          </text>
        )
      )}
      {/* Y axis */}
      <text x="8" y={getY(maxY) + 3} fontSize={12} fill="#444">
        {maxY}
      </text>
      <text x="8" y={height - pad + 3} fontSize={12} fill="#888">
        0
      </text>
      <text
        x={width / 2}
        y={pad / 2 + 4}
        fontSize={13}
        fill="#ffac28"
        textAnchor="middle"
        fontWeight={700}
      >
        {label}
      </text>
    </svg>
  );
}

export default Analytics;
