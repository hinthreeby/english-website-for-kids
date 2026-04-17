import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GameCard from "../components/GameCard";
import Navbar from "../components/Navbar";
import StarBadge from "../components/StarBadge";
import StreakBanner from "../components/StreakBanner";
import { useAuth } from "../context/AuthContext";
import { games } from "../data/games";
import useProgress from "../hooks/useProgress";
import useSound from "../hooks/useSound";

const NICKNAME_KEY = "funenglish_nickname";

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getGuestStars } = useProgress();
  const { playPop } = useSound();
  const [nickname, setNickname] = useState(localStorage.getItem(NICKNAME_KEY) || "");
  const [nicknameInput, setNicknameInput] = useState(localStorage.getItem(NICKNAME_KEY) || "");

  const titleChars = useMemo(() => [..."Fun English!"], []);

  const saveNickname = () => {
    if (!nicknameInput.trim()) {
      return;
    }
    const cleaned = nicknameInput.trim().slice(0, 20);
    localStorage.setItem(NICKNAME_KEY, cleaned);
    setNickname(cleaned);
    playPop();
  };

  return (
    <div className="screen with-bg">
      <Navbar />
      {!nickname && (
        <div className="modal-backdrop">
          <div className="nickname-card">
            <h2>Hi! What&apos;s your name? 👋</h2>
            <input
              className="kid-input"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              maxLength={20}
              placeholder="Your name"
            />
            <button className="kid-btn" type="button" onClick={saveNickname}>
              Let&apos;s Play!
            </button>
          </div>
        </div>
      )}

      <header className="home-header">
        <motion.h1 className="title-bounce">
          <span>🌟 </span>
          {titleChars.map((ch, index) => (
            <motion.span
              key={`${ch}-${index}`}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 1, repeat: Infinity, delay: index * 0.06 }}
            >
              {ch}
            </motion.span>
          ))}
        </motion.h1>

        <div className="top-right-status">
          {user ? (
            <>
              <StarBadge stars={user.totalStars ?? 0} />
              <StreakBanner streak={user.currentStreak ?? 0} />
              <div className="badge-pill">🧒 {user.username}</div>
            </>
          ) : (
            <>
              <div className="badge-pill">👻 Playing as Guest</div>
              <StarBadge stars={getGuestStars()} />
              <div className="badge-pill">🧒 {nickname || "Friend"}</div>
            </>
          )}
        </div>
      </header>

      <main className="game-grid">
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
      </main>
    </div>
  );
};

export default HomePage;
