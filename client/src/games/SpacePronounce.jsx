import { useEffect, useMemo, useRef, useState } from "react";
import astronautImg from "../assets/astronaut_game.png";
import meteoriteImg from "../assets/meteorite.png";
import mountainImg from "../assets/mountain.png";
import starImg from "../assets/star.png";
import sunImg from "../assets/sun.png";
import "./SpacePronounce.css";

const TOTAL_QUESTIONS = 10;
const MAX_ATTEMPTS = 3;
const MAX_STARS = 3;

const VOCAB_LIST = [
  { word: "apple", emoji: "🍎" },
  { word: "banana", emoji: "🍌" },
  { word: "cat", emoji: "🐱" },
  { word: "dog", emoji: "🐶" },
  { word: "elephant", emoji: "🐘" },
  { word: "fish", emoji: "🐟" },
  { word: "grape", emoji: "🍇" },
  { word: "house", emoji: "🏠" },
  { word: "ice", emoji: "🧊" },
  { word: "juice", emoji: "🧃" },
  { word: "kite", emoji: "🪁" },
  { word: "lion", emoji: "🦁" },
  { word: "moon", emoji: "🌙" },
  { word: "nose", emoji: "👃" },
  { word: "orange", emoji: "🍊" },
  { word: "pizza", emoji: "🍕" },
  { word: "queen", emoji: "👑" },
  { word: "rabbit", emoji: "🐰" },
  { word: "sun", emoji: "☀️" },
  { word: "tree", emoji: "🌳" },
];

const generateStars = () =>
  Array.from({ length: 60 }, (_, i) => ({
    id: i,
    top: Math.random() * 75,
    left: Math.random() * 100,
    size: Math.random() * 20 + 10,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 4,
    minScale: 0.3 + Math.random() * 0.4,
    maxScale: 1.0 + Math.random() * 0.8,
  }));

const pickSessionWords = () => {
  const shuffled = [...VOCAB_LIST].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, TOTAL_QUESTIONS);
};

const levenshtein = (a, b) => {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => {
      if (i === 0) {
        return j;
      }
      if (j === 0) {
        return i;
      }
      return 0;
    }),
  );

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[a.length][b.length];
};

const fuzzyMatch = (heard, target) => {
  const h = (heard || "").toLowerCase().trim();
  const t = (target || "").toLowerCase().trim();

  if (!h || !t) {
    return false;
  }

  if (h === t) {
    return true;
  }

  if (h.includes(t) || t.includes(h)) {
    return true;
  }

  if (h[0] === t[0] && Math.abs(h.length - t.length) <= 2) {
    return true;
  }

  return levenshtein(h, t) <= 2;
};

const playSound = (type) => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  const ctx = new AudioContextClass();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  if (type === "correct") {
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(523, ctx.currentTime);
    oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.15);
    oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.3);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.6);
  } else if (type === "wrong") {
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(300, ctx.currentTime);
    oscillator.frequency.setValueAtTime(200, ctx.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  }

  oscillator.onended = () => {
    ctx.close().catch(() => {});
  };
};

const SpacePronounce = ({ onComplete }) => {
  const recognitionRef = useRef(null);
  const isMeteoriteBusyRef = useRef(false);
  const isTransitioningRef = useRef(false);

  const [stars] = useState(() => generateStars());
  const [wordList, setWordList] = useState(() => pickSessionWords());
  const [questionIndex, setQuestionIndex] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [skippedCount, setSkippedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [meteoriteActive, setMeteoriteActive] = useState(false);
  const [meteoriteDestroyed, setMeteoriteDestroyed] = useState(false);
  const [meteoriteEscaped, setMeteoriteEscaped] = useState(false);
  const [meteoriteAtCenter, setMeteoriteAtCenter] = useState(false);
  const [showVocabCard, setShowVocabCard] = useState(false);
  const [encouragement, setEncouragement] = useState(null);
  const [meteoriteKey, setMeteoriteKey] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [starsEarned, setStarsEarned] = useState(MAX_STARS);

  const currentWord = wordList[questionIndex];

  const speakWord = useMemo(
    () => () => {
      if (!currentWord || !("speechSynthesis" in window)) {
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentWord.word);
      utterance.lang = "en-US";
      utterance.rate = 0.8;
      utterance.pitch = 1.2;
      window.speechSynthesis.speak(utterance);
    },
    [currentWord],
  );

  useEffect(() => {
    if (!showVocabCard || !currentWord || gameWon) {
      return;
    }

    const timerId = setTimeout(() => {
      speakWord();
    }, 400);

    return () => clearTimeout(timerId);
  }, [showVocabCard, currentWord, gameWon, speakWord]);

  useEffect(() => {
    if (gameWon) {
      return undefined;
    }

    const spawnMeteorite = () => {
      setMeteoriteAtCenter(false);
      setShowVocabCard(false);
      setMeteoriteDestroyed(false);
      setMeteoriteEscaped(false);
      setEncouragement(null);
      setMeteoriteKey((k) => k + 1);
      isMeteoriteBusyRef.current = true;
      setMeteoriteActive(true);
    };

    const interval = setInterval(() => {
      if (isMeteoriteBusyRef.current || isTransitioningRef.current) {
        return;
      }

      spawnMeteorite();
    }, 5000);

    return () => clearInterval(interval);
  }, [gameWon]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (!gameWon) {
      return;
    }

    onComplete({
      stars: starsEarned,
      mistakes: skippedCount,
      starsEarned,
      correctCount,
      totalQuestions: TOTAL_QUESTIONS,
      skippedCount,
    });
  }, [correctCount, gameWon, onComplete, skippedCount, starsEarned]);

  const finishGame = (nextSkippedCount) => {
    const earned = Math.max(1, MAX_STARS - nextSkippedCount);
    setStarsEarned(earned);
    setGameWon(true);
  };

  const advanceQuestion = (nextSkippedCount) => {
    const nextIndex = questionIndex + 1;

    if (nextIndex >= TOTAL_QUESTIONS) {
      finishGame(nextSkippedCount);
      return;
    }

    setQuestionIndex(nextIndex);
  };

  const hideVocabCard = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setShowVocabCard(false);
  };

  const handleCorrect = () => {
    if (isTransitioningRef.current || gameWon) {
      return;
    }

    isTransitioningRef.current = true;
    playSound("correct");
    hideVocabCard();
    setMeteoriteDestroyed(true);
    setEncouragement("correct");
    setCorrectCount((prev) => prev + 1);

    setTimeout(() => {
      setEncouragement(null);
      setMeteoriteActive(false);
      setMeteoriteAtCenter(false);
      setMeteoriteDestroyed(false);
      setMeteoriteEscaped(false);
      isMeteoriteBusyRef.current = false;
      setFeedback(null);
      setAttemptsLeft(MAX_ATTEMPTS);
      advanceQuestion(skippedCount);
      isTransitioningRef.current = false;
    }, 1500);
  };

  const handleWrongAttempt = (heard) => {
    if (isTransitioningRef.current || gameWon) {
      return;
    }

    playSound("wrong");

    setAttemptsLeft((prev) => {
      const newAttempts = prev - 1;
      setFeedback({ correct: false, heard });

      if (newAttempts <= 0) {
        isTransitioningRef.current = true;
        hideVocabCard();
        setMeteoriteEscaped(true);
        setEncouragement("wrong");

        setSkippedCount((prevSkipped) => {
          const updatedSkipped = prevSkipped + 1;
          setFeedback({ correct: false, skipped: true });

          setTimeout(() => {
            setEncouragement(null);
            setMeteoriteActive(false);
            setMeteoriteAtCenter(false);
            setMeteoriteEscaped(false);
            setMeteoriteDestroyed(false);
            isMeteoriteBusyRef.current = false;
            setFeedback(null);
            setAttemptsLeft(MAX_ATTEMPTS);
            advanceQuestion(updatedSkipped);
            isTransitioningRef.current = false;
          }, 2500);

          return updatedSkipped;
        });
      }

      return Math.max(newAttempts, 0);
    });
  };

  const checkPronunciation = (alternatives) => {
    if (!currentWord || gameWon) {
      return;
    }

    const isCorrect = alternatives.some((alt) => fuzzyMatch(alt, currentWord.word));

    if (isCorrect) {
      handleCorrect();
      return;
    }

    handleWrongAttempt(alternatives[0] || "?");
  };

  const startListening = () => {
    if (gameWon || !currentWord || isTransitioningRef.current || !showVocabCard) {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Your browser does not support speech recognition. Please use Chrome.");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;
    setIsListening(true);

    recognition.onresult = (event) => {
      const alternatives = Array.from(event.results[0]).map((item) =>
        item.transcript.toLowerCase().trim(),
      );
      console.log("[Speech] heard:", alternatives);
      checkPronunciation(alternatives);
    };

    recognition.onerror = (event) => {
      console.error("[Speech] error:", event.error);
      setIsListening(false);
      handleWrongAttempt("(no sound)");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const restartGame = () => {
    const nextWords = pickSessionWords();
    setWordList(nextWords);
    setQuestionIndex(0);
    setAttemptsLeft(MAX_ATTEMPTS);
    setSkippedCount(0);
    setCorrectCount(0);
    setFeedback(null);
    setMeteoriteActive(false);
    setMeteoriteDestroyed(false);
    setMeteoriteEscaped(false);
    setMeteoriteAtCenter(false);
    setShowVocabCard(false);
    setEncouragement(null);
    setGameWon(false);
    setStarsEarned(MAX_STARS);
    setIsListening(false);
    isMeteoriteBusyRef.current = false;
    isTransitioningRef.current = false;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const progressPercent = ((questionIndex + 1) / TOTAL_QUESTIONS) * 100;

  return (
    <div className="game-page-wrapper">
      <div className="game-frame">
        <section className="space-pronounce-panel">
          <div className="space-pronounce-scene">
        <div className="space-gradient" />

        <img src={sunImg} alt="Sun" className="space-sun" />

        <div className="star-layer" aria-hidden="true">
          {stars.map((star) => (
            <img
              key={star.id}
              src={starImg}
              className="star-item"
              alt=""
              style={{
                top: `${star.top}%`,
                left: `${star.left}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                animation: `starPulse ${star.duration}s ${star.delay}s ease-in-out infinite alternate`,
                "--min-scale": star.minScale,
                "--max-scale": star.maxScale,
              }}
            />
          ))}
        </div>

        <div className="mountain-track" aria-hidden="true">
          <div className="mountain-copy">
            <img src={mountainImg} alt="" className="mountain-image" />
          </div>
          <div className="mountain-copy">
            <img src={mountainImg} alt="" className="mountain-image" />
          </div>
        </div>

        <img src={astronautImg} alt="Astronaut ship" className="astronaut" />

        {meteoriteActive ? (
          <img
            key={meteoriteKey}
            src={meteoriteImg}
            alt="Meteorite"
            className={`meteorite ${meteoriteAtCenter ? "at-center" : ""} ${
              meteoriteDestroyed ? "destroyed" : ""
            } ${
              meteoriteEscaped ? "escaped" : ""
            }`}
            onAnimationEnd={(event) => {
              if (event.animationName === "meteoriteToCenter") {
                setMeteoriteAtCenter(true);
                setTimeout(() => setShowVocabCard(true), 300);
              }
            }}
          />
        ) : null}

        <div className="space-score">Correct: {correctCount}</div>

        {showVocabCard && !encouragement ? (
          <div className="vocab-card">
          <div className="question-progress">
            <span>
              {questionIndex + 1} / {TOTAL_QUESTIONS}
            </span>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <div className="vocab-emoji">{currentWord?.emoji}</div>
          <div className="vocab-word">{currentWord?.word}</div>

          <div className="vocab-controls">
            <button className="vocab-speaker" type="button" onClick={speakWord}>
              🔊
            </button>
            <button
              className={`vocab-mic ${isListening ? "mic-active" : ""}`}
              type="button"
              onClick={startListening}
              disabled={isListening || gameWon || isTransitioningRef.current}
            >
              {isListening ? "🔴" : "🎤"}
            </button>
          </div>

          <div className="vocab-attempts">
            {"💚".repeat(attemptsLeft)}
            {"🖤".repeat(MAX_ATTEMPTS - attemptsLeft)}
          </div>

          {feedback ? (
            <div className={`vocab-feedback ${feedback.correct ? "correct" : "wrong"}`}>
              {feedback.correct ? "✅ Great!" : `❌ Try again! (${feedback.heard || "?"})`}
            </div>
          ) : null}

          {feedback?.skipped ? (
            <div className="skip-message">
              😅 Better luck next time!
              <br />
              <small>Moving to next word...</small>
            </div>
          ) : null}
          </div>
        ) : null}

        {encouragement === "correct" ? (
          <div className="encouragement-overlay">
            <div className="encourage-text-correct">⭐ Good job! ⭐</div>
          </div>
        ) : null}

        {encouragement === "wrong" ? (
          <div className="encouragement-overlay">
            <div className="encourage-text-wrong">
              💪 Keep trying,
              <br />
              you will pronounce it
              <br />
              correctly next time!
            </div>
          </div>
        ) : null}

        {gameWon ? (
          <div className="gameover-overlay">
            <div className="gameover-card">
              <div className="gameover-emoji">🏆</div>
              <h2 className="gameover-title">Mission Complete!</h2>
              <p className="gameover-score">
                Correct: {correctCount}/{TOTAL_QUESTIONS}
              </p>
              <p className="gameover-score">Stars earned: {starsEarned}</p>
              <div className="gameover-buttons">
                <button className="btn-play-again" type="button" onClick={restartGame}>
                  🔄 Play Again
                </button>
              </div>
            </div>
          </div>
        ) : null}
          </div>
        </section>
      </div>

      <div className="game-title-bar">
        <h2 className="game-title">🚀 Space Pronounce</h2>
        <span className="question-progress">
          {questionIndex + 1} / {TOTAL_QUESTIONS}
        </span>
      </div>
    </div>
  );
};

export default SpacePronounce;
