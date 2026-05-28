/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/api";
import Navbar from "../../components/Navbar";
import StarBackground from "../../components/StarBackground";

function JoinCodeBadge({ code }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
      <code style={{
        background: "rgba(124,58,237,0.25)",
        border: "1px solid rgba(124,58,237,0.5)",
        borderRadius: 6,
        padding: "0.1rem 0.45rem",
        fontSize: 13,
        letterSpacing: "0.08em",
        fontWeight: 700,
        color: "#c4b5fd",
      }}>
        {code}
      </code>
      <button
        type="button"
        onClick={copy}
        title="Copy join code"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0.1rem 0.25rem",
          color: copied ? "#10b981" : "#94a3b8",
          fontSize: 13,
        }}
      >
        {copied ? "✓" : "Copy"}
      </button>
    </span>
  );
}
const TeacherDashboard = () => {
  const [stats, setStats] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [wordLists, setWordLists] = useState([]);
  const [newClassroomName, setNewClassroomName] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const [statsRes, classroomsRes, listsRes] = await Promise.all([
        api.get("/api/teacher/stats"),
        api.get("/api/teacher/classrooms"),
        api.get("/api/teacher/wordlists"),
      ]);
      setStats(statsRes.data);
      setClassrooms(classroomsRes.data.classrooms || []);
      setWordLists(listsRes.data.lists || []);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load teacher dashboard");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createClassroom = async (event) => {
    event.preventDefault();
    if (!newClassroomName.trim()) return;
    try {
      await api.post("/api/teacher/classroom", { name: newClassroomName.trim() });
      setNewClassroomName("");
      loadData();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to create classroom");
    }
  };

  const avgStarsForClassroom = (students) => {
    if (!students || students.length === 0) return 0;
    const total = students.reduce((sum, s) => sum + (s.totalStars || 0), 0);
    return Math.round(total / students.length);
  };

  return (
    <div className="screen with-bg role-page">
      <StarBackground />
      <Navbar />
      <main className="role-wrap">
        <section className="role-hero glass-card">
          <h1>Teacher Control Deck</h1>
          <p>Manage classrooms, track student progress, and submit word lists.</p>
        </section>

        {error ? <p className="error-msg">{error}</p> : null}

        <section className="glass-card role-grid role-grid-4">
          <article className="metric-card">
            <span className="metric-icon">🏫</span>
            <h3>Classrooms</h3>
            <p>{stats?.totalClassrooms ?? "—"}</p>
          </article>
          <article className="metric-card">
            <span className="metric-icon">👦</span>
            <h3>Students</h3>
            <p>{stats?.totalStudents ?? "—"}</p>
          </article>
          <article className="metric-card">
            <span className="metric-icon">⭐</span>
            <h3>Avg Stars</h3>
            <p>{stats?.avgStarsPerStudent ?? "—"}</p>
          </article>
          <article className="metric-card">
            <span className="metric-icon">🎮</span>
            <h3>Games Played</h3>
            <p>{stats?.totalGamesPlayed ?? "—"}</p>
          </article>
        </section>

        <section className="glass-card role-grid role-grid-2">
          <div>
            <h2>Classrooms</h2>
            <form className="role-form role-inline-form" onSubmit={createClassroom}>
              <input
                value={newClassroomName}
                onChange={(e) => setNewClassroomName(e.target.value)}
                placeholder="New classroom name"
              />
              <button className="btn-register" type="submit">
                Create
              </button>
            </form>

            <div className="role-list">
              {classrooms.map((room) => (
                <article key={room._id} className="role-item">
                  <div>
                    <strong>{room.name}</strong>
                    <p style={{ marginTop: "0.2rem" }}>
                      👦 {room.students?.length || 0} students &nbsp;|&nbsp;
                      ⭐ Avg {avgStarsForClassroom(room.students)}
                    </p>
                    <p style={{ marginTop: "0.25rem", color: "#94a3b8", fontSize: 12 }}>
                      Join code: <JoinCodeBadge code={room.joinCode} />
                    </p>
                  </div>
                  <Link className="btn-secondary-glass" to={`/teacher/classroom/${room._id}`}>
                    View
                  </Link>
                </article>
              ))}
              {classrooms.length === 0 ? <p>No classrooms yet.</p> : null}
            </div>
          </div>

          <div>
            <h2>Word Lists</h2>
            <Link to="/teacher/wordlist" className="btn-register">
              + New Word List
            </Link>
            <div className="role-list">
              {wordLists.map((list) => (
                <article key={list._id} className="role-item">
                  <div>
                    <strong>{list.title}</strong>
                    <p>
                      {list.gameType} • {list.words?.length || 0} words
                    </p>
                  </div>
                  <span className={list.isApproved ? "badge-ok" : "badge-pending"}>
                    {list.isApproved ? "Approved" : "Pending"}
                  </span>
                </article>
              ))}
              {wordLists.length === 0 ? <p>No word lists yet.</p> : null}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TeacherDashboard;
