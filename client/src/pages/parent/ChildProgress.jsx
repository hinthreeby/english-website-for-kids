import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import api from "../../lib/api";
import Navbar from "../../components/Navbar";

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

function SectionCard({ title, children, loading }) {
  return (
    <section className="glass-card" style={{ marginBottom: "1.5rem" }}>
      <h2 style={{ marginBottom: "1rem" }}>{title}</h2>
      {loading ? <p>Loading...</p> : children}
    </section>
  );
}

function ScoreHistoryChart({ childId }) {
  const [data, setData] = useState([]);
  const [period, setPeriod] = useState("weekly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/children/${childId}/score-history`, { params: { period, limit: 12 } })
      .then((res) => setData(res.data.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [childId, period]);

  return (
    <SectionCard title="⭐ Stars Over Time" loading={loading}>
      <div style={{ marginBottom: "0.75rem", display: "flex", gap: "0.5rem" }}>
        <button
          className={period === "weekly" ? "btn-register" : "btn-secondary-glass"}
          onClick={() => setPeriod("weekly")}
        >
          Weekly
        </button>
        <button
          className={period === "monthly" ? "btn-register" : "btn-secondary-glass"}
          onClick={() => setPeriod("monthly")}
        >
          Monthly
        </button>
      </div>
      {data.length === 0 ? (
        <p>No data yet. Play some games to see progress!</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
            <XAxis dataKey="label" tick={{ fill: "#e2e8f0", fontSize: 12 }} />
            <YAxis tick={{ fill: "#e2e8f0", fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "#1e1b4b", border: "none", borderRadius: 8, color: "#e2e8f0" }}
              formatter={(v) => [`${v} ⭐`, "Stars"]}
            />
            <Line type="monotone" dataKey="stars" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: "#f59e0b" }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </SectionCard>
  );
}

function ScoresByGameChart({ childId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/children/${childId}/scores-by-game-type`)
      .then((res) => setData(res.data.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [childId]);

  const chartData = data.map((d) => ({ ...d, name: GAME_LABELS[d.gameId] || d.gameId }));

  return (
    <SectionCard title="🎮 Stars by Game Type" loading={loading}>
      {chartData.length === 0 ? (
        <p>No game data yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
            <XAxis dataKey="name" tick={{ fill: "#e2e8f0", fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
            <YAxis domain={[0, 3]} tick={{ fill: "#e2e8f0", fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: "#1e1b4b", border: "none", borderRadius: 8, color: "#e2e8f0" }}
              formatter={(v, name) => [name === "avgStars" ? `${v} ⭐ avg` : v, name === "avgStars" ? "Avg Stars" : "Plays"]}
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

function CompletionRing({ childId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/children/${childId}/completion-rate`)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [childId]);

  if (loading) return <SectionCard title="🏆 Game Completion" loading />;
  if (!data) return null;

  const pieData = [
    { name: "Completed", value: data.completed },
    { name: "Remaining", value: data.total - data.completed },
  ];

  return (
    <SectionCard title="🏆 Game Completion" loading={false}>
      <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
        <ResponsiveContainer width={200} height={200}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              <Cell fill="#7c3aed" />
              <Cell fill="rgba(255,255,255,0.15)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div>
          <p style={{ fontSize: "3rem", fontWeight: 700, color: "#7c3aed", lineHeight: 1 }}>{data.rate}%</p>
          <p style={{ color: "#e2e8f0", marginTop: "0.25rem" }}>
            {data.completed} of {data.total} games played
          </p>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.25rem" }}>
            {data.completed === data.total ? "🎉 All games completed!" : `${data.total - data.completed} games to go`}
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

function PlayCalendar({ childId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/children/${childId}/play-calendar`, { params: { days: 30 } })
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [childId]);

  if (loading) return <SectionCard title="📅 Play Calendar (Last 30 Days)" loading />;
  if (!data) return null;

  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <SectionCard title="📅 Play Calendar (Last 30 Days)" loading={false}>
      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
        {data.calendar.map((day) => {
          const d = new Date(day.date + "T00:00:00");
          const isToday = day.date === new Date().toISOString().slice(0, 10);
          return (
            <div
              key={day.date}
              title={`${day.date}${day.played ? ` — ${day.stars} ⭐, ${day.plays} plays` : " — no play"}`}
              style={{
                width: 34,
                height: 34,
                borderRadius: 6,
                background: day.played ? (day.stars >= 6 ? "#7c3aed" : day.stars >= 3 ? "#06b6d4" : "#10b981") : "rgba(255,255,255,0.1)",
                border: isToday ? "2px solid #f59e0b" : "2px solid transparent",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "default",
                fontSize: 10,
                color: "#e2e8f0",
              }}
            >
              <span>{dayNames[d.getDay()]}</span>
              <span>{d.getDate()}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
        {[
          { color: "rgba(255,255,255,0.1)", label: "No play" },
          { color: "#10b981", label: "1-2 ⭐" },
          { color: "#06b6d4", label: "3-5 ⭐" },
          { color: "#7c3aed", label: "6+ ⭐" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: 12, color: "#94a3b8" }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: color, border: "1px solid rgba(255,255,255,0.2)" }} />
            {label}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

const ChildProgress = () => {
  const { childId } = useParams();
  const [summary, setSummary] = useState({ child: null, results: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/parent/child/${childId}/progress`)
      .then((res) => setSummary({ child: res.data.child, results: res.data.results || [] }))
      .catch((err) => setError(err?.response?.data?.error || "Failed to load progress"))
      .finally(() => setLoading(false));
  }, [childId]);

  const { child, results } = summary;

  return (
    <div className="screen with-bg role-page">
      <Navbar />
      <main className="role-wrap">
        <section className="role-hero glass-card">
          <h1>Child Progress</h1>
          {child ? (
            <p>
              {child.displayName || child.username} &nbsp;•&nbsp; ⭐ {child.totalStars || 0} stars &nbsp;•&nbsp; 🔥 {child.currentStreak || 0} day streak
            </p>
          ) : null}
        </section>

        {error ? <p className="error-msg">{error}</p> : null}

        {!loading && (
          <>
            <ScoreHistoryChart childId={childId} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <ScoresByGameChart childId={childId} />
              <CompletionRing childId={childId} />
            </div>
            <PlayCalendar childId={childId} />

            <section className="glass-card">
              <h2>Recent Games</h2>
              {results.length === 0 ? <p>No game records yet.</p> : null}
              <div className="role-list">
                {results.map((item) => (
                  <article key={item._id} className="role-item">
                    <div>
                      <strong>{GAME_LABELS[item.gameId] || item.gameId}</strong>
                      <p>{new Date(item.completedAt).toLocaleString()}</p>
                    </div>
                    <div className="nav-stars">⭐ {item.starsEarned}</div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
        {loading && <p style={{ textAlign: "center", padding: "2rem" }}>Loading...</p>}
      </main>
    </div>
  );
};

export default ChildProgress;
