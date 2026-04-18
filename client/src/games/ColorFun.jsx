import { useEffect, useMemo, useState } from "react";
import useSound from "../hooks/useSound";

const colors = [
  { name: "Red", value: "#ff7b7b" },
  { name: "Blue", value: "#84c8ff" },
  { name: "Green", value: "#93d67f" },
  { name: "Yellow", value: "#ffe06e" },
  { name: "Orange", value: "#ffb347" },
  { name: "Purple", value: "#c7a5ff" },
];

const shapes = ["circle", "square", "triangle"];
const shuffled = (array) => [...array].sort(() => Math.random() - 0.5);
const TOTAL_QUESTIONS = 10;

const ColorFun = ({ onComplete }) => {
  const { playPop, playChime, playWhoosh, speakText } = useSound();
  const [roundIndex, setRoundIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState({ name: "", type: "" });
  const [hint, setHint] = useState("");
  const [interactionTick, setInteractionTick] = useState(0);

  const rounds = useMemo(() => {
    return Array.from({ length: TOTAL_QUESTIONS }).map(() => {
      const color = shuffled(colors)[0];
      return {
        color,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        options: shuffled([color, ...shuffled(colors.filter((c) => c.name !== color.name)).slice(0, 3)]),
      };
    });
  }, []);

  const current = rounds[roundIndex];

  useEffect(() => {
    speakText(`Tap the ${current.color.name} color`);
  }, [current.color.name, speakText]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setHint(current.color.name);
    }, 30000);
    return () => clearTimeout(timeout);
  }, [current.color.name, interactionTick]);

  const finish = (nextMistakes = mistakes) => {
    const stars = nextMistakes === 0 ? 3 : nextMistakes === 1 ? 2 : 1;
    onComplete({ stars, mistakes: nextMistakes });
  };

  const handleChoice = (option) => {
    playPop();
    setInteractionTick((n) => n + 1);
    setHint("");

    if (option.name === current.color.name) {
      playChime();
      setFeedback({ name: option.name, type: "correct" });
      const isLast = roundIndex === rounds.length - 1;
      setTimeout(() => {
        setFeedback({ name: "", type: "" });
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
    setFeedback({ name: option.name, type: "wrong" });
    setTimeout(() => setFeedback({ name: "", type: "" }), 450);
  };

  return (
    <div className="game-page-wrapper">
      <div className="game-frame">
        <section className="game-panel color-fun-panel">
          <p className="round">Round {roundIndex + 1} / {TOTAL_QUESTIONS}</p>
          <div className="shape-wrap">
        <div
          className={`shape ${current.shape}`}
          style={{ backgroundColor: current.color.value }}
          aria-label={`${current.color.name} ${current.shape}`}
        />
          </div>
          <div className="options-grid four">
        {current.options.map((option) => (
          <button
            key={option.name}
            type="button"
            onClick={() => handleChoice(option)}
            className={[
              "kid-btn color-btn",
              feedback.name === option.name && feedback.type === "wrong" ? "shake" : "",
              feedback.name === option.name && feedback.type === "correct" ? "flash-good" : "",
              hint === option.name ? "wiggle" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {option.name}
          </button>
        ))}
          </div>
        </section>
      </div>

      <div className="game-title-bar">
        <h2 className="game-title">🎨 Color Fun</h2>
      </div>
    </div>
  );
};

export default ColorFun;
