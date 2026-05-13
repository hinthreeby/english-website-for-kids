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
const TOTAL_QUESTIONS = 10;

const PictureWords = ({ onComplete }) => {
  const { playPop, playChime, playWhoosh, speakText } = useSound();
  const [roundIndex, setRoundIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState({ id: "", type: "" });
  const [hint, setHint] = useState("");
  const [interactionTick, setInteractionTick] = useState(0);

  const rounds = useMemo(() => {
    return Array.from({ length: TOTAL_QUESTIONS }).map(() => {
      const item = shuffled(words)[0];
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
          <p className="round">Round {roundIndex + 1} / {TOTAL_QUESTIONS}</p>
          <div className="picture-target">{current.answer.emoji}</div>
          <div className="options-grid three">
        {current.options.map((option) => {
          const isCorrect = option.id === current.answer.id;
          const className = [
            "kid-btn option-card",
            feedback.id === option.id && feedback.type === "wrong" ? "shake" : "",
            feedback.id === option.id && feedback.type === "correct" ? "flash-good" : "",
            hint === option.id ? "wiggle" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={option.id}
              type="button"
              className={className}
              onClick={() => handleChoice(option)}
            >
              <span className="big-emoji">{option.emoji}</span>
              <span>{option.word}</span>
            </button>
          );
        })}
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
