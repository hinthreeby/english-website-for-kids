import { useEffect, useMemo, useRef, useState } from "react";
import beginningScene from "../assets/story_puppy_adventure/the_beginning.png";
import blueHouseScene from "../assets/story_puppy_adventure/the_blue_house.png";
import boatTripScene from "../assets/story_puppy_adventure/the_boat_trip.png";
import forestScene from "../assets/story_puppy_adventure/the_forest_adventure.png";
import hungryScene from "../assets/story_puppy_adventure/the_hungry_puppy.png";
import magicBridgeScene from "../assets/story_puppy_adventure/the_magic_bridge.png";
import storyBanner from "../assets/story_puppy_adventure/story_banner.png";
import secretNameScene from "../assets/story_puppy_adventure/the_secret_name.png";
import waitingParkScene from "../assets/story_puppy_adventure/waiting_in_the_park.png";
import "./StoryPuppyAdventure.css";

const STORY_PAGES = {
  1: {
    id: 1,
    title: "The Beginning",
    body: [
      "You are walking in the park.",
      "Suddenly, you see a small, white puppy under a tree.",
      "He looks sad and lost.",
    ],
    image: beginningScene,
    options: [
      { key: "A", text: "Give the puppy some of your sandwich.", nextPageId: 2 },
      { key: "B", text: "Look at his collar to find his name.", nextPageId: 3 },
    ],
  },
  2: {
    id: 2,
    title: "The Hungry Puppy",
    body: [
      "The puppy eats the sandwich and wags his tail.",
      "But wait, he suddenly starts running toward the forest.",
    ],
    image: hungryScene,
    options: [
      { key: "A", text: "Follow him into the forest.", nextPageId: 4 },
      { key: "B", text: "Stay in the park and call for help.", nextPageId: 5 },
    ],
  },
  3: {
    id: 3,
    title: "The Secret Name",
    body: [
      "You read the collar: My name is Snowy. I live at Blue House.",
      "You look around and see a blue house far away.",
    ],
    image: secretNameScene,
    options: [
      { key: "A", text: "Walk to the Blue House.", nextPageId: 6 },
      { key: "B", text: "Wait for Snowy's owner in the park.", nextPageId: 5 },
    ],
  },
  4: {
    id: 4,
    title: "The Forest Adventure",
    body: [
      "The forest is beautiful but dark.",
      "Snowy stops at a big river. There is a bridge and a small boat.",
    ],
    image: forestScene,
    options: [
      { key: "A", text: "Cross the bridge.", nextPageId: 7 },
      { key: "B", text: "Use the boat.", nextPageId: 8 },
    ],
  },
  5: {
    id: 5,
    title: "Waiting in the Park",
    ending: true,
    endingKey: "safe-return",
    endingTitle: "Ending 1: The Safe Return",
    body: [
      "An old lady arrives and calls out, Snowy!",
      "Snowy jumps into her arms.",
      "She thanks you and gives you a gold medal for being kind.",
    ],
    image: waitingParkScene,
    vocabulary: ["Lost", "Found", "Kind"],
  },
  6: {
    id: 6,
    title: "The Blue House",
    ending: true,
    endingKey: "new-friends",
    endingTitle: "Ending 2: New Friends",
    body: [
      "A little boy opens the door and smiles when he sees Snowy.",
      "He invites you in for cookies and milk.",
      "You make a new friend today.",
    ],
    image: blueHouseScene,
    vocabulary: ["Neighbor", "Happy", "Cookies"],
  },
  7: {
    id: 7,
    title: "The Magic Bridge",
    ending: true,
    endingKey: "fairy-party",
    endingTitle: "Ending 3: The Fairy Party",
    body: [
      "The bridge is magical and leads to a secret garden.",
      "Animals are having a party, and Snowy is a magic dog.",
      "You dance together all day.",
    ],
    image: magicBridgeScene,
    vocabulary: ["Magic", "Bridge", "Dance"],
  },
  8: {
    id: 8,
    title: "The Boat Trip",
    ending: true,
    endingKey: "river-journey",
    endingTitle: "Ending 4: The River Journey",
    body: [
      "The boat floats gently down the river.",
      "You see ducks and colorful fish.",
      "The boat stops in your backyard, where your mom gives you a big hug.",
    ],
    image: boatTripScene,
    vocabulary: ["Boat", "River", "Family"],
  },
};

const STARS_BY_ENDING = {
  "safe-return": 2,
  "new-friends": 3,
  "fairy-party": 3,
  "river-journey": 2,
};

const MAX_STEPS_TO_ENDING = 3;

const StoryPuppyAdventure = ({ onComplete }) => {
  const transitionTimerRef = useRef(null);
  const [currentPageId, setCurrentPageId] = useState(1);
  const [transitioning, setTransitioning] = useState(false);
  const [sceneTick, setSceneTick] = useState(0);
  const [choiceTrail, setChoiceTrail] = useState([]);
  const [autoNarrator, setAutoNarrator] = useState(true);

  const currentPage = STORY_PAGES[currentPageId];

  const stepsTaken = useMemo(() => Math.max(0, choiceTrail.length), [choiceTrail.length]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const readCurrentPage = () => {
    if (!("speechSynthesis" in window) || !currentPage) {
      return;
    }

    const narratorText = [currentPage.title, ...currentPage.body].join(" ");
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(narratorText);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!autoNarrator) {
      return;
    }

    const timeoutId = setTimeout(() => {
      readCurrentPage();
    }, 260);

    return () => clearTimeout(timeoutId);
  }, [currentPageId, autoNarrator]);

  const goToPageWithTransition = (nextPageId, choiceKey) => {
    if (transitioning) {
      return;
    }

    setTransitioning(true);
    setChoiceTrail((prev) => [...prev, choiceKey]);

    transitionTimerRef.current = setTimeout(() => {
      setCurrentPageId(nextPageId);
      setSceneTick((prev) => prev + 1);
      setTransitioning(false);
    }, 260);
  };

  const handleFinishAdventure = () => {
    const stars = STARS_BY_ENDING[currentPage.endingKey] ?? 2;
    onComplete({
      stars,
      mistakes: 0,
      starsEarned: stars,
      endingKey: currentPage.endingKey,
      endingTitle: currentPage.endingTitle,
      vocabularyLearned: currentPage.vocabulary || [],
      path: choiceTrail.join(""),
    });
  };

  const handleRestart = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setCurrentPageId(1);
    setChoiceTrail([]);
    setTransitioning(false);
    setSceneTick((prev) => prev + 1);
  };

  if (!currentPage) {
    return null;
  }

  const progressPercent = Math.min(100, Math.round((stepsTaken / MAX_STEPS_TO_ENDING) * 100));

  return (
    <div className="story-game-wrap">
      <div className="story-banner-shell">
        <img src={storyBanner} alt="Story Puppy Adventure banner" className="story-banner-image" />
      </div>

      <div className="story-header-row">
        <div className="story-progress-meta">
          <span className="story-chip">Story Adventure</span>
          <span className="story-chip">Step {stepsTaken + 1}</span>
        </div>

        <div className="story-controls">
          <button type="button" className="story-control-btn" onClick={readCurrentPage}>
            Read to me
          </button>
          <button
            type="button"
            className={`story-control-btn ${autoNarrator ? "active" : ""}`}
            onClick={() => setAutoNarrator((prev) => !prev)}
          >
            Narrator {autoNarrator ? "On" : "Off"}
          </button>
          <button type="button" className="story-control-btn" onClick={handleRestart}>
            Restart
          </button>
        </div>
      </div>

      <div className="story-progress-bar" aria-hidden="true">
        <span className="story-progress-value" style={{ width: `${progressPercent}%` }} />
      </div>

      <article
        key={`${currentPage.id}-${sceneTick}`}
        className={`story-scene-card ${transitioning ? "is-leaving" : "is-entering"}`}
      >
        <p className="story-page-label">Page {currentPage.id}</p>
        <h2>{currentPage.title}</h2>

        {currentPage.image ? (
          <div className="story-scene-media">
            <img src={currentPage.image} alt={currentPage.title} className="story-scene-image" />
          </div>
        ) : null}

        {currentPage.ending ? (
          <div className="story-ending-box">
            <p className="story-ending-title">{currentPage.endingTitle}</p>

            <div className="story-ending-actions">
              <button type="button" className="story-option-btn ending" onClick={handleFinishAdventure}>
                Finish adventure
              </button>
              <button type="button" className="story-option-btn secondary" onClick={handleRestart}>
                Try another ending
              </button>
            </div>
          </div>
        ) : (
          <div className="story-options-grid">
            {currentPage.options.map((option) => (
              <button
                key={`${currentPage.id}-${option.key}`}
                type="button"
                className="story-option-btn"
                onClick={() => goToPageWithTransition(option.nextPageId, option.key)}
                disabled={transitioning}
              >
                <span className="option-key">Option {option.key}</span>
                <span className="option-text">{option.text}</span>
              </button>
            ))}
          </div>
        )}
      </article>
    </div>
  );
};

export default StoryPuppyAdventure;