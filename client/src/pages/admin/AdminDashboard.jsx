import { useEffect, useState } from "react";
import api from "../../lib/api";
import Navbar from "../../components/Navbar";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [pendingWordLists, setPendingWordLists] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, teachersRes, listsRes, usersRes] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/pending-teachers"),
          api.get("/admin/pending-wordlists"),
          api.get("/admin/users?limit=5"),
        ]);
        setStats(statsRes.data);
        setPendingTeachers(teachersRes.data.teachers || []);
        setPendingWordLists(listsRes.data.lists || []);
        setRecentUsers(usersRes.data.users || []);
      } catch (err) {
        setError(err?.response?.data?.error || "Failed to load admin stats");
      }
    };
    load();
  }, []);

  return (
    <div className="screen with-bg role-page">
      <Navbar />
      <main className="role-wrap">
        <section className="role-hero glass-card">
          <h1>Admin Starport</h1>
          <p>System overview, pending approvals, and user activity.</p>
        </section>

        <section className="glass-card role-grid role-grid-3">
          <article className="metric-card">
            <h3>Total Users</h3>
            <p>{stats?.totalUsers ?? "-"}</p>
          </article>
          <article className="metric-card">
            <h3>Games Played</h3>
            <p>{stats?.totalGames ?? "-"}</p>
          </article>
          <article className="metric-card">
            <h3>Stars Given</h3>
            <p>{stats?.totalStarsGiven ?? "-"}</p>
          </article>
        </section>

        <section className="glass-card role-grid role-grid-3">
          <div>
            <h2>Pending Teachers</h2>
            <p>{pendingTeachers.length}</p>
          </div>
          <div>
            <h2>Pending Word Lists</h2>
            <p>{pendingWordLists.length}</p>
          </div>
          <div>
            <h2>Recent Users</h2>
            <p>{recentUsers.length}</p>
          </div>
        </section>

        {error ? <p className="error-msg">{error}</p> : null}
      </main>
    </div>
  );
};

export default AdminDashboard;
