import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { stories } from "../data/stories";
import Navbar from "../components/Navbar";
import LoadingDots from "../components/LoadingDots";
import useSound from "../hooks/useSound";
import "../styles/StoryPlayer.css";

const StoryPlayerPage = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const { playPop } = useSound();

  const story = stories.find((s) => s.id === storyId);

  if (!story) {
    return (
      <div className="screen with-bg centered">
        <LoadingDots label="Loading story" />
      </div>
    );
  }

  const handleBack = () => {
    playPop();
    navigate("/");
  };

  return (
    <div className="screen with-bg space-bg">
      <Navbar />

      <main className="story-player-container">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="back-button story-back-button"
          onClick={handleBack}
          type="button"
          aria-label="Go back"
        >
          ← <span>Back</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="story-player"
        >
          <div className="video-wrapper">
            <motion.video
              key={story.id}
              controls
              autoPlay
              className="story-video"
              style={{ "--story-accent": story.theme || "#42B8FF" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <source src={story.videoPath} type="video/mp4" />
              Your browser does not support the video tag.
            </motion.video>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="story-info"
          >
            <h1 className="story-player-title">{story.title}</h1>
            <p className="story-player-description">{story.description}</p>
            {story.duration && (
              <p className="story-player-duration">⏱️ Duration: {story.duration}</p>
            )}
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default StoryPlayerPage;
