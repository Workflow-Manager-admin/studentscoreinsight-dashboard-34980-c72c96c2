import React, { useEffect, useState } from "react";
import { apiListStudents, apiGetStudentPerformance } from "../utils/api";

/**
 * PUBLIC_INTERFACE
 * Performance page: allows selecting a student and visualizes their performance over time and by subject with backend data.
 */
const Performance = () => {
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [studentsLoading, setStudentsLoading] = useState(true);

  useEffect(() => {
    setStudentsLoading(true);
    apiListStudents()
      .then((s) => {
        setStudents(s || []);
        setStudentId((s && s[0] && s[0].student_id) || "");
      })
      .catch(() => setStudents([]))
      .finally(() => setStudentsLoading(false));
  }, []);

  useEffect(() => {
    if (!studentId) {
      setData(null);
      return;
    }
    setLoading(true);
    setErr("");
    apiGetStudentPerformance(studentId)
      .then((d) => setData(d))
      .catch((e) =>
        setErr(
          e?.detail ||
            e?.message ||
            "Failed to load performance data for this student."
        )
      )
      .finally(() => setLoading(false));
  }, [studentId]);

  return (
    <section>
      <h1 style={{ color: "#1976d2", marginBottom: 7 }}>Performance</h1>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 600, fontSize: 17, marginRight: 13 }}>
          Student:
        </label>
        {studentsLoading ? (
          <span>Loading students…</span>
        ) : (
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            style={{
              padding: "7px 13px",
              borderRadius: 6,
              border: "1.1px solid #b9c3db",
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            {students.map((s) => (
              <option key={s.student_id} value={s.student_id}>
                {s.name} ({s.student_id})
              </option>
            ))}
          </select>
        )}
      </div>
      {loading ? (
        <div>Loading performance…</div>
      ) : err ? (
        <div
          style={{
            color: "#D32F2F",
            background: "#ffeeef",
            padding: "1em",
            borderRadius: 7,
            fontWeight: 600,
          }}
        >
          {err}
        </div>
      ) : !data ? (
        <div style={{ color: "#888" }}>No data for this student.</div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 38 }}>
          {/* Over Time */}
          <div style={{ minWidth: 370, flex: 2 }}>
            <h3 style={{ margin: "7px 0 8px 0" }}>Trend Over Time</h3>
            {data.trend && data.trend.length > 0 ? (
              <LineChart
                data={data.trend}
                xKey="date"
                yKey="score"
                color="#1976d2"
                width={390}
                height={170}
                label="Score"
              />
            ) : (
              <div style={{ color: "#888" }}>No trend data.</div>
            )}
          </div>
          {/* By Subject */}
          <div style={{ minWidth: 260, flex: 1 }}>
            <h3 style={{ margin: "7px 0 8px 0" }}>Subject Breakdown</h3>
            {data.subjects && data.subjects.length > 0 ? (
              <BarChart
                data={data.subjects}
                xKey="subject"
                yKey="avg_score"
                color="#ffca28"
                width={210}
                height={120}
                label="Avg. Score"
              />
            ) : (
              <div style={{ color: "#888" }}>No subject data.</div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

// Inline SVG LineChart and BarChart - same as Analytics for consistency
function LineChart({ data, xKey, yKey, color, width, height, label }) {
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
      {data.map((d, i) => (
        <circle key={i} cx={pad + i * stepX} cy={getY(d[yKey])} r={3.5} fill={color} />
      ))}
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

export default Performance;
