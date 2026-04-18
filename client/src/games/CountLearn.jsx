import { useEffect, useMemo, useState } from "react";
import useSound from "../hooks/useSound";

const shuffled = (array) => [...array].sort(() => Math.random() - 0.5);

const buildOptions = (answer) => {
  const set = new Set([answer]);
  while (set.size < 4) {
    set.add(Math.floor(Math.random() * 10) + 1);
  }
  return shuffled([...set]);
};

const CountLearn = ({ onComplete }) => {
  const { playPop, playChime, playWhoosh, speakText } = useSound();
  const [roundIndex, setRoundIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState({ value: 0, type: "" });
  const [interactionTick, setInteractionTick] = useState(0);
  const [hint, setHint] = useState(0);

  const rounds = useMemo(() => {
    return Array.from({ length: 3 }).map(() => {
      const answer = Math.floor(Math.random() * 10) + 1;
      return {
        answer,
        options: buildOptions(answer),
        item: ["🍓", "🧁", "🐥", "🌼"][Math.floor(Math.random() * 4)],
      };
    });
  }, []);

  const current = rounds[roundIndex];

  useEffect(() => {
    speakText("Count the pictures and tap the number");
  }, [current.answer, speakText]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setHint(current.answer);
    }, 30000);
    return () => clearTimeout(timeout);
  }, [current.answer, interactionTick]);

  const finish = (nextMistakes = mistakes) => {
    const stars = nextMistakes === 0 ? 3 : nextMistakes === 1 ? 2 : 1;
    onComplete({ stars, mistakes: nextMistakes });
  };

  const handleChoice = (value) => {
    playPop();
    setInteractionTick((n) => n + 1);
    setHint(0);

    if (value === current.answer) {
      playChime();
      setFeedback({ value, type: "correct" });
      const isLast = roundIndex === rounds.length - 1;
      setTimeout(() => {
        setFeedback({ value: 0, type: "" });
        if (isLast) {
          finish(mistakes);
        } else {
          setRoundIndex((i) => i + 1);
        }
      }, 700);
      return;
    }

    playWhoosh();
    speakText("Try again! 💪");
    setMistakes((m) => m + 1);
    setFeedback({ value, type: "wrong" });
    setTimeout(() => setFeedback({ value: 0, type: "" }), 450);
  };

  return (
    <div className="game-page-wrapper">
      <div className="game-frame">
        <section className="game-panel">
          <p className="round">Round {roundIndex + 1} / 3</p>
          <div className="count-items" aria-label="counting items">
        {Array.from({ length: current.answer }).map((_, idx) => (
          <span key={idx} className="count-emoji floaty" style={{ animationDelay: `${idx * 0.08}s` }}>
            {current.item}
          </span>
        ))}
          </div>
          <div className="options-grid four">
        {current.options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => handleChoice(option)}
            className={[
              "kid-btn number-btn",
              feedback.value === option && feedback.type === "wrong" ? "shake" : "",
              feedback.value === option && feedback.type === "correct" ? "flash-good" : "",
              hint === option ? "wiggle" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {option}
          </button>
        ))}
          </div>
        </section>
      </div>

      <div className="game-title-bar">
        <h2 className="game-title">🔢 Count Learn</h2>
      </div>
    </div>
  );
};

export default CountLearn;
