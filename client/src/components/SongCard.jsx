import { motion } from "framer-motion";

const SongCard = ({ song, index, onClick }) => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileTap={{ scale: 0.98 }}
      className="story-card song-card"
      style={{ "--story-accent": song.theme || "#FF6B9D" }}
      onClick={onClick}
      type="button"
    >
      <div className="card-thumbnail story-thumbnail">
        {song.thumbnail ? (
          <img src={song.thumbnail} alt={song.title} className="story-thumbnail-img" />
        ) : (
          <div
            className="song-cover"
            style={{
              background: `radial-gradient(circle at 38% 38%, ${song.theme}55 0%, #1a0533 70%)`,
            }}
          >
            <span className="song-emoji-big">{song.emoji || "🎵"}</span>
            <span className="song-notes-deco" aria-hidden="true">♪ ♫ ♪</span>
          </div>
        )}

        <span className="video-badge song-badge">SONG</span>

        <div className="card-text story-card-text">
          {song.duration && (
            <span className="video-duration-tag">⏱ {song.duration}</span>
          )}
          <h3 className="card-title">{song.title}</h3>
        </div>
      </div>
    </motion.button>
  );
};

export default SongCard;
