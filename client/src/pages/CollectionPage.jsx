import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import PlanetCollection from "../components/PlanetCollection";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

const CollectionPage = () => {
  const { user, refreshUser } = useAuth();
  const [planetData, setPlanetData] = useState(null);

  useEffect(() => {
    if (!user) return;
    api.get("/progress/planets")
      .then((res) => {
        setPlanetData(res.data);
        // sync context if backend retroactively fixed planets
        refreshUser();
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const streak = planetData?.streak ?? user?.currentStreak ?? 0;
  const planetsUnlocked = planetData?.planetsUnlocked ?? user?.planetsUnlocked ?? [];

  const stars = useMemo(
    () =>
      Array.from({ length: 100 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() > 0.7 ? 2 : 1,
        duration: (Math.random() * 3 + 2).toFixed(2),
        delay: (Math.random() * 5).toFixed(2),
      })),
    []
  );

  return (
    <div className="screen with-bg space-bg">
      <Navbar />

      <div className="star-field" aria-hidden="true">
        {stars.map((star) => (
          <span
            key={star.id}
            className="space-star"
            style={{
              "--star-x": `${star.x}%`,
              "--star-y": `${star.y}%`,
              "--star-size": `${star.size}px`,
              "--star-duration": `${star.duration}s`,
              "--star-delay": `${star.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="nebula-glow" aria-hidden="true" />

      <main className="role-wrap">
        <section className="role-hero glass-card">
          <h1>Planet Collection</h1>
          <p>Keep your streak alive to unlock all 8 planets in the solar system!</p>
        </section>

        <section className="glass-card">
          <PlanetCollection streak={streak} planetsUnlocked={planetsUnlocked} />
        </section>
      </main>
    </div>
  );
};

export default CollectionPage;
