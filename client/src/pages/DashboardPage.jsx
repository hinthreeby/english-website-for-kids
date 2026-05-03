import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingDots from "../components/LoadingDots";
import Navbar from "../components/Navbar";
import starImg from "../assets/general/star/star.png";
import { useAuth } from "../context/AuthContext";
import { gameById } from "../data/games";
import useProgress from "../hooks/useProgress";
import useSound from "../hooks/useSound";

const GAME_META = {
  "abc-letters": { name: "ABC Letters", emoji: "🔤" },
  "picture-words": { name: "Picture Words", emoji: "🖼️" },
  "count-learn": { name: "Count Learn", emoji: "🔢" },
  "color-fun": { name: "Color Fun", emoji: "🎨" },
  "animal-sounds": { name: "Animal Sounds", emoji: "🐾" },
  "match-it": { name: "Match It", emoji: "🧩" },
  "space-pronounce": { name: "Space Pronounce", emoji: "🚀" },
  "funny-animals": { name: "Funny Animals", emoji: "🐾" },
  "clean-ocean-hero": { name: "Clean Ocean Hero", emoji: "🌊" },
};

const toLabel = (id) =>
  id
    ?.split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Unknown Game";

const getGameName = (id) => GAME_META[id]?.name || gameById[id]?.name || toLabel(id);
const getGameEmoji = (id) => GAME_META[id]?.emoji || gameById[id]?.emoji || "🎮";
const STAR_COUNT = 20;

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
    <div className="screen with-bg stars-page">
      <div className="space-stars star-field" aria-hidden="true">
        {Array.from({ length: STAR_COUNT }).map((_, i) => (
          <img key={i} src={starImg} className={`space-star space-star-${i}`} alt="" />
        ))}
      </div>

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
            <h1 className="stars-page-title">Stars & History</h1>

            <div className="stars-summary">
              <div className="stars-summary-card total-stars-card">
                <div className="value">
                  <span className="value-star" aria-hidden="true">
                    ⭐
                  </span>{" "}
                  {user.totalStars || 0}
                </div>
                <div className="label">TOTAL STARS</div>
              </div>
              <div className="stars-summary-card">
                <div className="value">{user.currentStreak || 0}</div>
                <div className="label">DAY STREAK</div>
              </div>
              <div className="stars-summary-card">
                <div className="value">{results.length}</div>
                <div className="label">GAMES PLAYED</div>
              </div>
            </div>

            <section className="history-list">
              {results.length === 0 ? (
                <p>No games yet. Play your first game!</p>
              ) : (
                results.map((item) => {
                  const gameName = getGameName(item.gameId);
                  const gameEmoji = getGameEmoji(item.gameId);
                  return (
                    <article key={item._id} className="history-item">
                      <div className="history-item-left">
                        <div className="history-game-icon">{gameEmoji}</div>
                        <div>
                          <p className="history-game-name">{gameName}</p>
                          <p className="history-date">{new Date(item.completedAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="history-stars">⭐ {item.starsEarned}</div>
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
