/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../../lib/api";
import Navbar from "../../components/Navbar";
import StarBackground from "../../components/StarBackground";

function JoinCodeBadge({ code }) {
  const { t } = useTranslation();
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
        {copied ? t("teacher.dashboard.copied") : t("teacher.dashboard.copy")}
      </button>
    </span>
  );
}
const TeacherDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [newClassroomName, setNewClassroomName] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const [statsRes, classroomsRes] = await Promise.all([
        api.get("/api/teacher/stats"),
        api.get("/api/teacher/classrooms"),
      ]);
      setStats(statsRes.data);
      setClassrooms(classroomsRes.data.classrooms || []);
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
          <h1>{t("teacher.dashboard.title")}</h1>
          <p>{t("teacher.dashboard.subtitle")}</p>
        </section>

        {error ? <p className="error-msg">{error}</p> : null}

        <section className="glass-card role-grid role-grid-4">
          <article className="metric-card">
            <span className="metric-icon">🏫</span>
            <h3>{t("teacher.dashboard.classrooms")}</h3>
            <p>{stats?.totalClassrooms ?? "—"}</p>
          </article>
          <article className="metric-card">
            <span className="metric-icon">👦</span>
            <h3>{t("teacher.dashboard.students")}</h3>
            <p>{stats?.totalStudents ?? "—"}</p>
          </article>
          <article className="metric-card">
            <span className="metric-icon">⭐</span>
            <h3>{t("teacher.dashboard.avgStars")}</h3>
            <p>{stats?.avgStarsPerStudent ?? "—"}</p>
          </article>
          <article className="metric-card">
            <span className="metric-icon">🎮</span>
            <h3>{t("teacher.dashboard.gamesPlayed")}</h3>
            <p>{stats?.totalGamesPlayed ?? "—"}</p>
          </article>
        </section>

        <section className="glass-card role-grid role-grid-2">
          <div>
            <h2>{t("teacher.dashboard.classrooms")}</h2>
            <form className="role-form role-inline-form" onSubmit={createClassroom}>
              <input
                value={newClassroomName}
                onChange={(e) => setNewClassroomName(e.target.value)}
                placeholder={t("teacher.dashboard.newClassroomPlaceholder")}
              />
              <button className="btn-register" type="submit">
                {t("teacher.dashboard.create")}
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
                    {t("teacher.dashboard.view")}
                  </Link>
                </article>
              ))}
              {classrooms.length === 0 ? <p>{t("teacher.dashboard.noClassrooms")}</p> : null}
            </div>
          </div>

          <div>
            <h2>{t("teacher.dashboard.myContent")}</h2>
            <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: "1rem" }}>
              {t("teacher.dashboard.myContentSubtitle")}
            </p>
            <Link to="/teacher/contents" className="btn-register">
              {t("teacher.dashboard.goToContent")}
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TeacherDashboard;
