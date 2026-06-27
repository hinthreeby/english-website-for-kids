/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react";
import api from "../../lib/api";
import Navbar from "../../components/Navbar";
import StarBackground from "../../components/StarBackground";

const WordListEditor = () => {
  const [title, setTitle] = useState("");
  const [gameType, setGameType] = useState("all");
  const [word, setWord] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [words, setWords] = useState([]);
  const [lists, setLists] = useState([]);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // AI generation state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState(8);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiGenerated, setAiGenerated] = useState([]);
  const [aiSelected, setAiSelected] = useState(new Set());

  const loadLists = async () => {
    try {
      const res = await api.get("/api/teacher/wordlists");
      setLists(res.data.lists || []);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load word lists");
    }
  };

  useEffect(() => {
    loadLists();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const addWord = () => {
    if (!word.trim()) return;
    setWords((prev) => [...prev, { word: word.trim(), imageUrl: imagePreview }]);
    setWord("");
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeWord = (idx) => setWords((prev) => prev.filter((_, i) => i !== idx));

  const saveList = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await api.post("/api/teacher/wordlist", { title, gameType, words });
      setTitle("");
      setGameType("all");
      setWords([]);
      loadLists();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to create word list");
    }
  };

  // ── AI generation ────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    setAiError("");
    setAiGenerated([]);
    setAiSelected(new Set());
    try {
      const res = await api.post("/api/ai/generate-wordlist", { topic: aiTopic.trim(), count: aiCount });
      const generated = res.data.words || [];
      setAiGenerated(generated);
      setAiSelected(new Set(generated.map((_, i) => i)));
    } catch (err) {
      setAiError(err?.response?.data?.error || "Generation failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const toggleAiSelect = (idx) => {
    setAiSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const addGeneratedToList = () => {
    const toAdd = aiGenerated
      .filter((_, i) => aiSelected.has(i))
      .map((item) => ({ word: item.word, imageUrl: item.imageUrl, emoji: item.emoji }));
    setWords((prev) => {
      const existing = new Set(prev.map((w) => w.word.toLowerCase()));
      return [...prev, ...toAdd.filter((w) => !existing.has(w.word.toLowerCase()))];
    });
    setAiGenerated([]);
    setAiSelected(new Set());
    setAiTopic("");
    setAiOpen(false);
  };

  const speakWord = (w) => {
    if (!window.speechSynthesis) return;
    const utt = new SpeechSynthesisUtterance(w);
    utt.lang = "en-US";
    utt.rate = 0.85;
    window.speechSynthesis.speak(utt);
  };

  return (
    <div className="screen with-bg role-page">
      <StarBackground />
      <Navbar />
      <main className="role-wrap">
        <section className="role-hero glass-card">
          <h1>Word List Editor</h1>
          <p>Create teacher content and send it for admin approval.</p>
        </section>

        <section className="glass-card role-grid role-grid-2">
          <form className="role-form" onSubmit={saveList}>
            <h2>Create New</h2>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="List title" required />
            <select value={gameType} onChange={(e) => setGameType(e.target.value)}>
              <option value="all">All Games</option>
              <option value="picture-words">Picture Words</option>
              <option value="abc-letters">ABC Letters</option>
              <option value="space-pronounce">Space Pronounce</option>
              <option value="funny-animals">Funny Animals</option>
            </select>

            {/* ── AI Generate Panel ── */}
            <div className="ai-gen-panel">
              <button
                type="button"
                className="ai-gen-toggle"
                onClick={() => { setAiOpen((v) => !v); setAiGenerated([]); setAiError(""); }}
              >
                ✨ Generate with AI {aiOpen ? "▲" : "▼"}
              </button>

              {aiOpen && (
                <div className="ai-gen-body">
                  <div className="ai-gen-row">
                    <input
                      className="ai-gen-topic"
                      placeholder="Topic (e.g. Animals, Colors, Food...)"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleGenerate())}
                    />
                    <select
                      className="ai-gen-count"
                      value={aiCount}
                      onChange={(e) => setAiCount(Number(e.target.value))}
                    >
                      {[4, 6, 8, 10, 12].map((n) => (
                        <option key={n} value={n}>{n} words</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn-secondary-glass"
                      onClick={handleGenerate}
                      disabled={aiLoading || !aiTopic.trim()}
                    >
                      {aiLoading ? "Generating…" : "Generate"}
                    </button>
                  </div>

                  {aiError && <p className="ai-gen-error">{aiError}</p>}

                  {aiGenerated.length > 0 && (
                    <>
                      <p className="ai-gen-hint">
                        Click to deselect. Press 🔊 to preview pronunciation.
                      </p>
                      <div className="ai-gen-grid">
                        {aiGenerated.map((item, idx) => (
                          <div
                            key={idx}
                            className={`ai-gen-card${aiSelected.has(idx) ? " selected" : ""}`}
                            onClick={() => toggleAiSelect(idx)}
                          >
                            {item.imageUrl
                              ? <img src={item.imageUrl} alt={item.word} className="ai-gen-img" />
                              : <span className="ai-gen-emoji">{item.emoji || "🖼️"}</span>}
                            <span className="ai-gen-word">{item.word}</span>
                            <button
                              type="button"
                              className="ai-gen-speak"
                              onClick={(e) => { e.stopPropagation(); speakWord(item.word); }}
                              title="Preview pronunciation"
                            >
                              🔊
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="btn-register"
                        onClick={addGeneratedToList}
                        disabled={aiSelected.size === 0}
                      >
                        Add {aiSelected.size} word{aiSelected.size !== 1 ? "s" : ""} to list
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ── Manual word add ── */}
            <div className="word-add-row">
              <input
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="Word (e.g. apple)"
                className="word-add-input"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addWord())}
              />
              <label className="word-img-label" title="Upload image (optional)">
                {imagePreview
                  ? <img src={imagePreview} alt="preview" className="word-img-preview" />
                  : <span>📷 Image</span>}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="word-img-input"
                />
              </label>
              <button type="button" className="btn-secondary-glass" onClick={addWord}>
                Add
              </button>
            </div>

            <div className="word-chip-wrap">
              {words.map((item, idx) => (
                <span key={`${item.word}-${idx}`} className="badge-pill">
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt="" className="word-chip-img" />
                    : item.emoji
                      ? <span>{item.emoji}</span>
                      : null}
                  {item.word}
                  <button
                    type="button"
                    className="word-chip-remove"
                    onClick={() => removeWord(idx)}
                    aria-label="Remove"
                  >
                    ×
                  </button>
                </span>
              ))}
              {words.length === 0 ? <p className="word-chip-empty">No words added yet.</p> : null}
            </div>

            <button type="submit" className="btn-register" disabled={!words.length}>
              Save Word List
            </button>
          </form>

          <div>
            <h2>My Lists</h2>
            <div className="role-list">
              {lists.map((list) => (
                <article key={list._id} className="role-item">
                  <div>
                    <strong>{list.title}</strong>
                    <p>{list.words?.length || 0} words • {list.gameType}</p>
                  </div>
                  <span className={list.isApproved ? "badge-ok" : "badge-pending"}>
                    {list.isApproved ? "Approved" : "Pending"}
                  </span>
                </article>
              ))}
              {lists.length === 0 ? <p>No lists created yet.</p> : null}
            </div>
          </div>
        </section>

        {error ? <p className="error-msg">{error}</p> : null}
      </main>
    </div>
  );
};

export default WordListEditor;
