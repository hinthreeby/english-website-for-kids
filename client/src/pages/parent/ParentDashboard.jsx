/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../lib/api";
import Navbar from "../../components/Navbar";
import StarBackground from "../../components/StarBackground";
import ParentMascot from "../../components/ParentMascot";
import { useAuth } from "../../context/AuthContext";
const dashboardAudio = "/sounds/parent_dashboard.mp3";

const DASHBOARD_LINES = [
  "You can track your child's learning progress here! ⭐"
];

const ParentDashboard = () => {
  const { refreshUser } = useAuth();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createForm, setCreateForm] = useState({ username: "", password: "" });
  const [joinForm, setJoinForm] = useState({ joinCode: "", childId: "" });
  const [joinMsg, setJoinMsg] = useState(null);
  const navigate = useNavigate();

  const loadChildren = async () => {
    try {
      const res = await api.get("/api/parent/children");
      setChildren(res.data.children || []);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load children");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChildren();
  }, []);

  const handleCreateChild = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await api.post("/api/parent/create-child", createForm);
      setCreateForm({ username: "", password: "" });
      loadChildren();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to create child");
    }
  };

  const handleJoinClassroom = async (e) => {
    e.preventDefault();
    setJoinMsg(null);
    setError("");
    try {
      const res = await api.post("/api/parent/join-classroom", joinForm);
      setJoinMsg({ ok: true, text: `Joined "${res.data.classroomName}" successfully!` });
      setJoinForm({ joinCode: "", childId: "" });
    } catch (err) {
      setJoinMsg({ ok: false, text: err?.response?.data?.error || "Failed to join classroom." });
    }
  };

  const switchToChild = async (childId) => {
    try {
      await api.post("/api/auth/switch-child", { childId });
      await refreshUser();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to switch profile");
    }
  };

  const totalStars = children.reduce((sum, c) => sum + (c.totalStars || 0), 0);
  const bestStreak = children.reduce((max, c) => Math.max(max, c.currentStreak || 0), 0);

  const formatLastPlayed = (date) => {
    if (!date) return "Never";
    const d = new Date(date);
    const diff = Math.floor((Date.now() - d) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return `${diff} days ago`;
  };

  return (
    <div className="screen with-bg role-page">
      <StarBackground />
      <Navbar />
      <main className="role-wrap">
        <section className="role-hero glass-card">
          <h1>Parent Mission Control</h1>
          <p>Track your children's progress and manage their profiles.</p>
        </section>

        {error ? <p className="error-msg">{error}</p> : null}

        <section className="glass-card role-grid role-grid-3">
          <article className="metric-card">
            <span className="metric-icon">👦</span>
            <h3>Children</h3>
            <p>{children.length}</p>
          </article>
          <article className="metric-card">
            <span className="metric-icon">⭐</span>
            <h3>Total Stars</h3>
            <p>{totalStars}</p>
          </article>
          <article className="metric-card">
            <span className="metric-icon">🔥</span>
            <h3>Best Streak</h3>
            <p>{bestStreak} days</p>
          </article>
        </section>

        <section className="glass-card role-grid role-grid-2">
          <div>
            <h2>My Children</h2>
            {loading ? <p>Loading...</p> : null}
            {!loading && children.length === 0 ? <p>No child accounts yet. Create one below.</p> : null}
            <div className="role-list">
              {children.map((child) => (
                <article key={child._id} className="role-item role-item-col">
                  <div className="role-item-top">
                    <strong>{child.displayName || child.username}</strong>
                    <span className="badge-ok">@{child.username}</span>
                  </div>
                  <div className="role-item-stats">
                    <span>⭐ {child.totalStars || 0} stars</span>
                    <span>🔥 {child.currentStreak || 0} day streak</span>
                    <span>🕐 {formatLastPlayed(child.lastPlayedDate)}</span>
                  </div>
                  <div className="role-actions">
                    <Link to={`/parent/child/${child._id}`} className="btn-register">
                      View Progress
                    </Link>
                    <button type="button" className="btn-secondary-glass" onClick={() => switchToChild(child._id)}>
                      Switch Profile
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div>
            <h2>Add Child Account</h2>
            <form className="role-form" onSubmit={handleCreateChild}>
              <input
                placeholder="Username"
                value={createForm.username}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, username: e.target.value }))}
                required
              />
              <input
                placeholder="Password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
              <button type="submit" className="btn-register">
                Create Child
              </button>
            </form>
          </div>
        </section>

        <section className="glass-card">
          <h2>Join a Classroom</h2>
          <p style={{ color: "#94a3b8", marginBottom: "1rem", fontSize: 14 }}>
            Enter the join code from your child's teacher to enroll them in a classroom.
          </p>
          {joinMsg && (
            <p style={{ color: joinMsg.ok ? "#10b981" : "#f43f5e", marginBottom: "0.75rem" }}>
              {joinMsg.text}
            </p>
          )}
          <form className="role-form role-inline-form" onSubmit={handleJoinClassroom} style={{ flexWrap: "wrap", gap: "0.75rem" }}>
            <input
              placeholder="Join code (e.g. AB12CD)"
              value={joinForm.joinCode}
              onChange={(e) => setJoinForm((prev) => ({ ...prev, joinCode: e.target.value.toUpperCase() }))}
              style={{ textTransform: "uppercase", letterSpacing: "0.1em", maxWidth: 180 }}
              maxLength={6}
              required
            />
            <select
              value={joinForm.childId}
              onChange={(e) => setJoinForm((prev) => ({ ...prev, childId: e.target.value }))}
              required
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 8,
                padding: "0.55rem 0.75rem",
                color: "#e2e8f0",
                minWidth: 160,
              }}
            >
              <option value="" disabled>Select child</option>
              {children.map((c) => (
                <option key={c._id} value={c._id}>{c.displayName || c.username}</option>
              ))}
            </select>
            <button type="submit" className="btn-register" disabled={children.length === 0}>
              Join
            </button>
          </form>
          {children.length === 0 && (
            <p style={{ color: "#94a3b8", fontSize: 13, marginTop: "0.5rem" }}>
              Create a child account first before joining a classroom.
            </p>
          )}
        </section>
      </main>
      <ParentMascot audioSrc={dashboardAudio} lines={DASHBOARD_LINES} />
    </div>
  );
};

export default ParentDashboard;
