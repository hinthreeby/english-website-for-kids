import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { useLocation, useNavigate } from "react-router-dom";
import CelebrationModal from "../components/CelebrationModal";
import LoadingDots from "../components/LoadingDots";
import LoginModal from "../components/LoginModal";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { celebrationMessages } from "../data/games";
import useProgress from "../hooks/useProgress";
import useSound from "../hooks/useSound";

const CompletionPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { addGuestStars, saveProgress } = useProgress();
  const { playPop, playChime } = useSound();
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [mergeMessage, setMergeMessage] = useState("");

  const message = useMemo(() => {
    const pick = Math.floor(Math.random() * celebrationMessages.length);
    return celebrationMessages[pick];
  }, []);

  useEffect(() => {
    if (!state?.stars || !state?.gameId) {
      navigate("/", { replace: true });
    }
  }, [navigate, state]);

  useEffect(() => {
    if (!state?.stars) {
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
    if (!state?.stars || !state?.gameId) {
      return;
    }

    const save = async () => {
      if (user) {
        setSaving(true);
        try {
          const data = await saveProgress(state.gameId, state.stars);
          setSaveResult(data.totals);
          await refreshUser();
        } catch {
          setSaveResult(null);
        } finally {
          setSaving(false);
        }
      } else {
        addGuestStars(state.stars);
      }
    };

    save();
  }, [addGuestStars, refreshUser, saveProgress, state?.gameId, state?.stars, user]);

  if (!state?.stars) {
    return null;
  }

  return (
    <div className="screen with-bg">
      <Navbar />
      <div className="completion-wrap">
        <CelebrationModal message={message} stars={state.stars} />
        {saving && <LoadingDots label="Saving your stars" />}

        {user ? (
          <div className="completion-card" style={{ borderColor: state.theme || "#fff" }}>
            <p>Great work! {state.gameName} is complete.</p>
            <p>Total Stars: ⭐ {saveResult?.totalStars ?? user.totalStars ?? 0}</p>
            <p>Streak: 🔥 {saveResult?.currentStreak ?? user.currentStreak ?? 0} days</p>
            <div className="action-row">
              <button
                className="kid-btn"
                type="button"
                onClick={() => {
                  playPop();
                  navigate(`/game/${state.gameId}`);
                }}
              >
                🔁 Play Again
              </button>
              <button
                className="kid-btn secondary"
                type="button"
                onClick={() => {
                  playPop();
                  navigate("/");
                }}
              >
                🎮 Choose Game
              </button>
              <button
                className="kid-btn"
                type="button"
                onClick={() => {
                  playPop();
                  navigate("/dashboard");
                }}
              >
                🏆 View My Stars
              </button>
            </div>
          </div>
        ) : (
          <div className="completion-card" style={{ borderColor: state.theme || "#fff" }}>
            <p>Save your stars! Login or create account 🌟</p>
            {mergeMessage && <p className="success-text">{mergeMessage}</p>}
            <div className="action-row">
              <button
                className="kid-btn"
                type="button"
                onClick={() => {
                  playPop();
                  setShowLogin(true);
                }}
              >
                🔐 Login / Sign Up
              </button>
              <button
                className="kid-btn secondary"
                type="button"
                onClick={() => {
                  playPop();
                  navigate(`/game/${state.gameId}`);
                }}
              >
                🔁 Play Again
              </button>
              <button
                className="kid-btn ghost"
                type="button"
                onClick={() => {
                  playPop();
                  navigate("/");
                }}
              >
                🏠 Home
              </button>
            </div>
          </div>
        )}
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
