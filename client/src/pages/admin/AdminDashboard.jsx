import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../../lib/api";
import Navbar from "../../components/Navbar";
import StarBackground from "../../components/StarBackground";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const ROLE_META = {
  child:   { label: "Child",   icon: "🧒", color: "#818cf8", bg: "rgba(99,102,241,0.18)",  border: "rgba(99,102,241,0.4)"  },
  parent:  { label: "Parent",  icon: "👨‍👩‍👧", color: "#34d399", bg: "rgba(16,185,129,0.18)", border: "rgba(16,185,129,0.4)" },
  teacher: { label: "Teacher", icon: "👩‍🏫", color: "#fbbf24", bg: "rgba(245,158,11,0.18)", border: "rgba(245,158,11,0.4)" },
  admin:   { label: "Admin",   icon: "🛡️",  color: "#f87171", bg: "rgba(239,68,68,0.18)",  border: "rgba(239,68,68,0.4)"  },
};

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [pendingWordLists, setPendingWordLists] = useState([]);
  const [pendingChildren, setPendingChildren] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const reload = () => setTick((n) => n + 1);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        const [statsRes, teachersRes, listsRes, childrenRes, usersRes] = await Promise.all([
          api.get("/api/admin/stats"),
          api.get("/api/admin/pending-teachers"),
          api.get("/api/admin/pending-wordlists"),
          api.get("/api/admin/pending-children"),
          api.get("/api/admin/users?limit=8"),
        ]);
        if (cancelled) return;
        setStats(statsRes.data);
        setPendingTeachers(teachersRes.data.teachers || []);
        setPendingWordLists(listsRes.data.lists || []);
        setPendingChildren(childrenRes.data.children || []);
        setRecentUsers(usersRes.data.users || []);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.error || "Failed to load admin stats");
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, [tick]);

  const approveTeacher = async (id) => {
    try { await api.patch(`/api/admin/approve-teacher/${id}`); reload(); }
    catch (err) { setError(err?.response?.data?.error || "Failed to approve teacher"); }
  };

  const rejectTeacher = async (id) => {
    try { await api.patch(`/api/admin/user/${id}`, { isActive: false }); reload(); }
    catch (err) { setError(err?.response?.data?.error || "Failed to reject teacher"); }
  };

  const approveChild = async (id) => {
    try { await api.patch(`/api/admin/approve-child/${id}`); reload(); }
    catch (err) { setError(err?.response?.data?.error || "Failed to approve child"); }
  };

  const rejectChild = async (id) => {
    try { await api.patch(`/api/admin/reject-child/${id}`); reload(); }
    catch (err) { setError(err?.response?.data?.error || "Failed to reject child"); }
  };

  const approveWordList = async (id) => {
    try { await api.patch(`/api/admin/approve-wordlist/${id}`); reload(); }
    catch (err) { setError(err?.response?.data?.error || "Failed to approve word list"); }
  };

  return (
    <div className="screen with-bg role-page">
      <StarBackground />
      <Navbar />
      <main className="role-wrap">

        {/* Hero */}
        <section className="role-hero glass-card">
          <h1>{t("admin.dashboard.title")}</h1>
          <p>{t("admin.dashboard.subtitle")}</p>
        </section>

        {error ? <p className="error-msg">{error}</p> : null}

        {/* Quick nav */}
        <section className="glass-card role-grid role-grid-3" style={{ gap: "0.75rem" }}>
          <Link to="/admin/users" className="btn-secondary-glass" style={{ textAlign: "center", padding: "0.75rem 1rem", display: "block" }}>
            {t("admin.dashboard.manageUsers")}
          </Link>
          <Link to="/admin/approvals" className="btn-secondary-glass" style={{ textAlign: "center", padding: "0.75rem 1rem", display: "block" }}>
            {t("admin.dashboard.approvalsNav")}
          </Link>
          <Link to="/admin/videos" className="btn-register" style={{ textAlign: "center", padding: "0.75rem 1rem", display: "block" }}>
            {t("admin.dashboard.manageVideos")}
          </Link>
        </section>

        {/* User stats */}
        <section className="glass-card">
          <h2 style={{ marginBottom: "1rem" }}>{t("admin.dashboard.usersSection")}</h2>
          <div className="role-grid role-grid-3">
            <article className="metric-card">
              <span className="metric-icon">👥</span>
              <h3>{t("admin.dashboard.totalUsers")}</h3>
              <p>{stats?.totalUsers ?? "—"}</p>
            </article>
            <article className="metric-card">
              <span className="metric-icon">👦</span>
              <h3>{t("admin.dashboard.children")}</h3>
              <p>{stats?.totalChildren ?? "—"}</p>
            </article>
            <article className="metric-card">
              <span className="metric-icon">👨‍👩‍👧</span>
              <h3>{t("admin.dashboard.parents")}</h3>
              <p>{stats?.totalParents ?? "—"}</p>
            </article>
            <article className="metric-card">
              <span className="metric-icon">👩‍🏫</span>
              <h3>{t("admin.dashboard.teachers")}</h3>
              <p>{stats?.totalTeachers ?? "—"}</p>
            </article>
            <article className="metric-card">
              <span className="metric-icon">🎮</span>
              <h3>{t("admin.dashboard.gamesPlayed")}</h3>
              <p>{stats?.totalGames ?? "—"}</p>
            </article>
            <article className="metric-card">
              <span className="metric-icon">⭐</span>
              <h3>{t("admin.dashboard.starsGiven")}</h3>
              <p>{stats?.totalStarsGiven ?? "—"}</p>
            </article>
          </div>
        </section>

        {/* Video stats */}
        <section className="glass-card">
          <div className="role-section-header" style={{ marginBottom: "1rem" }}>
            <h2>{t("admin.dashboard.videosSection")}</h2>
            <Link to="/admin/videos" className="btn-secondary-glass">{t("admin.dashboard.manage")}</Link>
          </div>
          <div className="role-grid role-grid-3">
            <article className="metric-card">
              <span className="metric-icon">🎬</span>
              <h3>{t("admin.dashboard.totalVideos")}</h3>
              <p>{stats?.totalVideos ?? "—"}</p>
            </article>
            <article className="metric-card">
              <span className="metric-icon">✅</span>
              <h3>{t("admin.dashboard.published")}</h3>
              <p>{stats?.publishedVideos ?? "—"}</p>
            </article>
            <article className="metric-card">
              <span className="metric-icon">📝</span>
              <h3>{t("admin.dashboard.drafts")}</h3>
              <p>{stats?.draftVideos ?? "—"}</p>
            </article>
            <article className="metric-card">
              <span className="metric-icon">👁</span>
              <h3>{t("admin.dashboard.totalViews")}</h3>
              <p>{stats?.totalVideoViews ?? "—"}</p>
            </article>
            <article className="metric-card">
              <span className="metric-icon">📺</span>
              <h3>{t("admin.dashboard.storySeries")}</h3>
              <p>{stats?.videosByType?.["story-series"] ?? "—"}</p>
            </article>
            <article className="metric-card">
              <span className="metric-icon">⚡</span>
              <h3>{t("admin.dashboard.quickVideos")}</h3>
              <p>{stats?.videosByType?.["quick-video"] ?? "—"}</p>
            </article>
          </div>

          {/* Top viewed */}
          {stats?.topViewedVideos?.length > 0 && (
            <div style={{ marginTop: "1.25rem" }}>
              <h3 style={{ fontSize: "0.95rem", marginBottom: "0.6rem", opacity: 0.8 }}>🔥 Top Viewed</h3>
              <div className="role-list">
                {stats.topViewedVideos.map((v) => (
                  <article key={v._id} className="role-item">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      {v.thumbnailUrl && <img src={v.thumbnailUrl} alt={v.title} style={{ width: "40px", height: "28px", borderRadius: "5px", objectFit: "cover", flexShrink: 0 }} />}
                      <div>
                        <strong style={{ fontSize: "0.88rem" }}>{v.title}</strong>
                        <p style={{ fontSize: "0.75rem", margin: 0, opacity: 0.65 }}>{v.type} {v.field ? `· ${v.field}` : ""}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: "0.82rem", opacity: 0.8 }}>👁 {v.views}</span>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* Recently added */}
          {stats?.recentVideos?.length > 0 && (
            <div style={{ marginTop: "1.25rem" }}>
              <h3 style={{ fontSize: "0.95rem", marginBottom: "0.6rem", opacity: 0.8 }}>🆕 Recently Added</h3>
              <div className="role-list">
                {stats.recentVideos.map((v) => (
                  <article key={v._id} className="role-item">
                    <div>
                      <strong style={{ fontSize: "0.88rem" }}>{v.title}</strong>
                      <p style={{ fontSize: "0.75rem", margin: 0, opacity: 0.65 }}>{v.type}</p>
                    </div>
                    <span className={v.isPublished ? "badge-ok" : "badge-pending"}>{v.isPublished ? t("admin.dashboard.live") : t("admin.dashboard.draft")}</span>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Analytics Charts */}
        {stats && (
          <section className="glass-card">
            <h2 style={{ marginBottom: "1.5rem" }}>📊 Analytics</h2>

            <div className="role-grid role-grid-2" style={{ gap: "2rem" }}>

              {/* User Distribution Donut */}
              <div>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, opacity: 0.75, marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  👥 User Distribution
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Children", value: stats.totalChildren || 0 },
                        { name: "Parents",  value: stats.totalParents  || 0 },
                        { name: "Teachers", value: stats.totalTeachers || 0 },
                      ]}
                      cx="50%" cy="50%"
                      innerRadius={58} outerRadius={88}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      <Cell fill="#7c3aed" />
                      <Cell fill="#06b6d4" />
                      <Cell fill="#10b981" />
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "rgba(8,1,26,0.97)", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 10, color: "#e2e8f0", fontSize: 13 }}
                      itemStyle={{ color: "#e2e8f0" }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={9}
                      formatter={(v) => <span style={{ color: "#cbd5e1", fontSize: 13 }}>{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Video Types Bar */}
              <div>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, opacity: 0.75, marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  🎬 Videos by Type
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={[
                      { name: "📺 Series", count: stats.videosByType?.["story-series"] || 0 },
                      { name: "🎬 Video",  count: stats.videosByType?.["quick-video"]  || 0 },
                      { name: "🎵 Song",   count: stats.videosByType?.["song"]         || 0 },
                    ]}
                    margin={{ top: 8, right: 10, left: -10, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: "rgba(8,1,26,0.97)", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 10, color: "#e2e8f0", fontSize: 13 }}
                      cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    />
                    <Bar dataKey="count" radius={[7, 7, 0, 0]} maxBarSize={64}>
                      {[0, 1, 2].map((i) => (
                        <Cell key={i} fill={["#7c3aed", "#06b6d4", "#10b981"][i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Published vs Draft horizontal bar */}
            <div style={{ marginTop: "1.75rem" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700, opacity: 0.75, marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                📺 Video Status
              </h3>
              <ResponsiveContainer width="100%" height={110}>
                <BarChart
                  layout="vertical"
                  data={[
                    { name: "Published ✅", count: stats.publishedVideos || 0 },
                    { name: "Draft 📝",     count: stats.draftVideos     || 0 },
                  ]}
                  margin={{ top: 4, right: 30, left: 10, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} width={110} />
                  <Tooltip
                    contentStyle={{ background: "rgba(8,1,26,0.97)", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 10, color: "#e2e8f0", fontSize: 13 }}
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  />
                  <Bar dataKey="count" radius={[0, 7, 7, 0]} maxBarSize={28}>
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top viewed horizontal bar */}
            {stats.topViewedVideos?.length > 0 && (
              <div style={{ marginTop: "1.75rem" }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, opacity: 0.75, marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  🔥 Top Viewed Videos
                </h3>
                <ResponsiveContainer width="100%" height={stats.topViewedVideos.length * 46 + 20}>
                  <BarChart
                    layout="vertical"
                    data={stats.topViewedVideos.map((v) => ({
                      name: v.title.length > 30 ? v.title.slice(0, 30) + "…" : v.title,
                      views: v.views,
                    }))}
                    margin={{ top: 4, right: 30, left: 10, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} width={160} />
                    <Tooltip
                      contentStyle={{ background: "rgba(8,1,26,0.97)", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 10, color: "#e2e8f0", fontSize: 13 }}
                      cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    />
                    <Bar dataKey="views" fill="#7c3aed" radius={[0, 7, 7, 0]} maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        )}

        {/* Pending approvals */}
        <section className="glass-card role-grid role-grid-2">
          <div>
            <div className="role-section-header">
              <h2>{t("admin.dashboard.pendingTeachers")} ({pendingTeachers.length})</h2>
              <Link to="/admin/approvals" className="btn-secondary-glass">{t("admin.dashboard.viewAll")}</Link>
            </div>
            <div className="role-list">
              {pendingTeachers.slice(0, 4).map((teacher) => (
                <article key={teacher._id} className="role-item">
                  <div>
                    <strong>{teacher.displayName || teacher.username}</strong>
                    <p>@{teacher.username}</p>
                  </div>
                  <div className="role-actions">
                    <button type="button" className="btn-register" onClick={() => approveTeacher(teacher._id)}>{t("admin.approvals.approve")}</button>
                    <button type="button" className="btn-secondary-glass" onClick={() => rejectTeacher(teacher._id)}>{t("admin.approvals.reject")}</button>
                  </div>
                </article>
              ))}
              {pendingTeachers.length === 0 ? <p>{t("admin.dashboard.noTeachers")}</p> : null}
            </div>
          </div>

          <div>
            <div className="role-section-header">
              <h2>{t("admin.dashboard.pendingWordLists")} ({pendingWordLists.length})</h2>
              <Link to="/admin/approvals" className="btn-secondary-glass">{t("admin.dashboard.viewAll")}</Link>
            </div>
            <div className="role-list">
              {pendingWordLists.slice(0, 4).map((list) => (
                <article key={list._id} className="role-item">
                  <div>
                    <strong>{list.title}</strong>
                    <p>{list.teacherId?.displayName || list.teacherId?.username} • {list.words?.length || 0} {t("teacher.wordList.words")}</p>
                  </div>
                  <button type="button" className="btn-register" onClick={() => approveWordList(list._id)}>{t("admin.approvals.approve")}</button>
                </article>
              ))}
              {pendingWordLists.length === 0 ? <p>{t("admin.dashboard.noWordLists")}</p> : null}
            </div>
          </div>
        </section>

        {/* Pending children */}
        <section className="glass-card">
          <div className="role-section-header">
            <h2>{t("admin.dashboard.pendingChildren")} ({pendingChildren.length})</h2>
            <Link to="/admin/approvals" className="btn-secondary-glass">{t("admin.dashboard.viewAll")}</Link>
          </div>
          <div className="role-list">
            {pendingChildren.slice(0, 4).map((child) => (
              <article key={child._id} className="role-item">
                <div>
                  <strong>{child.displayName || child.username}</strong>
                  <p>@{child.username} · {t("admin.dashboard.parentLabel")} {child.parentId?.displayName || child.parentId?.username || "Unknown"}</p>
                </div>
                <div className="role-actions">
                  <button type="button" className="btn-register" onClick={() => approveChild(child._id)}>{t("admin.approvals.approve")}</button>
                  <button type="button" className="btn-secondary-glass" onClick={() => rejectChild(child._id)}>{t("admin.approvals.reject")}</button>
                </div>
              </article>
            ))}
            {pendingChildren.length === 0 ? <p>{t("admin.dashboard.noChildren")}</p> : null}
          </div>
        </section>

        {/* Recent users */}
        <section className="glass-card">
          {/* Card header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "1.65rem", filter: "drop-shadow(0 0 8px rgba(167,139,250,0.75))", lineHeight: 1 }}>👥</span>
              <div>
                <h2 style={{ margin: 0, fontWeight: 800, fontSize: "1.2rem", color: "#fff", lineHeight: 1.2 }}>{t("admin.dashboard.recentUsers")}</h2>
                <p style={{ margin: "3px 0 0", fontSize: "0.77rem", color: "rgba(196,181,253,0.6)", lineHeight: 1.4 }}>
                  {t("admin.dashboard.recentUsersSubtitle")}
                </p>
              </div>
            </div>
            <Link
              to="/admin/users"
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.42rem",
                padding: "0.45rem 1.1rem",
                borderRadius: "10px",
                background: "linear-gradient(135deg,rgba(124,58,237,0.55),rgba(6,182,212,0.38))",
                border: "1px solid rgba(124,58,237,0.42)",
                color: "#e2e8f0",
                fontSize: "0.82rem", fontWeight: 600,
                textDecoration: "none",
                boxShadow: "0 2px 10px rgba(124,58,237,0.22)",
                transition: "all 0.18s",
                whiteSpace: "nowrap",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {t("admin.dashboard.manageAll")}
            </Link>
          </div>

          <div className="table-wrap">
            <table className="role-table">
              <thead>
                <tr>
                  <th>{t("admin.dashboard.userCol")}</th>
                  <th>{t("admin.dashboard.roleCol")}</th>
                  <th>{t("admin.dashboard.statusCol")}</th>
                  <th>{t("admin.dashboard.joinedCol")}</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => {
                  const rm = ROLE_META[u.role] || ROLE_META.child;
                  return (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                          <span style={{ fontWeight: 600, color: "#e2e8f0" }}>{u.displayName || u.username}</span>
                          {u.displayName ? <span style={{ fontSize: "0.73rem", color: "#64748b" }}>@{u.username}</span> : null}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "0.32rem",
                          padding: "0.22rem 0.55rem 0.22rem 0.42rem",
                          borderRadius: "6px",
                          border: `1.5px solid ${rm.border}`,
                          background: rm.bg,
                          color: rm.color,
                          fontSize: "0.78rem", fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}>
                          <span style={{ fontSize: "0.88rem" }}>{rm.icon}</span>
                          <span>{rm.label}</span>
                        </span>
                      </td>
                      <td>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "0.3rem",
                          padding: "0.2rem 0.55rem", borderRadius: "5px", fontSize: "0.75rem", fontWeight: 600,
                          background: u.isActive ? "rgba(16,185,129,0.15)" : "rgba(100,116,139,0.15)",
                          border: `1px solid ${u.isActive ? "rgba(16,185,129,0.35)" : "rgba(100,116,139,0.3)"}`,
                          color: u.isActive ? "#34d399" : "#64748b",
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                          {u.isActive ? t("common.active") : t("common.disabled")}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.82rem", color: "rgba(148,163,184,0.85)" }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
