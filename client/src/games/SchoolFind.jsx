import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import bagImg       from "../assets/roadmap/unit2/bag.png";
import ballImg      from "../assets/roadmap/unit2/ball.png";
import bookImg      from "../assets/roadmap/unit2/book.png";
import crayonImg    from "../assets/roadmap/unit2/crayon.png";
import pencilImg    from "../assets/roadmap/unit2/pencil.png";
import teddybearImg from "../assets/roadmap/unit2/teddybear.png";
import "./SchoolFind.css";

const ITEMS = [
  { id: "bag",       name: "Bag",        img: bagImg,       audio: "/roadmap/games/unit2/bag.mp3",       color: "#f472b6" },
  { id: "ball",      name: "Ball",       img: ballImg,      audio: "/roadmap/games/unit2/ball.mp3",      color: "#60a5fa" },
  { id: "book",      name: "Book",       img: bookImg,      audio: "/roadmap/games/unit2/book.mp3",      color: "#34d399" },
  { id: "crayon",    name: "Crayon",     img: crayonImg,    audio: "/roadmap/games/unit2/crayon.mp3",    color: "#fbbf24" },
  { id: "pencil",    name: "Pencil",     img: pencilImg,    audio: "/roadmap/games/unit2/pencil.mp3",    color: "#a78bfa" },
  { id: "teddybear", name: "Teddy Bear", img: teddybearImg, audio: "/roadmap/games/unit2/teddybear.mp3", color: "#fb923c" },
];

const TOTAL = ITEMS.length;

const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  emoji: ["⭐", "🌟", "✨", "🎉", "🎊", "📚", "🎈", "🏆"][i % 8],
  left:  Math.random() * 100,
  delay: Math.random() * 2.5,
  dur:   2.2 + Math.random() * 2,
}));

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const playFeedback = (type) => {
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

const SchoolFind = ({ onComplete }) => {
  const [phase, setPhase]                 = useState("intro");
  const [questionOrder]                   = useState(() => shuffle(ITEMS).map(i => i.id));
  const [questionIdx, setQuestionIdx]     = useState(0);
  const [foundIds,    setFoundIds]        = useState(new Set());
  const [shakingId,   setShakingId]       = useState(null);
  const [poppingId,   setPoppingId]       = useState(null);
  const [revealingId, setRevealingId]     = useState(null);
  const [mistakesRound, setMistakesRound] = useState(0);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [showWordFor,  setShowWordFor]    = useState(null);
  const timersRef = useRef([]);
  const audioRef  = useRef(null);

  const qt = (fn, ms) => {
    const id = setTimeout(() => {
      timersRef.current = timersRef.current.filter(t => t !== id);
      fn();
    }, ms);
    timersRef.current.push(id);
  };

  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
  }, []);

  const playAudio = useCallback((path) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      const audio = new Audio(path);
      audioRef.current = audio;
      audio.play().catch((err) => {
        console.warn(`[SchoolFind] Audio failed to play: ${path}`, err.message || err);
      });
    } catch (err) {
      console.warn(`[SchoolFind] Audio error for: ${path}`, err.message || err);
    }
  }, []);

  const currentId   = questionOrder[questionIdx];
  const currentItem = useMemo(() => ITEMS.find(i => i.id === currentId), [currentId]);

  // Auto-play audio when question changes (after user started playing)
  useEffect(() => {
    if (phase !== "question") return;
    const item = ITEMS.find(i => i.id === questionOrder[questionIdx]);
    if (!item) return;
    const id = setTimeout(() => playAudio(item.audio), 450);
    return () => clearTimeout(id);
  }, [phase, questionIdx, questionOrder, playAudio]);

  const advanceToNext = useCallback((nextIdx) => {
    if (nextIdx >= TOTAL) {
      setPhase("complete");
    } else {
      setQuestionIdx(nextIdx);
      setMistakesRound(0);
      setShowWordFor(null);
      setPhase("question");
    }
  }, []);

  const handleCorrect = useCallback((id) => {
    playFeedback("correct");
    const item = ITEMS.find(i => i.id === id);
    if (item) playAudio(item.audio);
    setPoppingId(id);
    setShowWordFor(id);
    setPhase("transitioning");
    qt(() => {
      setPoppingId(null);
      setShowWordFor(null);
      setFoundIds(prev => new Set([...prev, id]));
      advanceToNext(questionIdx + 1);
    }, 750);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionIdx, advanceToNext, playAudio]);

  const handleReveal = useCallback((id) => {
    const item = ITEMS.find(i => i.id === id);
    if (item) playAudio(item.audio);
    setRevealingId(id);
    setShowWordFor(id);
    qt(() => {
      setRevealingId(null);
      setPoppingId(id);
      qt(() => {
        setPoppingId(null);
        setShowWordFor(null);
        setFoundIds(prev => new Set([...prev, id]));
        advanceToNext(questionIdx + 1);
      }, 750);
    }, 1500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionIdx, advanceToNext, playAudio]);

  const handleClick = useCallback((id) => {
    if (phase !== "question") return;
    if (foundIds.has(id)) return;

    if (id === currentId) {
      handleCorrect(id);
    } else {
      playFeedback("wrong");
      setShakingId(id);
      setTotalMistakes(n => n + 1);
      const newMistakes = mistakesRound + 1;
      setMistakesRound(newMistakes);
      qt(() => setShakingId(null), 650);
      if (newMistakes >= 3) {
        setPhase("transitioning");
        qt(() => handleReveal(currentId), 700);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, foundIds, currentId, mistakesRound, handleCorrect, handleReveal]);

  const playCurrentAudio = () => {
    if (currentItem) playAudio(currentItem.audio);
  };

  const finish = () => {
    const stars = totalMistakes === 0 ? 3 : totalMistakes <= 3 ? 2 : 1;
    onComplete({ stars, mistakes: totalMistakes });
  };

  const foundCount = foundIds.size;
  const hearts     = Math.max(0, 3 - mistakesRound);
  const wordItem   = showWordFor ? ITEMS.find(i => i.id === showWordFor) : null;

  return (
    <div className="game-page-wrapper">

      {/* ── INTRO overlay ── */}
      {phase === "intro" && (
        <div className="sf-overlay">
          <div className="sf-intro-card">
            <div className="text-6xl mb-1">🔍</div>
            <h2 className="text-2xl font-black text-purple-700">Find the Object!</h2>
            <p className="text-gray-600 font-semibold text-center leading-relaxed text-sm">
              Listen 🔊 and tap the correct object!
            </p>
            <div className="sf-items-preview">
              {ITEMS.map(item => (
                <img key={item.id} src={item.img} alt={item.name} className="sf-preview-img" draggable={false} />
              ))}
            </div>
            <button type="button" className="sf-btn-primary" onClick={() => setPhase("question")}>
              Let&apos;s Play! 🚀
            </button>
          </div>
        </div>
      )}

      {/* ── GAME ── */}
      {(phase === "question" || phase === "transitioning") && (
        <div className="sf-game-wrap">

          {/* Top bar */}
          <div className="sf-top-bar">
            <div className="sf-progress-pill">
              <span className="sf-progress-icon">📦</span>
              {foundCount} / {TOTAL}
            </div>
            <div className="sf-hearts">
              {[0, 1, 2].map(i => (
                <span key={i} className={`sf-heart ${i < hearts ? "sf-heart-on" : "sf-heart-off"}`}>
                  {i < hearts ? "❤️" : "🖤"}
                </span>
              ))}
            </div>
          </div>

          {/* Question prompt — always visible, shows which object to find */}
          {!wordItem && currentItem && (
            <div className="sf-question-prompt">
              <button
                type="button"
                className="sf-ask-btn"
                onClick={playCurrentAudio}
                aria-label="Play audio"
              >
                🔊
              </button>
              <span className="sf-ask-text">
                Find:&nbsp;<strong style={{ color: currentItem.color }}>{currentItem.name}</strong>
              </span>
            </div>
          )}

          {/* Word reveal banner — shown after correct/reveal */}
          {wordItem && (
            <div className="sf-word-banner" style={{ color: wordItem.color, borderColor: wordItem.color }}>
              {wordItem.name}
            </div>
          )}

          {/* 2-column × 3-row items grid */}
          <div className="sf-items-area">
            <div className="sf-items-grid">
              {ITEMS.map(item => {
                if (foundIds.has(item.id)) {
                  return <div key={item.id} className="sf-item-slot sf-item-slot-empty" />;
                }

                const isShaking   = shakingId   === item.id;
                const isPopping   = poppingId   === item.id;
                const isRevealing = revealingId === item.id;
                const isActive    = phase === "question";

                return (
                  <div key={item.id} className="sf-item-slot">
                    <button
                      type="button"
                      aria-label={`Choose ${item.name}`}
                      className={[
                        "sf-item-btn",
                        isShaking   ? "sf-anim-shake"  : "",
                        isPopping   ? "sf-anim-pop"    : "",
                        isRevealing ? "sf-anim-reveal" : "",
                        isActive && !isShaking && !isPopping && !isRevealing
                          ? "sf-item-active" : "",
                      ].filter(Boolean).join(" ")}
                      style={{ "--ic": item.color }}
                      onClick={() => handleClick(item.id)}
                      disabled={!isActive || isPopping || isRevealing}
                    >
                      <img
                        src={item.img}
                        alt={item.name}
                        className="sf-item-img"
                        draggable={false}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ── GAME TITLE BAR ── */}
      {(phase === "question" || phase === "transitioning") && (
        <div className="game-title-bar">
          <h2 className="game-title">🔍 Find the Object</h2>
          <span className="question-progress">
            Question {Math.min(foundCount + 1, TOTAL)} / {TOTAL}
          </span>
        </div>
      )}

      {/* ── COMPLETE overlay ── */}
      {phase === "complete" && (
        <div className="sf-overlay">
          {PARTICLES.map(p => (
            <span
              key={p.id}
              className="sf-particle"
              style={{ left: `${p.left}%`, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }}
              aria-hidden="true"
            >
              {p.emoji}
            </span>
          ))}
          <div className="sf-complete-card">
            <div className="text-6xl">🎉</div>
            <h2 className="text-3xl font-black" style={{ color: "#7c3aed" }}>Great Job!</h2>
            <p className="text-gray-500 font-semibold text-sm">You found all 6 objects! ⭐</p>
            <div className="sf-complete-items">
              {ITEMS.map(item => (
                <div key={item.id} className="sf-complete-item">
                  <img src={item.img} alt={item.name} className="sf-complete-img" draggable={false} />
                  <span className="sf-complete-name" style={{ color: item.color }}>{item.name}</span>
                </div>
              ))}
            </div>
            <button type="button" className="sf-btn-primary" onClick={finish}>
              Finish! 🎊
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolFind;
