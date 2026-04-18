import { useEffect, useRef, useState } from "react";
import funnyBgImg from "../assets/funny_animal_game/funny_animal_game_background.png";
import elephantImg from "../assets/funny_animal_game/elephant.png";
import foxImg from "../assets/funny_animal_game/fox.png";
import giraffeImg from "../assets/funny_animal_game/giraffe.png";
import hippoImg from "../assets/funny_animal_game/hippo.png";
import horseImg from "../assets/funny_animal_game/horse.png";
import koalaImg from "../assets/funny_animal_game/koala.png";
import lionImg from "../assets/funny_animal_game/lion.png";
import monkeyImg from "../assets/funny_animal_game/monkey.png";
import pandaImg from "../assets/funny_animal_game/panda.png";
import rabbitImg from "../assets/funny_animal_game/rabbit.png";
import sheepImg from "../assets/funny_animal_game/sheep.png";
import snakeImg from "../assets/funny_animal_game/snake.png";
import squirrelImg from "../assets/funny_animal_game/squirrel.png";
import tigerImg from "../assets/funny_animal_game/tiger.png";
import "./FunnyAnimals.css";

const TOTAL_QUESTIONS = 9;
const ANIMALS_PER_Q = 3;

const ALL_ANIMALS = [
  { id: "elephant", name: "Elephant", image: elephantImg },
  { id: "fox", name: "Fox", image: foxImg },
  { id: "giraffe", name: "Giraffe", image: giraffeImg },
  { id: "hippo", name: "Hippo", image: hippoImg },
  { id: "horse", name: "Horse", image: horseImg },
  { id: "koala", name: "Koala", image: koalaImg },
  { id: "lion", name: "Lion", image: lionImg },
  { id: "monkey", name: "Monkey", image: monkeyImg },
  { id: "panda", name: "Panda", image: pandaImg },
  { id: "rabbit", name: "Rabbit", image: rabbitImg },
  { id: "sheep", name: "Sheep", image: sheepImg },
  { id: "snake", name: "Snake", image: snakeImg },
  { id: "squirrel", name: "Squirrel", image: squirrelImg },
  { id: "tiger", name: "Tiger", image: tigerImg },
];

const playSound = (type) => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  const ctx = new AudioContextClass();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  if (type === "correct") {
    osc.frequency.setValueAtTime(523, ctx.currentTime);
    osc.frequency.setValueAtTime(659, ctx.currentTime + 0.15);
    osc.frequency.setValueAtTime(784, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } else if (type === "wrong") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(280, ctx.currentTime);
    osc.frequency.setValueAtTime(200, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }

  osc.onended = () => {
    ctx.close().catch(() => {});
  };
};

const speakInstruction = (animalName) => {
  if (!animalName || !("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(`Touch the ${animalName}`);
  utter.lang = "en-US";
  utter.rate = 0.8;
  utter.pitch = 1.2;
  window.speechSynthesis.speak(utter);
};

const speakAnimalName = (animalName) => {
  if (!animalName || !("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(animalName);
  utter.lang = "en-US";
  utter.rate = 0.75;
  utter.pitch = 1.2;
  window.speechSynthesis.speak(utter);
};

const generateQuestions = () => {
  const shuffled = [...ALL_ANIMALS].sort(() => Math.random() - 0.5);
  const questions = [];

  for (let i = 0; i < TOTAL_QUESTIONS; i += 1) {
    const startIdx = (i * ANIMALS_PER_Q) % shuffled.length;
    let group = [];

    for (let j = 0; j < ANIMALS_PER_Q; j += 1) {
      group.push(shuffled[(startIdx + j) % shuffled.length]);
    }

    group = [...new Map(group.map((animal) => [animal.id, animal])).values()];
    while (group.length < ANIMALS_PER_Q) {
      const extra = shuffled[Math.floor(Math.random() * shuffled.length)];
      if (!group.find((animal) => animal.id === extra.id)) {
        group.push(extra);
      }
    }

    const target = group[Math.floor(Math.random() * group.length)];
    questions.push({ group, target });
  }

  return questions;
};

const FunnyAnimals = ({ onComplete }) => {
  const timeoutRef = useRef([]);

  const [questions] = useState(() => generateQuestions());
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [phase, setPhase] = useState("question");
  const [celebrationAnimal, setCelebrationAnimal] = useState(null);

  const currentQ = questions[questionIndex];
  const target = currentQ?.target;
  const group = currentQ?.group ?? [];

  const queueTimeout = (fn, delay) => {
    const timeoutId = setTimeout(() => {
      timeoutRef.current = timeoutRef.current.filter((id) => id !== timeoutId);
      fn();
    }, delay);

    timeoutRef.current.push(timeoutId);
  };

  useEffect(() => {
    if (phase === "question" && target) {
      const timeoutId = setTimeout(() => speakInstruction(target.name), 600);
      return () => clearTimeout(timeoutId);
    }

    return undefined;
  }, [phase, questionIndex, target]);

  useEffect(() => {
    return () => {
      timeoutRef.current.forEach((id) => clearTimeout(id));
      timeoutRef.current = [];
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const finishGame = (finalCorrectCount) => {
    const stars = finalCorrectCount >= 8 ? 3 : finalCorrectCount >= 5 ? 2 : 1;
    const mistakes = TOTAL_QUESTIONS - finalCorrectCount;

    setPhase("finished");
    onComplete({
      stars,
      mistakes,
      starsEarned: stars,
      correctCount: finalCorrectCount,
      totalQuestions: TOTAL_QUESTIONS,
    });
  };

  const showCelebration = (animal, type, nextCorrectCount) => {
    setPhase(type === "correct" ? "correct" : "wrong-skip");
    setCelebrationAnimal(animal);

    queueTimeout(() => speakAnimalName(animal.name), 500);

    queueTimeout(() => {
      setCelebrationAnimal(null);

      if (questionIndex + 1 >= TOTAL_QUESTIONS) {
        finishGame(nextCorrectCount);
      } else {
        setQuestionIndex((prev) => prev + 1);
        setPhase("question");
      }
    }, 2500);
  };

  const handleAnimalTap = (animal) => {
    if (phase !== "question" || !target) {
      return;
    }

    if (animal.id === target.id) {
      playSound("correct");
      const nextCorrectCount = correctCount + 1;
      setCorrectCount(nextCorrectCount);
      showCelebration(animal, "correct", nextCorrectCount);
      return;
    }

    playSound("wrong");
    showCelebration(target, "skip", correctCount);
  };

  return (
    <div className="game-page-wrapper">
      <div className="funny-game-frame">
        <img src={funnyBgImg} alt="" className="funny-bg" draggable={false} />

        <div className="instruction-bar">
          <button
            className="replay-btn"
            type="button"
            onClick={() => speakInstruction(target?.name)}
            aria-label="Replay instruction"
          >
            🔊
          </button>
        </div>

        <div className="animals-row">
          {group.map((animal) => (
            <button
              key={animal.id}
              type="button"
              className={`animal-btn ${phase !== "question" ? "animal-disabled" : ""}`}
              onClick={() => handleAnimalTap(animal)}
              disabled={phase !== "question"}
              aria-label={animal.name}
            >
              <img src={animal.image} alt={animal.name} className="animal-img" draggable={false} />
            </button>
          ))}
        </div>

        {celebrationAnimal ? (
          <div className="celebration-overlay">
            <div className={`celebration-msg ${phase === "correct" ? "msg-correct" : "msg-skip"}`}>
              {phase === "correct" ? "⭐ Good job! ⭐" : "📚 Let's learn this new vocabulary word!"}
            </div>

            <div className="celebration-animal">
              <img
                src={celebrationAnimal.image}
                alt={celebrationAnimal.name}
                className="celebration-img"
              />
              <div className="celebration-name">{celebrationAnimal.name.toUpperCase()}</div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="game-title-bar">
        <h2 className="game-title">🐾 Funny Animals</h2>
        <span className="question-progress">
          {Math.min(questionIndex + 1, TOTAL_QUESTIONS)} / {TOTAL_QUESTIONS}
        </span>
      </div>
    </div>
  );
};

export default FunnyAnimals;
