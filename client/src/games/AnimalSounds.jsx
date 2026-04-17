import { useEffect, useMemo, useState } from "react";
import useSound from "../hooks/useSound";

const animals = [
  { id: "cow", emoji: "🐮", sound: "Moo!", name: "Cow" },
  { id: "dog", emoji: "🐶", sound: "Woof!", name: "Dog" },
  { id: "cat", emoji: "🐱", sound: "Meow!", name: "Cat" },
  { id: "duck", emoji: "🦆", sound: "Quack!", name: "Duck" },
  { id: "lion", emoji: "🦁", sound: "Roar!", name: "Lion" },
  { id: "frog", emoji: "🐸", sound: "Ribbit!", name: "Frog" },
];

const shuffled = (array) => [...array].sort(() => Math.random() - 0.5);

const AnimalSounds = ({ onComplete }) => {
  const { playPop, playChime, playWhoosh, speakText } = useSound();
  const [roundIndex, setRoundIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState({ id: "", type: "" });
  const [hint, setHint] = useState("");
  const [interactionTick, setInteractionTick] = useState(0);

  const rounds = useMemo(() => {
    return shuffled(animals).slice(0, 3).map((answer) => ({
      answer,
      options: shuffled([answer, ...shuffled(animals.filter((a) => a.id !== answer.id)).slice(0, 3)]),
    }));
  }, []);

  const current = rounds[roundIndex];

  useEffect(() => {
    speakText(`Listen! ${current.answer.sound}. Which animal is that?`);
  }, [current.answer.sound, speakText]);

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
      }, 700);
      return;
    }

    playWhoosh();
    speakText("Try again! 💪");
    setMistakes((m) => m + 1);
    setFeedback({ id: option.id, type: "wrong" });
    setTimeout(() => setFeedback({ id: "", type: "" }), 450);
  };

  return (
    <section className="game-panel" style={{ borderColor: "#f09fa7" }}>
      <p className="round">Round {roundIndex + 1} / 3</p>
      <h2 className="sound-bubble">{current.answer.sound}</h2>
      <div className="options-grid four">
        {current.options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={[
              "kid-btn option-card",
              feedback.id === option.id && feedback.type === "wrong" ? "shake" : "",
              feedback.id === option.id && feedback.type === "correct" ? "flash-good" : "",
              hint === option.id ? "wiggle" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => handleChoice(option)}
          >
            <span className="big-emoji">{option.emoji}</span>
            <span>{option.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default AnimalSounds;
