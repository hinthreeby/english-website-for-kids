import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "../components/Navbar";
import PlanetCollection from "../components/PlanetCollection";
import SpaceBackground from "../components/SpaceBackground";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

const CollectionPage = () => {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [planetData, setPlanetData] = useState(null);

  useEffect(() => {
    if (!user) return;
    api.get("/api/progress/planets")
      .then((res) => {
        setPlanetData(res.data);
        refreshUser();
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const streak = planetData?.streak ?? user?.currentStreak ?? 0;
  const planetsUnlocked = planetData?.planetsUnlocked ?? user?.planetsUnlocked ?? [];

  // Keep existing stars for fallback (used by PlanetCollection internals if needed)
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
  void stars; // retained for any child components that rely on it

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{ background: "radial-gradient(circle at top, #2b0a5a 0%, #12002e 40%, #07001a 100%)" }}
    >
      <SpaceBackground />
      <Navbar />

      <main className="role-wrap" style={{ position: "relative", zIndex: 2, paddingTop: "80px" }}>
        <section className="role-hero glass-card">
          <h1
            style={{
              background: "linear-gradient(90deg,#ffd700,#ff6b9d,#a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 16px rgba(255,215,0,0.4))",
            }}
          >
            {t("collection.title")}
          </h1>
          <p style={{ color: "#c4b5fd" }}>
            {t("collection.subtitle")}
          </p>
        </section>

        <section className="glass-card">
          <PlanetCollection streak={streak} planetsUnlocked={planetsUnlocked} />
        </section>
      </main>
    </div>
  );
};

export default CollectionPage;
