import { useEffect, useMemo, useState } from "react";
import useSound from "../hooks/useSound";

const letterBank = {
  A: { word: "Apple", emoji: "🍎" },
  B: { word: "Ball", emoji: "⚽" },
  C: { word: "Cat", emoji: "🐱" },
  D: { word: "Dog", emoji: "🐶" },
  E: { word: "Egg", emoji: "🥚" },
  F: { word: "Fish", emoji: "🐟" },
  G: { word: "Grapes", emoji: "🍇" },
  H: { word: "Hat", emoji: "🎩" },
  I: { word: "Ice", emoji: "🧊" },
  J: { word: "Jam", emoji: "🍓" },
  K: { word: "Kite", emoji: "🪁" },
  L: { word: "Lion", emoji: "🦁" },
  M: { word: "Moon", emoji: "🌙" },
  N: { word: "Nest", emoji: "🪹" },
  O: { word: "Orange", emoji: "🍊" },
  P: { word: "Pig", emoji: "🐷" },
  Q: { word: "Queen", emoji: "👑" },
  R: { word: "Rabbit", emoji: "🐰" },
  S: { word: "Sun", emoji: "☀️" },
  T: { word: "Tree", emoji: "🌳" },
  U: { word: "Umbrella", emoji: "☂️" },
  V: { word: "Violin", emoji: "🎻" },
  W: { word: "Whale", emoji: "🐋" },
  X: { word: "Xylophone", emoji: "🎼" },
  Y: { word: "Yak", emoji: "🐂" },
  Z: { word: "Zebra", emoji: "🦓" },
};

const shuffled = (array) => [...array].sort(() => Math.random() - 0.5);
const TOTAL_QUESTIONS = 10;

const ABCLetters = ({ onComplete }) => {
  const { playPop, playChime, playWhoosh, speakText } = useSound();
  const [roundIndex, setRoundIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState({ type: "", key: "" });
  const [interactionTick, setInteractionTick] = useState(0);
  const [hint, setHint] = useState("");

  const rounds = useMemo(() => {
    return Array.from({ length: TOTAL_QUESTIONS }).map(() => {
      const letter = shuffled(Object.keys(letterBank))[0];
      const correct = { ...letterBank[letter], letter, id: letter };
      const wrongPool = shuffled(
        Object.keys(letterBank)
          .filter((key) => key !== letter)
          .map((key) => ({ ...letterBank[key], letter: key, id: key }))
      ).slice(0, 2);

      return {
        letter,
        options: shuffled([correct, ...wrongPool]),
      };
    });
  }, []);

  const current = rounds[roundIndex];

  useEffect(() => {
    speakText(`Find the picture that starts with letter ${current.letter}`);
    // delay avoids speech overlap with round transition sound
    const timeout = setTimeout(() => speakText(current.letter), 650);
    return () => clearTimeout(timeout);
  }, [current.letter, speakText]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setHint(current.letter);
    }, 30000);
    return () => clearTimeout(timeout);
  }, [current.letter, interactionTick]);

  const finish = (nextMistakes = mistakes) => {
    const stars = nextMistakes === 0 ? 3 : nextMistakes === 1 ? 2 : 1;
    onComplete({ stars, mistakes: nextMistakes });
  };

  const handleChoice = (option) => {
    playPop();
    setInteractionTick((n) => n + 1);
    setHint("");

    if (option.letter === current.letter) {
      playChime();
      setFeedback({ type: "correct", key: option.id });
      const lastRound = roundIndex === rounds.length - 1;
      setTimeout(() => {
        setFeedback({ type: "", key: "" });
        if (lastRound) {
          finish(mistakes);
        } else {
          setRoundIndex((i) => i + 1);
        }
      }, 750);
      return;
    }

    playWhoosh();
    speakText("Try again! You can do it!");
    setMistakes((m) => m + 1);
    setFeedback({ type: "wrong", key: option.id });
    setTimeout(() => setFeedback({ type: "", key: "" }), 480);
  };

  return (
    <div className="game-page-wrapper">
      <div className="game-frame">
        <section className="game-panel">
          <p className="round">Round {roundIndex + 1} / {TOTAL_QUESTIONS}</p>
          <h2 className="hero-letter">{current.letter}</h2>
          <div className="options-grid three">
        {current.options.map((option) => {
          const isCorrect = option.letter === current.letter;
          const className = [
            "kid-btn option-card",
            feedback.key === option.id && feedback.type === "wrong" ? "shake" : "",
            feedback.key === option.id && feedback.type === "correct" ? "flash-good" : "",
            hint && isCorrect ? "wiggle" : "",
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
        <h2 className="game-title">🔤 ABC Letters</h2>
      </div>
    </div>
  );
};

export default ABCLetters;
