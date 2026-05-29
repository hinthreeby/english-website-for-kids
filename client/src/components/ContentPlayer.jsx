import { useCallback, useEffect, useState } from "react";
import useSound from "../hooks/useSound";
import api from "../lib/api";

if (typeof document !== "undefined" && !document.getElementById("cp-kf")) {
  const s = document.createElement("style");
  s.id = "cp-kf";
  s.textContent = `
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
  `;
  document.head.appendChild(s);
}

const QUIZ_COLORS = [
  { bg: "rgba(59,130,246,0.25)",  border: "rgba(59,130,246,0.7)",  text: "#93c5fd", glow: "rgba(59,130,246,0.45)",  icon: "▲" },
  { bg: "rgba(239,68,68,0.22)",   border: "rgba(239,68,68,0.65)",   text: "#fca5a5", glow: "rgba(239,68,68,0.45)",   icon: "●" },
  { bg: "rgba(34,197,94,0.22)",   border: "rgba(34,197,94,0.65)",   text: "#86efac", glow: "rgba(34,197,94,0.45)",   icon: "◆" },
  { bg: "rgba(245,158,11,0.22)",  border: "rgba(245,158,11,0.65)",  text: "#fcd34d", glow: "rgba(245,158,11,0.45)",  icon: "■" },
];

const CARD_COLORS = [
  { bg: "rgba(124,58,237,0.22)", border: "rgba(124,58,237,0.65)", text: "#c4b5fd", glow: "rgba(124,58,237,0.4)" },
  { bg: "rgba(6,182,212,0.18)",  border: "rgba(6,182,212,0.6)",   text: "#67e8f9", glow: "rgba(6,182,212,0.4)" },
  { bg: "rgba(16,185,129,0.18)", border: "rgba(16,185,129,0.6)",  text: "#6ee7b7", glow: "rgba(16,185,129,0.4)" },
  { bg: "rgba(245,158,11,0.18)", border: "rgba(245,158,11,0.6)",  text: "#fcd34d", glow: "rgba(245,158,11,0.4)" },
  { bg: "rgba(239,68,68,0.18)",  border: "rgba(239,68,68,0.55)",  text: "#fca5a5", glow: "rgba(239,68,68,0.4)" },
  { bg: "rgba(236,72,153,0.18)", border: "rgba(236,72,153,0.55)", text: "#f9a8d4", glow: "rgba(236,72,153,0.4)" },
];

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
function MatchWordPictureGame({ items }) {
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
function MemoryCardGame({ items }) {
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

  // Already-submitted screen (score only, no graded breakdown)
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

  // Quiz answering screen
  const handleSubmit = async () => {
    if (answers.some((a) => a === null)) { setError("Please answer all questions before submitting."); return; }
    setSubmitting(true); setError("");
    try {
      const res = await api.post(`/api/student/contents/${content._id}/submit`, { answers });
      setFreshResult(res.data);
      if (res.data.score >= 70) playChime(); else playWhoosh();
    } catch (err) {
      setError(err?.response?.data?.error || "Submission failed.");
    } finally { setSubmitting(false); }
  };

  return (
    <div>
      {error && (
        <div style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: 8, padding: "0.6rem 1rem", marginBottom: "1rem", color: "#f87171", fontSize: 14 }}>
          {error}
        </div>
      )}

      {content.questions.map((q, qi) => (
        <div key={qi} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "1.25rem", marginBottom: "1.1rem", animation: "cpSlideIn 0.3s ease" }}>
          {q.imageUrl && (
            <img src={q.imageUrl} alt="" style={{ maxWidth: "100%", maxHeight: 240, borderRadius: 10, marginBottom: "0.9rem", display: "block", margin: "0 auto 0.9rem" }} />
          )}
          <p style={{ color: "#e2e8f0", fontWeight: 700, marginBottom: "1.1rem", fontSize: 17 }}>
            {qi + 1}. {q.questionText}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
            {q.options.map((opt, oi) => {
              const col = QUIZ_COLORS[oi % QUIZ_COLORS.length];
              const isSelected = answers[qi] === opt;
              const isCorrect = opt === q.correctAnswer;
              let bg = isSelected ? col.bg : "rgba(255,255,255,0.04)";
              let border = isSelected ? col.border : "rgba(255,255,255,0.1)";
              if (revealed) {
                if (isCorrect)       { bg = col.bg; border = col.border; }
                else if (isSelected) { bg = "rgba(239,68,68,0.15)"; border = "rgba(239,68,68,0.5)"; }
                else                 { bg = "rgba(255,255,255,0.03)"; border = "rgba(255,255,255,0.08)"; }
              }
              return (
                <button key={oi} type="button"
                  onClick={() => { if (revealed) return; playPop(); setAnswers((a) => a.map((x, i) => i === qi ? opt : x)); }}
                  style={{ background: bg, border: `2px solid ${border}`, borderRadius: 12, padding: "1rem 1.1rem", textAlign: "left", cursor: revealed ? "default" : "pointer", transition: "all .15s", display: "flex", alignItems: "center", gap: "0.75rem", boxShadow: isSelected && !revealed ? `0 0 0 3px ${col.glow}, 0 4px 14px ${col.glow}` : "none", minHeight: 64 }}>
                  <span style={{ width: 34, height: 34, borderRadius: 8, background: col.bg, border: `1px solid ${col.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0, color: col.text, fontWeight: 800 }}>
                    {col.icon}
                  </span>
                  <span style={{ color: revealed ? (isCorrect ? col.text : isSelected ? "#f87171" : "#475569") : (isSelected ? col.text : "#e2e8f0"), fontWeight: isSelected || (revealed && isCorrect) ? 700 : 400, fontSize: 15 }}>
                    {revealed && isCorrect ? "✓ " : ""}{opt}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
        {mode === "preview" ? (
          <button className="btn-register"
            onClick={() => { setRevealed((r) => !r); if (!revealed) { answers.forEach((a, qi) => { if (a === content.questions[qi]?.correctAnswer) playChime(); }); } }}>
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
// mode="preview": teacher preview (Show Answers on quiz, games fully playable)
// mode="student": student plays (Submit on quiz, games fully playable)
// alreadySubmitted: existing submission object { score, completedAt } for student quiz
export default function ContentPlayer({ content, mode = "preview", alreadySubmitted = null, onClose }) {
  const isGame = content.type === "game";
  const icon = isGame ? (content.template === "match-word-picture" ? "🔤" : "🃏") : "📝";
  const typeLabel = isGame
    ? (content.template === "match-word-picture" ? "Match Word with Picture" : "Memory Card")
    : "Quiz";
  const itemCount = isGame
    ? `${content.items?.length || 0} items`
    : `${content.questions?.length || 0} questions`;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2vh 2vw" }}
      onClick={onClose}
    >
      <div
        style={{ width: "min(980px, 96vw)", maxHeight: "95vh", overflowY: "auto", background: "rgba(13,13,28,0.98)", border: "1px solid rgba(124,58,237,0.35)", borderRadius: 20, padding: "2rem 2.5rem", boxShadow: "0 24px 80px rgba(0,0,0,0.7)", animation: "cpSlideIn 0.25s ease" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", gap: "0.85rem", alignItems: "center" }}>
            <span style={{ fontSize: "2.2rem", lineHeight: 1 }}>{icon}</span>
            <div>
              {mode === "preview" && (
                <span style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: "0.2rem" }}>
                  Teacher Preview
                </span>
              )}
              <h2 style={{ margin: 0, fontSize: "1.35rem", color: "#e2e8f0" }}>{content.title}</h2>
              <p style={{ color: "#64748b", fontSize: 13, marginTop: "0.2rem" }}>
                {typeLabel} · {itemCount}
                {content.description ? ` · ${content.description}` : ""}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "#94a3b8", cursor: "pointer", padding: "0.4rem 0.9rem", fontSize: 14, flexShrink: 0, transition: "all .15s" }}>
            ✕ Close
          </button>
        </div>

        <div style={{ height: 1, background: "linear-gradient(90deg, rgba(124,58,237,0.5), rgba(6,182,212,0.3), transparent)", marginBottom: "1.75rem" }} />

        {isGame ? (
          !content.items?.length ? (
            <p style={{ color: "#64748b", textAlign: "center", padding: "2.5rem 0", fontSize: 15 }}>No items added yet.</p>
          ) : content.template === "match-word-picture" ? (
            <MatchWordPictureGame items={content.items} />
          ) : (
            <MemoryCardGame items={content.items} />
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
  );
}
