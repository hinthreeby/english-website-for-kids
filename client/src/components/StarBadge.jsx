import { motion } from "framer-motion";

const StarBadge = ({ stars }) => {
  return (
    <motion.div
      className="badge-pill"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <motion.span
        animate={{ rotate: [0, 18, -12, 0] }}
        transition={{ repeat: Infinity, duration: 2.2 }}
      >
        ⭐
      </motion.span>
      <span>{stars}</span>
    </motion.div>
  );
};

export default StarBadge;
