import { motion } from "framer-motion";

const SeriesCard = ({ series, index, onClick }) => {
  const epCount = series.episodes.length;
  const current = series.currentEpisode || 1;

  return (
    <motion.button
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileTap={{ scale: 0.98 }}
      className="story-card series-card"
      style={{ "--story-accent": series.theme || "#42B8FF" }}
      onClick={onClick}
      type="button"
    >
      <div className="card-thumbnail story-thumbnail">
        {series.thumbnail ? (
          <img src={series.thumbnail} alt={series.title} className="story-thumbnail-img" />
        ) : (
          <div className="card-icon-fallback" aria-hidden="true">🎬</div>
        )}

        <span className="video-badge series-badge">SERIES</span>

        <div className="card-text story-card-text">
          <div className="series-card-meta">
            <span className="episode-count-tag">📽 {epCount} Episodes</span>
            <span className="episode-progress-tag">Episode {current}/{epCount}</span>
          </div>
          <h3 className="card-title">{series.title}</h3>
        </div>
      </div>
    </motion.button>
  );
};

export default SeriesCard;
