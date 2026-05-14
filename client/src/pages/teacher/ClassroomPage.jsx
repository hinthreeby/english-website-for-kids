import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import api from "../../lib/api";
import Navbar from "../../components/Navbar";
import StarBackground from "../../components/StarBackground";

const GAME_LABELS = {
  "abc-letters": "ABC Letters",
  "picture-words": "Picture Words",
  "count-learn": "Count Learn",
  "color-fun": "Color Fun",
  "animal-sounds": "Animal Sounds",
  "match-it": "Match It",
  "space-pronounce": "Space Pronounce",
  "funny-animals": "Funny Animals",
  "clean-ocean-hero": "Ocean Hero",
};

const CHART_COLORS = ["#7c3aed", "#06b6d4", "#f59e0b", "#10b981", "#f43f5e", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];
const PIE_COLORS = ["#7c3aed", "rgba(255,255,255,0.18)"];

function SectionCard({ title, children, loading }) {
  return (
    <section className="glass-card" style={{ marginBottom: "1.5rem" }}>
      <h2 style={{ marginBottom: "1rem" }}>{title}</h2>
      {loading ? <p>Loading...</p> : children}
    </section>
  );
}

function ClassAvgScoresChart({ classId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/api/classes/${classId}/average-scores`)
      .then((res) => setData(res.data.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [classId]);

  const chartData = data.map((d) => ({ ...d, name: GAME_LABELS[d.gameId] || d.gameId }));

  return (
    <SectionCard title="📊 Class Average Stars by Game" loading={loading}>
      {chartData.length === 0 ? (
        <p>No game data for this class yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
            <XAxis dataKey="name" tick={{ fill: "#e2e8f0", fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
            <YAxis domain={[0, 3]} tick={{ fill: "#e2e8f0", fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: "#1e1b4b", border: "none", borderRadius: 8, color: "#e2e8f0" }}
              formatter={(v, key) => [key === "avgStars" ? `${v} ⭐` : v, key === "avgStars" ? "Avg Stars" : "Total Plays"]}
            />
            <Bar dataKey="avgStars" name="avgStars" radius={[4, 4, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </SectionCard>
  );
}

function CompletionPie({ classId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/api/classes/${classId}/completion-summary`)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [classId]);

  if (loading) return <SectionCard title="✅ Assignment Completion" loading />;
  if (!data) return null;

  const pieData = [
    { name: "Completed", value: data.completed },
    { name: "Pending", value: data.pending },
  ];

  return (
    <SectionCard title="✅ Assignment Completion" loading={false}>
      <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
        <ResponsiveContainer width={200} height={200}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div>
          <p style={{ fontSize: "3rem", fontWeight: 700, color: "#7c3aed", lineHeight: 1 }}>{data.rate}%</p>
          <p style={{ color: "#e2e8f0", marginTop: "0.25rem" }}>
            {data.completed} / {data.totalPossible} student-game pairs
          </p>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.25rem" }}>
            {data.pending} combinations still pending
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

function ProgressHistoryChart({ classId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/api/classes/${classId}/progress-history`, { params: { weeks: 8 } })
      .then((res) => setData(res.data.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [classId]);

  return (
    <SectionCard title="📈 Class Progress Over Time" loading={loading}>
      {data.length === 0 ? (
        <p>No weekly data yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
            <XAxis dataKey="label" tick={{ fill: "#e2e8f0", fontSize: 12 }} />
            <YAxis domain={[0, 3]} tick={{ fill: "#e2e8f0", fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: "#1e1b4b", border: "none", borderRadius: 8, color: "#e2e8f0" }}
              formatter={(v, key) => [key === "avgStars" ? `${v} ⭐ avg` : v, key === "avgStars" ? "Avg Stars" : "Total Plays"]}
            />
            <Legend formatter={(v) => (v === "avgStars" ? "Avg Stars" : v)} wrapperStyle={{ color: "#e2e8f0" }} />
            <Line type="monotone" dataKey="avgStars" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 4, fill: "#06b6d4" }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </SectionCard>
  );
}

const SORT_OPTIONS = [
  { value: "stars", label: "Total Stars" },
  { value: "streak", label: "Streak" },
  { value: "completion", label: "Completion %" },
  { value: "name", label: "Name" },
];

function StudentsTable({ classId }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("stars");
  const [order, setOrder] = useState("desc");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    setLoading(true);
    api
      .get(`/api/classes/${classId}/students-analytics`, { params: { sort, order, filter, page, limit } })
      .then((res) => {
        setRows(res.data.data || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [classId, sort, order, filter, page]);

  const totalPages = Math.ceil(total / limit);

  function handleSort(col) {
    if (sort === col) setOrder((o) => (o === "desc" ? "asc" : "desc"));
    else { setSort(col); setOrder("desc"); }
    setPage(1);
  }

  const arrow = (col) => sort === col ? (order === "desc" ? " ▼" : " ▲") : "";

  return (
    <SectionCard title="👦 Student Analytics" loading={false}>
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <input
          placeholder="Filter by name..."
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 8,
            padding: "0.4rem 0.75rem",
            color: "#e2e8f0",
            minWidth: 180,
          }}
        />
        <span style={{ color: "#94a3b8", fontSize: 13 }}>Sort:</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={sort === opt.value ? "btn-register" : "btn-secondary-glass"}
            style={{ padding: "0.3rem 0.7rem", fontSize: 12 }}
            onClick={() => handleSort(opt.value)}
          >
            {opt.label}{arrow(opt.value)}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : rows.length === 0 ? (
        <p>No students found.</p>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.2)", color: "#94a3b8" }}>
                  <th style={{ textAlign: "left", padding: "0.5rem 0.75rem" }}>Name</th>
                  <th style={{ textAlign: "right", padding: "0.5rem 0.75rem", cursor: "pointer" }} onClick={() => handleSort("stars")}>Stars{arrow("stars")}</th>
                  <th style={{ textAlign: "right", padding: "0.5rem 0.75rem", cursor: "pointer" }} onClick={() => handleSort("completion")}>Completion{arrow("completion")}</th>
                  <th style={{ textAlign: "right", padding: "0.5rem 0.75rem", cursor: "pointer" }} onClick={() => handleSort("streak")}>Streak{arrow("streak")}</th>
                  <th style={{ textAlign: "right", padding: "0.5rem 0.75rem" }}>Last Played</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s, i) => (
                  <tr
                    key={s._id}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                      background: i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent",
                    }}
                  >
                    <td style={{ padding: "0.6rem 0.75rem", color: "#e2e8f0" }}>
                      <strong>{s.name}</strong>
                      <span style={{ color: "#94a3b8", marginLeft: "0.5rem", fontSize: 12 }}>@{s.username}</span>
                    </td>
                    <td style={{ textAlign: "right", padding: "0.6rem 0.75rem", color: "#f59e0b" }}>⭐ {s.totalStars}</td>
                    <td style={{ textAlign: "right", padding: "0.6rem 0.75rem" }}>
                      <span
                        style={{
                          background: s.completionRate >= 70 ? "#10b981" : s.completionRate >= 40 ? "#f59e0b" : "#f43f5e",
                          color: "#fff",
                          borderRadius: 12,
                          padding: "0.2rem 0.55rem",
                          fontSize: 12,
                        }}
                      >
                        {s.completionRate}%
                      </span>
                    </td>
                    <td style={{ textAlign: "right", padding: "0.6rem 0.75rem", color: "#e2e8f0" }}>🔥 {s.currentStreak}d</td>
                    <td style={{ textAlign: "right", padding: "0.6rem 0.75rem", color: "#94a3b8", fontSize: 12 }}>
                      {s.lastPlayedDate ? new Date(s.lastPlayedDate).toLocaleDateString() : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1rem" }}>
              <button
                className="btn-secondary-glass"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                style={{ padding: "0.3rem 0.75rem" }}
              >
                ← Prev
              </button>
              <span style={{ color: "#94a3b8", alignSelf: "center", fontSize: 13 }}>
                {page} / {totalPages}
              </span>
              <button
                className="btn-secondary-glass"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                style={{ padding: "0.3rem 0.75rem" }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </SectionCard>
  );
}

const ClassroomPage = () => {
  const { id } = useParams();
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/api/teacher/classroom/${id}/students`)
      .then((res) => setStudents(res.data.students || []))
      .catch((err) => setError(err?.response?.data?.error || "Failed to load students"));
  }, [id]);

  return (
    <div className="screen with-bg role-page">
      <StarBackground />
      <Navbar />
      <main className="role-wrap">
        <section className="role-hero glass-card">
          <h1>Classroom Analytics</h1>
          <p>
            {students.length} student{students.length !== 1 ? "s" : ""} enrolled &nbsp;•&nbsp; Track stars, streaks, and overall progress.
          </p>
        </section>

        {error ? <p className="error-msg">{error}</p> : null}

        <StudentsTable classId={id} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <ClassAvgScoresChart classId={id} />
          <CompletionPie classId={id} />
        </div>

        <ProgressHistoryChart classId={id} />
      </main>
    </div>
  );
};

export default ClassroomPage;
