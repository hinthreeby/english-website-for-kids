import { useEffect, useRef, useState } from "react";
import dadImg     from "../assets/games/unit1-family/dad.png";
import momImg     from "../assets/games/unit1-family/mom.png";
import brotherImg from "../assets/games/unit1-family/brother.png";
import sisterImg  from "../assets/games/unit1-family/sister.png";
import "./FamilyPhoto.css";

const MEMBERS = [
  { id: "dad",     name: "Dad",     img: dadImg,     audio: "/roadmap/games/unit1/dad.mp3",     color: "#fbbf24" },
  { id: "mom",     name: "Mom",     img: momImg,     audio: "/roadmap/games/unit1/mom.mp3",     color: "#f472b6" },
  { id: "brother", name: "Brother", img: brotherImg, audio: "/roadmap/games/unit1/brother.mp3", color: "#60a5fa" },
  { id: "sister",  name: "Sister",  img: sisterImg,  audio: "/roadmap/games/unit1/sister.mp3",  color: "#34d399" },
];

const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  emoji: ["❤️", "💛", "💚", "💙", "✨", "⭐", "🌸", "🎉"][i % 8],
  left:  Math.random() * 100,
  delay: Math.random() * 2.2,
  dur:   2.4 + Math.random() * 2,
}));

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const playSound = (type) => {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  const ctx  = new Ctx();
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  if (type === "correct") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(523, ctx.currentTime);
    osc.frequency.setValueAtTime(659, ctx.currentTime + 0.15);
    osc.frequency.setValueAtTime(784, ctx.currentTime + 0.30);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    osc.start(); osc.stop(ctx.currentTime + 0.6);
  } else {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(280, ctx.currentTime);
    osc.frequency.setValueAtTime(200, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(); osc.stop(ctx.currentTime + 0.4);
  }
  osc.onended = () => ctx.close().catch(() => {});
};

const FamilyPhoto = ({ onComplete }) => {
  const [showIntro, setShowIntro] = useState(true);
  const [questions] = useState(() =>
    shuffle(MEMBERS).map(m => ({
      correct: m.id,
      audio:   m.audio,
      options: shuffle(MEMBERS),
    }))
  );
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const [allDone,  setAllDone]  = useState(false);

  const timersRef = useRef([]);

  const qt = (fn, ms) => {
    const id = setTimeout(() => {
      timersRef.current = timersRef.current.filter(t => t !== id);
      fn();
    }, ms);
    timersRef.current.push(id);
  };

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  // Auto-play question audio when question changes or game starts
  useEffect(() => {
    if (showIntro || allDone) return;
    const id = setTimeout(() => new Audio(questions[currentQ].audio).play().catch(() => {}), 500);
    return () => clearTimeout(id);
  }, [currentQ, showIntro, allDone, questions]);

  const q = questions[currentQ];

  const playQuestionAudio = () => new Audio(q.audio).play().catch(() => {});

  const handleSelect = (memberId) => {
    if (selected !== null) return;
    setSelected(memberId);
    if (memberId === q.correct) {
      playSound("correct");
      qt(() => {
        if (currentQ + 1 >= questions.length) {
          setAllDone(true);
        } else {
          setCurrentQ(prev => prev + 1);
          setSelected(null);
        }
      }, 1100);
    } else {
      playSound("wrong");
      setMistakes(n => n + 1);
      qt(() => setSelected(null), 750);
    }
  };

  const finish = () => {
    const stars = mistakes === 0 ? 3 : mistakes <= 3 ? 2 : 1;
    onComplete({ stars, mistakes });
  };

  return (
    <div className="game-page-wrapper">

      {/* ── Intro overlay ── */}
      {showIntro && (
        <div className="fp-intro-overlay">
          <div className="fp-intro-card">
            <p className="fp-intro-title">Who do you hear?</p>
            <p className="fp-intro-sub">
              Press 🔊 and pick the right family member!
            </p>
            <button
              type="button"
              className="fp-intro-btn"
              onClick={() => {
                setShowIntro(false);
              }}
            >
              Let&apos;s Play! 🚀
            </button>
          </div>
        </div>
      )}

      {/* ── Main game ── */}
      <div className="fp-quiz-frame">

        {/* Question */}
        <div className="fp-question-area">
          <p className="fp-q-num">Question {currentQ + 1} / {questions.length}</p>
          <p className="fp-question-label">Who do you hear? 👂</p>
          <button
            type="button"
            className="fp-audio-btn"
            onClick={playQuestionAudio}
            aria-label="Play sound"
          >
            🔊
          </button>
          <p className="fp-tap-hint">Tap to listen again!</p>
        </div>

        {/* Answer options – horizontal row */}
        <div className="fp-options-row">
          {q.options.map(m => {
            const isSelected = selected === m.id;
            const isCorrect  = isSelected && m.id === q.correct;
            const isWrong    = isSelected && m.id !== q.correct;
            return (
              <button
                key={m.id}
                type="button"
                className={[
                  "fp-option",
                  isCorrect ? "fp-option-correct" : "",
                  isWrong   ? "fp-option-wrong"   : "",
                ].filter(Boolean).join(" ")}
                style={{ "--opt-col": m.color }}
                onClick={() => handleSelect(m.id)}
                disabled={selected !== null && !isSelected}
                aria-label={`Choose ${m.name}`}
              >
                <img src={m.img} alt={m.name} className="fp-option-img" draggable={false} />
                <span className="fp-option-name">{m.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Title bar ── */}
      <div className="game-title-bar">
        <h2 className="game-title">👂 Listen &amp; Match</h2>
        <span className="question-progress">{currentQ + 1} / {questions.length}</span>
      </div>

      {/* ── Celebration overlay ── */}
      {allDone && (
        <div className="fp-celebration">
          {PARTICLES.map(p => (
            <span
              key={p.id}
              className="fp-particle"
              style={{ left: `${p.left}%`, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }}
              aria-hidden="true"
            >
              {p.emoji}
            </span>
          ))}
          <div className="fp-celeb-card">
            <div className="fp-celeb-family">
              {MEMBERS.map(m => (
                <img key={m.id} src={m.img} alt={m.name} className="fp-celeb-img" draggable={false} />
              ))}
            </div>
            <h2 className="fp-celeb-title">Amazing! 🌟</h2>
            <p className="fp-celeb-sub">You know your family! ⭐</p>
            <button type="button" className="fp-finish-btn" onClick={finish}>
              Finish! 🎉
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyPhoto;
