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

            <div className="word-add-row">
              <input
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="Word (e.g. apple)"
                className="word-add-input"
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
