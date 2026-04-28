/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import api from "../../lib/api";
import Navbar from "../../components/Navbar";

const WordListEditor = () => {
  const [title, setTitle] = useState("");
  const [gameType, setGameType] = useState("all");
  const [word, setWord] = useState("");
  const [emoji, setEmoji] = useState("");
  const [words, setWords] = useState([]);
  const [lists, setLists] = useState([]);
  const [error, setError] = useState("");

  const loadLists = async () => {
    try {
      const res = await api.get("/teacher/wordlists");
      setLists(res.data.lists || []);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load word lists");
    }
  };

  useEffect(() => {
    loadLists();
  }, []);

  const addWord = () => {
    if (!word.trim()) return;
    setWords((prev) => [...prev, { word: word.trim(), emoji }]);
    setWord("");
    setEmoji("");
  };

  const saveList = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await api.post("/teacher/wordlist", {
        title,
        gameType,
        words,
      });
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

            <div className="role-inline-form">
              <input value={word} onChange={(e) => setWord(e.target.value)} placeholder="Word" />
              <input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="Emoji" />
              <button type="button" className="btn-secondary-glass" onClick={addWord}>
                Add
              </button>
            </div>

            <div className="word-chip-wrap">
              {words.map((item, idx) => (
                <span key={`${item.word}-${idx}`} className="badge-pill">
                  {item.emoji} {item.word}
                </span>
              ))}
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
                    <p>
                      {list.words?.length || 0} words • {list.gameType}
                    </p>
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
