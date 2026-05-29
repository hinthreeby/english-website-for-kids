import { motion, AnimatePresence } from "framer-motion";

const SeriesDetailModal = ({ series, onClose, onPlayEpisode }) => {
  if (!series) return null;

  return (
    <AnimatePresence>
      <div
        className="modal-overlay series-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-label={`${series.title} episodes`}
        onClick={onClose}
      >
        <motion.div
          className="series-detail-modal"
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="series-modal-header"
            style={{ "--series-theme": series.theme || "#42B8FF" }}
          >
            <img
              src={series.thumbnail}
              alt={series.title}
              className="series-modal-thumb"
            />
            <div className="series-modal-info">
              <span className="video-badge series-badge">SERIES</span>
              <h2 className="series-modal-title">{series.title}</h2>
              <p className="series-modal-desc">{series.description}</p>
              <span className="episode-count-tag">📽 {series.episodes.length} Episodes</span>
            </div>
          </div>

          <div className="series-episode-list">
            <h3 className="episodes-heading">Episodes</h3>
            {series.episodes.map((ep) => (
              <button
                key={ep.id}
                type="button"
                className="episode-item"
                onClick={() => onPlayEpisode(ep)}
              >
                <span className="episode-num">{ep.id}</span>
                <span className="episode-title-text">{ep.title}</span>
                <span className="episode-dur">⏱ {ep.duration}</span>
                <span className="episode-play-icon">▶</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn-cancel series-close-btn"
            onClick={onClose}
          >
            ✕ Close
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SeriesDetailModal;
