/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../lib/api";
import Navbar from "../../components/Navbar";
import StarBackground from "../../components/StarBackground";
import ParentMascot from "../../components/ParentMascot";
import { useAuth } from "../../context/AuthContext";
import dashboardAudio from "../../assets/general/sound/parent_dashboard.mp3";

const DASHBOARD_LINES = [
  "Welcome to Mission Control! 🚀",
  "Track your children's learning journey!",
  "You're doing an amazing job! ⭐",
];

const ParentDashboard = () => {
  const { refreshUser } = useAuth();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createForm, setCreateForm] = useState({
    username: "",
    password: "",
  });
  const navigate = useNavigate();

  const loadChildren = async () => {
    try {
      const res = await api.get("/parent/children");
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
      await api.post("/parent/create-child", createForm);
      setCreateForm({ username: "", password: "" });
      loadChildren();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to create child");
    }
  };

  const switchToChild = async (childId) => {
    try {
      await api.post("/auth/switch-child", { childId });
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
      </main>
      <ParentMascot audioSrc={dashboardAudio} lines={DASHBOARD_LINES} />
    </div>
  );
};

export default ParentDashboard;
