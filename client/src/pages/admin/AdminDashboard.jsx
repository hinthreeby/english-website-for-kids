import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/api";
import Navbar from "../../components/Navbar";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [pendingWordLists, setPendingWordLists] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [statsRes, teachersRes, listsRes, usersRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/pending-teachers"),
        api.get("/admin/pending-wordlists"),
        api.get("/admin/users?limit=8"),
      ]);
      setStats(statsRes.data);
      setPendingTeachers(teachersRes.data.teachers || []);
      setPendingWordLists(listsRes.data.lists || []);
      setRecentUsers(usersRes.data.users || []);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load admin stats");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approveTeacher = async (id) => {
    try {
      await api.patch(`/admin/approve-teacher/${id}`);
      load();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to approve teacher");
    }
  };

  const rejectTeacher = async (id) => {
    try {
      await api.patch(`/admin/user/${id}`, { isActive: false });
      load();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to reject teacher");
    }
  };

  const approveWordList = async (id) => {
    try {
      await api.patch(`/admin/approve-wordlist/${id}`);
      load();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to approve word list");
    }
  };

  const ROLE_BADGE = { child: "👦", parent: "👨‍👩‍👧", teacher: "👩‍🏫", admin: "🛡️" };

  return (
    <div className="screen with-bg role-page">
      <Navbar />
      <main className="role-wrap">
        <section className="role-hero glass-card">
          <h1>Admin Starport</h1>
          <p>System overview — users, activity, and pending approvals.</p>
        </section>

        {error ? <p className="error-msg">{error}</p> : null}

        <section className="glass-card role-grid role-grid-3">
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
        </section>

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
                    <button type="button" className="btn-register" onClick={() => approveTeacher(t._id)}>
                      Approve
                    </button>
                    <button type="button" className="btn-secondary-glass" onClick={() => rejectTeacher(t._id)}>
                      Reject
                    </button>
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
                  <button type="button" className="btn-register" onClick={() => approveWordList(list._id)}>
                    Approve
                  </button>
                </article>
              ))}
              {pendingWordLists.length === 0 ? <p>No pending word lists.</p> : null}
            </div>
          </div>
        </section>

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
                    <td>
                      <span className={u.isActive ? "badge-ok" : "badge-pending"}>
                        {u.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
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
