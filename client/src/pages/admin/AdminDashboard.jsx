import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/api";
import Navbar from "../../components/Navbar";
import StarBackground from "../../components/StarBackground";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const ROLE_BADGE = { child: "👦", parent: "👨‍👩‍👧", teacher: "👩‍🏫", admin: "🛡️" };

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [pendingWordLists, setPendingWordLists] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const reload = () => setTick((n) => n + 1);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        const [statsRes, teachersRes, listsRes, usersRes] = await Promise.all([
          api.get("/api/admin/stats"),
          api.get("/api/admin/pending-teachers"),
          api.get("/api/admin/pending-wordlists"),
          api.get("/api/admin/users?limit=8"),
        ]);
        if (cancelled) return;
        setStats(statsRes.data);
        setPendingTeachers(teachersRes.data.teachers || []);
        setPendingWordLists(listsRes.data.lists || []);
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
          <h1>Admin Starport</h1>
          <p>System overview — users, videos, activity, and pending approvals.</p>
        </section>

        {error ? <p className="error-msg">{error}</p> : null}

        {/* Quick nav */}
        <section className="glass-card role-grid role-grid-3" style={{ gap: "0.75rem" }}>
          <Link to="/admin/users" className="btn-secondary-glass" style={{ textAlign: "center", padding: "0.75rem 1rem", display: "block" }}>
            👥 Manage Users
          </Link>
          <Link to="/admin/approvals" className="btn-secondary-glass" style={{ textAlign: "center", padding: "0.75rem 1rem", display: "block" }}>
            ✅ Approvals
          </Link>
          <Link to="/admin/videos" className="btn-register" style={{ textAlign: "center", padding: "0.75rem 1rem", display: "block" }}>
            🎬 Manage Videos
          </Link>
        </section>

        {/* User stats */}
        <section className="glass-card">
          <h2 style={{ marginBottom: "1rem" }}>👥 Users</h2>
          <div className="role-grid role-grid-3">
            <article className="metric-card">
              <span className="metric-icon">👥</span>
              <h3>Total Users</h3>
              <p>{stats?.totalUsers ?? "—"}</p>
            </article>
            <article className="metric-card">
              <span className="metric-icon">👦</span>
              <h3>Children</h3>
              <p>{stats?.totalChildren ?? "—"}</p>
            </article>
            <article className="metric-card">
              <span className="metric-icon">👨‍👩‍👧</span>
              <h3>Parents</h3>
              <p>{stats?.totalParents ?? "—"}</p>
            </article>
            <article className="metric-card">
              <span className="metric-icon">👩‍🏫</span>
              <h3>Teachers</h3>
              <p>{stats?.totalTeachers ?? "—"}</p>
            </article>
            <article className="metric-card">
              <span className="metric-icon">🎮</span>
              <h3>Games Played</h3>
              <p>{stats?.totalGames ?? "—"}</p>
            </article>
            <article className="metric-card">
              <span className="metric-icon">⭐</span>
              <h3>Stars Given</h3>
              <p>{stats?.totalStarsGiven ?? "—"}</p>
            </article>
          </div>
        </section>

        {/* Video stats */}
        <section className="glass-card">
          <div className="role-section-header" style={{ marginBottom: "1rem" }}>
            <h2>🎬 Videos</h2>
            <Link to="/admin/videos" className="btn-secondary-glass">Manage</Link>
          </div>
          <div className="role-grid role-grid-3">
            <article className="metric-card">
              <span className="metric-icon">🎬</span>
              <h3>Total Videos</h3>
              <p>{stats?.totalVideos ?? "—"}</p>
            </article>
            <article className="metric-card">
              <span className="metric-icon">✅</span>
              <h3>Published</h3>
              <p>{stats?.publishedVideos ?? "—"}</p>
            </article>
            <article className="metric-card">
              <span className="metric-icon">📝</span>
              <h3>Drafts</h3>
              <p>{stats?.draftVideos ?? "—"}</p>
            </article>
            <article className="metric-card">
              <span className="metric-icon">👁</span>
              <h3>Total Views</h3>
              <p>{stats?.totalVideoViews ?? "—"}</p>
            </article>
            <article className="metric-card">
              <span className="metric-icon">📺</span>
              <h3>Story Series</h3>
              <p>{stats?.videosByType?.["story-series"] ?? "—"}</p>
            </article>
            <article className="metric-card">
              <span className="metric-icon">⚡</span>
              <h3>Quick Videos</h3>
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
                    <span className={v.isPublished ? "badge-ok" : "badge-pending"}>{v.isPublished ? "Live" : "Draft"}</span>
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
              <h2>Pending Teachers ({pendingTeachers.length})</h2>
              <Link to="/admin/approvals" className="btn-secondary-glass">View All</Link>
            </div>
            <div className="role-list">
              {pendingTeachers.slice(0, 4).map((t) => (
                <article key={t._id} className="role-item">
                  <div>
                    <strong>{t.displayName || t.username}</strong>
                    <p>@{t.username}</p>
                  </div>
                  <div className="role-actions">
                    <button type="button" className="btn-register" onClick={() => approveTeacher(t._id)}>Approve</button>
                    <button type="button" className="btn-secondary-glass" onClick={() => rejectTeacher(t._id)}>Reject</button>
                  </div>
                </article>
              ))}
              {pendingTeachers.length === 0 ? <p>No pending teachers.</p> : null}
            </div>
          </div>

          <div>
            <div className="role-section-header">
              <h2>Pending Word Lists ({pendingWordLists.length})</h2>
              <Link to="/admin/approvals" className="btn-secondary-glass">View All</Link>
            </div>
            <div className="role-list">
              {pendingWordLists.slice(0, 4).map((list) => (
                <article key={list._id} className="role-item">
                  <div>
                    <strong>{list.title}</strong>
                    <p>{list.teacherId?.displayName || list.teacherId?.username} • {list.words?.length || 0} words</p>
                  </div>
                  <button type="button" className="btn-register" onClick={() => approveWordList(list._id)}>Approve</button>
                </article>
              ))}
              {pendingWordLists.length === 0 ? <p>No pending word lists.</p> : null}
            </div>
          </div>
        </section>

        {/* Recent users */}
        <section className="glass-card">
          <div className="role-section-header">
            <h2>Recent Users</h2>
            <Link to="/admin/users" className="btn-secondary-glass">Manage All</Link>
          </div>
          <div className="table-wrap">
            <table className="role-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u._id}>
                    <td>{u.displayName || u.username}</td>
                    <td>{ROLE_BADGE[u.role]} {u.role}</td>
                    <td><span className={u.isActive ? "badge-ok" : "badge-pending"}>{u.isActive ? "Active" : "Disabled"}</span></td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
