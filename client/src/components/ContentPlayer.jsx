import { useCallback, useEffect, useState } from "react";
import useSound from "../hooks/useSound";
import api from "../lib/api";
import matchWithPicImg from "../assets/teacher/matchwithpicture.png";
import flashcardImg    from "../assets/teacher/flashcard.png";
import quizlogoImg     from "../assets/teacher/quizlogo.png";

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
  `;
  document.head.appendChild(s);
}

// ── Quiz answer colors (Kahoot-style, pink for circle instead of red) ─────────
const QUIZ_COLORS = [
  { bg: "rgba(59,130,246,0.25)",  border: "rgba(59,130,246,0.75)",  text: "#93c5fd", glow: "rgba(59,130,246,0.5)",  icon: "▲" },
  { bg: "rgba(236,72,153,0.22)",  border: "rgba(236,72,153,0.75)",  text: "#f9a8d4", glow: "rgba(236,72,153,0.5)",  icon: "●" },
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

// Layer 1: colorful ★ icon stars — same data as RoadmapPage STAR_ICON_DECOS
const _STAR_ICONS = [
  { x:"6%",  y:"6%",  size:22, color:"#FFD700", dur:3.2, delay:0    },
  { x:"14%", y:"18%", size:16, color:"#A78BFA", dur:4.1, delay:0.8  },
  { x:"87%", y:"9%",  size:20, color:"#38BDF8", dur:2.9, delay:1.5  },
  { x:"75%", y:"22%", size:14, color:"#FF6B9D", dur:3.7, delay:0.3  },
  { x:"92%", y:"38%", size:18, color:"#34D399", dur:3.4, delay:1.1  },
  { x:"3%",  y:"43%", size:24, color:"#FBBF24", dur:4.5, delay:2.0  },
  { x:"83%", y:"55%", size:16, color:"#F472B6", dur:3.0, delay:0.6  },
  { x:"8%",  y:"65%", size:20, color:"#FFD700", dur:3.9, delay:1.7  },
  { x:"80%", y:"74%", size:18, color:"#A78BFA", dur:2.8, delay:0.4  },
  { x:"32%", y:"4%",  size:14, color:"#38BDF8", dur:4.2, delay:1.2  },
  { x:"57%", y:"13%", size:18, color:"#FF6B9D", dur:3.5, delay:0.9  },
  { x:"44%", y:"46%", size:12, color:"#FFD700", dur:4.0, delay:1.6  },
  { x:"64%", y:"62%", size:20, color:"#34D399", dur:3.1, delay:2.2  },
  { x:"20%", y:"85%", size:16, color:"#FBBF24", dur:3.6, delay:0.7  },
  { x:"51%", y:"78%", size:22, color:"#F472B6", dur:2.7, delay:1.3  },
  { x:"2%",  y:"30%", size:14, color:"#A78BFA", dur:3.8, delay:0.5  },
  { x:"95%", y:"20%", size:12, color:"#FFD700", dur:4.3, delay:1.8  },
  { x:"47%", y:"91%", size:16, color:"#38BDF8", dur:3.3, delay:0.2  },
  { x:"78%", y:"88%", size:14, color:"#FF6B9D", dur:4.6, delay:1.4  },
  { x:"19%", y:"52%", size:22, color:"#34D399", dur:2.9, delay:0.8  },
  { x:"60%", y:"35%", size:16, color:"#FBBF24", dur:3.7, delay:1.0  },
  { x:"38%", y:"70%", size:18, color:"#FFD700", dur:4.0, delay:1.9  },
  { x:"71%", y:"46%", size:14, color:"#F472B6", dur:3.2, delay:0.3  },
  { x:"90%", y:"64%", size:20, color:"#A78BFA", dur:3.6, delay:2.1  },
  { x:"25%", y:"96%", size:16, color:"#38BDF8", dur:2.8, delay:0.6  },
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
      {/* Layer 0: tiny white dot stars (same as RoadmapPage BG_DOTS) */}
      {_BG_DOTS.map((d) => (
        <span key={d.id} style={{
          position: "absolute", left: `${d.x}%`, top: `${d.y}%`,
          width: d.s, height: d.s, borderRadius: "50%",
          background: "#fff", opacity: 0.45,
          display: "block",
          animation: `cpDotTwinkle ${d.dur}s ${d.del}s ease-in-out infinite alternate`,
        }} />
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

      {/* Planet 1 — large purple */}
      <div style={{
        position: "absolute", right: "6%", top: "10%",
        width: 88, height: 88, borderRadius: "50%",
        background: "radial-gradient(circle at 36% 30%, rgba(216,180,254,0.8), rgba(139,92,246,0.5) 45%, rgba(76,29,149,0.18))",
        boxShadow: "0 0 40px rgba(139,92,246,0.45), 0 0 90px rgba(139,92,246,0.15)",
        animation: "cpFloatPlanet 7s ease-in-out infinite",
      }} />

      {/* Planet 2 — medium cyan */}
      <div style={{
        position: "absolute", left: "4%", bottom: "18%",
        width: 54, height: 54, borderRadius: "50%",
        background: "radial-gradient(circle at 36% 30%, rgba(103,232,249,0.75), rgba(6,182,212,0.45) 50%, rgba(8,145,178,0.15))",
        boxShadow: "0 0 26px rgba(6,182,212,0.45), 0 0 55px rgba(6,182,212,0.15)",
        animation: "cpFloatPlanet 9s 2.5s ease-in-out infinite",
      }} />

      {/* Planet 3 — small pink */}
      <div style={{
        position: "absolute", right: "13%", bottom: "22%",
        width: 38, height: 38, borderRadius: "50%",
        background: "radial-gradient(circle at 36% 30%, rgba(249,168,212,0.75), rgba(236,72,153,0.4) 50%, rgba(157,23,77,0.18))",
        boxShadow: "0 0 20px rgba(236,72,153,0.45)",
        animation: "cpFloatPlanet 5.5s 1s ease-in-out infinite",
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

// ── MatchWordPictureGame ───────────────────────────────────────────────────────
function MatchWordPictureGame({ items, onComplete }) {
  const { playPop, playChime, playWhoosh } = useSound();
  const { stars, burst } = useStarBurst();
  const [selected, setSelected] = useState(null);
  const [matched, setMatched] = useState(new Set());
  const [wrongPair, setWrongPair] = useState(null);

  const [shuffledWords] = useState(
    () => [...items.map((it, i) => ({ ...it, idx: i }))].sort(() => Math.random() - 0.5),
  );

  const isWrong = (key) => wrongPair && (wrongPair.imgKey === key || wrongPair.wordKey === key);

  const handleClick = (itemIdx, side, e) => {
    if (matched.has(itemIdx)) return;
    const key = `${side}-${itemIdx}`;
    if (!selected) { playPop(); setSelected({ itemIdx, side, key }); return; }
    if (selected.key === key) { setSelected(null); return; }
    if (selected.side === side) { playPop(); setSelected({ itemIdx, side, key }); return; }
    if (selected.itemIdx === itemIdx) {
      playChime(); burst(e.clientX, e.clientY);
      setMatched((prev) => new Set([...prev, itemIdx]));
      setSelected(null);
    } else {
      playWhoosh();
      setWrongPair({ imgKey: side === "img" ? key : selected.key, wordKey: side === "word" ? key : selected.key });
      setTimeout(() => setWrongPair(null), 550);
      setSelected(null);
    }
  };

  const allDone = matched.size === items.length;

  useEffect(() => {
    if (allDone && matched.size > 0) onComplete?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone]);

  return (
    <div style={{ position: "relative" }}>
      {stars.map((s) => <FloatingStar key={s.id} x={s.x} y={s.y} char={s.char} onDone={() => {}} />)}

      {allDone && (
        <div style={{ textAlign: "center", padding: "1.25rem", background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(124,58,237,0.2))", border: "1px solid rgba(16,185,129,0.5)", borderRadius: 14, marginBottom: "1.25rem", animation: "cpDone 0.6s ease" }}>
          <div style={{ fontSize: "2.5rem" }}>🎉</div>
          <p style={{ color: "#10b981", fontWeight: 800, marginTop: "0.35rem", fontSize: "1.1rem" }}>All matched! Great job!</p>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <div style={{ flex: 1, height: 7, background: "rgba(255,255,255,0.1)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 99, transition: "width 0.4s ease", width: `${items.length ? (matched.size / items.length) * 100 : 0}%`, background: "linear-gradient(90deg, #7c3aed, #10b981)" }} />
        </div>
        <span style={{ fontSize: 13, color: "#94a3b8", whiteSpace: "nowrap", fontWeight: 600 }}>{matched.size} / {items.length}</span>
      </div>

      <p style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "1rem" }}>
        Click an image ↔ matching word
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          <p style={{ fontSize: 12, color: "#7c3aed", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>🖼 Images</p>
          {items.map((item, idx) => {
            const col = CARD_COLORS[idx % CARD_COLORS.length];
            const isSel = selected?.side === "img" && selected?.itemIdx === idx;
            const isMat = matched.has(idx);
            const isWrg = isWrong(`img-${idx}`);
            return (
              <button key={idx} type="button" onClick={(e) => handleClick(idx, "img", e)}
                style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", borderRadius: 12, cursor: isMat ? "default" : "pointer", border: `2px solid ${isMat ? "rgba(16,185,129,0.7)" : isSel ? "#fff" : col.border}`, background: isMat ? "rgba(16,185,129,0.15)" : isSel ? col.bg : "rgba(255,255,255,0.04)", transition: "all 0.18s", boxShadow: isSel ? `0 0 0 3px ${col.glow}, 0 4px 18px ${col.glow}` : isMat ? "0 0 12px rgba(16,185,129,0.3)" : "none", opacity: isMat ? 0.75 : 1, animation: isWrg ? "cpWrongFlash 0.55s ease, cpShake 0.4s ease" : isMat ? "cpCorrectGlow 0.6s ease" : "none" }}>
                {isMat ? (
                  <span style={{ fontSize: "1.8rem" }}>✅</span>
                ) : item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.word} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 60, height: 60, borderRadius: 8, background: col.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.7rem", fontWeight: 800, color: col.text, flexShrink: 0 }}>
                    {item.word[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <span style={{ fontSize: 15, color: isMat ? "#10b981" : col.text, fontWeight: 700 }}>
                  {isMat ? `✓ ${item.word}` : `#${idx + 1}`}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          <p style={{ fontSize: 12, color: "#7c3aed", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>🔤 Words</p>
          {shuffledWords.map((item) => {
            const col = CARD_COLORS[item.idx % CARD_COLORS.length];
            const isSel = selected?.side === "word" && selected?.itemIdx === item.idx;
            const isMat = matched.has(item.idx);
            const isWrg = isWrong(`word-${item.idx}`);
            return (
              <button key={item.idx} type="button" onClick={(e) => handleClick(item.idx, "word", e)}
                style={{ padding: "0.85rem 1.2rem", borderRadius: 12, cursor: isMat ? "default" : "pointer", border: `2px solid ${isMat ? "rgba(16,185,129,0.7)" : isSel ? "#fff" : col.border}`, background: isMat ? "rgba(16,185,129,0.15)" : isSel ? col.bg : "rgba(255,255,255,0.04)", color: isMat ? "#10b981" : col.text, fontWeight: 700, fontSize: 17, transition: "all 0.18s", textAlign: "center", boxShadow: isSel ? `0 0 0 3px ${col.glow}, 0 4px 18px ${col.glow}` : isMat ? "0 0 12px rgba(16,185,129,0.3)" : "none", opacity: isMat ? 0.75 : 1, animation: isWrg ? "cpShake 0.45s ease, cpWrongFlash 0.55s ease" : isMat ? "cpCorrectGlow 0.6s ease" : "none", minHeight: 68 }}>
                {isMat ? `✓ ${item.word}` : item.word}
              </button>
            );
          })}
        </div>
      </div>

      {!allDone && (
        <button type="button" style={{ marginTop: "1.25rem", fontSize: 13, padding: "0.4rem 1rem", cursor: "pointer", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#94a3b8" }}
          onClick={() => { setMatched(new Set()); setSelected(null); }}>
          🔄 Reset
        </button>
      )}
    </div>
  );
}

// ── MemoryCardGame ────────────────────────────────────────────────────────────
function MemoryCardGame({ items, onComplete }) {
  const { playPop, playChime, playWhoosh } = useSound();
  const { stars, burst } = useStarBurst();
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState(new Set());
  const [isLocked, setIsLocked] = useState(false);
  const [wrongIds, setWrongIds] = useState([]);

  const [cards] = useState(() => {
    const c = items.flatMap((item, i) => [
      { cardId: `img-${i}`, itemIdx: i, side: "image", label: item.imageUrl ? null : item.word[0]?.toUpperCase(), imageUrl: item.imageUrl },
      { cardId: `word-${i}`, itemIdx: i, side: "word", label: item.word },
    ]);
    return [...c].sort(() => Math.random() - 0.5);
  });

  const handleFlip = (card, e) => {
    if (isLocked || matched.has(card.itemIdx) || flipped.includes(card.cardId) || flipped.length >= 2) return;
    playPop();
    const newFlipped = [...flipped, card.cardId];
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      const [a, b] = newFlipped.map((id) => cards.find((c) => c.cardId === id));
      if (a.itemIdx === b.itemIdx) {
        playChime(); burst(e.clientX, e.clientY);
        setTimeout(() => { setMatched((prev) => new Set([...prev, a.itemIdx])); setFlipped([]); }, 400);
      } else {
        playWhoosh(); setIsLocked(true); setWrongIds(newFlipped);
        setTimeout(() => { setFlipped([]); setWrongIds([]); setIsLocked(false); }, 900);
      }
    }
  };

  const allDone = matched.size === items.length;
  const cols = Math.min(Math.ceil(Math.sqrt(cards.length * 1.3)), 6);

  useEffect(() => {
    if (allDone && matched.size > 0) onComplete?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone]);

  return (
    <div style={{ position: "relative" }}>
      {stars.map((s) => <FloatingStar key={s.id} x={s.x} y={s.y} char={s.char} onDone={() => {}} />)}
      {allDone && (
        <div style={{ textAlign: "center", padding: "1.25rem", background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(124,58,237,0.2))", border: "1px solid rgba(16,185,129,0.5)", borderRadius: 14, marginBottom: "1.25rem", animation: "cpDone 0.6s ease" }}>
          <div style={{ fontSize: "2.5rem" }}>🎉</div>
          <p style={{ color: "#10b981", fontWeight: 800, marginTop: "0.35rem", fontSize: "1.1rem" }}>All pairs found!</p>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <div style={{ flex: 1, height: 7, background: "rgba(255,255,255,0.1)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 99, transition: "width 0.4s ease", width: `${items.length ? (matched.size / items.length) * 100 : 0}%`, background: "linear-gradient(90deg, #7c3aed, #10b981)" }} />
        </div>
        <span style={{ fontSize: 13, color: "#94a3b8", whiteSpace: "nowrap", fontWeight: 600 }}>{matched.size} / {items.length} pairs</span>
      </div>
      <p style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "1rem" }}>Flip cards to find matching pairs</p>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "0.65rem" }}>
        {cards.map((card) => {
          const col = CARD_COLORS[card.itemIdx % CARD_COLORS.length];
          const isFlipped = flipped.includes(card.cardId) || matched.has(card.itemIdx);
          const isMat = matched.has(card.itemIdx);
          const isWrg = wrongIds.includes(card.cardId);
          return (
            <button key={card.cardId} type="button" onClick={(e) => handleFlip(card, e)}
              style={{ width: "100%", aspectRatio: "1", minWidth: 0, borderRadius: 12, cursor: isMat || isLocked ? "default" : "pointer", border: `2px solid ${isMat ? "rgba(16,185,129,0.7)" : isFlipped ? col.border : "rgba(124,58,237,0.4)"}`, background: isMat ? "rgba(16,185,129,0.15)" : isFlipped ? col.bg : "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.15))", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.3rem", padding: "0.4rem", transition: "all 0.25s", boxShadow: isMat ? "0 0 14px rgba(16,185,129,0.4)" : isFlipped ? `0 4px 16px ${col.glow}` : "none", animation: isWrg ? "cpShake 0.45s ease" : isMat ? "cpCorrectGlow 0.6s ease" : "none" }}>
              {!isFlipped ? (
                <span style={{ fontSize: "1.6rem", opacity: 0.7 }}>⭐</span>
              ) : (
                <>
                  {card.side === "image" && card.imageUrl
                    ? <img src={card.imageUrl} alt="" style={{ width: "72%", height: "72%", objectFit: "cover", borderRadius: 7 }} />
                    : <span style={{ fontSize: card.side === "word" ? "0.85rem" : "1.5rem", fontWeight: 700, color: isMat ? "#10b981" : col.text, textAlign: "center", wordBreak: "break-all", padding: "0 3px" }}>{card.label}</span>
                  }
                  {isMat && <span style={{ fontSize: "0.7rem", color: "#10b981" }}>✓</span>}
                </>
              )}
            </button>
          );
        })}
      </div>
      {!allDone && (
        <button type="button" style={{ marginTop: "1.25rem", fontSize: 13, padding: "0.4rem 1rem", cursor: "pointer", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#94a3b8" }}
          onClick={() => { setMatched(new Set()); setFlipped([]); setIsLocked(false); }}>
          🔄 Reset
        </button>
      )}
    </div>
  );
}

// ── QuizGame ──────────────────────────────────────────────────────────────────
// mode="preview": teacher sees "Show Answers" toggle
// mode="student": submit button + result screen; alreadySubmitted shows score directly
function QuizGame({ content, mode, alreadySubmitted }) {
  const { playChime, playWhoosh, playPop } = useSound();
  const [answers, setAnswers] = useState(Array(content.questions.length).fill(null));
  const [revealed, setRevealed] = useState(false);
  const [freshResult, setFreshResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isPreview = mode === "preview";

  // Already-submitted screen
  if (alreadySubmitted && !freshResult) {
    const score = alreadySubmitted.score;
    return (
      <div style={{ textAlign: "center", padding: "2rem 0", animation: "cpSlideIn 0.35s ease" }}>
        <div style={{ fontSize: "5rem", fontWeight: 900, color: score >= 70 ? "#10b981" : "#f59e0b", lineHeight: 1 }}>{score}%</div>
        <div style={{ fontSize: "2.2rem", marginTop: "0.5rem" }}>{score >= 70 ? "🎉" : "📚"}</div>
        <p style={{ color: "#e2e8f0", marginTop: "0.6rem", fontSize: "1.1rem", fontWeight: 600 }}>
          {score >= 70 ? "Excellent work!" : "Keep practicing!"}
        </p>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: "0.35rem" }}>
          Submitted on {new Date(alreadySubmitted.completedAt).toLocaleDateString()}
        </p>
        <p style={{ color: "#475569", fontSize: 12, marginTop: "0.2rem" }}>You can only submit this quiz once.</p>
      </div>
    );
  }

  // Fresh result after submitting
  if (freshResult) {
    const score = freshResult.score;
    return (
      <div style={{ animation: "cpSlideIn 0.35s ease" }}>
        <div style={{ textAlign: "center", padding: "1.5rem 0 1.25rem" }}>
          <div style={{ fontSize: "4.5rem", fontWeight: 900, color: score >= 70 ? "#10b981" : "#f59e0b", lineHeight: 1 }}>{score}%</div>
          <div style={{ fontSize: "2rem", marginTop: "0.4rem" }}>{score >= 70 ? "🎉" : "📚"}</div>
          <p style={{ color: "#e2e8f0", marginTop: "0.5rem", fontSize: "1.15rem", fontWeight: 600 }}>
            {freshResult.correct} / {freshResult.total} correct
          </p>
          {score >= 70
            ? <p style={{ color: "#10b981", fontSize: 14, marginTop: "0.25rem" }}>Keep it up!</p>
            : <p style={{ color: "#f59e0b", fontSize: 14, marginTop: "0.25rem" }}>Review the answers below.</p>
          }
        </div>
        <div style={{ height: 1, background: "linear-gradient(90deg, rgba(124,58,237,0.4), transparent)", margin: "0 0 1.25rem" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          {(freshResult.graded || []).map((g, i) => (
            <div key={i} style={{ background: g.isCorrect ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)", border: `1px solid ${g.isCorrect ? "rgba(16,185,129,0.3)" : "rgba(244,63,94,0.3)"}`, borderRadius: 12, padding: "0.9rem 1.1rem" }}>
              <p style={{ color: "#e2e8f0", marginBottom: "0.35rem", fontWeight: 600 }}>{g.isCorrect ? "✅" : "❌"} Q{i + 1}: {g.questionText}</p>
              <p style={{ fontSize: 14 }}>
                {g.isCorrect
                  ? <span style={{ color: "#10b981" }}>✓ {g.given}</span>
                  : <><span style={{ color: "#f43f5e" }}>✗ {g.given || "—"}</span><span style={{ color: "#94a3b8" }}> · Answer: </span><span style={{ color: "#10b981" }}>{g.correct}</span></>
                }
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Submit handler — convert stored indices back to text values for the API
  const handleSubmit = async () => {
    if (answers.some((a) => a === null)) { setError("Please answer all questions before submitting."); return; }
    setSubmitting(true); setError("");
    try {
      const answerTexts = answers.map((idx, qi) =>
        idx !== null ? content.questions[qi].options[idx] : null
      );
      const res = await api.post(`/api/student/contents/${content._id}/submit`, { answers: answerTexts });
      setFreshResult(res.data);
      if (res.data.score >= 70) playChime(); else playWhoosh();
    } catch (err) {
      setError(err?.response?.data?.error || "Submission failed.");
    } finally { setSubmitting(false); }
  };

  // ── Quiz answering screen — unified style for both preview and student ────────
  return (
    <div>
      {error && (
        <div style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: 10, padding: "0.65rem 1rem", marginBottom: "1rem", color: "#f87171", fontSize: 14 }}>
          {error}
        </div>
      )}

      {content.questions.map((q, qi) => (
        <div key={qi} style={{
          background: "linear-gradient(145deg, rgba(30,12,65,0.92), rgba(18,7,42,0.96))",
          border: "2px solid rgba(168,85,247,0.45)",
          borderRadius: 24,
          padding: "1.75rem",
          marginBottom: "1.6rem",
          animation: "cpSlideIn 0.3s ease",
          boxShadow: "0 0 32px rgba(168,85,247,0.2), 0 10px 40px rgba(0,0,0,0.55)",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Inner aurora */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 8% 8%, rgba(168,85,247,0.1) 0%, transparent 60%)" }} />

          {/* Question number + text */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: q.imageUrl ? "1rem" : "1.3rem" }}>
            <div style={{
              width: 44, height: 44, flexShrink: 0, borderRadius: "50%",
              background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              border: "2px solid rgba(196,181,253,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, fontWeight: 900, color: "#fff",
              boxShadow: "0 0 18px rgba(124,58,237,0.65), 0 4px 14px rgba(0,0,0,0.45)",
              position: "relative", zIndex: 1,
            }}>
              {qi + 1}
            </div>
            <p style={{ color: "#f0e6ff", fontWeight: 700, marginBottom: 0, fontSize: 19, lineHeight: 1.5, position: "relative", zIndex: 1 }}>
              {q.questionText}
            </p>
          </div>

          {/* Optional image */}
          {q.imageUrl && (
            <img src={q.imageUrl} alt="" style={{
              maxWidth: "100%", maxHeight: 240, borderRadius: 14,
              marginBottom: "1.25rem", display: "block", margin: "0 auto 1.25rem",
              boxShadow: "0 4px 24px rgba(0,0,0,0.55)",
              border: "1px solid rgba(168,85,247,0.3)",
            }} />
          )}

          {/* Answer grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: "1.1rem", columnGap: "1.1rem" }}>
            {q.options.map((opt, oi) => {
              const col = QUIZ_COLORS[oi % QUIZ_COLORS.length];
              const isSelected = answers[qi] === oi;
              const isCorrect = opt === q.correctAnswer;

              let bgColor = isSelected ? col.bg : "rgba(255,255,255,0.04)";
              let borderColor = isSelected ? col.border : "rgba(255,255,255,0.14)";
              if (revealed) {
                if (isCorrect)       { bgColor = col.bg; borderColor = col.border; }
                else if (isSelected) { bgColor = "rgba(239,68,68,0.18)"; borderColor = "rgba(239,68,68,0.6)"; }
                else                 { bgColor = "rgba(255,255,255,0.02)"; borderColor = "rgba(255,255,255,0.07)"; }
              }

              const boxShadow = isSelected && !revealed
                ? `0 0 0 3px ${col.glow}, 0 10px 22px ${col.glow}`
                : revealed && isCorrect ? `0 0 22px ${col.glow}` : "none";

              return (
                <button key={oi} type="button"
                  onClick={() => { if (revealed) return; playPop(); setAnswers((a) => a.map((x, i) => i === qi ? oi : x)); }}
                  style={{
                    background: bgColor, border: `2.5px solid ${borderColor}`,
                    borderRadius: 18, padding: "1.1rem 1.3rem",
                    textAlign: "left", cursor: revealed ? "default" : "pointer",
                    transition: "all .18s", display: "flex", alignItems: "center",
                    gap: "0.9rem", boxShadow, minHeight: 88,
                    position: "relative", overflow: "hidden", boxSizing: "border-box", width: "100%",
                  }}
                >
                  {(isSelected || (revealed && isCorrect)) && (
                    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(circle at 20% 50%, ${col.glow} 0%, transparent 70%)`, opacity: 0.25 }} />
                  )}
                  <span style={{
                    width: 44, height: 44, borderRadius: 13,
                    background: col.bg, border: `2px solid ${col.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, flexShrink: 0, color: col.text, fontWeight: 900,
                    boxShadow: `0 0 12px ${col.glow}`, position: "relative", zIndex: 1,
                  }}>
                    {col.icon}
                  </span>
                  <span style={{
                    color: revealed ? (isCorrect ? col.text : isSelected ? "#f87171" : "#475569") : (isSelected ? col.text : "#e2e8f0"),
                    fontWeight: isSelected || (revealed && isCorrect) ? 700 : 500,
                    fontSize: 15, lineHeight: 1.4, flex: 1, position: "relative", zIndex: 1,
                  }}>
                    {revealed && isCorrect ? "✓ " : ""}{opt}
                  </span>
                  {revealed && isCorrect && (
                    <span style={{ fontSize: "1.2rem", flexShrink: 0, position: "relative", zIndex: 1 }}>✨</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Action button */}
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
        {mode === "preview" ? (
          <button
            onClick={() => {
              setRevealed((r) => !r);
              if (!revealed) answers.forEach((idx, qi) => {
                const q = content.questions[qi];
                if (idx !== null && q?.options[idx] === q?.correctAnswer) playChime();
              });
            }}
            style={{
              background: revealed ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)",
              border: revealed ? "1.5px solid rgba(255,255,255,0.18)" : "none",
              borderRadius: 16, padding: "0.9rem 2.4rem",
              color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer",
              boxShadow: revealed ? "none" : "0 4px 28px rgba(124,58,237,0.65), 0 0 60px rgba(236,72,153,0.25), 0 8px 32px rgba(0,0,0,0.45)",
              transition: "all .2s", letterSpacing: "0.02em",
            }}
          >
            {revealed ? "Hide Answers" : "Show Answers"}
          </button>
        ) : (
          <button className="btn-register" disabled={submitting} onClick={handleSubmit}>
            {submitting ? "Submitting…" : "Submit Quiz"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── ContentPlayer — full-screen modal ─────────────────────────────────────────
// mode="preview": teacher preview — space-themed galaxy overlay
// mode="student": student plays — original dark overlay
export default function ContentPlayer({ content, mode = "preview", alreadySubmitted = null, onClose, onGameComplete }) {
  const isGame = content.type === "game";
  const iconSrc = isGame
    ? (content.template === "match-word-picture" ? matchWithPicImg : flashcardImg)
    : quizlogoImg;
  const typeLabel = isGame
    ? (content.template === "match-word-picture" ? "Match Word with Picture" : "Memory Card")
    : "Quiz";
  const itemCount = isGame
    ? `${content.items?.length || 0} items`
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
                flexShrink: 0, marginTop: "0.2rem",
                width: 44, height: 44, borderRadius: "50%",
                background: "rgba(255,255,255,0.07)",
                border: "1.5px solid rgba(168,85,247,0.4)",
                color: "#c4b5fd",
                cursor: "pointer",
                fontSize: 18, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
                boxShadow: "0 0 14px rgba(168,85,247,0.3)",
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
              ✕
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
              flexShrink: 0, marginTop: "0.2rem",
              width: 44, height: 44, borderRadius: "50%",
              background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(168,85,247,0.4)",
              color: "#c4b5fd", cursor: "pointer", fontSize: 18, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s", boxShadow: "0 0 14px rgba(168,85,247,0.3)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(236,72,153,0.22)"; e.currentTarget.style.borderColor = "rgba(236,72,153,0.7)"; e.currentTarget.style.color = "#f9a8d4"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.borderColor = "rgba(168,85,247,0.4)"; e.currentTarget.style.color = "#c4b5fd"; }}
          >
            ✕
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
