/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import confetti from "canvas-confetti";
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
  const { t } = useTranslation();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");
  const [createdChildName, setCreatedChildName] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [createForm, setCreateForm] = useState({ username: "", password: "" });
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

  const celebrateChildCreated = () => {
    confetti({
      particleCount: 140,
      spread: 75,
      origin: { y: 0.62 },
      colors: ["#7b2ff7", "#ff6b9d", "#ffd700", "#c9b8ff", "#b2ebf2"],
    });

    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0.16, y: 0.7 },
        colors: ["#ffd700", "#ff6b9d", "#b2ebf2"],
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 0.84, y: 0.7 },
        colors: ["#ffd700", "#7b2ff7", "#c9b8ff"],
      });
    }, 180);
  };

  const [createdChildNeedsApproval, setCreatedChildNeedsApproval] = useState(false);

  const handleCreateChild = async (event) => {
    event.preventDefault();
    setError("");
    setCreateError("");
    setCreatedChildName("");
    setCreatedChildNeedsApproval(false);
    setDeleteSuccess("");
    try {
      const res = await api.post("/api/parent/create-child", createForm);
      const child = res.data?.child;
      const needsApproval = res.data?.needsApproval ?? false;
      setCreatedChildName(child?.displayName || child?.username || createForm.username.trim());
      setCreatedChildNeedsApproval(needsApproval);
      if (!needsApproval) celebrateChildCreated();
      setCreateForm({ username: "", password: "" });
      loadChildren();
    } catch (err) {
      const errorCode = err?.response?.data?.code;
      setCreateError(
        errorCode === "USERNAME_TAKEN"
          ? t("parent.createChild.usernameTaken")
          : err?.response?.data?.error || t("parent.createChild.failed")
      );
    }
  };

  const openDeleteConfirm = (child) => {
    setError("");
    setCreateError("");
    setCreatedChildName("");
    setDeleteSuccess("");
    setDeleteConfirm({ child, step: 1 });
  };

  const closeDeleteConfirm = () => setDeleteConfirm(null);

  const handleDeleteChild = async () => {
    if (!deleteConfirm?.child) return;

    const child = deleteConfirm.child;
    const childName = child.displayName || child.username;

    try {
      await api.delete(`/api/parent/child/${child._id}`);
      setDeleteSuccess(t("parent.deleteChild.success", { name: childName }));
      setDeleteConfirm(null);
      loadChildren();
    } catch (err) {
      setError(err?.response?.data?.error || t("parent.deleteChild.failed"));
      setDeleteConfirm(null);
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
        {deleteSuccess ? <p className="success-msg">{deleteSuccess}</p> : null}

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
                    {!child.isApproved && (
                      <span className="badge-pending">Pending Approval</span>
                    )}
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
                    <button type="button" className="btn-danger-glass" onClick={() => openDeleteConfirm(child)}>
                      {t("parent.deleteChild.button")}
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
                onChange={(e) => {
                  setCreateError("");
                  setCreatedChildName("");
                  setDeleteSuccess("");
                  setCreateForm((prev) => ({ ...prev, username: e.target.value }));
                }}
                required
              />
              <input
                placeholder="Password"
                type="password"
                value={createForm.password}
                onChange={(e) => {
                  setCreateError("");
                  setCreatedChildName("");
                  setDeleteSuccess("");
                  setCreateForm((prev) => ({ ...prev, password: e.target.value }));
                }}
                required
              />
              {createError ? (
                <div className="form-alert form-alert-error" role="alert">
                  {createError}
                </div>
              ) : null}
              {createdChildName ? (
                <div className={`form-alert ${createdChildNeedsApproval ? "form-alert-warning" : "form-alert-success"}`} role="status">
                  {createdChildNeedsApproval
                    ? t("parent.createChild.pendingApproval", { name: createdChildName })
                    : t("parent.createChild.success", { name: createdChildName })}
                </div>
              ) : null}
              <button type="submit" className="btn-register">
                Create Child
              </button>
            </form>
          </div>
        </section>

      </main>
      {deleteConfirm ? (
        <div className="modal-overlay" onClick={closeDeleteConfirm}>
          <div
            className="modal-box glass-card parent-delete-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="parent-delete-icon">⚠️</div>
            <h2>
              {deleteConfirm.step === 1
                ? t("parent.deleteChild.modalTitleFirst")
                : t("parent.deleteChild.modalTitleSecond")}
            </h2>
            <p>
              {deleteConfirm.step === 1
                ? t("parent.deleteChild.confirmFirst", {
                    name: deleteConfirm.child.displayName || deleteConfirm.child.username,
                  })
                : t("parent.deleteChild.confirmSecond", {
                    name: deleteConfirm.child.displayName || deleteConfirm.child.username,
                  })}
            </p>
            <div className="parent-delete-actions">
              <button type="button" className="btn-secondary-glass" onClick={closeDeleteConfirm}>
                {t("parent.deleteChild.cancel")}
              </button>
              {deleteConfirm.step === 1 ? (
                <button
                  type="button"
                  className="btn-danger-glass"
                  onClick={() => setDeleteConfirm((prev) => ({ ...prev, step: 2 }))}
                >
                  {t("parent.deleteChild.continue")}
                </button>
              ) : (
                <button type="button" className="btn-danger-glass" onClick={handleDeleteChild}>
                  {t("parent.deleteChild.confirmDelete")}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
      <ParentMascot audioSrc={dashboardAudio} lines={DASHBOARD_LINES} />
    </div>
  );
};

export default ParentDashboard;
