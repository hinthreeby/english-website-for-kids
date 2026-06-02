import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../lib/api";
import Navbar from "../../components/Navbar";
import StarBackground from "../../components/StarBackground";
import ContentPlayer from "../../components/ContentPlayer";
import matchWithPicImg from "../../assets/teacher/matchwithpicture.png";
import flashcardImg    from "../../assets/teacher/flashcard.png";
import quizlogoImg     from "../../assets/teacher/quizlogo.png";

if (typeof document !== "undefined" && !document.getElementById("tc-slide-kf")) {
  const s = document.createElement("style");
  s.id = "tc-slide-kf";
  s.textContent = `
    @keyframes tcSlideIn {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(s);
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TEMPLATES = [
  { value: "match-word-picture", label: "Match Word with Picture", type: "game", icon: matchWithPicImg, desc: "Students match words to pictures" },
  { value: "memory-card",        label: "Memory Card",             type: "game", icon: flashcardImg,    desc: "Flip cards to find matching pairs" },
  { value: "quiz",               label: "Quiz",                    type: "quiz", icon: quizlogoImg,     desc: "Multiple-choice questions" },
];

const BLANK_ITEM     = { word: "", imageUrl: "" };
const BLANK_QUESTION = { questionText: "", options: ["", "", "", ""], correctAnswer: "", imageUrl: "" };

// Quiz answer colors (Kahoot style: A/B/C/D)
const QUIZ_COLORS = [
  { bg: "rgba(59,130,246,0.25)",  border: "rgba(59,130,246,0.7)",  text: "#93c5fd",  glow: "rgba(59,130,246,0.45)",  icon: "▲" },
  { bg: "rgba(239,68,68,0.22)",   border: "rgba(239,68,68,0.65)",   text: "#fca5a5",  glow: "rgba(239,68,68,0.45)",   icon: "●" },
  { bg: "rgba(34,197,94,0.22)",   border: "rgba(34,197,94,0.65)",   text: "#86efac",  glow: "rgba(34,197,94,0.45)",   icon: "◆" },
  { bg: "rgba(245,158,11,0.22)",  border: "rgba(245,158,11,0.65)",  text: "#fcd34d",  glow: "rgba(245,158,11,0.45)",  icon: "■" },
];

// Item card colors for variety
const CARD_COLORS = [
  { bg: "rgba(124,58,237,0.22)", border: "rgba(124,58,237,0.65)", text: "#c4b5fd", glow: "rgba(124,58,237,0.4)" },
  { bg: "rgba(6,182,212,0.18)",  border: "rgba(6,182,212,0.6)",   text: "#67e8f9", glow: "rgba(6,182,212,0.4)" },
  { bg: "rgba(16,185,129,0.18)", border: "rgba(16,185,129,0.6)",  text: "#6ee7b7", glow: "rgba(16,185,129,0.4)" },
  { bg: "rgba(245,158,11,0.18)", border: "rgba(245,158,11,0.6)",  text: "#fcd34d", glow: "rgba(245,158,11,0.4)" },
  { bg: "rgba(239,68,68,0.18)",  border: "rgba(239,68,68,0.55)",  text: "#fca5a5", glow: "rgba(239,68,68,0.4)" },
  { bg: "rgba(236,72,153,0.18)", border: "rgba(236,72,153,0.55)", text: "#f9a8d4", glow: "rgba(236,72,153,0.4)" },
];

// ── UI Atoms ──────────────────────────────────────────────────────────────────

const chip = (color) => ({
  fontSize: 11, fontWeight: 700, padding: "0.18rem 0.55rem", borderRadius: 20,
  display: "inline-flex", alignItems: "center", gap: 4, ...color,
});

function Badge({ published }) {
  return published
    ? <span style={chip({ background: "rgba(16,185,129,.18)", color: "#10b981", border: "1px solid rgba(16,185,129,.4)" })}>● Published</span>
    : <span style={chip({ background: "rgba(148,163,184,.15)", color: "#94a3b8", border: "1px solid rgba(148,163,184,.3)" })}>○ Draft</span>;
}

function TypeTag({ template }) {
  const t = TEMPLATES.find((x) => x.value === template);
  return (
    <span style={chip({ background: "rgba(124,58,237,.2)", color: "#c4b5fd", border: "1px solid rgba(124,58,237,.4)" })}>
      {t?.icon && <img src={t.icon} alt="" style={{ width: 14, height: 14, objectFit: "contain", verticalAlign: "middle" }} />}
      {t?.label || template}
    </span>
  );
}

function SectionLabel({ children }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7c3aed", marginBottom: "0.6rem" }}>
      {children}
    </p>
  );
}

function FieldBox({ children, style }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "1rem 1.2rem", marginBottom: "0.85rem", ...style }}>
      {children}
    </div>
  );
}

function FormInput({ label, ...props }) {
  return (
    <div style={{ marginBottom: "0.65rem" }}>
      {label && <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: "0.3rem" }}>{label}</label>}
      <input
        style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "0.55rem 0.85rem", color: "#e2e8f0", fontSize: 14, outline: "none", transition: "border-color .2s" }}
        {...props}
      />
    </div>
  );
}

// ── ImageInput ────────────────────────────────────────────────────────────────

function ImageInput({ value, onChange }) {
  const [mode, setMode] = useState("url");
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) { alert("Image too large. Max 1.5 MB."); e.target.value = ""; return; }
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "0.35rem", marginBottom: "0.4rem", alignItems: "center" }}>
        <label style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>Image:</label>
        {["url", "file"].map((m) => (
          <button key={m} type="button"
            onClick={() => { setMode(m); if (m === "file") setTimeout(() => fileRef.current?.click(), 30); }}
            style={{ fontSize: 10, padding: "0.15rem 0.5rem", borderRadius: 5, cursor: "pointer", background: mode === m ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.05)", border: `1px solid ${mode === m ? "rgba(124,58,237,0.7)" : "rgba(255,255,255,0.12)"}`, color: mode === m ? "#c4b5fd" : "#64748b" }}>
            {m === "url" ? "🔗 URL" : "📁 Upload"}
          </button>
        ))}
        {value && (
          <button type="button" onClick={() => onChange("")}
            style={{ fontSize: 10, padding: "0.15rem 0.45rem", borderRadius: 5, cursor: "pointer", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
            ✕
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
      {mode === "url" && (
        <input
          placeholder="https://example.com/image.jpg"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 7, padding: "0.45rem 0.7rem", color: "#e2e8f0", fontSize: 12, outline: "none" }}
        />
      )}
      {value && (
        <img src={value} alt="preview" style={{ marginTop: "0.4rem", maxHeight: 56, maxWidth: 100, borderRadius: 6, objectFit: "cover", border: "1px solid rgba(255,255,255,0.15)", display: "block" }} />
      )}
    </div>
  );
}

// ── Stats Modal ───────────────────────────────────────────────────────────────

function StatsModal({ contentId, onClose }) {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api.get(`/api/teacher/contents/${contentId}/stats`).then((r) => setStats(r.data)).catch(() => setStats({ error: true }));
  }, [contentId]);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <h3 style={{ marginBottom: "1rem" }}>Submission Stats</h3>
        {!stats ? <p>Loading…</p> : stats.error ? <p style={{ color: "#f43f5e" }}>Failed to load.</p> : (
          <>
            <div style={{ display: "flex", gap: "2rem", marginBottom: "1.25rem" }}>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: "2rem", fontWeight: 800, color: "#7c3aed" }}>{stats.total}</div><div style={{ color: "#94a3b8", fontSize: 12 }}>Submissions</div></div>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: "2rem", fontWeight: 800, color: "#06b6d4" }}>{stats.avgScore}%</div><div style={{ color: "#94a3b8", fontSize: 12 }}>Avg Score</div></div>
            </div>
            {stats.results.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr style={{ color: "#94a3b8", borderBottom: "1px solid rgba(255,255,255,0.12)" }}><th style={{ textAlign: "left", padding: "0.4rem 0.6rem" }}>Student</th><th style={{ textAlign: "right", padding: "0.4rem 0.6rem" }}>Score</th><th style={{ textAlign: "right", padding: "0.4rem 0.6rem" }}>Date</th></tr></thead>
                  <tbody>
                    {stats.results.map((r, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <td style={{ padding: "0.45rem 0.6rem", color: "#e2e8f0" }}>{r.studentId?.displayName || r.studentId?.username || "—"}</td>
                        <td style={{ textAlign: "right", padding: "0.45rem 0.6rem", color: r.score >= 70 ? "#10b981" : "#f59e0b", fontWeight: 600 }}>{r.score}%</td>
                        <td style={{ textAlign: "right", padding: "0.45rem 0.6rem", color: "#94a3b8" }}>{new Date(r.completedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p style={{ color: "#94a3b8", textAlign: "center" }}>No submissions yet.</p>}
          </>
        )}
        <button className="btn-cancel" onClick={onClose} style={{ marginTop: "1rem" }}>Close</button>
      </div>
    </div>
  );
}

// ── Assign Modal ──────────────────────────────────────────────────────────────

function AssignModal({ content, classrooms, onSave, onClose }) {
  const [selected, setSelected] = useState(
    (content.assignedClassrooms || []).map((id) => (typeof id === "object" ? id._id || id : id).toString())
  );
  const [publishAfter, setPublishAfter] = useState(!content.isPublished);

  const toggle = (id) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <h3 style={{ marginBottom: "0.25rem" }}>Assign to Classrooms</h3>
        <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: "1rem" }}>Choose which classrooms can see this content.</p>
        {classrooms.length === 0 ? (
          <p style={{ color: "#94a3b8" }}>You have no classrooms yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
            {classrooms.map((room) => (
              <label key={room._id} style={{ display: "flex", alignItems: "center", gap: "0.65rem", cursor: "pointer", padding: "0.55rem 0.85rem", borderRadius: 8, transition: "background .15s", background: selected.includes(room._id) ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${selected.includes(room._id) ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.1)"}` }}>
                <input type="checkbox" checked={selected.includes(room._id)} onChange={() => toggle(room._id)} style={{ accentColor: "#7c3aed", width: 15, height: 15 }} />
                <span style={{ color: "#e2e8f0" }}>{room.name}</span>
                <span style={{ marginLeft: "auto", color: "#94a3b8", fontSize: 12 }}>{room.students?.length || 0} students</span>
              </label>
            ))}
          </div>
        )}
        {!content.isPublished && (
          <label style={{ display: "flex", alignItems: "flex-start", gap: "0.65rem", cursor: "pointer", padding: "0.75rem 0.85rem", borderRadius: 8, marginBottom: "1rem", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.35)" }}>
            <input type="checkbox" checked={publishAfter} onChange={(e) => setPublishAfter(e.target.checked)} style={{ accentColor: "#f59e0b", width: 15, height: 15, marginTop: 2 }} />
            <div>
              <span style={{ color: "#f59e0b", fontWeight: 600, fontSize: 13 }}>Publish now</span>
              <p style={{ color: "#94a3b8", fontSize: 12, margin: "0.15rem 0 0" }}>Students won't see this until it's published.</p>
            </div>
          </label>
        )}
        <div className="modal-buttons">
          <button className="btn-register" onClick={() => onSave(selected, publishAfter)}>Save</button>
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Content Form (2-step wizard) ──────────────────────────────────────────────

function ContentForm({ initial, onSave, onCancel }) {
  const isEdit = !!initial?._id;
  const [step,        setStep]        = useState(isEdit ? 2 : 1);
  const [title,       setTitle]       = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [template,    setTemplate]    = useState(initial?.template || "match-word-picture");
  const [items,       setItems]       = useState(
    initial?.items?.length ? initial.items.map((i) => ({ ...i })) : [{ ...BLANK_ITEM }]
  );
  const [questions, setQuestions] = useState(
    initial?.questions?.length ? initial.questions.map((q) => ({ ...q })) : [{ ...BLANK_QUESTION }]
  );
  const [playLimit,   setPlayLimit]   = useState(initial?.playLimit ?? null);
  const [error,       setError]       = useState("");
  const [saving,      setSaving]      = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const tplMeta = TEMPLATES.find((t) => t.value === template);
  const isGame  = tplMeta?.type === "game";

  const setItem    = (i, field, val) => setItems((p) => p.map((it, idx) => idx === i ? { ...it, [field]: val } : it));
  const addItem    = ()              => setItems((p) => [...p, { ...BLANK_ITEM }]);
  const removeItem = (i)            => setItems((p) => p.filter((_, idx) => idx !== i));

  const setQuestion = (i, field, val) => setQuestions((p) => p.map((q, idx) => idx === i ? { ...q, [field]: val } : q));
  const setOption   = (qi, oi, val)   => setQuestions((p) =>
    p.map((q, idx) => idx !== qi ? q : { ...q, options: q.options.map((o, j) => j === oi ? val : o) })
  );
  const changeOptionCount = (qi, n) =>
    setQuestions((p) => p.map((q, idx) => {
      if (idx !== qi) return q;
      const opts = [...q.options];
      while (opts.length < n) opts.push("");
      return { ...q, options: opts.slice(0, n), correctAnswer: "" };
    }));
  const addQuestion    = () => setQuestions((p) => [...p, { ...BLANK_QUESTION }]);
  const removeQuestion = (i) => setQuestions((p) => p.filter((_, idx) => idx !== i));

  const previewContent = { title, type: tplMeta?.type || "quiz", template, items: isGame ? items : [], questions: isGame ? [] : questions };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      const body = { title, description, playLimit, ...(isEdit ? {} : { type: tplMeta.type, template }), ...(isGame ? { items } : { questions }) };
      await onSave(body);
    } catch (err) { setError(err?.response?.data?.error || "Failed to save."); }
    finally { setSaving(false); }
  };

  // ── Step 1: Template picker ─────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <section className="glass-card" style={{ animation: "tcSlideIn 0.3s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(124,58,237,0.4)", border: "2px solid rgba(124,58,237,0.8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#c4b5fd", fontSize: 13, flexShrink: 0 }}>1</div>
            <div>
              <h2 style={{ margin: 0 }}>Choose a Template</h2>
              <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>What type of content do you want to create?</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.85rem" }}>
            {TEMPLATES.map((t) => {
              const isSelected = template === t.value;
              return (
                <button key={t.value} type="button"
                  onClick={() => setTemplate(t.value)}
                  style={{
                    background: isSelected ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.04)",
                    border: `2px solid ${isSelected ? "rgba(124,58,237,0.8)" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 14, padding: "1rem", textAlign: "center", cursor: "pointer",
                    transition: "all .18s",
                    boxShadow: isSelected ? "0 0 0 3px rgba(124,58,237,0.25), 0 8px 24px rgba(124,58,237,0.2)" : "none",
                    display: "flex", alignItems: "center", gap: "0.85rem",
                  }}>
                  <img src={t.icon} alt={t.label} style={{ width: 52, height: 52, objectFit: "contain", flexShrink: 0 }} />
                  <span style={{ textAlign: "left" }}>
                    <span style={{ display: "block", color: isSelected ? "#c4b5fd" : "#e2e8f0", fontWeight: 700, fontSize: 14 }}>{t.label}</span>
                    <span style={{ display: "block", color: "#64748b", fontSize: 12, marginTop: "0.2rem" }}>{t.desc}</span>
                    {isSelected && <span style={{ display: "block", color: "#c4b5fd", fontSize: 11, fontWeight: 600, marginTop: "0.3rem" }}>✓ Selected</span>}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <button type="button" className="btn-register" onClick={() => setStep(2)}>
              Next
            </button>
            <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
          </div>
        </section>
      </div>
    );
  }

  // ── Step 2: Content form ────────────────────────────────────────────────────
  return (
    <>
      {showPreview && <ContentPlayer content={previewContent} mode="preview" onClose={() => setShowPreview(false)} />}
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <section className="glass-card" style={{ animation: "tcSlideIn 0.3s ease" }}>
          {/* Header with step indicator */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
            <div>
              {!isEdit && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                  <span style={{ background: "rgba(124,58,237,0.3)", color: "#c4b5fd", fontSize: 10, fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 20 }}>Step 2 of 2</span>
                  {tplMeta?.icon && <img src={tplMeta.icon} alt="" style={{ width: 20, height: 20, objectFit: "contain" }} />}
                  <span style={{ color: "#94a3b8", fontSize: 13 }}>{tplMeta?.label}</span>
                </div>
              )}
              <h2 style={{ margin: 0 }}>{isEdit ? "Edit Content" : "Fill in the Details"}</h2>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexShrink: 0 }}>
              {!isEdit && (
                <button type="button" onClick={() => setStep(1)}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#94a3b8", cursor: "pointer", padding: "0.35rem 0.85rem", fontSize: 13 }}>
                  ← Back
                </button>
              )}
              <button type="button" className="btn-secondary-glass" style={{ fontSize: 13, padding: "0.35rem 0.85rem" }}
                onClick={() => setShowPreview(true)}>
                👁 Preview
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.35)", borderRadius: 8, padding: "0.6rem 1rem", marginBottom: "1rem", color: "#f87171", fontSize: 13 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Basic info */}
            <FieldBox>
              <SectionLabel>Basic Info</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <FormInput label="Title *" placeholder="e.g. Animals Vocabulary" value={title} onChange={(e) => setTitle(e.target.value)} required />
                <FormInput label="Description" placeholder="Optional description" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </FieldBox>

            {/* Play limit */}
            <FieldBox>
              <SectionLabel>Play / Attempt Limit</SectionLabel>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                {[
                  { label: "Unlimited", value: null },
                  { label: "1×", value: 1 },
                  { label: "2×", value: 2 },
                  { label: "3×", value: 3 },
                  { label: "5×", value: 5 },
                ].map((opt) => {
                  const active = playLimit === opt.value;
                  return (
                    <button key={String(opt.value)} type="button"
                      onClick={() => setPlayLimit(opt.value)}
                      style={{
                        padding: "0.35rem 0.9rem", borderRadius: 20, fontSize: 13, cursor: "pointer", fontWeight: active ? 700 : 400,
                        background: active ? "rgba(124,58,237,0.35)" : "rgba(255,255,255,0.06)",
                        border: `1.5px solid ${active ? "rgba(124,58,237,0.8)" : "rgba(255,255,255,0.12)"}`,
                        color: active ? "#c4b5fd" : "#94a3b8",
                      }}>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: 11, color: "#64748b", marginTop: "0.5rem" }}>
                {playLimit === null
                  ? "Students can play/attempt this content as many times as they want."
                  : `Students can play/attempt this content up to ${playLimit} time${playLimit > 1 ? "s" : ""}.`}
              </p>
            </FieldBox>

            {/* Game items */}
            {isGame && (
              <FieldBox>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                  <SectionLabel>Items ({items.length})</SectionLabel>
                  <button type="button" className="btn-secondary-glass" style={{ fontSize: 12, padding: "0.3rem 0.8rem" }} onClick={addItem}>+ Add Item</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
                  {items.map((item, i) => {
                    const col = CARD_COLORS[i % CARD_COLORS.length];
                    return (
                      <div key={i} style={{ background: col.bg, border: `1px solid ${col.border}`, borderRadius: 12, padding: "0.85rem", position: "relative" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
                          <span style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}`, fontWeight: 800, fontSize: 12, width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                          {items.length > 1 && (
                            <button type="button" onClick={() => removeItem(i)}
                              style={{ marginLeft: "auto", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: 5, color: "#f87171", cursor: "pointer", width: 22, height: 22, fontSize: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              ✕
                            </button>
                          )}
                        </div>
                        <input
                          placeholder="Word *" value={item.word} onChange={(e) => setItem(i, "word", e.target.value)} required
                          style={{ width: "100%", boxSizing: "border-box", marginBottom: "0.6rem", background: "rgba(0,0,0,0.25)", border: `1px solid ${col.border}`, borderRadius: 7, padding: "0.45rem 0.7rem", color: "#e2e8f0", fontSize: 14, outline: "none" }}
                        />
                        <ImageInput value={item.imageUrl} onChange={(val) => setItem(i, "imageUrl", val)} />
                      </div>
                    );
                  })}
                </div>
              </FieldBox>
            )}

            {/* Quiz questions */}
            {!isGame && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <SectionLabel>Questions ({questions.length})</SectionLabel>
                  <button type="button" className="btn-secondary-glass" style={{ fontSize: 12, padding: "0.3rem 0.8rem" }} onClick={addQuestion}>+ Add Question</button>
                </div>

                {questions.map((q, qi) => (
                  <FieldBox key={qi} style={{ borderColor: "rgba(124,58,237,0.25)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                      <span style={{ background: "rgba(124,58,237,0.3)", color: "#c4b5fd", fontWeight: 700, fontSize: 12, padding: "0.2rem 0.65rem", borderRadius: 20 }}>Q{qi + 1}</span>
                      {questions.length > 1 && (
                        <button type="button" onClick={() => removeQuestion(qi)}
                          style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, color: "#f87171", cursor: "pointer", padding: "0.2rem 0.5rem", fontSize: 12 }}>
                          Remove
                        </button>
                      )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.75rem", alignItems: "start", marginBottom: "0.65rem" }}>
                      <FormInput label="Question text *" placeholder="e.g. What animal is this?" value={q.questionText} onChange={(e) => setQuestion(qi, "questionText", e.target.value)} required />
                      <div style={{ paddingTop: "1.4rem" }}>
                        <ImageInput value={q.imageUrl} onChange={(val) => setQuestion(qi, "imageUrl", val)} />
                      </div>
                    </div>

                    {/* Option count selector */}
                    <div style={{ marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <label style={{ fontSize: 12, color: "#94a3b8", flexShrink: 0 }}>Options:</label>
                      {[2, 3, 4].map((n) => (
                        <button key={n} type="button" onClick={() => changeOptionCount(qi, n)}
                          style={{ padding: "0.25rem 0.65rem", borderRadius: 7, fontSize: 12, cursor: "pointer", background: q.options.length === n ? "rgba(124,58,237,0.35)" : "rgba(255,255,255,0.06)", border: `1px solid ${q.options.length === n ? "rgba(124,58,237,0.7)" : "rgba(255,255,255,0.12)"}`, color: q.options.length === n ? "#c4b5fd" : "#94a3b8", fontWeight: q.options.length === n ? 700 : 400 }}>
                          {n}
                        </button>
                      ))}
                    </div>

                    {/* Options — Kahoot colored inputs */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.85rem" }}>
                      {q.options.map((opt, oi) => {
                        const col = QUIZ_COLORS[oi % QUIZ_COLORS.length];
                        const isCorrect = opt !== "" && opt === q.correctAnswer;
                        return (
                          <div key={oi} style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                            <span style={{ width: 26, height: 26, borderRadius: 6, background: col.bg, border: `1px solid ${col.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: col.text, flexShrink: 0 }}>
                              {col.icon}
                            </span>
                            <input
                              placeholder={`Option ${String.fromCharCode(65 + oi)} *`}
                              value={opt} onChange={(e) => setOption(qi, oi, e.target.value)} required
                              style={{ flex: 1, background: isCorrect ? col.bg : "rgba(255,255,255,0.06)", border: `2px solid ${isCorrect ? col.border : "rgba(255,255,255,0.12)"}`, borderRadius: 8, padding: "0.5rem 0.7rem", color: "#e2e8f0", fontSize: 13, outline: "none" }}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Correct answer — colorful button selector */}
                    <div>
                      <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: "0.5rem" }}>✓ Correct answer *</label>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.4rem" }}>
                        {q.options.filter(Boolean).map((opt, oi) => {
                          const col = QUIZ_COLORS[oi % QUIZ_COLORS.length];
                          const isSelected = q.correctAnswer === opt;
                          return (
                            <button key={oi} type="button" onClick={() => setQuestion(qi, "correctAnswer", opt)}
                              style={{
                                padding: "0.55rem 0.75rem", borderRadius: 9, cursor: "pointer",
                                background: isSelected ? col.bg : "rgba(255,255,255,0.04)",
                                border: `2px solid ${isSelected ? col.border : "rgba(255,255,255,0.1)"}`,
                                display: "flex", alignItems: "center", gap: "0.5rem",
                                transition: "all .15s",
                                boxShadow: isSelected ? `0 0 0 2px ${col.glow}` : "none",
                              }}>
                              <span style={{ width: 22, height: 22, borderRadius: 5, background: col.bg, border: `1px solid ${col.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: col.text, flexShrink: 0 }}>
                                {col.icon}
                              </span>
                              <span style={{ color: isSelected ? col.text : "#64748b", fontWeight: isSelected ? 700 : 400, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {opt}
                              </span>
                              {isSelected && <span style={{ marginLeft: "auto", color: col.text, fontSize: 13 }}>✓</span>}
                            </button>
                          );
                        })}
                      </div>
                      {!q.correctAnswer && <p style={{ color: "#f59e0b", fontSize: 11, marginTop: "0.35rem" }}>⚠ Select the correct answer above</p>}
                    </div>
                  </FieldBox>
                ))}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <button type="submit" className="btn-register" disabled={saving}>
                {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Content"}
              </button>
              <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const TeacherContentsPage = () => {
  const [contents,       setContents]       = useState([]);
  const [classrooms,     setClassrooms]     = useState([]);
  const [view,           setView]           = useState("list");
  const [editing,        setEditing]        = useState(null);
  const [statsId,        setStatsId]        = useState(null);
  const [previewContent, setPreviewContent] = useState(null);
  const [assignTarget,   setAssignTarget]   = useState(null);
  const [error,          setError]          = useState("");
  const [refreshKey,     setRefreshKey]     = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.get("/api/teacher/contents"), api.get("/api/teacher/classrooms")])
      .then(([cRes, rRes]) => {
        if (!cancelled) {
          setContents(cRes.data.contents || []);
          setClassrooms(rRes.data.classrooms || []);
        }
      })
      .catch(() => { if (!cancelled) setError("Failed to load data."); });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const handleCreate    = async (body) => { await api.post("/api/teacher/contents", body); refresh(); setView("list"); };
  const handleEdit      = async (body) => { await api.put(`/api/teacher/contents/${editing._id}`, body); refresh(); setView("list"); setEditing(null); };
  const handleDelete    = async (id)   => {
    if (!window.confirm("Delete this content? This cannot be undone.")) return;
    try { await api.delete(`/api/teacher/contents/${id}`); refresh(); } catch { setError("Failed to delete."); }
  };
  const handleDuplicate = async (id)   => { try { await api.post(`/api/teacher/contents/${id}/duplicate`); refresh(); } catch { setError("Failed to duplicate."); } };
  const handlePublish   = async (id)   => { try { await api.patch(`/api/teacher/contents/${id}/publish`); refresh(); } catch { setError("Failed to toggle publish."); } };
  const handleAssign    = async (classroomIds, publishAfter) => {
    try {
      await api.patch(`/api/teacher/contents/${assignTarget._id}/assign`, { classroomIds });
      if (publishAfter) await api.patch(`/api/teacher/contents/${assignTarget._id}/publish`);
      refresh(); setAssignTarget(null);
    } catch (err) { setError(err?.response?.data?.error || "Failed to assign."); setAssignTarget(null); }
  };

  if (view === "create") return (
    <div className="screen with-bg role-page"><StarBackground /><Navbar />
      <main className="role-wrap"><ContentForm onSave={handleCreate} onCancel={() => setView("list")} /></main>
    </div>
  );
  if (view === "edit" && editing) return (
    <div className="screen with-bg role-page"><StarBackground /><Navbar />
      <main className="role-wrap"><ContentForm initial={editing} onSave={handleEdit} onCancel={() => { setView("list"); setEditing(null); }} /></main>
    </div>
  );

  return (
    <div className="screen with-bg role-page">
      <StarBackground /><Navbar />
      <main className="role-wrap">
        <section className="role-hero glass-card">
          <h1>My Content</h1>
          <p>Create games and quizzes, then assign them to your classrooms.</p>
        </section>

        {error && <p className="error-msg">{error}</p>}

        <section className="glass-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h2 style={{ margin: 0 }}>All Content <span style={{ color: "#94a3b8", fontWeight: 400, fontSize: "0.9rem" }}>({contents.length})</span></h2>
            <button className="btn-register" onClick={() => setView("create")}>+ Create New</button>
          </div>

          {contents.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📚</div>
              <p style={{ color: "#e2e8f0", fontWeight: 600 }}>No content yet</p>
              <p style={{ color: "#94a3b8", fontSize: 13, marginTop: "0.25rem" }}>Create your first game or quiz to get started.</p>
            </div>
          ) : (
            <div className="role-list">
              {contents.map((c) => (
                <article key={c._id} className="role-item" style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: "0.98rem", color: "#e2e8f0" }}>{c.title}</strong>
                      {c.description && <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>{c.description}</p>}
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexShrink: 0 }}>
                      <TypeTag template={c.template} />
                      <Badge published={c.isPublished} />
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    <span>{c.type === "game" ? `${c.items?.length || 0} items` : `${c.questions?.length || 0} questions`}</span>
                    <span>{c.assignedClassrooms?.length ? `Assigned to ${c.assignedClassrooms.length} classroom${c.assignedClassrooms.length > 1 ? "s" : ""}` : "Not assigned"}</span>
                    <span>{c.playLimit ? `${c.playLimit}× limit` : "Unlimited plays"}</span>
                    {!c.isPublished && c.assignedClassrooms?.length > 0 && <span style={{ color: "#f59e0b" }}>⚠ Draft — students can't see this yet</span>}
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    <button className="btn-secondary-glass" style={{ fontSize: 12, padding: "0.28rem 0.65rem" }} onClick={() => setPreviewContent(c)}>👁 Preview</button>
                    <button className="btn-secondary-glass" style={{ fontSize: 12, padding: "0.28rem 0.65rem" }} onClick={() => { setEditing(c); setView("edit"); }}>Edit</button>
                    <button className="btn-secondary-glass" style={{ fontSize: 12, padding: "0.28rem 0.65rem" }} onClick={() => handleDuplicate(c._id)}>Duplicate</button>
                    <button className={c.isPublished ? "btn-cancel" : "btn-register"} style={{ fontSize: 12, padding: "0.28rem 0.65rem" }} onClick={() => handlePublish(c._id)}>{c.isPublished ? "Unpublish" : "Publish"}</button>
                    <button className="btn-secondary-glass" style={{ fontSize: 12, padding: "0.28rem 0.65rem" }} onClick={() => setAssignTarget(c)}>Assign</button>
                    {c.type === "quiz" && <button className="btn-secondary-glass" style={{ fontSize: 12, padding: "0.28rem 0.65rem" }} onClick={() => setStatsId(c._id)}>Stats</button>}
                    <button onClick={() => handleDelete(c._id)} style={{ fontSize: 12, padding: "0.28rem 0.65rem", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: 8, color: "#f87171", cursor: "pointer" }}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {previewContent && <ContentPlayer content={previewContent} mode="preview" onClose={() => setPreviewContent(null)} />}
      {statsId        && <StatsModal contentId={statsId} onClose={() => setStatsId(null)} />}
      {assignTarget   && <AssignModal content={assignTarget} classrooms={classrooms} onSave={handleAssign} onClose={() => setAssignTarget(null)} />}
    </div>
  );
};

export default TeacherContentsPage;
