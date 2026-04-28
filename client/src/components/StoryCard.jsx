import { motion } from "framer-motion";

const accentByStory = {
  "secret-of-the-sea": "#42B8FF",
  "lucky-coin": "#FFD700",
  "lily": "#FF89C2",
};

const StoryCard = ({ story, onClick, index }) => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileTap={{ scale: 0.98 }}
      className="story-card"
      style={{ "--story-accent": accentByStory[story.id] || story.theme || "#42B8FF" }}
      onClick={onClick}
      type="button"
    >
      <div className="card-thumbnail story-thumbnail">
        {story.thumbnail ? (
          <img src={story.thumbnail} alt={story.title} className="story-thumbnail-img" />
        ) : (
          <div className="card-icon-fallback" aria-hidden="true">
            <span className="story-emoji">{story.emoji}</span>
          </div>
        )}

        <div className="card-text story-card-text">
          <h3 className="card-title">{story.title}</h3>
          <p className="card-subtitle">{story.description}</p>
        </div>
      </div>
    </motion.button>
  );
};

export default StoryCard;
