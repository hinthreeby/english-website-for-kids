import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { useLocation, useNavigate } from "react-router-dom";
import LoginModal from "../components/LoginModal";
import { useAuth } from "../context/AuthContext";
import { celebrationMessages } from "../data/games";
import useProgress from "../hooks/useProgress";
import useSound from "../hooks/useSound";

const CompletionPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { addGuestStars, getGuestStars, saveProgress } = useProgress();
  const { playPop, playChime } = useSound();
  const [isSaving, setIsSaving] = useState(false);
  const [savedData, setSavedData] = useState(null);
  const [error, setError] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [mergeMessage, setMergeMessage] = useState("");
  const hasSaved = useRef(false);

  const starsEarned = Math.max(0, Math.min(3, Number(state?.stars || 0)));

  const message = useMemo(() => {
    const pick = Math.floor(Math.random() * celebrationMessages.length);
    return celebrationMessages[pick];
  }, []);

  useEffect(() => {
    if (state?.stars == null || !state?.gameId) {
      navigate("/", { replace: true });
    }
  }, [navigate, state]);

  useEffect(() => {
    if (state?.stars == null) {
      return;
    }
    playChime();
    confetti({
      particleCount: 220,
      spread: 90,
      origin: { y: 0.6 },
    });
  }, [playChime, state?.stars]);

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
      <div className="completion-stars-bg" aria-hidden="true" />

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
        {mergeMessage && <p className="success-text">{mergeMessage}</p>}

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
                  setShowLogin(true);
                }}
              >
                🔐 Login to Save
              </button>
            </>
          )}
        </div>
      </div>

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={(merged) => {
            setShowLogin(false);
            if (merged > 0) {
              setMergeMessage(`You had ${merged} stars! They're saved now 🌟`);
            }
          }}
        />
      )}
    </div>
  );
};

export default CompletionPage;
