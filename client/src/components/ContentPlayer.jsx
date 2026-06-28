import { useCallback, useEffect, useRef, useState } from "react";
import useSound from "../hooks/useSound";
import api from "../lib/api";
import matchWithPicImg from "../assets/teacher/matchwithpicture.png";
import flashcardImg    from "../assets/teacher/flashcard.png";
import quizlogoImg     from "../assets/teacher/quizlogo.png";

// ── Spell + TTS helper ────────────────────────────────────────────────────────
// If audioUrl provided → play it. Otherwise spell letters then read full word via Web Speech API.
function spellAndSay(word, audioUrl) {
  if (!word) return;
  if (audioUrl) {
    try { new Audio(audioUrl).play(); } catch (_) {}
    return;
  }
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const clean = word.trim();
  // Spell each letter
  [...clean.toUpperCase()].forEach((ch) => {
    const u = new SpeechSynthesisUtterance(ch);
    u.lang = "en-US"; u.rate = 0.85; u.pitch = 1.1;
    window.speechSynthesis.speak(u);
  });
  // Read full word after a short pause utterance
  const pause = new SpeechSynthesisUtterance(" ");
  pause.lang = "en-US"; pause.rate = 2;
  window.speechSynthesis.speak(pause);
  const full = new SpeechSynthesisUtterance(clean);
  full.lang = "en-US"; full.rate = 0.75; full.pitch = 1.05;
  window.speechSynthesis.speak(full);
}

// ── Keyframes (injected once) ─────────────────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("cp-kf")) {
  const s = document.createElement("style");
  s.id = "cp-kf";
  s.textContent = `
    /* ── Scoped scrollbar for preview/student modal ── */
    .cp-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
    .cp-scroll::-webkit-scrollbar-track {
      background: rgba(20, 5, 55, 0.7);
      border-radius: 99px;
    }
    .cp-scroll::-webkit-scrollbar-thumb {
      background: linear-gradient(180deg, #ff5bd7 0%, #8b5cf6 50%, #38bdf8 100%);
      border-radius: 99px;
      border: 1.5px solid rgba(14, 4, 42, 0.75);
      box-shadow: 0 0 10px rgba(139,92,246,0.7), 0 0 4px rgba(56,189,248,0.4);
    }
    .cp-scroll::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(180deg, #ff80e8 0%, #a78bfa 50%, #67e8f9 100%);
      box-shadow: 0 0 18px rgba(167,139,250,0.95), 0 0 8px rgba(56,189,248,0.65);
    }
    .cp-scroll { scrollbar-width: thin; scrollbar-color: #8b5cf6 rgba(20,5,55,0.7); }

    @keyframes cpStarFloat {
      0%   { opacity: 1; transform: translateY(0) scale(1.5) rotate(0deg); }
      100% { opacity: 0; transform: translateY(-90px) scale(0.2) rotate(40deg); }
    }
    @keyframes cpWrongFlash {
      0%, 100% { background: rgba(239,68,68,0); }
      40%       { background: rgba(239,68,68,0.3); }
    }
    @keyframes cpCorrectGlow {
      0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
      50%  { box-shadow: 0 0 20px 6px rgba(16,185,129,0.7); }
      100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
    }
    @keyframes cpDone {
      0%   { transform: scale(1) rotate(0deg); }
      25%  { transform: scale(1.1) rotate(-3deg); }
      75%  { transform: scale(1.1) rotate(3deg); }
      100% { transform: scale(1) rotate(0deg); }
    }
    @keyframes cpPulse {
      0%, 100% { transform: scale(1);    box-shadow: 0 0 30px rgba(6,182,212,0.6), 0 0 60px rgba(6,182,212,0.2); }
      50%       { transform: scale(1.08); box-shadow: 0 0 55px rgba(6,182,212,0.95), 0 0 90px rgba(6,182,212,0.4); }
    }
    @keyframes cpSlideIn {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes cpShake {
      0%, 100% { transform: translateX(0); }
      20%       { transform: translateX(-7px); }
      60%       { transform: translateX(7px); }
    }
    @keyframes cpTwinkle {
      0%, 100% { opacity: 0.12; transform: scale(0.6); }
      50%       { opacity: 1;    transform: scale(1.4); }
    }
    @keyframes cpShootingStar {
      0%   { opacity: 0;   transform: rotate(-25deg) translateX(-100px); }
      6%   { opacity: 1; }
      88%  { opacity: 0.8; }
      100% { opacity: 0;   transform: rotate(-25deg) translateX(750px); }
    }
    @keyframes cpFloatPlanet {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-11px); }
    }
    @keyframes cpModalEntrance {
      from { opacity: 0; transform: scale(0.91) translateY(26px); }
      to   { opacity: 1; transform: scale(1)    translateY(0); }
    }
    @keyframes cpBadgePulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(236,72,153,0.55), 0 0 14px rgba(236,72,153,0.4); }
      50%       { box-shadow: 0 0 0 7px rgba(236,72,153,0),  0 0 26px rgba(236,72,153,0.65); }
    }
    @keyframes cpAnswerHover {
      from { transform: translateY(0); }
      to   { transform: translateY(-2px); }
    }
    @keyframes cpDotTwinkle {
      from { opacity: 0.1; }
      to   { opacity: 0.7; }
    }
    @keyframes cpStarScaleGlow {
      0%   { opacity: 0.3; transform: scale(0.85); }
      50%  { opacity: 0.9; transform: scale(1.15); }
      100% { opacity: 0.3; transform: scale(0.85); }
    }
    @keyframes cpBurst {
      0%   { opacity: 1; transform: translate(0, 0) scale(1.4) rotate(0deg); }
      30%  { opacity: 1; }
      100% { opacity: 0; transform: translate(var(--tx, 80px), var(--ty, 80px)) scale(0.2) rotate(var(--rot, 360deg)); }
    }
  `;
  document.head.appendChild(s);
}

// ── Quiz answer colors (Kahoot-style) ─────────────────────────────────────────
const QUIZ_COLORS = [
  { bg: "rgba(59,130,246,0.25)",  border: "rgba(59,130,246,0.75)",  text: "#93c5fd", glow: "rgba(59,130,246,0.5)",  icon: "★" },
  { bg: "rgba(239,68,68,0.22)",   border: "rgba(239,68,68,0.75)",   text: "#fca5a5", glow: "rgba(239,68,68,0.5)",   icon: "♥" },
  { bg: "rgba(34,197,94,0.22)",   border: "rgba(34,197,94,0.70)",   text: "#86efac", glow: "rgba(34,197,94,0.5)",   icon: "◆" },
  { bg: "rgba(245,158,11,0.22)",  border: "rgba(245,158,11,0.70)",  text: "#fcd34d", glow: "rgba(245,158,11,0.5)",  icon: "■" },
];

// ── Item card colors for variety ──────────────────────────────────────────────
const CARD_COLORS = [
  { bg: "rgba(124,58,237,0.22)", border: "rgba(124,58,237,0.65)", text: "#c4b5fd", glow: "rgba(124,58,237,0.4)" },
  { bg: "rgba(6,182,212,0.18)",  border: "rgba(6,182,212,0.6)",   text: "#67e8f9", glow: "rgba(6,182,212,0.4)" },
  { bg: "rgba(16,185,129,0.18)", border: "rgba(16,185,129,0.6)",  text: "#6ee7b7", glow: "rgba(16,185,129,0.4)" },
  { bg: "rgba(245,158,11,0.18)", border: "rgba(245,158,11,0.6)",  text: "#fcd34d", glow: "rgba(245,158,11,0.4)" },
  { bg: "rgba(239,68,68,0.18)",  border: "rgba(239,68,68,0.55)",  text: "#fca5a5", glow: "rgba(239,68,68,0.4)" },
  { bg: "rgba(236,72,153,0.18)", border: "rgba(236,72,153,0.55)", text: "#f9a8d4", glow: "rgba(236,72,153,0.4)" },
];

// ── Galaxy decoration data (static, computed once at module load) ──────────────
// Layer 0: tiny white dot stars — same approach as RoadmapPage BG_DOTS
const _BG_DOTS = Array.from({ length: 100 }, (_, i) => ({
  id:  i,
  x:   Math.random() * 100,
  y:   Math.random() * 100,
  s:   Math.random() > 0.75 ? 2 : 1,
  dur: (Math.random() * 3 + 2).toFixed(2),
  del: (Math.random() * 8).toFixed(2),
}));

// Layer 1: minimal colorful ★ stars — perimeter only, small sizes
const _STAR_ICONS = [
  { x:"5%",  y:"8%",  size:14, color:"#A78BFA", dur:3.4, delay:0.0 },
  { x:"88%", y:"6%",  size:16, color:"#38BDF8", dur:3.0, delay:1.2 },
  { x:"2%",  y:"42%", size:12, color:"#FBBF24", dur:4.1, delay:0.5 },
  { x:"93%", y:"35%", size:14, color:"#34D399", dur:3.7, delay:1.8 },
  { x:"7%",  y:"78%", size:14, color:"#FF6B9D", dur:3.2, delay:0.9 },
  { x:"91%", y:"72%", size:12, color:"#A78BFA", dur:4.3, delay:0.3 },
  { x:"48%", y:"3%",  size:12, color:"#FFD700", dur:3.6, delay:1.5 },
  { x:"52%", y:"94%", size:14, color:"#38BDF8", dur:2.9, delay:0.7 },
];

const _SHOOTING = [
  { x: 5,  y: 10, dur: 4.5, del: 0.0 },
  { x: 42, y: 4,  dur: 5.5, del: 3.5 },
  { x: 72, y: 8,  dur: 4.0, del: 7.5 },
];

// ── GalaxyOverlay ─────────────────────────────────────────────────────────────
function GalaxyOverlay() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {/* Tiny white dot stars */}
      {_BG_DOTS.map((d) => (
        <span key={d.id} style={{
          position: "absolute", left: `${d.x}%`, top: `${d.y}%`,
          width: d.s, height: d.s, borderRadius: "50%",
          background: "#fff", opacity: 0.45, display: "block",
          animation: `cpDotTwinkle ${d.dur}s ${d.del}s ease-in-out infinite alternate`,
        }} />
      ))}

      {/* Colorful star icons */}
      {_STAR_ICONS.map((s, i) => (
        <span key={i} style={{
          position: "absolute", left: s.x, top: s.y,
          fontSize: s.size, lineHeight: 1, color: s.color,
          animation: `cpStarScaleGlow ${s.dur}s ${s.delay}s ease-in-out infinite`,
          filter: `drop-shadow(0 0 5px ${s.color})`,
        }}>★</span>
      ))}

      {/* Shooting stars */}
      {_SHOOTING.map((s, i) => (
        <div key={i} style={{
          position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
          width: 130, height: 2, borderRadius: 99,
          background: "linear-gradient(90deg, rgba(255,255,255,0.95), rgba(196,181,253,0.7), transparent)",
          animation: `cpShootingStar ${s.dur}s ${s.del}s infinite linear`,
        }} />
      ))}

      {/* Subtle corner glows — replaces large planet illustrations */}
      <div style={{
        position: "absolute", top: "-10%", left: "-5%",
        width: "35%", paddingBottom: "35%", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(88,28,135,0.22) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-8%", right: "-4%",
        width: "28%", paddingBottom: "28%", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
    </div>
  );
}

// ── FloatingStar ───────────────────────────────────────────────────────────────
function FloatingStar({ x, y, char, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 850); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position: "fixed", left: x - 12, top: y - 14, fontSize: "1.4rem", pointerEvents: "none", zIndex: 9999, lineHeight: 1, animation: "cpStarFloat 0.85s ease-out forwards" }}>
      {char}
    </div>
  );
}

function useStarBurst() {
  const [stars, setStars] = useState([]);
  const burst = useCallback((cx, cy) => {
    const chars = ["⭐", "✨", "🌟", "💫", "⭐", "✨"];
    const next = chars.map((char, i) => ({ id: `${Date.now()}-${i}`, x: cx + (Math.random() - 0.5) * 80, y: cy + (Math.random() - 0.5) * 50, char }));
    setStars((p) => [...p, ...next]);
    next.forEach((s) => setTimeout(() => setStars((p) => p.filter((x) => x.id !== s.id)), 900));
  }, []);
  return { stars, burst };
}

const _BURST_COLORS = ["#fcd34d", "#34d399", "#a78bfa", "#f9a8d4", "#67e8f9", "#fb923c", "#c4b5fd"];

// Two-wave burst: wave 0 = immediate (50 particles), wave 1 = delayed second pop (30 particles)
const _BURST = Array.from({ length: 80 }, (_, i) => {
  const wave      = i < 50 ? 0 : 1;
  const count     = wave === 0 ? 50 : 30;
  const idx       = wave === 0 ? i : i - 50;
  const baseAngle = (idx / count) * Math.PI * 2;
  const jitter    = (Math.random() - 0.5) * 0.8;
  const angle     = baseAngle + jitter;
  const dist      = wave === 0
    ? 160 + Math.random() * 220   // first wave: 160–380px
    : 120 + Math.random() * 260;  // second wave: 120–380px
  const isCircle  = i % 3 === 0;
  const w         = 7 + Math.floor(Math.random() * 7);
  const h         = isCircle ? w : 6 + Math.floor(Math.random() * 10);
  return {
    id:    i,
    tx:    Math.cos(angle) * dist,
    ty:    Math.sin(angle) * dist + 55,   // gravity
    rot:   (Math.random() > 0.5 ? 1 : -1) * (180 + Math.floor(Math.random() * 400)),
    delay: wave === 0
      ? (Math.random() * 0.12).toFixed(2)          // 0–0.12s
      : (0.38 + Math.random() * 0.28).toFixed(2),  // 0.38–0.66s
    dur:   wave === 0
      ? (1.6 + Math.random() * 0.7).toFixed(2)     // 1.6–2.3s
      : (1.4 + Math.random() * 0.8).toFixed(2),    // 1.4–2.2s
    color: _BURST_COLORS[i % _BURST_COLORS.length],
    shape: isCircle ? "circle" : "rect",
    w,
    h,
  };
});

function CelebrationConfetti() {
  return (
    // Fixed overlay — covers full viewport regardless of parent overflow
    <div style={{
      position: "fixed", inset: 0,
      pointerEvents: "none", zIndex: 9999, overflow: "visible",
    }}>
      {/* Burst origin: center of viewport, slightly above middle */}
      <div style={{
        position: "absolute", top: "46%", left: "50%",
        width: 0, height: 0, overflow: "visible",
      }}>
        {_BURST.map((p) => (
          <div key={p.id} style={{
            position: "absolute",
            left: -p.w / 2,
            top:  -p.h / 2,
            width:  p.w,
            height: p.h,
            borderRadius: p.shape === "circle" ? "50%" : 2,
            background: p.color,
            boxShadow: `0 0 8px ${p.color}dd`,
            animation: `cpBurst ${p.dur}s ${p.delay}s ease-out forwards`,
            "--tx":  `${p.tx}px`,
            "--ty":  `${p.ty}px`,
            "--rot": `${p.rot}deg`,
          }} />
        ))}
      </div>
    </div>
  );
}

const ROUND_SIZE = 4;

// ── MatchWordPictureGame ───────────────────────────────────────────────────────
function MatchWordPictureGame({ items, onComplete }) {
  const { playPop, playChime, playWhoosh } = useSound();
  const { stars, burst } = useStarBurst();
  const [currentRound, setCurrentRound] = useState(0);
  const [selected, setSelected] = useState(null);
  const [matched, setMatched] = useState(new Set());
  const [wrongPair, setWrongPair] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const totalRounds = Math.ceil(items.length / ROUND_SIZE);
  const roundStart = currentRound * ROUND_SIZE;
  const roundItems = items.slice(roundStart, roundStart + ROUND_SIZE);

  const [shuffledWords, setShuffledWords] = useState(() =>
    [...roundItems.map((it, i) => ({ ...it, localIdx: i }))].sort(() => Math.random() - 0.5)
  );

  useEffect(() => {
    const ri = items.slice(currentRound * ROUND_SIZE, (currentRound + 1) * ROUND_SIZE);
    setShuffledWords([...ri.map((it, i) => ({ ...it, localIdx: i }))].sort(() => Math.random() - 0.5));
    setMatched(new Set());
    setSelected(null);
    setWrongPair(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRound]);

  const roundDone = matched.size === roundItems.length && roundItems.length > 0;
  const allDone = roundDone && currentRound === totalRounds - 1;

  useEffect(() => {
    if (allDone && matched.size > 0) onComplete?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone]);

  const isWrong = (key) => wrongPair && (wrongPair.imgKey === key || wrongPair.wordKey === key);

  const handleClick = (localIdx, side, e) => {
    if (matched.has(localIdx)) return;
    const key = `${side}-${localIdx}`;
    if (!selected) { playPop(); setSelected({ localIdx, side, key }); return; }
    if (selected.key === key) { setSelected(null); return; }
    if (selected.side === side) { playPop(); setSelected({ localIdx, side, key }); return; }
    if (selected.localIdx === localIdx) {
      playChime(); burst(e.clientX, e.clientY);
      setShowConfetti(true); setTimeout(() => setShowConfetti(false), 2200);
      setMatched((prev) => new Set([...prev, localIdx]));
      setSelected(null);
      const it = roundItems[localIdx];
      setTimeout(() => spellAndSay(it?.word, it?.audioUrl), 300);
    } else {
      playWhoosh();
      setWrongPair({ imgKey: side === "img" ? key : selected.key, wordKey: side === "word" ? key : selected.key });
      setTimeout(() => setWrongPair(null), 550);
      setSelected(null);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {stars.map((s) => <FloatingStar key={s.id} x={s.x} y={s.y} char={s.char} onDone={() => {}} />)}
      {showConfetti && <CelebrationConfetti />}

      {/* All done */}
      {allDone && (
        <div style={{ textAlign: "center", padding: "2.5rem 1rem", background: "linear-gradient(135deg, rgba(16,185,129,0.22), rgba(124,58,237,0.22))", border: "1.5px solid rgba(16,185,129,0.6)", borderRadius: 24, animation: "cpDone 0.6s ease" }}>
          <div style={{ fontSize: "4rem" }}>🎉</div>
          <p style={{ color: "#10b981", fontWeight: 800, fontSize: "1.4rem", margin: "0.6rem 0 0.3rem" }}>All matched!</p>
          <p style={{ color: "#a78bfa" }}>Great job!</p>
        </div>
      )}

      {/* Round done — not last */}
      {roundDone && !allDone && (
        <div style={{ textAlign: "center", padding: "2rem", background: "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(124,58,237,0.18))", border: "1.5px solid rgba(16,185,129,0.55)", borderRadius: 24, animation: "cpDone 0.5s ease" }}>
          <div style={{ fontSize: "3rem" }}>⭐</div>
          <p style={{ color: "#10b981", fontWeight: 800, fontSize: "1.2rem", margin: "0.5rem 0 1.25rem" }}>Round {currentRound + 1} complete!</p>
          <button type="button" onClick={() => setCurrentRound((r) => r + 1)}
            style={{ fontSize: 17, padding: "0.8rem 2.8rem", borderRadius: 18, cursor: "pointer", fontWeight: 800, background: "linear-gradient(135deg,#7c3aed,#10b981)", border: "none", color: "#fff", boxShadow: "0 4px 28px rgba(16,185,129,0.45)" }}>
            Next Round →
          </button>
        </div>
      )}

      {!allDone && !roundDone && (
        <>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
            {totalRounds > 1 && (
              <span style={{ fontSize: 13, color: "#a78bfa", fontWeight: 700, background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 20, padding: "0.22rem 0.85rem", whiteSpace: "nowrap" }}>
                Round {currentRound + 1} / {totalRounds}
              </span>
            )}
            <span style={{ fontSize: 13, color: "#c4b5fd", fontWeight: 700 }}>
              {matched.size} / {roundItems.length} matched
            </span>
            <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden", minWidth: 80 }}>
              <div style={{ height: "100%", borderRadius: 99, transition: "width 0.4s ease", width: `${roundItems.length ? (matched.size / roundItems.length) * 100 : 0}%`, background: "linear-gradient(90deg,#7c3aed,#10b981)" }} />
            </div>
          </div>

          <p style={{ fontSize: 12, color: "#7c3aed", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "1.25rem", textAlign: "center" }}>
            Click an image → then its matching word
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", alignItems: "start" }}>
            {/* Images column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              <p style={{ fontSize: 11, color: "#a78bfa", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 0.2rem 0.2rem" }}>🖼 Images</p>
              {roundItems.map((item, localIdx) => {
                const col = CARD_COLORS[localIdx % CARD_COLORS.length];
                const isSel = selected?.side === "img" && selected?.localIdx === localIdx;
                const isMat = matched.has(localIdx);
                const isWrg = isWrong(`img-${localIdx}`);
                return (
                  <button key={localIdx} type="button" onClick={(e) => handleClick(localIdx, "img", e)}
                    style={{
                      display: "flex", alignItems: "center", gap: "1rem",
                      padding: "0.85rem 1rem", borderRadius: 18, cursor: isMat ? "default" : "pointer",
                      border: `2.5px solid ${isMat ? "rgba(16,185,129,0.8)" : isSel ? col.border : "rgba(255,255,255,0.1)"}`,
                      background: isMat ? "rgba(16,185,129,0.15)" : isSel ? "linear-gradient(145deg,rgba(30,12,65,0.95),rgba(14,5,38,0.98))" : "linear-gradient(145deg,rgba(30,12,65,0.85),rgba(14,5,38,0.92))",
                      transition: "all 0.18s", position: "relative", overflow: "hidden",
                      boxShadow: isMat ? "0 0 18px rgba(16,185,129,0.4)" : isSel ? `0 0 0 3px ${col.glow},0 8px 24px ${col.glow}` : "0 2px 12px rgba(0,0,0,0.4)",
                      minHeight: 96,
                      animation: isWrg ? "cpWrongFlash 0.55s ease,cpShake 0.4s ease" : isMat ? "cpCorrectGlow 0.6s ease" : "none",
                    }}>
                    {isSel && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 15% 50%,${col.glow} 0%,transparent 65%)`, opacity: 0.2, pointerEvents: "none" }} />}
                    {isMat ? (
                      <span style={{ fontSize: "2.2rem", flexShrink: 0 }}>✅</span>
                    ) : item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.word} style={{ width: 82, height: 82, objectFit: "cover", borderRadius: 14, flexShrink: 0, border: `2px solid ${col.border}`, boxShadow: `0 0 10px ${col.glow}` }} />
                    ) : (
                      <div style={{ width: 82, height: 82, borderRadius: 14, flexShrink: 0, background: `linear-gradient(135deg,${col.bg},rgba(0,0,0,0.2))`, border: `2px solid ${col.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.2rem", fontWeight: 900, color: col.text }}>
                        {item.word[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    <span style={{ fontSize: 15, color: isMat ? "#10b981" : isSel ? col.text : "#c4b5fd", fontWeight: 700, position: "relative", zIndex: 1 }}>
                      {isMat ? `✓ ${item.word}` : `#${localIdx + 1}`}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Words column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              <p style={{ fontSize: 11, color: "#a78bfa", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 0.2rem 0.2rem" }}>🔤 Words</p>
              {shuffledWords.map((item) => {
                const col = CARD_COLORS[item.localIdx % CARD_COLORS.length];
                const isSel = selected?.side === "word" && selected?.localIdx === item.localIdx;
                const isMat = matched.has(item.localIdx);
                const isWrg = isWrong(`word-${item.localIdx}`);
                return (
                  <button key={item.localIdx} type="button" onClick={(e) => handleClick(item.localIdx, "word", e)}
                    style={{
                      borderRadius: 18, cursor: isMat ? "default" : "pointer",
                      border: `2.5px solid ${isMat ? "rgba(16,185,129,0.8)" : isSel ? col.border : "rgba(255,255,255,0.1)"}`,
                      background: isMat ? "rgba(16,185,129,0.15)" : isSel ? "linear-gradient(145deg,rgba(30,12,65,0.95),rgba(14,5,38,0.98))" : "linear-gradient(145deg,rgba(30,12,65,0.85),rgba(14,5,38,0.92))",
                      transition: "all 0.18s", textAlign: "center", position: "relative", overflow: "hidden",
                      boxShadow: isMat ? "0 0 18px rgba(16,185,129,0.4)" : isSel ? `0 0 0 3px ${col.glow},0 8px 24px ${col.glow}` : "0 2px 12px rgba(0,0,0,0.4)",
                      minHeight: 96, display: "flex", alignItems: "center", justifyContent: "center",
                      animation: isWrg ? "cpShake 0.45s ease,cpWrongFlash 0.55s ease" : isMat ? "cpCorrectGlow 0.6s ease" : "none",
                    }}>
                    {isSel && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 50%,${col.glow} 0%,transparent 70%)`, opacity: 0.18, pointerEvents: "none" }} />}
                    <span style={{ color: isMat ? "#10b981" : isSel ? col.text : "#e2e8f0", fontWeight: 800, fontSize: 22, position: "relative", zIndex: 1, textShadow: isSel ? `0 0 20px ${col.glow}` : "none" }}>
                      {isMat ? `✓ ${item.word}` : item.word}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── MemoryCardGame ────────────────────────────────────────────────────────────
function buildMemoryCards(roundItems) {
  const c = roundItems.flatMap((item, i) => [
    { cardId: `img-${i}`, localIdx: i, side: "image", label: item.imageUrl ? null : item.word[0]?.toUpperCase(), imageUrl: item.imageUrl },
    { cardId: `word-${i}`, localIdx: i, side: "word", label: item.word },
  ]);
  return [...c].sort(() => Math.random() - 0.5);
}

function MemoryCardGame({ items, onComplete }) {
  const { playPop, playChime, playWhoosh } = useSound();
  const { stars, burst } = useStarBurst();
  const [currentRound, setCurrentRound] = useState(0);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState(new Set());
  const [isLocked, setIsLocked] = useState(false);
  const [wrongIds, setWrongIds] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);

  const totalRounds = Math.ceil(items.length / ROUND_SIZE);
  const roundItems = items.slice(currentRound * ROUND_SIZE, (currentRound + 1) * ROUND_SIZE);
  const [cards, setCards] = useState(() => buildMemoryCards(roundItems));

  useEffect(() => {
    const ri = items.slice(currentRound * ROUND_SIZE, (currentRound + 1) * ROUND_SIZE);
    setCards(buildMemoryCards(ri));
    setMatched(new Set());
    setFlipped([]);
    setIsLocked(false);
    setWrongIds([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRound]);

  const roundDone = matched.size === roundItems.length && roundItems.length > 0;
  const allDone = roundDone && currentRound === totalRounds - 1;

  useEffect(() => {
    if (allDone && matched.size > 0) onComplete?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone]);

  const handleFlip = (card, e) => {
    if (isLocked || matched.has(card.localIdx) || flipped.includes(card.cardId) || flipped.length >= 2) return;
    playPop();
    const newFlipped = [...flipped, card.cardId];
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      const [a, b] = newFlipped.map((id) => cards.find((c) => c.cardId === id));
      if (a.localIdx === b.localIdx) {
        playChime(); burst(e.clientX, e.clientY);
        setShowConfetti(true); setTimeout(() => setShowConfetti(false), 2200);
        setTimeout(() => { setMatched((prev) => new Set([...prev, a.localIdx])); setFlipped([]); }, 400);
        const ri = items.slice(currentRound * ROUND_SIZE, (currentRound + 1) * ROUND_SIZE);
        setTimeout(() => spellAndSay(ri[a.localIdx]?.word, ri[a.localIdx]?.audioUrl), 700);
      } else {
        playWhoosh(); setIsLocked(true); setWrongIds(newFlipped);
        setTimeout(() => { setFlipped([]); setWrongIds([]); setIsLocked(false); }, 900);
      }
    }
  };

  // 4 cols for 8 cards, 2 cols for ≤4
  const cols = cards.length <= 4 ? 2 : 4;

  return (
    <div style={{ position: "relative" }}>
      {stars.map((s) => <FloatingStar key={s.id} x={s.x} y={s.y} char={s.char} onDone={() => {}} />)}
      {showConfetti && <CelebrationConfetti />}

      {allDone && (
        <div style={{ textAlign: "center", padding: "2.5rem 1rem", background: "linear-gradient(135deg,rgba(16,185,129,0.22),rgba(124,58,237,0.22))", border: "1.5px solid rgba(16,185,129,0.6)", borderRadius: 24, animation: "cpDone 0.6s ease" }}>
          <div style={{ fontSize: "4rem" }}>🎉</div>
          <p style={{ color: "#10b981", fontWeight: 800, fontSize: "1.4rem", margin: "0.6rem 0 0.3rem" }}>All pairs found!</p>
          <p style={{ color: "#a78bfa" }}>Amazing memory!</p>
        </div>
      )}

      {roundDone && !allDone && (
        <div style={{ textAlign: "center", padding: "2rem", background: "linear-gradient(135deg,rgba(16,185,129,0.18),rgba(124,58,237,0.18))", border: "1.5px solid rgba(16,185,129,0.55)", borderRadius: 24, animation: "cpDone 0.5s ease" }}>
          <div style={{ fontSize: "3rem" }}>⭐</div>
          <p style={{ color: "#10b981", fontWeight: 800, fontSize: "1.2rem", margin: "0.5rem 0 1.25rem" }}>Round {currentRound + 1} complete!</p>
          <button type="button" onClick={() => setCurrentRound((r) => r + 1)}
            style={{ fontSize: 17, padding: "0.8rem 2.8rem", borderRadius: 18, cursor: "pointer", fontWeight: 800, background: "linear-gradient(135deg,#7c3aed,#10b981)", border: "none", color: "#fff", boxShadow: "0 4px 28px rgba(16,185,129,0.45)" }}>
            Next Round →
          </button>
        </div>
      )}

      {!allDone && !roundDone && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
            {totalRounds > 1 && (
              <span style={{ fontSize: 13, color: "#a78bfa", fontWeight: 700, background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 20, padding: "0.22rem 0.85rem", whiteSpace: "nowrap" }}>
                Round {currentRound + 1} / {totalRounds}
              </span>
            )}
            <span style={{ fontSize: 13, color: "#c4b5fd", fontWeight: 700 }}>{matched.size} / {roundItems.length} pairs</span>
            <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden", minWidth: 80 }}>
              <div style={{ height: "100%", borderRadius: 99, transition: "width 0.4s ease", width: `${roundItems.length ? (matched.size / roundItems.length) * 100 : 0}%`, background: "linear-gradient(90deg,#7c3aed,#10b981)" }} />
            </div>
          </div>

          <p style={{ fontSize: 12, color: "#7c3aed", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "1.25rem", textAlign: "center" }}>
            Flip cards to find matching pairs
          </p>

          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "0.9rem" }}>
            {cards.map((card) => {
              const col = CARD_COLORS[card.localIdx % CARD_COLORS.length];
              const isFlipped = flipped.includes(card.cardId) || matched.has(card.localIdx);
              const isMat = matched.has(card.localIdx);
              const isWrg = wrongIds.includes(card.cardId);
              return (
                <button key={card.cardId} type="button" onClick={(e) => handleFlip(card, e)}
                  style={{
                    width: "100%", aspectRatio: "1", minWidth: 0, borderRadius: 20,
                    cursor: isMat || isLocked ? "default" : "pointer",
                    border: `2.5px solid ${isMat ? "rgba(16,185,129,0.8)" : isFlipped ? col.border : "rgba(168,85,247,0.5)"}`,
                    background: isMat ? "rgba(16,185,129,0.15)" : isFlipped ? "linear-gradient(145deg,rgba(30,12,65,0.95),rgba(14,5,38,0.98))" : "linear-gradient(145deg,rgba(88,28,135,0.55),rgba(6,182,212,0.2))",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: "0.2rem", padding: "0.5rem", transition: "all 0.25s", position: "relative", overflow: "hidden",
                    boxShadow: isMat ? "0 0 20px rgba(16,185,129,0.5)" : isFlipped ? `0 0 0 2px ${col.glow},0 6px 22px ${col.glow}` : "0 0 0 1px rgba(168,85,247,0.3),0 4px 16px rgba(88,28,135,0.45)",
                    animation: isWrg ? "cpShake 0.45s ease" : isMat ? "cpCorrectGlow 0.6s ease" : "none",
                  }}>
                  {isFlipped && !isMat && (
                    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 30% 30%,${col.glow} 0%,transparent 65%)`, opacity: 0.2, pointerEvents: "none" }} />
                  )}
                  {!isFlipped ? (
                    <>
                      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 35% 35%,rgba(168,85,247,0.3) 0%,transparent 60%)", pointerEvents: "none" }} />
                      <span style={{ fontSize: "2.2rem", filter: "drop-shadow(0 0 10px rgba(245,158,11,0.8))", position: "relative", zIndex: 1 }}>?</span>
                    </>
                  ) : (
                    <>
                      {card.side === "image" && card.imageUrl ? (
                        <img src={card.imageUrl} alt="" style={{ width: "88%", height: "80%", objectFit: "cover", borderRadius: 12, border: `2px solid ${col.border}`, boxShadow: `0 0 14px ${col.glow}`, position: "relative", zIndex: 1 }} />
                      ) : (
                        <span style={{ fontSize: card.side === "word" ? "clamp(1rem,3.5vw,1.6rem)" : "1.8rem", fontWeight: 800, color: isMat ? "#10b981" : col.text, textAlign: "center", wordBreak: "break-word", padding: "0 8px", position: "relative", zIndex: 1, textShadow: `0 0 16px ${col.glow}`, lineHeight: 1.2 }}>
                          {card.label}
                        </span>
                      )}
                      {isMat && <span style={{ fontSize: "1rem", color: "#10b981", position: "relative", zIndex: 1 }}>✓</span>}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── QuizGame ──────────────────────────────────────────────────────────────────
function QuizGame({ content, mode, alreadySubmitted }) {
  const { playChime, playWhoosh, playPop, playApplause } = useSound();
  const qs = content.questions;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState(Array(qs.length).fill(null)); // option indices
  const [locked, setLocked] = useState(false);     // answered current question
  const [revealed, setRevealed] = useState(false); // preview: show correct answer
  const [showConfetti, setShowConfetti] = useState(false);
  const [freshResult, setFreshResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const isPreview = mode === "preview";
  const q = qs[currentIdx];
  const isLast = currentIdx === qs.length - 1;

  // Reset locked/revealed when navigating
  useEffect(() => { setLocked(false); setRevealed(false); }, [currentIdx]);

  // Already-submitted screen (student)
  if (alreadySubmitted && !freshResult) {
    const score = alreadySubmitted.score;
    return (
      <div style={{ textAlign: "center", padding: "2rem 0", animation: "cpSlideIn 0.35s ease" }}>
        <div style={{ fontSize: "5rem", fontWeight: 900, color: score >= 70 ? "#10b981" : "#f59e0b", lineHeight: 1 }}>{score}%</div>
        <div style={{ fontSize: "2.2rem", marginTop: "0.5rem" }}>{score >= 70 ? "🎉" : "📚"}</div>
        <p style={{ color: "#e2e8f0", marginTop: "0.6rem", fontSize: "1.1rem", fontWeight: 600 }}>{score >= 70 ? "Excellent work!" : "Keep practicing!"}</p>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: "0.35rem" }}>Submitted on {new Date(alreadySubmitted.completedAt).toLocaleDateString()}</p>
        <p style={{ color: "#475569", fontSize: 12, marginTop: "0.2rem" }}>You can only submit this quiz once.</p>
      </div>
    );
  }

  // Fresh result screen (student after submit)
  if (freshResult) {
    const score = freshResult.score;
    return (
      <div style={{ animation: "cpSlideIn 0.35s ease" }}>
        <div style={{ textAlign: "center", padding: "1.5rem 0 1.25rem" }}>
          <div style={{ fontSize: "4.5rem", fontWeight: 900, color: score >= 70 ? "#10b981" : "#f59e0b", lineHeight: 1 }}>{score}%</div>
          <div style={{ fontSize: "2rem", marginTop: "0.4rem" }}>{score >= 70 ? "🎉" : "📚"}</div>
          <p style={{ color: "#e2e8f0", marginTop: "0.5rem", fontSize: "1.15rem", fontWeight: 600 }}>{freshResult.correct} / {freshResult.total} correct</p>
        </div>
        <div style={{ height: 1, background: "linear-gradient(90deg,rgba(124,58,237,0.4),transparent)", margin: "0 0 1.25rem" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          {(freshResult.graded || []).map((g, i) => (
            <div key={i} style={{ background: g.isCorrect ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)", border: `1px solid ${g.isCorrect ? "rgba(16,185,129,0.3)" : "rgba(244,63,94,0.3)"}`, borderRadius: 12, padding: "0.9rem 1.1rem" }}>
              <p style={{ color: "#e2e8f0", marginBottom: "0.35rem", fontWeight: 600 }}>{g.isCorrect ? "✅" : "❌"} Q{i + 1}: {g.questionText}</p>
              <p style={{ fontSize: 14 }}>
                {g.isCorrect ? <span style={{ color: "#10b981" }}>✓ {g.given}</span>
                  : <><span style={{ color: "#f43f5e" }}>✗ {g.given || "—"}</span><span style={{ color: "#94a3b8" }}> · Answer: </span><span style={{ color: "#10b981" }}>{g.correct}</span></>}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (answers.some((a) => a === null)) { setError("Please answer all questions."); return; }
    setSubmitting(true); setError("");
    try {
      const answerTexts = answers.map((idx, qi) => idx !== null ? qs[qi].options[idx] : null);
      const res = await api.post(`/api/student/contents/${content._id}/submit`, { answers: answerTexts });
      setFreshResult(res.data);
      if (res.data.score >= 70) playChime(); else playWhoosh();
    } catch (err) { setError(err?.response?.data?.error || "Submission failed."); }
    finally { setSubmitting(false); }
  };

  const handleSelect = (oi) => {
    if (locked) return;
    playPop();
    setAnswers((a) => a.map((x, i) => i === currentIdx ? oi : x));
    const isCorrect = q.options[oi] === q.correctAnswer;
    if (!isPreview) {
      setLocked(true);
      if (isCorrect) { playChime(); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 2200); }
      else playWhoosh();
    } else {
      if (isCorrect) { playChime(); playApplause(); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 2200); }
    }
  };

  const handleNext = () => {
    if (currentIdx < qs.length - 1) setCurrentIdx((i) => i + 1);
  };

  const selectedOi = answers[currentIdx];
  const hasSelected = selectedOi !== null;
  const selectedIsCorrect = hasSelected && q.options[selectedOi] === q.correctAnswer;

  return (
    <div style={{ position: "relative" }}>
      {showConfetti && <CelebrationConfetti />}
      {error && (
        <div style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: 10, padding: "0.65rem 1rem", marginBottom: "1rem", color: "#f87171", fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Progress */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <span style={{ fontSize: 13, color: "#a78bfa", fontWeight: 700, background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 20, padding: "0.22rem 0.85rem", whiteSpace: "nowrap" }}>
          Question {currentIdx + 1} / {qs.length}
        </span>
        <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 99, transition: "width 0.4s ease", width: `${((currentIdx + (hasSelected ? 1 : 0)) / qs.length) * 100}%`, background: "linear-gradient(90deg,#7c3aed,#10b981)" }} />
        </div>
      </div>

      {/* Question card */}
      <div style={{ background: "linear-gradient(160deg,rgba(26,10,58,0.97) 0%,rgba(14,5,38,0.99) 100%)", border: "1.5px solid rgba(168,85,247,0.35)", borderRadius: 28, marginBottom: "1.25rem", animation: "cpSlideIn 0.3s ease", boxShadow: "0 0 40px rgba(124,58,237,0.15),0 16px 48px rgba(0,0,0,0.6)", overflow: "hidden", position: "relative" }}>
        {/* Question header */}
        <div style={{ padding: "1.6rem 2rem 1.4rem", background: "linear-gradient(135deg,rgba(88,28,135,0.35) 0%,rgba(30,12,65,0.2) 60%,transparent 100%)", borderBottom: "1px solid rgba(168,85,247,0.18)", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 0%,rgba(168,85,247,0.08) 0%,transparent 65%)" }} />
          {/* Question text + TTS */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", position: "relative", zIndex: 1 }}>
            <p style={{ color: "#f0e6ff", fontWeight: 800, fontSize: "clamp(1.15rem,2.2vw,1.55rem)", lineHeight: 1.45, textAlign: "center", margin: 0, textShadow: "0 0 32px rgba(196,181,253,0.2)" }}>
              {q.questionText}
            </p>
            <button type="button" title="Read aloud"
              onClick={() => {
                window.speechSynthesis?.cancel();
                if (q.audioUrl) { try { new Audio(q.audioUrl).play(); } catch (_) {} return; }
                const u = new SpeechSynthesisUtterance(q.questionText);
                u.lang = "en-US"; u.rate = 0.82; window.speechSynthesis?.speak(u);
              }}
              style={{ background: "rgba(168,85,247,0.2)", border: "1.5px solid rgba(168,85,247,0.5)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, flexShrink: 0 }}>
              🔊
            </button>
          </div>
          {q.imageUrl && (
            <img src={q.imageUrl} alt="" style={{ maxWidth: "min(480px,88%)", maxHeight: 240, borderRadius: 14, marginTop: "1.1rem", display: "block", margin: "1.1rem auto 0", boxShadow: "0 6px 28px rgba(0,0,0,0.6)", border: "1px solid rgba(168,85,247,0.3)" }} />
          )}
        </div>

        {/* Answer options */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, padding: 0 }}>
          {q.options.map((opt, oi) => {
            const col = QUIZ_COLORS[oi % QUIZ_COLORS.length];
            const isSelected = selectedOi === oi;
            const isCorrect = opt === q.correctAnswer;
            const showResult = (locked && !isPreview) || (isPreview && revealed);

            let bg = isSelected ? `linear-gradient(135deg,${col.bg.replace(")", ",0.85)")},rgba(0,0,0,0.3))` : "rgba(255,255,255,0.025)";
            let bShadow = isSelected ? `inset 0 0 0 2.5px ${col.border},0 0 28px ${col.glow}` : `inset 0 0 0 1px rgba(255,255,255,0.08)`;
            if (showResult) {
              if (isCorrect)       { bg = `linear-gradient(135deg,${col.bg},rgba(0,0,0,0.2))`; bShadow = `inset 0 0 0 2.5px ${col.border},0 0 24px ${col.glow}`; }
              else if (isSelected) { bg = "rgba(239,68,68,0.14)"; bShadow = "inset 0 0 0 2.5px rgba(239,68,68,0.6)"; }
              else                 { bg = "rgba(0,0,0,0.15)"; bShadow = `inset 0 0 0 1px rgba(255,255,255,0.05)`; }
            }

            const isLeft   = oi % 2 === 0;
            const isTopRow = oi < 2;

            return (
              <button key={oi} type="button" onClick={() => handleSelect(oi)}
                style={{
                  background: bg, border: "none",
                  borderRight:  isLeft   ? "1px solid rgba(255,255,255,0.07)" : "none",
                  borderBottom: isTopRow ? "1px solid rgba(255,255,255,0.07)" : "none",
                  padding: "1.25rem 1.5rem", textAlign: "left",
                  cursor: locked && !isPreview ? "default" : "pointer",
                  transition: "background 0.16s,box-shadow 0.16s",
                  display: "flex", alignItems: "center", gap: "1rem",
                  boxShadow: bShadow, minHeight: 88,
                  position: "relative", boxSizing: "border-box", width: "100%", outline: "none",
                }}
                onMouseEnter={(e) => { if (!locked && !isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.055)"; }}
                onMouseLeave={(e) => { if (!locked && !isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.025)"; }}
              >
                <span style={{ width: 40, height: 40, borderRadius: 11, background: isSelected || (showResult && isCorrect) ? col.bg : "rgba(255,255,255,0.06)", border: `2px solid ${isSelected || (showResult && isCorrect) ? col.border : "rgba(255,255,255,0.12)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, color: col.text, fontWeight: 900, boxShadow: isSelected || (showResult && isCorrect) ? `0 0 10px ${col.glow}` : "none", transition: "all 0.16s" }}>
                  {col.icon}
                </span>
                <span style={{ color: showResult ? (isCorrect ? col.text : isSelected ? "#f87171" : "#334155") : (isSelected ? col.text : "#c4b5fd"), fontWeight: isSelected || (showResult && isCorrect) ? 700 : 500, fontSize: "clamp(0.85rem,1.5vw,1rem)", lineHeight: 1.4, flex: 1 }}>
                  {opt}
                </span>
                {showResult && isCorrect && <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>✨</span>}
                {showResult && isSelected && !isCorrect && <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>✗</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback message */}
      {(locked && !isPreview) && (
        <div style={{ textAlign: "center", marginBottom: "1rem", fontSize: 15, fontWeight: 700, color: selectedIsCorrect ? "#10b981" : "#f87171", animation: "cpSlideIn 0.25s ease" }}>
          {selectedIsCorrect ? "✨ Correct!" : `✗ Correct answer: ${q.correctAnswer}`}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem", flexWrap: "wrap" }}>
        {/* Preview: Show/Hide Answer */}
        {isPreview && (
          <button type="button"
            onClick={() => { setRevealed((r) => !r); if (!revealed && selectedIsCorrect) playChime(); }}
            style={{ background: revealed ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg,#7c3aed 0%,#a855f7 50%,#ec4899 100%)", border: revealed ? "1.5px solid rgba(255,255,255,0.18)" : "none", borderRadius: 16, padding: "0.8rem 2rem", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: revealed ? "none" : "0 4px 28px rgba(124,58,237,0.65)" }}>
            {revealed ? "Hide Answer" : "⭐ Show Answer"}
          </button>
        )}

        <div style={{ display: "flex", gap: "0.65rem", marginLeft: "auto" }}>
          {/* Student: Next / Submit */}
          {!isPreview && hasSelected && !isLast && (
            <button type="button" onClick={handleNext}
              style={{ fontSize: 16, padding: "0.8rem 2.2rem", borderRadius: 16, cursor: "pointer", fontWeight: 800, background: "linear-gradient(135deg,#7c3aed,#10b981)", border: "none", color: "#fff", boxShadow: "0 4px 24px rgba(124,58,237,0.45)" }}>
              Next →
            </button>
          )}
          {!isPreview && hasSelected && isLast && (
            <button type="button" className="btn-register" disabled={submitting} onClick={handleSubmit}>
              {submitting ? "Submitting…" : "Submit Quiz"}
            </button>
          )}
          {/* Preview: Next */}
          {isPreview && !isLast && (
            <button type="button" onClick={handleNext}
              style={{ fontSize: 15, padding: "0.8rem 2rem", borderRadius: 16, cursor: "pointer", fontWeight: 700, background: "rgba(124,58,237,0.25)", border: "1.5px solid rgba(124,58,237,0.6)", color: "#c4b5fd" }}>
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ListenChoosePictureGame ───────────────────────────────────────────────────
const LISTEN_COLORS = [
  { bg: "rgba(59,130,246,0.2)",  border: "rgba(59,130,246,0.75)", text: "#93c5fd",  glow: "rgba(59,130,246,0.5)"  },
  { bg: "rgba(239,68,68,0.18)",  border: "rgba(239,68,68,0.75)",  text: "#fca5a5",  glow: "rgba(239,68,68,0.5)"   },
  { bg: "rgba(34,197,94,0.18)",  border: "rgba(34,197,94,0.70)",  text: "#86efac",  glow: "rgba(34,197,94,0.5)"   },
  { bg: "rgba(245,158,11,0.18)", border: "rgba(245,158,11,0.70)", text: "#fcd34d",  glow: "rgba(245,158,11,0.5)"  },
];

function ListenChoosePictureGame({ items, onComplete }) {
  const { playChime, playWhoosh, playPop } = useSound();
  const { stars, burst } = useStarBurst();
  const [current,    setCurrent]   = useState(0);
  const [chosen,     setChosen]    = useState(null);
  const [score,      setScore]     = useState(0);
  const [done,       setDone]      = useState(false);
  const [isPlaying,  setIsPlaying] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const audioRef = useRef(null);

  const item = items[current];
  const isLast = current === items.length - 1;
  const chosenIsCorrect = chosen !== null && chosen === item?.correctIndex;

  const playAudio = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    window.speechSynthesis?.cancel();
    if (item?.audioUrl) {
      const a = new Audio(item.audioUrl);
      audioRef.current = a;
      setIsPlaying(true);
      a.play().catch(() => {});
      a.onended = () => setIsPlaying(false);
      a.onerror = () => setIsPlaying(false);
    } else if (item?.word) {
      const u = new SpeechSynthesisUtterance(item.word);
      u.lang = "en-US"; u.rate = 0.8; u.pitch = 1.05;
      setIsPlaying(true);
      u.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(u);
    }
  }, [item]);

  useEffect(() => { const t = setTimeout(() => playAudio(), 500); return () => clearTimeout(t); }, [current, playAudio]);
  useEffect(() => () => { if (audioRef.current) audioRef.current.pause(); window.speechSynthesis?.cancel(); }, []);

  const handleChoice = (idx, e) => {
    if (chosen !== null) return;
    playPop(); setChosen(idx);
    const isCorrect = idx === item.correctIndex;
    if (isCorrect) {
      playChime(); burst(e.clientX, e.clientY);
      setScore((s) => s + 1);
      setShowConfetti(true); setTimeout(() => setShowConfetti(false), 2200);
      setTimeout(() => spellAndSay(item.word, null), 600);
    } else { playWhoosh(); }
  };

  const handleNext = () => {
    if (isLast) { setDone(true); onComplete?.(); }
    else { setCurrent((c) => c + 1); setChosen(null); setIsPlaying(false); }
  };

  if (done) {
    return (
      <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
        <div style={{ fontSize: "4rem", marginBottom: "0.5rem" }}>🎉</div>
        <p style={{ color: "#10b981", fontSize: "1.5rem", fontWeight: 900, marginBottom: "0.35rem" }}>Well done!</p>
        <p style={{ color: "#c4b5fd", fontSize: "1.1rem", fontWeight: 700 }}>{score} / {items.length} correct</p>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {stars.map((s) => <FloatingStar key={s.id} x={s.x} y={s.y} char={s.char} onDone={() => {}} />)}
      {showConfetti && <CelebrationConfetti />}

      {/* Progress */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <span style={{ fontSize: 13, color: "#a78bfa", fontWeight: 700, background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 20, padding: "0.22rem 0.85rem", whiteSpace: "nowrap" }}>
          Question {current + 1} / {items.length}
        </span>
        <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 99, transition: "width 0.4s ease", width: `${((current + (chosen !== null ? 1 : 0)) / items.length) * 100}%`, background: "linear-gradient(90deg,#7c3aed,#10b981)" }} />
        </div>
      </div>

      {/* Speaker */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: "1rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          🎧 Listen and pick the correct picture
        </p>
        <button type="button" onClick={playAudio}
          style={{ width: 110, height: 110, borderRadius: "50%", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", cursor: "pointer", border: "none", background: isPlaying ? "radial-gradient(circle,rgba(6,182,212,0.5),rgba(6,182,212,0.2))" : "radial-gradient(circle,rgba(124,58,237,0.55),rgba(124,58,237,0.25))", outline: `3px solid ${isPlaying ? "rgba(6,182,212,0.85)" : "rgba(168,85,247,0.75)"}`, outlineOffset: 4, boxShadow: isPlaying ? "0 0 40px rgba(6,182,212,0.7)" : "0 0 30px rgba(124,58,237,0.55)", transition: "all 0.3s", animation: isPlaying ? "cpPulse 0.85s ease-in-out infinite" : "none" }}>
          🔊
        </button>
        <p style={{ color: "#475569", fontSize: 12, marginTop: "0.65rem" }}>Tap to replay</p>
      </div>

      {/* 2×2 choice grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", maxWidth: 560, margin: "0 auto" }}>
        {(item.choices || []).map((choice, idx) => {
          const col = LISTEN_COLORS[idx % 4];
          const isCorrect  = idx === item.correctIndex;
          const isChosen   = chosen === idx;
          const showResult = chosen !== null;
          return (
            <button key={idx} type="button" onClick={(e) => handleChoice(idx, e)} disabled={chosen !== null}
              style={{
                padding: 0, borderRadius: 18, cursor: chosen !== null ? "default" : "pointer",
                border: `2.5px solid ${showResult && isCorrect ? "rgba(16,185,129,0.9)" : showResult && isChosen ? "rgba(239,68,68,0.9)" : col.border}`,
                overflow: "hidden", position: "relative", aspectRatio: "4/3",
                background: showResult && isCorrect ? "rgba(16,185,129,0.18)" : showResult && isChosen ? "rgba(239,68,68,0.12)" : col.bg,
                boxShadow: showResult && isCorrect ? "0 0 28px rgba(16,185,129,0.65)" : showResult && isChosen ? "0 0 18px rgba(239,68,68,0.45)" : `0 0 12px ${col.glow}`,
                transition: "all 0.25s",
                animation: showResult && isChosen && !isCorrect ? "cpShake 0.4s ease" : "none",
              }}>
              {choice.imageUrl ? (
                <img src={choice.imageUrl} alt={choice.label || `Option ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52 }}>
                  {["🖼️","🎨","📷","🌄"][idx]}
                </div>
              )}
              {choice.label && (
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.62)", padding: "0.35rem 0.55rem", color: col.text, fontSize: 14, fontWeight: 700, textAlign: "center" }}>
                  {choice.label}
                </div>
              )}
              {showResult && isCorrect  && <div style={{ position: "absolute", top: 8, right: 8, width: 32, height: 32, borderRadius: "50%", background: "rgba(16,185,129,0.95)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff", fontWeight: 900 }}>✓</div>}
              {showResult && isChosen && !isCorrect && <div style={{ position: "absolute", top: 8, right: 8, width: 32, height: 32, borderRadius: "50%", background: "rgba(239,68,68,0.95)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff", fontWeight: 900 }}>✗</div>}
            </button>
          );
        })}
      </div>

      {/* Feedback + Next */}
      {chosen !== null && (
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          {chosenIsCorrect ? (
            <p style={{ color: "#10b981", fontSize: "1.3rem", fontWeight: 900, letterSpacing: "0.05em", textShadow: "0 0 20px rgba(16,185,129,0.6)", marginBottom: "1rem" }}>
              ✨ {item.word?.toUpperCase()} ✨
            </p>
          ) : (
            <p style={{ color: "#f87171", fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>
              Correct answer: <span style={{ color: "#10b981" }}>{item.word}</span>
            </p>
          )}
          <button type="button" onClick={handleNext}
            style={{ fontSize: 16, padding: "0.8rem 2.8rem", borderRadius: 18, cursor: "pointer", fontWeight: 800, background: "linear-gradient(135deg,#7c3aed,#10b981)", border: "none", color: "#fff", boxShadow: "0 4px 24px rgba(124,58,237,0.45)" }}>
            {isLast ? "Finish 🎉" : "Next →"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── ContentPlayer — full-screen modal ─────────────────────────────────────────
// mode="preview": teacher preview — space-themed galaxy overlay
// mode="student": student plays — original dark overlay
export default function ContentPlayer({ content, mode = "preview", alreadySubmitted = null, onClose, onGameComplete }) {
  const isGame   = content.type === "game";
  const isListen = content.type === "listen";
  const iconSrc = isGame   ? (content.template === "match-word-picture" ? matchWithPicImg : flashcardImg)
               : isListen ? flashcardImg
               : quizlogoImg;
  const typeLabel = isGame   ? (content.template === "match-word-picture" ? "Match Word with Picture" : "Memory Card")
                 : isListen ? "Listen & Choose"
                 : "Quiz";
  const itemCount = isGame   ? `${content.items?.length || 0} items`
                 : isListen ? `${content.listenItems?.length || 0} question${content.listenItems?.length !== 1 ? "s" : ""}`
                 : `${content.questions?.length || 0} question${content.questions?.length !== 1 ? "s" : ""}`;

  // ── Preview mode — space-galaxy themed ──────────────────────────────────────
  if (mode === "preview") {
    return (
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "radial-gradient(ellipse at 28% 32%, rgba(88,28,135,0.85) 0%, rgba(20,8,52,0.97) 45%, rgba(0,0,14,0.99) 100%)",
          backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "2vh 2vw",
        }}
      >
        {/* Galaxy decoration layer */}
        <GalaxyOverlay />

        {/* Modal card */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="cp-scroll"
          style={{
            position: "relative", zIndex: 1,
            width: "min(980px, 96vw)",
            maxHeight: "95vh", overflowY: "auto",
            background: "linear-gradient(148deg, rgba(30,11,66,0.97) 0%, rgba(14,5,38,0.99) 100%)",
            border: "1.5px solid rgba(168,85,247,0.55)",
            borderRadius: 28,
            padding: "2rem 2.5rem",
            animation: "cpModalEntrance 0.38s cubic-bezier(0.34,1.15,0.64,1)",
            boxShadow: [
              "0 0 0 1px rgba(236,72,153,0.18)",
              "0 0 50px rgba(168,85,247,0.38)",
              "0 0 110px rgba(236,72,153,0.18)",
              "0 40px 100px rgba(0,0,0,0.88)",
            ].join(", "),
          }}
        >
          {/* Subtle inner top glow */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 120,
            background: "radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.12) 0%, transparent 70%)",
            borderRadius: "28px 28px 0 0", pointerEvents: "none",
          }} />

          {/* ── Header ────────────────────────────────────────────────────────── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", position: "relative", zIndex: 1 }}>
            {/* Left: icon card + title stack */}
            <div style={{ display: "flex", gap: "1.1rem", alignItems: "center" }}>
              {/* Quiz icon card */}
              <div style={{
                width: 62, height: 62, flexShrink: 0,
                borderRadius: 20,
                background: "linear-gradient(140deg, rgba(124,58,237,0.7), rgba(236,72,153,0.6))",
                border: "1.5px solid rgba(168,85,247,0.65)",
                boxShadow: "0 0 28px rgba(168,85,247,0.55), 0 0 55px rgba(236,72,153,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <img src={iconSrc} alt={typeLabel} style={{ width: 44, height: 44, objectFit: "contain" }} />
              </div>

              {/* Title stack */}
              <div>
                {/* TEACHER PREVIEW pill badge */}
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  background: "linear-gradient(90deg, rgba(236,72,153,0.88), rgba(168,85,247,0.88))",
                  border: "1px solid rgba(236,72,153,0.55)",
                  borderRadius: 99,
                  padding: "0.2rem 0.8rem",
                  fontSize: 10, fontWeight: 800, letterSpacing: "0.12em",
                  color: "#fff", textTransform: "uppercase",
                  marginBottom: "0.4rem",
                  display: "inline-flex",
                  animation: "cpBadgePulse 2.5s ease-in-out infinite",
                }}>
                  🎓 TEACHER PREVIEW
                </span>
                <h2 style={{
                  margin: 0,
                  fontSize: "1.55rem", fontWeight: 900,
                  color: "#f5eeff",
                  lineHeight: 1.2,
                  textShadow: "0 0 30px rgba(196,181,253,0.3)",
                }}>
                  {content.title}
                </h2>
                <p style={{ color: "#a78bfa", fontSize: 13, marginTop: "0.25rem", fontWeight: 500 }}>
                  {typeLabel} · {itemCount}
                  {content.description ? ` · ${content.description}` : ""}
                </p>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                flexShrink: 0, alignSelf: "flex-start",
                width: 44, height: 44, borderRadius: "50%",
                background: "rgba(255,255,255,0.07)",
                border: "1.5px solid rgba(168,85,247,0.4)",
                color: "#c4b5fd",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
                boxShadow: "0 0 14px rgba(168,85,247,0.3)",
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(236,72,153,0.22)";
                e.currentTarget.style.borderColor = "rgba(236,72,153,0.7)";
                e.currentTarget.style.boxShadow = "0 0 22px rgba(236,72,153,0.55)";
                e.currentTarget.style.color = "#f9a8d4";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                e.currentTarget.style.borderColor = "rgba(168,85,247,0.4)";
                e.currentTarget.style.boxShadow = "0 0 14px rgba(168,85,247,0.3)";
                e.currentTarget.style.color = "#c4b5fd";
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Gradient divider */}
          <div style={{
            height: 1.5, borderRadius: 2,
            background: "linear-gradient(90deg, rgba(168,85,247,0.8), rgba(236,72,153,0.55), rgba(6,182,212,0.3), transparent)",
            marginBottom: "1.85rem",
            position: "relative", zIndex: 1,
          }} />

          {/* Content */}
          <div style={{ position: "relative", zIndex: 1 }}>
            {isGame ? (
              !content.items?.length ? (
                <p style={{ color: "#64748b", textAlign: "center", padding: "2.5rem 0", fontSize: 15 }}>No items added yet.</p>
              ) : content.template === "match-word-picture" ? (
                <MatchWordPictureGame items={content.items} onComplete={mode === "student" ? onGameComplete : undefined} />
              ) : (
                <MemoryCardGame items={content.items} onComplete={mode === "student" ? onGameComplete : undefined} />
              )
            ) : isListen ? (
              !content.listenItems?.length ? (
                <p style={{ color: "#64748b", textAlign: "center", padding: "2.5rem 0", fontSize: 15 }}>No questions added yet.</p>
              ) : (
                <ListenChoosePictureGame items={content.listenItems} onComplete={mode === "student" ? onGameComplete : undefined} />
              )
            ) : (
              !content.questions?.length ? (
                <p style={{ color: "#64748b", textAlign: "center", padding: "2.5rem 0", fontSize: 15 }}>No questions added yet.</p>
              ) : (
                <QuizGame content={content} mode={mode} alreadySubmitted={alreadySubmitted} />
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Student mode — same galaxy theme, no preview badge ──────────────────────
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "radial-gradient(ellipse at 28% 32%, rgba(88,28,135,0.85) 0%, rgba(20,8,52,0.97) 45%, rgba(0,0,14,0.99) 100%)",
        backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "2vh 2vw",
      }}
    >
      <GalaxyOverlay />
      <div
        className="cp-scroll"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative", zIndex: 1,
          width: "min(980px, 96vw)", maxHeight: "95vh", overflowY: "auto",
          background: "linear-gradient(148deg, rgba(30,11,66,0.97) 0%, rgba(14,5,38,0.99) 100%)",
          border: "1.5px solid rgba(168,85,247,0.55)",
          borderRadius: 28, padding: "2rem 2.5rem",
          animation: "cpModalEntrance 0.38s cubic-bezier(0.34,1.15,0.64,1)",
          boxShadow: "0 0 0 1px rgba(236,72,153,0.18), 0 0 50px rgba(168,85,247,0.38), 0 40px 100px rgba(0,0,0,0.88)",
        }}
      >
        {/* Inner top glow */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 120, background: "radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.12) 0%, transparent 70%)", borderRadius: "28px 28px 0 0", pointerEvents: "none" }} />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", gap: "1.1rem", alignItems: "center" }}>
            <div style={{
              width: 62, height: 62, flexShrink: 0, borderRadius: 20,
              background: "linear-gradient(140deg, rgba(124,58,237,0.7), rgba(236,72,153,0.6))",
              border: "1.5px solid rgba(168,85,247,0.65)",
              boxShadow: "0 0 28px rgba(168,85,247,0.55), 0 0 55px rgba(236,72,153,0.22)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <img src={iconSrc} alt={typeLabel} style={{ width: 44, height: 44, objectFit: "contain" }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.55rem", fontWeight: 900, color: "#f5eeff", lineHeight: 1.2, textShadow: "0 0 30px rgba(196,181,253,0.3)" }}>
                {content.title}
              </h2>
              <p style={{ color: "#a78bfa", fontSize: 13, marginTop: "0.25rem", fontWeight: 500 }}>
                {typeLabel} · {itemCount}{content.description ? ` · ${content.description}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              flexShrink: 0, alignSelf: "flex-start",
              width: 44, height: 44, borderRadius: "50%",
              background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(168,85,247,0.4)",
              color: "#c4b5fd", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s", boxShadow: "0 0 14px rgba(168,85,247,0.3)",
              padding: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(236,72,153,0.22)"; e.currentTarget.style.borderColor = "rgba(236,72,153,0.7)"; e.currentTarget.style.color = "#f9a8d4"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.borderColor = "rgba(168,85,247,0.4)"; e.currentTarget.style.color = "#c4b5fd"; }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div style={{ height: 1.5, borderRadius: 2, background: "linear-gradient(90deg, rgba(168,85,247,0.8), rgba(236,72,153,0.55), rgba(6,182,212,0.3), transparent)", marginBottom: "1.85rem", position: "relative", zIndex: 1 }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          {isGame ? (
            !content.items?.length ? (
              <p style={{ color: "#64748b", textAlign: "center", padding: "2.5rem 0", fontSize: 15 }}>No items added yet.</p>
            ) : content.template === "match-word-picture" ? (
              <MatchWordPictureGame items={content.items} onComplete={onGameComplete} />
            ) : (
              <MemoryCardGame items={content.items} onComplete={onGameComplete} />
            )
          ) : (
            !content.questions?.length ? (
              <p style={{ color: "#64748b", textAlign: "center", padding: "2.5rem 0", fontSize: 15 }}>No questions added yet.</p>
            ) : (
              <QuizGame content={content} mode={mode} alreadySubmitted={alreadySubmitted} />
            )
          )}
        </div>
      </div>
    </div>
  );
}
