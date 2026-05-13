import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { useLocation, useNavigate } from "react-router-dom";
import astronautImg from "../assets/general/astronaut/astronaut_3.png";
import jupiterImg from "../assets/general/planet/jupiter.png";
import starImg from "../assets/general/star/star.png";
const gameResultSound = "/sounds/Game-Result.mp3";
import { useAuth } from "../context/AuthContext";
import { celebrationMessages } from "../data/games";
import useProgress from "../hooks/useProgress";
import useSound from "../hooks/useSound";
import PlanetUnlockModal from "../components/PlanetUnlockModal";

const CompletionPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { addGuestStars, getGuestStars, saveProgress } = useProgress();
  const { playPop } = useSound();
  const [isSaving, setIsSaving] = useState(false);
  const [savedData, setSavedData] = useState(null);
  const [error, setError] = useState(null);
  const [unlockedPlanet, setUnlockedPlanet] = useState(null);
  const [bonusInfo, setBonusInfo] = useState({ awarded: false, stars: 0 });
  const hasSaved = useRef(false);
  const hasPlayedCelebration = useRef(false);
  const audioRef = useRef({ success: null, celebration: null });

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
    
    // Play success sound
    const successAudio = new Audio("/sounds/success.mp3");
    successAudio.volume = 0.6;
    successAudio.play().catch(() => {
      console.log("Autoplay blocked");
    });
    audioRef.current.success = successAudio;
    
    // Play game result celebration sound with delay
    const celebrationAudio = new Audio(gameResultSound);
    celebrationAudio.volume = 0.7;
    setTimeout(() => {
      celebrationAudio.play().catch(() => {
        console.log("Celebration sound autoplay blocked");
      });
    }, 500);
    audioRef.current.celebration = celebrationAudio;
  }, [state?.stars]);

  useEffect(() => {
    if (state?.stars == null) {
      return;
    }
    
    const timeoutIds = [];
    
    // Reset confetti and start immediately with small delay to ensure DOM is ready
    const startConfetti = setTimeout(() => {
      // Main burst from center
      confetti({
        particleCount: 250,
        spread: 90,
        origin: { y: 0.6 },
        gravity: 0.8,
        decay: 0.95,
      });
      
      // Left side burst
      timeoutIds.push(setTimeout(() => {
        confetti({
          particleCount: 180,
          angle: 60,
          spread: 60,
          origin: { x: 0.1, y: 0.5 },
          gravity: 0.8,
          decay: 0.95,
        });
      }, 150));
      
      // Right side burst
      timeoutIds.push(setTimeout(() => {
        confetti({
          particleCount: 180,
          angle: 120,
          spread: 60,
          origin: { x: 0.9, y: 0.5 },
          gravity: 0.8,
          decay: 0.95,
        });
      }, 300));
      
      // Top burst
      timeoutIds.push(setTimeout(() => {
        confetti({
          particleCount: 120,
          spread: 180,
          origin: { y: 0.2 },
          gravity: 0.7,
          decay: 0.93,
        });
      }, 450));
      
      // Bottom burst
      timeoutIds.push(setTimeout(() => {
        confetti({
          particleCount: 100,
          angle: 90,
          spread: 120,
          origin: { y: 0.9 },
          gravity: 1,
          decay: 0.96,
        });
      }, 600));
      
      // Continue with repeated bursts every 2 seconds until component unmounts
      const repeatConfetti = setInterval(() => {
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: Math.random() * 0.6 + 0.3 },
          gravity: 0.8,
          decay: 0.95,
        });
      }, 2000);
      
      timeoutIds.push(repeatConfetti);
    }, 50);
    
    timeoutIds.push(startConfetti);
    
    // Cleanup: clear all timeouts when component unmounts
    return () => {
      timeoutIds.forEach(id => {
        if (typeof id === 'number') {
          clearTimeout(id);
          clearInterval(id);
        }
      });
    };
  }, [state?.stars]);

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current.success) {
        audioRef.current.success.pause();
        audioRef.current.success.currentTime = 0;
      }
      if (audioRef.current.celebration) {
        audioRef.current.celebration.pause();
        audioRef.current.celebration.currentTime = 0;
      }
    };
  }, []);

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
          if (data.newPlanet) {
            setUnlockedPlanet(data.newPlanet);
            setBonusInfo({ awarded: data.bonusAwarded ?? false, stars: data.bonusStars ?? 0 });
          }
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

      {unlockedPlanet && (
        <PlanetUnlockModal
          planetId={unlockedPlanet}
          bonusAwarded={bonusInfo.awarded}
          bonusStars={bonusInfo.stars}
          onClose={() => setUnlockedPlanet(null)}
        />
      )}
    </div>
  );
};

export default CompletionPage;
