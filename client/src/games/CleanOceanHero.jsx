import { useEffect, useMemo, useState } from "react";
import oceanBgImg from "../assets/ocean_game/ocean_game_background.png";
import winBgImg from "../assets/ocean_game/win_background.png";
import waste1Img from "../assets/ocean_game/waste_1.png";
import waste2Img from "../assets/ocean_game/waste_2.png";
import waste3Img from "../assets/ocean_game/waste_3.png";
import waste4Img from "../assets/ocean_game/waste_4.png";
import waste5Img from "../assets/ocean_game/waste_5.png";
import waste6Img from "../assets/ocean_game/waste_6.png";
import waste7Img from "../assets/ocean_game/waste_7.png";
import waste8Img from "../assets/ocean_game/waste_8.png";
import "./CleanOceanHero.css";

const TOTAL_QUESTIONS = 9;
const MAX_ATTEMPTS = 3;

const SENTENCE_POOL = [
  "How are you ?",
  "I am fine",
  "Thank you !",
  "Good job !",
  "I like fish",
  "This is fun",
  "Clean the sea",
  "Pick the trash",
  "Save the ocean",
  "Let us help",
];

const TRASH_IMAGES = [
  waste1Img,
  waste2Img,
  waste3Img,
  waste4Img,
  waste5Img,
  waste6Img,
  waste7Img,
  waste8Img,
];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const shuffle = (items) => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const speak = (text) => {
  if (typeof window === "undefined" || !window.speechSynthesis || !text) {
    return;
  }

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 0.8;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
};

const makeQuestion = () => {
  const sentence = SENTENCE_POOL[randomInt(0, SENTENCE_POOL.length - 1)];
  const words = sentence.split(" ");
  return {
    sentence,
    words,
    shuffledWords: shuffle(words),
  };
};

const generateTrashItems = () => {
  const items = [];

  for (let i = 0; i < TOTAL_QUESTIONS; i += 1) {
    const image = TRASH_IMAGES[randomInt(0, TRASH_IMAGES.length - 1)];

    items.push({
      id: `trash-${i + 1}`,
      image,
      floatDuration: randomInt(3, 6),
      floatDelay: randomInt(0, 25) / 10,
      removed: false,
    });
  }

  return items;
};

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
    osc.type = "sine";
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

const CleanOceanHero = ({ onComplete }) => {
  const [trashList, setTrashList] = useState(() => generateTrashItems());
  const [activeTrashId, setActiveTrashId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [question, setQuestion] = useState(null);
  const [selectedWords, setSelectedWords] = useState([]);
  const [remainingWords, setRemainingWords] = useState([]);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [finalAttempt, setFinalAttempt] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackType, setFeedbackType] = useState("idle");
  const [revealAnswer, setRevealAnswer] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [sparkleTrashId, setSparkleTrashId] = useState(null);
  const [gameFinished, setGameFinished] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  const cleanedTrashCount = useMemo(
    () => trashList.filter((item) => item.removed).length,
    [trashList],
  );

  const isComplete = cleanedTrashCount === TOTAL_QUESTIONS;

  const speakInstruction = () => {
    speak("Build the sentence");
  };

  useEffect(() => {
    if (isComplete) {
      setGameFinished(true);
    }
  }, [isComplete]);

  useEffect(() => {
    if (modalOpen) {
      speakInstruction();
      return;
    }

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [modalOpen]);

  useEffect(() => {
    if (!showIntro) {
      return undefined;
    }

    speak("Tap trash and build the sentence");
    const timerId = setTimeout(() => {
      setShowIntro(false);
    }, 2500);

    return () => {
      clearTimeout(timerId);
    };
  }, [showIntro]);

  const openQuestion = (trashId) => {
    const nextQuestion = makeQuestion();
    setActiveTrashId(trashId);
    setQuestion(nextQuestion);
    setSelectedWords([]);
    setRemainingWords(nextQuestion.shuffledWords);
    setAttemptsLeft(MAX_ATTEMPTS);
    setFinalAttempt(false);
    setFeedbackText("");
    setFeedbackType("idle");
    setRevealAnswer(false);
    setModalOpen(true);
    setResolving(false);
  };

  const closeQuestion = () => {
    setModalOpen(false);
    setQuestion(null);
    setActiveTrashId(null);
    setSelectedWords([]);
    setRemainingWords([]);
    setAttemptsLeft(MAX_ATTEMPTS);
    setFinalAttempt(false);
    setFeedbackText("");
    setFeedbackType("idle");
    setRevealAnswer(false);
    setResolving(false);
  };

  const handleTrashClick = (trashItem) => {
    if (modalOpen || resolving || trashItem.removed) {
      return;
    }

    openQuestion(trashItem.id);
  };

  const selectWord = (index) => {
    if (!modalOpen || resolving) {
      return;
    }

    const word = remainingWords[index];
    if (word == null) {
      return;
    }

    setSelectedWords((prev) => [...prev, word]);
    setRemainingWords((prev) => prev.filter((_, itemIndex) => itemIndex !== index));

    if (!["!", "?", ".", ","].includes(word)) {
      speak(word.toLowerCase());
    }
  };

  const resetPick = () => {
    if (!question) {
      return;
    }

    setSelectedWords([]);
    setRemainingWords(shuffle(question.words));
  };

  const removeActiveTrash = () => {
    if (!activeTrashId) {
      closeQuestion();
      return;
    }

    setTrashList((prev) =>
      prev.map((item) => (item.id === activeTrashId ? { ...item, removed: true } : item)),
    );

    setSparkleTrashId(activeTrashId);

    setTimeout(() => {
      setSparkleTrashId(null);
      closeQuestion();
    }, 550);
  };

  const handleSubmit = () => {
    if (!question || resolving) {
      return;
    }

    const answer = selectedWords.join(" ").trim();

    if (!answer) {
      setFeedbackType("wrong");
      setFeedbackText("Pick words first!");
      return;
    }

    const isCorrect = answer === question.sentence;

    if (isCorrect) {
      playSound("correct");
      setFeedbackType("correct");
      setFeedbackText("⭐ Good job!");
      setResolving(true);
      removeActiveTrash();
      return;
    }

    playSound("wrong");

    if (finalAttempt) {
      setFeedbackType("wrong");
      setFeedbackText("Not quite. Trash stays. Try another one!");
      setResolving(true);
      setTimeout(() => {
        closeQuestion();
      }, 1200);
      return;
    }

    if (attemptsLeft > 1) {
      setAttemptsLeft((prev) => prev - 1);
      setFeedbackType("wrong");
      setFeedbackText("Try again, you can do it!");
      resetPick();
      return;
    }

    setAttemptsLeft(0);
    setFinalAttempt(true);
    setRevealAnswer(true);
    setFeedbackType("warn");
    setFeedbackText("One final try!");
    resetPick();
  };

  const goToCompletion = () => {
    const stars = cleanedTrashCount >= TOTAL_QUESTIONS ? 3 : cleanedTrashCount >= 4 ? 2 : 1;
    onComplete({
      stars,
      mistakes: TOTAL_QUESTIONS - cleanedTrashCount,
      starsEarned: stars,
      cleanedTrashCount,
      totalTrash: TOTAL_QUESTIONS,
    });
  };

  const handleFinish = () => {
    setGameFinished(true);
  };

  return (
    <div className="game-page-wrapper">
      <div className="ocean-game-frame">
        <img src={oceanBgImg} className="ocean-bg" alt="Ocean" draggable={false} />

        {showIntro ? (
          <div className="intro-overlay">
            <div className="intro-text">Tap trash and build the sentence!</div>
          </div>
        ) : null}

        <div className="ocean-topbar">
          <div className="ocean-progress">{cleanedTrashCount} / {TOTAL_QUESTIONS} cleaned</div>
          {!gameFinished ? (
            <button type="button" className="end-round-btn" onClick={handleFinish}>
              End Round
            </button>
          ) : null}
        </div>

        <div className={`trash-layer ${modalOpen ? "locked" : ""}`}>
          <div className="trash-grid">
            {trashList.map((item) => (
              <div key={item.id} className="trash-cell">
                <img
                  src={item.image}
                  className={`trash-item ${item.removed ? "removed" : ""}`}
                  style={{
                    "--float-duration": `${item.floatDuration}s`,
                    "--float-delay": `${item.floatDelay}s`,
                  }}
                  onClick={() => handleTrashClick(item)}
                  alt="Trash"
                  draggable={false}
                />
                {sparkleTrashId === item.id ? <div className="sparkle-burst" aria-hidden="true">✨✨✨</div> : null}
              </div>
            ))}
          </div>
        </div>

        {modalOpen && question ? (
          <div className="question-modal-overlay">
            <div className={`question-modal ${feedbackType === "wrong" ? "shake" : ""}`}>
              <div className="question-title-row">
                <h3>Build the sentence</h3>
                <button type="button" className="voice-replay" onClick={speakInstruction}>
                  🔊
                </button>
              </div>

              <div className="modal-meta">
                {finalAttempt ? "Final attempt" : `${attemptsLeft} tries left`}
              </div>

              <div className="word-options">
                {remainingWords.map((word, index) => (
                  <button key={`${word}-${index}`} type="button" onClick={() => selectWord(index)}>
                    {word}
                  </button>
                ))}
              </div>

              <div className="answer-preview">{selectedWords.join(" ") || "Tap words to build"}</div>

              {revealAnswer ? (
                <div className="answer-hint">Correct answer: {question.sentence}</div>
              ) : null}

              {feedbackText ? <div className={`feedback ${feedbackType}`}>{feedbackText}</div> : null}

              <div className="modal-actions">
                <button type="button" className="secondary" onClick={resetPick}>
                  Reset
                </button>
                <button type="button" className="primary" onClick={handleSubmit}>
                  Check
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {gameFinished ? (
          <div className="end-screen">
            {isComplete ? (
              <>
                <img src={winBgImg} className="end-bg" alt="Ocean celebration" draggable={false} />
                <h2>You've helped clean up our oceans! Keep up the good work!</h2>
              </>
            ) : (
              <h2>Keep going!</h2>
            )}

            <button type="button" className="finish-btn" onClick={goToCompletion}>
              Finish Game
            </button>
          </div>
        ) : null}
      </div>

      <div className="game-title-bar">
        <h2 className="game-title">🌊 Clean Ocean Hero</h2>
        <span className="question-progress">{cleanedTrashCount} / {TOTAL_QUESTIONS}</span>
      </div>
    </div>
  );
};

export default CleanOceanHero;
