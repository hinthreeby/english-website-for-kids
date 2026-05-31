import { useCallback, useEffect, useRef, useState } from "react";
import api from "../lib/api";
import useSound from "../hooks/useSound";
import "./DrawGuess.css";

const KEYWORDS = [
  // Animals
  { word: "cat",         emoji: "🐱" },
  { word: "dog",         emoji: "🐶" },
  { word: "fish",        emoji: "🐟" },
  { word: "bird",        emoji: "🐦" },
  { word: "rabbit",      emoji: "🐰" },
  { word: "elephant",    emoji: "🐘" },
  { word: "lion",        emoji: "🦁" },
  { word: "snake",       emoji: "🐍" },
  { word: "butterfly",   emoji: "🦋" },
  { word: "turtle",      emoji: "🐢" },
  { word: "frog",        emoji: "🐸" },
  { word: "duck",        emoji: "🦆" },
  { word: "horse",       emoji: "🐴" },
  { word: "monkey",      emoji: "🐒" },
  // Nature
  { word: "sun",         emoji: "☀️" },
  { word: "tree",        emoji: "🌲" },
  { word: "flower",      emoji: "🌸" },
  { word: "cloud",       emoji: "☁️" },
  { word: "moon",        emoji: "🌙" },
  { word: "star",        emoji: "⭐" },
  { word: "rainbow",     emoji: "🌈" },
  { word: "mountain",    emoji: "⛰️" },
  { word: "rain",        emoji: "🌧️" },
  { word: "leaf",        emoji: "🍃" },
  // Food
  { word: "apple",       emoji: "🍎" },
  { word: "banana",      emoji: "🍌" },
  { word: "pizza",       emoji: "🍕" },
  { word: "cake",        emoji: "🎂" },
  { word: "ice cream",   emoji: "🍦" },
  { word: "watermelon",  emoji: "🍉" },
  { word: "strawberry",  emoji: "🍓" },
  { word: "carrot",      emoji: "🥕" },
  // Objects
  { word: "house",       emoji: "🏠" },
  { word: "car",         emoji: "🚗" },
  { word: "boat",        emoji: "⛵" },
  { word: "airplane",    emoji: "✈️" },
  { word: "bicycle",     emoji: "🚲" },
  { word: "ball",        emoji: "⚽" },
  { word: "book",        emoji: "📚" },
  { word: "clock",       emoji: "🕐" },
  { word: "chair",       emoji: "🪑" },
  { word: "umbrella",    emoji: "☂️" },
  { word: "hat",         emoji: "🎩" },
  { word: "key",         emoji: "🔑" },
];

const COLORS = [
  "#111111", "#ffffff", "#e53935", "#ff4081",
  "#fb8c00", "#fdd835", "#43a047", "#26c6da",
  "#1e88e5", "#8e24aa", "#795548", "#90a4ae",
];
const TOTAL     = 5;
const BRUSH     = 8;
const ERASER    = 26;
const CANVAS_SZ = 480;
const TIME_LIMIT = 30;

function pickRounds() {
  return [...KEYWORDS].sort(() => Math.random() - 0.5).slice(0, TOTAL);
}

const DrawGuess = ({ onComplete }) => {
  const { playChime, playWhoosh, speakText } = useSound();

  const canvasRef  = useRef(null);
  const ctxRef     = useRef(null);
  const isDrawing  = useRef(false);

  const [rounds]       = useState(pickRounds);
  const [roundIndex,   setRoundIndex]   = useState(0);
  const [drawColor,    setDrawColor]    = useState(COLORS[0]);
  const [isEraser,     setIsEraser]     = useState(false);
  const [status,       setStatus]       = useState("idle"); // idle|checking|correct|wrong|error
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft,     setTimeLeft]     = useState(TIME_LIMIT);
  const [attempts,     setAttempts]     = useState(0);

  const current  = rounds[roundIndex];
  const isActive = status === "idle";

  // Init canvas with white background
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_SZ, CANVAS_SZ);
    ctx.lineCap  = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;
  }, []);

  // Announce keyword on each new round
  useEffect(() => {
    speakText(`Draw a ${current.word}`);
  }, [current.word, speakText]);

  // Update brush style when color / eraser mode changes
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.strokeStyle = isEraser ? "#ffffff" : drawColor;
    ctx.lineWidth   = isEraser ? ERASER : BRUSH;
  }, [drawColor, isEraser]);

  const resetCanvas = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_SZ, CANVAS_SZ);
  }, []);

  const isCanvasEmpty = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return true;
    const { data } = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) return false;
    }
    return true;
  }, []);

  // Convert pointer/touch event to canvas coordinates
  const getPos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const src    = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top)  * scaleY,
    };
  }, []);

  const handlePointerDown = useCallback((e) => {
    if (!isActive) return;
    e.preventDefault();
    isDrawing.current = true;
    const { x, y } = getPos(e);
    const ctx = ctxRef.current;
    // Paint a dot on press (handles single tap)
    ctx.beginPath();
    ctx.arc(x, y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, [isActive, getPos]);

  const handlePointerMove = useCallback((e) => {
    if (!isDrawing.current || !isActive) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    const ctx = ctxRef.current;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, [isActive, getPos]);

  const handlePointerUp = useCallback(() => {
    isDrawing.current = false;
    ctxRef.current?.beginPath();
  }, []);

  // Advance to next round or end game
  const handleNext = useCallback(() => {
    const nextIndex = roundIndex + 1;
    if (nextIndex >= TOTAL) {
      const mistakes = TOTAL - correctCount;
      const stars    = mistakes === 0 ? 3 : mistakes <= 1 ? 2 : 1;
      onComplete({ stars, mistakes });
      return;
    }
    setRoundIndex(nextIndex);
    setStatus("idle");
    setIsEraser(false);
    setAttempts(0);
    resetCanvas();
  }, [roundIndex, correctCount, onComplete, resetCanvas]);

  // Reset timer on new round
  useEffect(() => {
    setTimeLeft(TIME_LIMIT);
  }, [roundIndex]);

  // Countdown tick — only while drawing
  useEffect(() => {
    if (status !== "idle") return;
    if (timeLeft <= 0) {
      playWhoosh();
      setStatus("wrong");
      return;
    }
    const t = setTimeout(() => setTimeLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-advance 1.8s after a correct answer
  useEffect(() => {
    if (status !== "correct") return;
    const t = setTimeout(handleNext, 1800);
    return () => clearTimeout(t);
  }, [status, handleNext]);

  const handleCheck = async () => {
    if (isCanvasEmpty()) return; // chưa vẽ gì → không làm gì

    const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.85);
    const base64  = dataUrl.split(",")[1];

    setStatus("checking");
    try {
      const { data } = await api.post("/api/draw-game/check", {
        imageBase64: base64,
        keyword: current.word,
      });
      if (data.correct) {
        playChime();
        setCorrectCount((c) => c + 1);
        setStatus("correct");
      } else {
        playWhoosh();
        setStatus("wrong");
      }
    } catch {
      setStatus("error");
    }
  };

  const timeUp = status === "wrong" && timeLeft <= 0;
  const resultText = {
    correct: `✅ Yes! That looks like a ${current.word}!`,
    wrong:   timeUp ? `⏰ Time's up! Try again?` : `🤔 Not quite a ${current.word}… Keep trying!`,
    error:   "⚠️ Couldn't reach AI. Please try again!",
  }[status];

  return (
    <div className="game-page-wrapper">
      <div className="game-frame">
        <section className="game-panel draw-guess-panel">

          {/* ── Header ───────────────────────────────────────── */}
          <div className="dg-header">
            <p className="round">Round {roundIndex + 1} / {TOTAL}</p>
          </div>

          {/* ── Two columns ──────────────────────────────────── */}
          <div className="dg-main">

            {/* Left: reference card + action below */}
            <div className="dg-left">
              <div className="dg-reference">
                <p className="dg-ref-label">Look at this!</p>
                <div className="dg-ref-emoji">{current.emoji}</div>
                <p className="dg-ref-word">{current.word.toUpperCase()}</p>
                <button
                  type="button"
                  className="dg-speak-btn"
                  onClick={() => speakText(`Draw a ${current.word}`)}
                  aria-label="Hear the word"
                >
                  🔊
                </button>
              </div>

              {/* Timer + action fill the empty space */}
              <div className="dg-actions">
                <div className="dg-timer-wrap">
                  <div className={`dg-timer${timeLeft <= 10 ? " dg-timer--urgent" : ""}`}>
                    <svg viewBox="0 0 44 44" className="dg-timer-ring">
                      <circle cx="22" cy="22" r="18" className="dg-timer-track" />
                      <circle
                        cx="22" cy="22" r="18"
                        className="dg-timer-progress"
                        style={{
                          strokeDashoffset: 113.1 - (113.1 * timeLeft) / TIME_LIMIT,
                        }}
                      />
                    </svg>
                    <span className="dg-timer-num">{timeLeft}</span>
                  </div>
                </div>

              <div className="dg-actions-btn">
                {isActive && (
                  <button type="button" className="kid-btn dg-check-btn" onClick={handleCheck}>
                    🔍 Check!
                  </button>
                )}
                {(status === "wrong" || status === "error") && (
                  <div className="dg-retry-btns">
                    {attempts < 3 && (
                      <button
                        type="button"
                        className="kid-btn secondary dg-check-btn"
                        onClick={() => {
                          setAttempts((a) => a + 1);
                          resetCanvas();
                          setTimeLeft(TIME_LIMIT);
                          setStatus("idle");
                        }}
                      >
                        Try Again ({3 - attempts})
                      </button>
                    )}
                    <button type="button" className="kid-btn ghost dg-check-btn" onClick={handleNext}>
                      Next →
                    </button>
                  </div>
                )}
                {status === "correct" && (
                  <p className="dg-auto-advance">Next round…</p>
                )}
              </div>
              </div>
            </div>

            {/* Right: drawing canvas */}
            <div className="dg-canvas-wrap">
              <canvas
                ref={canvasRef}
                width={CANVAS_SZ}
                height={CANVAS_SZ}
                className="dg-canvas"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                style={{ touchAction: "none" }}
              />

              {/* Floating tools inside canvas */}
              {isActive && (
                <div className="dg-canvas-tools">
                  <button
                    type="button"
                    className={`dg-tool-btn${isEraser ? " dg-tool-btn--active" : ""}`}
                    onClick={() => setIsEraser((v) => !v)}
                    title={isEraser ? "Draw" : "Erase"}
                  >
                    {isEraser ? "✏️" : "🧹"}
                  </button>
                  <button
                    type="button"
                    className="dg-tool-btn"
                    onClick={resetCanvas}
                    title="Clear"
                  >
                    🗑️
                  </button>
                </div>
              )}

              {status !== "idle" && (
                <div className={`dg-overlay dg-overlay--${status}`}>
                  {status === "checking" ? (
                    <div className="dg-loading">
                      <span className="dg-spinner" />
                      <span>AI is thinking…</span>
                    </div>
                  ) : (
                    <p className="dg-result-text">{resultText}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Colors (centered) ────────────────────────────── */}
          <div className="dg-toolbar">
            <div className="dg-colors">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`dg-color-btn${!isEraser && drawColor === c ? " dg-color-btn--active" : ""}`}
                  style={{ background: c }}
                  onClick={() => { setDrawColor(c); setIsEraser(false); }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>


        </section>
      </div>

      <div className="game-title-bar">
        <h2 className="game-title">🎨 Draw &amp; Guess</h2>
        <span className="question-progress">
          ⭐ {correctCount} / {roundIndex + (status !== "idle" ? 1 : 0)}
        </span>
      </div>
    </div>
  );
};

export default DrawGuess;
