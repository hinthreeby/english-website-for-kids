import { motion } from "framer-motion";

const GameCard = ({ game, onClick, index }) => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ y: -8, scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="game-card shimmer"
      style={{ backgroundColor: game.theme }}
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
