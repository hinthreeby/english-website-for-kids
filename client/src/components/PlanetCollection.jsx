import { PLANETS, getNextPlanet } from "../data/planets";

const PlanetCollection = ({ streak = 0, planetsUnlocked = [] }) => {
  const nextPlanet = getNextPlanet(streak);
  const progressPct = nextPlanet
    ? Math.round(((streak - (nextPlanet.requiredStreak - 2)) / 2) * 100)
    : 100;

  return (
    <section className="planet-collection">
      <div className="planet-collection-header">
        <span className="streak-badge">🔥 {streak} day streak</span>
        {nextPlanet ? (
          <span className="planet-next-hint">
            {nextPlanet.requiredStreak - streak} more day{nextPlanet.requiredStreak - streak !== 1 ? "s" : ""} → {nextPlanet.name}
          </span>
        ) : (
          <span className="planet-next-hint">🏆 All planets collected!</span>
        )}
      </div>

      {nextPlanet && (
        <div className="planet-progress-bar-wrap">
          <div
            className="planet-progress-bar-fill"
            style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
          />
        </div>
      )}

      <div className="planet-grid">
        {PLANETS.map((planet) => {
          const unlocked = planetsUnlocked.includes(planet.id);
          return (
            <div key={planet.id} className={`planet-slot ${unlocked ? "unlocked" : "locked"}`}>
              <div className="planet-slot-inner">
                <img
                  src={planet.img}
                  alt={planet.name}
                  className="planet-slot-img"
                  draggable={false}
                />
                {!unlocked && <div className="planet-lock-overlay">🔒</div>}
              </div>
              <span className="planet-slot-name">{planet.name}</span>
              {!unlocked && (
                <span className="planet-slot-req">🔥{planet.requiredStreak}</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PlanetCollection;
