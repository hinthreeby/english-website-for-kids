import { motion } from "framer-motion";

const accentByGame = {
  "abc-letters": "#2ec5ff",
  "picture-words": "#ffd59a",
  "count-learn": "#72f7a5",
  "color-fun": "#ffb06a",
  "animal-sounds": "#ff8dc1",
  "match-it": "#d2ff67",
};

const GameCard = ({ game, onClick, index }) => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileTap={{ scale: 0.98 }}
      className="game-card"
      style={{ "--game-accent": accentByGame[game.id] || game.theme || "#7b2ff7" }}
      onClick={onClick}
      type="button"
    >
      <span className="game-emoji" aria-hidden="true">
        {game.emoji}
      </span>
      <h3>{game.name}</h3>
      <p>{game.subtitle}</p>
    </motion.button>
  );
};

export default GameCard;
