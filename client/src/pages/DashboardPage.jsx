import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingDots from "../components/LoadingDots";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { gameById } from "../data/games";
import useProgress from "../hooks/useProgress";
import useSound from "../hooks/useSound";

const DashboardPage = () => {
  const { user, loading } = useAuth();
  const { fetchMyProgress } = useProgress();
  const { playPop } = useSound();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await fetchMyProgress();
        setResults(data.results || []);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [fetchMyProgress, user]);

  if (loading || isLoading) {
    return (
      <div className="screen with-bg centered">
        <LoadingDots label="Loading dashboard" />
      </div>
    );
  }

  return (
    <div className="screen with-bg">
      <Navbar />
      <main className="dashboard-wrap">
        {!user ? (
          <div className="completion-card">
            <h2>Join to save your stars 🌟</h2>
            <button
              type="button"
              className="kid-btn"
              onClick={() => {
                playPop();
                navigate("/login");
              }}
            >
              🔐 Login / Sign Up
            </button>
          </div>
        ) : (
          <>
            <div className="stats-row">
              <div className="stat-card">⭐ Total Stars: {user.totalStars || 0}</div>
              <div className="stat-card">🔥 Streak: {user.currentStreak || 0} days</div>
              <div className="stat-card">🎮 Games: {results.length}</div>
            </div>
            <section className="results-list">
              {results.length === 0 ? (
                <p>No games yet. Play your first game!</p>
              ) : (
                results.map((item) => {
                  const game = gameById[item.gameId];
                  return (
                    <article key={item._id} className="result-item" style={{ borderColor: game?.theme || "#fff" }}>
                      <div>
                        <strong>{game?.emoji || "🎮"} {game?.name || item.gameId}</strong>
                        <p>{new Date(item.completedAt).toLocaleString()}</p>
                      </div>
                      <div className="result-stars">⭐ {item.starsEarned}</div>
                    </article>
                  );
                })
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
