import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import useSound from "../hooks/useSound";
import { playCorrectEffect, playErrorEffect } from "../utils/gameEffects";
import zeroImg from "../assets/CountLearn/zero.png";
import oneImg from "../assets/CountLearn/one.png";
import twoImg from "../assets/CountLearn/two.png";
import threeImg from "../assets/CountLearn/three.png";
import fourImg from "../assets/CountLearn/four.png";
import fiveImg from "../assets/CountLearn/five.png";
import sixImg from "../assets/CountLearn/six.png";
import sevenImg from "../assets/CountLearn/seven.png";
import eightImg from "../assets/CountLearn/eight.png";
import nineImg from "../assets/CountLearn/nine.png";

const shuffled = (array) => [...array].sort(() => Math.random() - 0.5);
const TOTAL_QUESTIONS = 10;
const COUNT_STEP_MS = 850;
const NUMBER_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
];

const numberImages = {
  0: zeroImg,
  1: oneImg,
  2: twoImg,
  3: threeImg,
  4: fourImg,
  5: fiveImg,
  6: sixImg,
  7: sevenImg,
  8: eightImg,
  9: nineImg,
};

const buildOptions = (answer) => {
  const set = new Set([answer]);
  while (set.size < 4) {
    set.add(Math.floor(Math.random() * 10));
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
  const [countHighlight, setCountHighlight] = useState(-1);
  const [isCounting, setIsCounting] = useState(false);
  const countTimersRef = useRef([]);

  const rounds = useMemo(() => {
    return Array.from({ length: TOTAL_QUESTIONS }).map(() => {
      const answer = Math.floor(Math.random() * 9) + 1;
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
    setCountHighlight(-1);
    setIsCounting(false);
  }, [roundIndex]);

  useEffect(() => {
    return () => {
      countTimersRef.current.forEach(clearTimeout);
      countTimersRef.current = [];
    };
  }, []);

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

  const clearCountTimers = () => {
    countTimersRef.current.forEach(clearTimeout);
    countTimersRef.current = [];
  };

  const celebrateCorrectAnswer = () => {
    playChime();
    playCorrectEffect();
    speakText("Correct!");

    confetti({
      particleCount: 160,
      spread: 82,
      origin: { y: 0.62 },
      colors: ["#34d399", "#bbf7d0", "#ffd700", "#b2ebf2", "#c9b8ff"],
    });
    confetti({
      particleCount: 95,
      angle: 60,
      spread: 60,
      origin: { x: 0.12, y: 0.72 },
      colors: ["#ffd700", "#34d399", "#b2ebf2"],
    });
    confetti({
      particleCount: 95,
      angle: 120,
      spread: 60,
      origin: { x: 0.88, y: 0.72 },
      colors: ["#ffd700", "#bbf7d0", "#c9b8ff"],
    });
  };

  const playCountingSequence = (isLast, correctValue) => {
    clearCountTimers();
    setIsCounting(true);
    setFeedback({ value: 0, type: "" });
    setCountHighlight(-1);

    Array.from({ length: current.answer }).forEach((_, idx) => {
      const timer = setTimeout(() => {
        const number = idx + 1;
        setCountHighlight(idx);
        speakText(NUMBER_WORDS[number]);
      }, 220 + idx * COUNT_STEP_MS);
      countTimersRef.current.push(timer);
    });

    const finishTimer = setTimeout(() => {
      setCountHighlight(current.answer - 1);
      setFeedback({ value: correctValue, type: "correct" });
      celebrateCorrectAnswer();

      const nextRoundTimer = setTimeout(() => {
        setFeedback({ value: 0, type: "" });
        setCountHighlight(-1);
        setIsCounting(false);
        if (isLast) {
          finish(mistakes);
        } else {
          setRoundIndex((i) => i + 1);
        }
      }, 1050);
      countTimersRef.current.push(nextRoundTimer);
    }, 220 + current.answer * COUNT_STEP_MS + 500);
    countTimersRef.current.push(finishTimer);
  };

  const handleChoice = (value) => {
    if (isCounting) return;

    playPop();
    setInteractionTick((n) => n + 1);
    setHint(0);

    if (value === current.answer) {
      const isLast = roundIndex === rounds.length - 1;
      playCountingSequence(isLast, value);
      return;
    }

    playWhoosh();
    playErrorEffect();
    speakText("Try again! 💪");
    setMistakes((m) => m + 1);
    setFeedback({ value, type: "wrong" });
    setTimeout(() => setFeedback({ value: 0, type: "" }), 450);
  };

  return (
    <div className="game-page-wrapper">
      <div className="game-frame">
        <section className="game-panel">
          <div className="count-header">
            <p className="round">Round {roundIndex + 1} / {TOTAL_QUESTIONS}</p>
            {feedback.type === "correct" ? (
              <div className="count-correct-badge" aria-live="polite">
                Correct! ✨
              </div>
            ) : null}
          </div>
          <div className="count-items" aria-label="counting items">
        {Array.from({ length: current.answer }).map((_, idx) => (
          <span
            key={idx}
            className={[
              "count-emoji floaty",
              idx <= countHighlight ? "count-lit" : "",
              idx === countHighlight ? "count-current" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ animationDelay: `${idx * 0.08}s` }}
          >
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
            disabled={isCounting}
            className={[
              "kid-btn number-btn",
              "count-number-btn",
              feedback.value === option && feedback.type === "wrong" ? "shake count-wrong" : "",
              feedback.value === option && feedback.type === "correct" ? "flash-good count-correct" : "",
              hint === option ? "wiggle" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <img
              src={numberImages[option]}
              alt={`${option}`}
              className="count-number-img"
              draggable={false}
            />
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
