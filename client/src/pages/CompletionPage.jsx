import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { useLocation, useNavigate } from "react-router-dom";
import astronautImg from "../assets/astronaut_3.png";
import jupiterImg from "../assets/jupiter.png";
import starImg from "../assets/star.png";
import { useAuth } from "../context/AuthContext";
import { celebrationMessages } from "../data/games";
import useProgress from "../hooks/useProgress";
import useSound from "../hooks/useSound";

const CompletionPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { addGuestStars, getGuestStars, saveProgress } = useProgress();
  const { playPop } = useSound();
  const [isSaving, setIsSaving] = useState(false);
  const [savedData, setSavedData] = useState(null);
  const [error, setError] = useState(null);
  const hasSaved = useRef(false);
  const hasPlayedCelebration = useRef(false);

  const starsEarned = Math.max(0, Math.min(3, Number(state?.stars || 0)));

  const message = useMemo(() => {
    const pick = Math.floor(Math.random() * celebrationMessages.length);
    return celebrationMessages[pick];
  }, []);

  const decorativeStars = useMemo(
    () =>
      Array.from({ length: 20 }, (_, index) => ({
        id: index,
        top: `${(Math.random() * 96 + 2).toFixed(2)}%`,
        left: `${(Math.random() * 96 + 2).toFixed(2)}%`,
        delay: `${(Math.random() * 3).toFixed(2)}s`,
        duration: `${(2 + Math.random() * 1.8).toFixed(2)}s`,
        size: `${(16 + Math.random() * 12).toFixed(2)}px`,
        offset: `${(Math.random() * 20).toFixed(2)}px`,
      })),
    [],
  );

  useEffect(() => {
    if (state?.stars == null || !state?.gameId) {
      navigate("/", { replace: true });
    }
  }, [navigate, state]);

  useEffect(() => {
    if (state?.stars == null || hasPlayedCelebration.current) {
      return;
    }

    hasPlayedCelebration.current = true;
    const audio = new Audio("/sounds/success.mp3");
    audio.volume = 0.6;
    audio.play().catch(() => {
      console.log("Autoplay blocked");
    });
  }, [state?.stars]);

  useEffect(() => {
    if (state?.stars == null) {
      return;
    }
    confetti({
      particleCount: 220,
      spread: 90,
      origin: { y: 0.6 },
    });
  }, [state?.stars]);

  useEffect(() => {
    if (state?.stars == null || !state?.gameId || hasSaved.current) {
      return;
    }
    hasSaved.current = true;

    const save = async () => {
      if (user) {
        setIsSaving(true);
        setError(null);
        try {
          const data = await saveProgress(state.gameId, starsEarned);
          setSavedData({
            totalStars: data.totalStars ?? data.totals?.totalStars ?? user.totalStars ?? 0,
            streak: data.streak ?? data.totals?.currentStreak ?? user.currentStreak ?? 0,
          });
          await refreshUser();
        } catch (err) {
          console.error("Save failed:", err);
          setError("Could not save. Try again.");
        } finally {
          setIsSaving(false);
        }
      } else {
        addGuestStars(starsEarned);
        setSavedData({ totalStars: getGuestStars(), streak: 0 });
      }
    };

    save();
  }, [addGuestStars, getGuestStars, refreshUser, saveProgress, starsEarned, state?.gameId, state?.stars, user]);

  if (state?.stars == null) {
    return null;
  }

  const titleText =
    starsEarned === 3 ? "🎉 Perfect!" : starsEarned === 2 ? "🌟 Great Job!" : "✨ Well Done!";

  return (
    <div className="completion-page">
      <div className="space-stars" aria-hidden="true" />
      <div className="completion-stars-bg" aria-hidden="true" />

      <img src={astronautImg} alt="" className="completion-astronaut" aria-hidden="true" />
      <img src={jupiterImg} alt="" className="completion-planet" aria-hidden="true" />

      {decorativeStars.map((star) => (
        <img
          key={star.id}
          src={starImg}
          alt=""
          className="completion-star"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            animationDelay: star.delay,
            animationDuration: star.duration,
            "--star-offset": star.offset,
          }}
          aria-hidden="true"
        />
      ))}

      <div className="completion-card">
        <div className="completion-stars-earned">
          {[1, 2, 3].map((star) => (
            <span key={star} className={`star-icon ${star <= starsEarned ? "active" : "inactive"}`}>
              ⭐
            </span>
          ))}
        </div>

        <h2 className="completion-title">{titleText}</h2>
        <p className="completion-game-name">{state.gameName} is complete!</p>
        <p className="completion-message">{message}</p>

        {isSaving && (
          <div className="saving-indicator">
            <span className="saving-dot" />
            <span className="saving-dot" />
            <span className="saving-dot" />
            <span>Saving your stars...</span>
          </div>
        )}

        {error && <p className="error-text">{error}</p>}
        {savedData && !isSaving && (
          <div className="completion-stats">
            <div className="stat-item">
              <span className="stat-icon">⭐</span>
              <span className="stat-value">{savedData.totalStars}</span>
              <span className="stat-label">Total Stars</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-icon">🔥</span>
              <span className="stat-value">{savedData.streak}</span>
              <span className="stat-label">Day Streak</span>
            </div>
          </div>
        )}

        <div className="completion-buttons">
          {user ? (
            <>
              <button
                className="btn-completion btn-play-again"
                type="button"
                onClick={() => {
                  playPop();
                  navigate(`/game/${state.gameId}`);
                }}
              >
                🔄 Play Again
              </button>
              <button
                className="btn-completion btn-choose-game"
                type="button"
                onClick={() => {
                  playPop();
                  navigate("/");
                }}
              >
                🎮 Choose Game
              </button>
              <button
                className="btn-completion btn-view-stars"
                type="button"
                onClick={() => {
                  playPop();
                  navigate("/dashboard");
                }}
              >
                ⭐ My Stars
              </button>
            </>
          ) : (
            <>
              <button
                className="btn-completion btn-play-again"
                type="button"
                onClick={() => {
                  playPop();
                  navigate(`/game/${state.gameId}`);
                }}
              >
                🔄 Play Again
              </button>
              <button
                className="btn-completion btn-choose-game"
                type="button"
                onClick={() => {
                  playPop();
                  navigate("/");
                }}
              >
                🎮 Choose Game
              </button>
              <button
                className="btn-completion btn-view-stars"
                type="button"
                onClick={() => {
                  playPop();
                  navigate("/login");
                }}
              >
                🔐 Login to Save
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompletionPage;
