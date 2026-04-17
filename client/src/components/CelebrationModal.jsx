import { motion } from "framer-motion";

const CelebrationModal = ({ message, stars }) => {
  return (
    <motion.div
      className="celebration-box"
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <h2>{message}</h2>
      <motion.p
        className="stars-earned"
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.5 }}
      >
        ⭐ You earned {stars} stars!
      </motion.p>
    </motion.div>
  );
};

export default CelebrationModal;
