import { useEffect, useMemo, useState } from "react";
import useSound from "../hooks/useSound";

const words = [
  { id: "apple", emoji: "🍎", word: "Apple" },
  { id: "car", emoji: "🚗", word: "Car" },
  { id: "star", emoji: "⭐", word: "Star" },
  { id: "cake", emoji: "🎂", word: "Cake" },
  { id: "ball", emoji: "⚽", word: "Ball" },
  { id: "fish", emoji: "🐟", word: "Fish" },
];

const shuffled = (array) => [...array].sort(() => Math.random() - 0.5);

const PictureWords = ({ onComplete }) => {
  const { playPop, playChime, playWhoosh, speakText } = useSound();
  const [roundIndex, setRoundIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState({ id: "", type: "" });
  const [hint, setHint] = useState("");
  const [interactionTick, setInteractionTick] = useState(0);

  const rounds = useMemo(() => {
    return shuffled(words).slice(0, 3).map((item) => {
      const options = shuffled([item, ...shuffled(words.filter((x) => x.id !== item.id)).slice(0, 2)]);
      return { answer: item, options };
    });
  }, []);

  const current = rounds[roundIndex];

  useEffect(() => {
    speakText(`Tap the word for ${current.answer.word}`);
  }, [current.answer.word, speakText]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setHint(current.answer.id);
    }, 30000);
    return () => clearTimeout(timeout);
  }, [current.answer.id, interactionTick]);

  const finish = (nextMistakes = mistakes) => {
    const stars = nextMistakes === 0 ? 3 : nextMistakes === 1 ? 2 : 1;
    onComplete({ stars, mistakes: nextMistakes });
  };

  const handleChoice = (option) => {
    playPop();
    setInteractionTick((n) => n + 1);
    setHint("");

    if (option.id === current.answer.id) {
      playChime();
      setFeedback({ id: option.id, type: "correct" });
      const isLast = roundIndex === rounds.length - 1;
      setTimeout(() => {
        setFeedback({ id: "", type: "" });
        if (isLast) {
          finish(mistakes);
        } else {
          setRoundIndex((i) => i + 1);
        }
      }, 680);
      return;
    }

    playWhoosh();
    speakText("Try again! 💪");
    setMistakes((m) => m + 1);
    setFeedback({ id: option.id, type: "wrong" });
    setTimeout(() => setFeedback({ id: "", type: "" }), 480);
  };

  return (
    <div className="game-page-wrapper">
      <div className="game-frame">
        <section className="game-panel">
          <p className="round">Round {roundIndex + 1} / 3</p>
          <div className="picture-target">{current.answer.emoji}</div>
          <div className="options-stack">
        {current.options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={[
              "kid-btn option-word",
              feedback.id === option.id && feedback.type === "wrong" ? "shake" : "",
              feedback.id === option.id && feedback.type === "correct" ? "flash-good" : "",
              hint === option.id ? "wiggle" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => handleChoice(option)}
          >
            {option.word}
          </button>
        ))}
          </div>
        </section>
      </div>

      <div className="game-title-bar">
        <h2 className="game-title">🖼️ Picture Words</h2>
      </div>
    </div>
  );
};

export default PictureWords;
