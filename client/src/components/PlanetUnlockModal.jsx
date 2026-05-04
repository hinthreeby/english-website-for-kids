import { useEffect } from "react";
import confetti from "canvas-confetti";
import { getPlanetById } from "../data/planets";

const PlanetUnlockModal = ({ planetId, bonusAwarded, bonusStars, onClose }) => {
  const planet = getPlanetById(planetId);

  useEffect(() => {
    confetti({
      particleCount: 180,
      spread: 80,
      origin: { y: 0.55 },
      colors: ["#7b2ff7", "#ff6b9d", "#ffd700", "#c9b8ff", "#b2ebf2"],
    });
  }, []);

  if (!planet) return null;

  return (
    <div className="planet-modal-overlay" onClick={onClose}>
      <div className="planet-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="planet-modal-glow" />
        <p className="planet-modal-label">🌌 Planet Unlocked!</p>
        <img src={planet.img} alt={planet.name} className="planet-modal-img" />
        <h2 className="planet-modal-name">{planet.name}</h2>
        <p className="planet-modal-streak">
          {planet.requiredStreak} days streak achieved!
        </p>

        {bonusAwarded && (
          <div className="planet-bonus-banner">
            🎉 All 8 planets collected! +{bonusStars} bonus stars!
          </div>
        )}

        <button className="btn-register planet-modal-btn" type="button" onClick={onClose}>
          Awesome! ✨
        </button>
      </div>
    </div>
  );
};

export default PlanetUnlockModal;
