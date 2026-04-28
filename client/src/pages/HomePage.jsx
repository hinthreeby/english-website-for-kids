import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import GameCard from "../components/GameCard";
import StoryCard from "../components/StoryCard";
import MascotGreeting from "../components/MascotGreeting";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { games } from "../data/games";
import { stories } from "../data/stories";
import useSound from "../hooks/useSound";
import earthPlanet from "../assets/earth.png";
import jupiterPlanet from "../assets/jupiter.png";
import marsPlanet from "../assets/mars.png";
import starRock from "../assets/star.png";

const HomePage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { playPop } = useSound();

  const stars = useMemo(
    () =>
      Array.from({ length: 100 }, (_, index) => ({
        id: index,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() > 0.7 ? 2 : 1,
        duration: (Math.random() * 3 + 2).toFixed(2),
        delay: (Math.random() * 5).toFixed(2),
      })),
    [],
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

      <div className="floating-decorations" aria-hidden="true">
        <span className="float-star f1">✦</span>
        <span className="float-star f2">★</span>
        <span className="float-star f3">✦</span>
        <span className="float-star f4">★</span>
        <span className="float-star f5">✦</span>
        <span className="float-star f6">★</span>
      </div>

      <main className="home-main">
        <section className="hero">
          <div className="planets-layer" aria-hidden="true">
            <img src={earthPlanet} alt="" className="planet planet-orb" />
            <img src={jupiterPlanet} alt="Jupiter" className="planet planet-jupiter" />
            <img src={marsPlanet} alt="Mars" className="planet planet-mars" />
            <img src={starRock} alt="" className="asteroid a1" />
            <img src={starRock} alt="" className="asteroid a2" />
            <img src={starRock} alt="" className="asteroid a3" />
          </div>

          <div className="hero-title-wrapper">
            <h1 className="space-title">
              <span>FUN</span>
              <span>ENGLISH</span>
            </h1>
            <p className="hero-subtitle">WEBSITE LEARNING ENGLISH FOR KIDS</p>
          </div>
        </section>

        <section className="games-section">
          <h2 className="section-title">✨ CHOOSE A GAME ✨</h2>
          <div className="section-divider" />

          <div className="game-grid home-game-grid">
            {games.map((game, index) => (
              <GameCard
                key={game.id}
                game={game}
                index={index}
                onClick={() => {
                  playPop();
                  navigate(`/game/${game.id}`);
                }}
              />
            ))}
          </div>
        </section>

        <section className="stories-section">
          <h2 className="section-title">🎬 LEARN BY VIDEOS 🎬</h2>
          <div className="section-divider" />

          <div className="story-grid home-story-grid">
            {stories.map((story, index) => (
              <StoryCard
                key={story.id}
                story={story}
                index={index}
                onClick={() => {
                  playPop();
                  navigate(`/story/${story.id}`);
                }}
              />
            ))}
          </div>
        </section>
      </main>

      <MascotGreeting user={user} isAuthLoading={loading} />
    </div>
  );
};

export default HomePage;
