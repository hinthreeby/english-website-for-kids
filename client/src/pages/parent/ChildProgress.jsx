import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../lib/api";
import Navbar from "../../components/Navbar";

const ChildProgress = () => {
  const { childId } = useParams();
  const [data, setData] = useState({ child: null, results: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/parent/child/${childId}/progress`);
        setData({ child: res.data.child, results: res.data.results || [] });
      } catch (err) {
        setError(err?.response?.data?.error || "Failed to load progress");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [childId]);

  return (
    <div className="screen with-bg role-page">
      <Navbar />
      <main className="role-wrap">
        <section className="role-hero glass-card">
          <h1>Child Progress</h1>
          {data.child ? (
            <p>
              {data.child.displayName || data.child.username} • ⭐ {data.child.totalStars || 0} • Streak{" "}
              {data.child.currentStreak || 0}
            </p>
          ) : null}
        </section>

        <section className="glass-card">
          <h2>Recent Games</h2>
          {loading ? <p>Loading...</p> : null}
          {error ? <p className="error-msg">{error}</p> : null}
          {!loading && !error && data.results.length === 0 ? <p>No game records yet.</p> : null}
          <div className="role-list">
            {data.results.map((item) => (
              <article key={item._id} className="role-item">
                <div>
                  <strong>{item.gameId}</strong>
                  <p>{new Date(item.completedAt).toLocaleString()}</p>
                </div>
                <div className="nav-stars">⭐ {item.starsEarned}</div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default ChildProgress;
