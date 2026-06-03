import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../../lib/api";
import Navbar from "../../components/Navbar";
import SpaceBackground from "../../components/SpaceBackground";
import ContentPlayer from "../../components/ContentPlayer";

const GRADIENT_TITLE = {
  background: "linear-gradient(90deg,#ffd700,#ff6b9d,#a78bfa)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  filter: "drop-shadow(0 0 16px rgba(255,215,0,0.4))",
};

// ── Content Modal — fetches full data, then renders ContentPlayer ─────────────
function ContentModal({ contentId, onClose, onPlayed }) {
  const [data,  setData]  = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/api/student/contents/${contentId}`)
      .then((r) => setData(r.data))
      .catch(() => setError("Failed to load content."));
  }, [contentId]);

  const handleClose = () => {
    if (data?.content?.type === "game") onPlayed?.();
    onClose();
  };

  const handleGameComplete = async () => {
    try {
      await api.post(`/api/student/contents/${contentId}/complete`);
      onPlayed?.();
    } catch { /* limit may already be reached */ }
  };

  if (!data) {
    return (
      <div className="modal-overlay">
        <div className="modal-card" style={{ maxWidth: 320, textAlign: "center" }}>
          {error
            ? <p style={{ color: "#f43f5e" }}>{error}</p>
            : <p style={{ color: "#94a3b8" }}>Loading…</p>
          }
          <button className="btn-cancel" onClick={onClose} style={{ marginTop: "1rem" }}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <ContentPlayer
      content={data.content}
      mode="student"
      alreadySubmitted={data.submission || null}
      onClose={handleClose}
      onGameComplete={handleGameComplete}
    />
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const StudentContentsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [contents, setContents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);

  const loadContents = () => {
    api.get("/api/student/contents")
      .then((r) => setContents(r.data.contents || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadContents(); }, []);

  const games   = contents.filter((c) => c.type === "game");
  const quizzes = contents.filter((c) => c.type === "quiz");

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{ background: "radial-gradient(circle at top, #2b0a5a 0%, #12002e 40%, #07001a 100%)" }}
    >
      <SpaceBackground />
      <Navbar />

      <main className="role-wrap" style={{ position: "relative", zIndex: 2, paddingTop: "80px" }}>
        <section className="role-hero glass-card" style={{ textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h1 style={GRADIENT_TITLE}>{t("studentContent.title")}</h1>
              <p style={{ color: "#c4b5fd" }}>{t("studentContent.subtitle")}</p>
            </div>
            <button
              type="button"
              className="btn-secondary-glass"
              style={{ whiteSpace: "nowrap" }}
              onClick={() => navigate("/my-classrooms")}
            >
              {t("studentContent.backToClassrooms")}
            </button>
          </div>
        </section>

        {loading ? (
          <section className="glass-card"><p>{t("studentContent.loading")}</p></section>
        ) : contents.length === 0 ? (
          <section className="glass-card">
            <p style={{ color: "#94a3b8" }}>{t("studentContent.noContent")}</p>
          </section>
        ) : (
          <>
            {quizzes.length > 0 && (
              <section className="glass-card">
                <h2 style={{ marginBottom: "1rem" }}>📝 {t("studentContent.quizzes")}</h2>
                <div className="role-list">
                  {quizzes.map((c) => {
                    const played = c.playCount || 0;
                    const limit = c.playLimit ?? 1;
                    const limitReached = played >= limit;
                    return (
                      <article key={c._id} className="role-item">
                        <div>
                          <strong>{c.title}</strong>
                          <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 2 }}>
                            {c.questions?.length || 0} {t("studentContent.questions")}
                            {c.description ? ` · ${c.description}` : ""}
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          {c.submission && (
                            <span style={{ fontSize: 13, color: c.submission.score >= 70 ? "#10b981" : "#f59e0b", fontWeight: 700 }}>
                              {c.submission.score}%
                            </span>
                          )}
                          {limit > 1 && (
                            <span style={{ fontSize: 12, color: limitReached ? "#f43f5e" : "#a78bfa", fontWeight: 600 }}>
                              {played}/{limit}
                            </span>
                          )}
                          <button
                            className={limitReached && !c.submission ? "btn-cancel" : c.submission ? "btn-secondary-glass" : "btn-register"}
                            style={{ fontSize: 13, padding: "0.3rem 0.75rem" }}
                            disabled={limitReached && !c.submission}
                            onClick={() => setSelected(c)}
                          >
                            {c.submission ? t("studentContent.review") : limitReached ? t("studentContent.limitReached") : t("studentContent.start")}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {games.length > 0 && (
              <section className="glass-card">
                <h2 style={{ marginBottom: "1rem" }}>🎮 {t("studentContent.games")}</h2>
                <div className="role-list">
                  {games.map((c) => {
                    const played = c.playCount || 0;
                    const limit = c.playLimit ?? null;
                    const limitReached = limit !== null && played >= limit;
                    return (
                      <article key={c._id} className="role-item">
                        <div>
                          <strong>{c.title}</strong>
                          <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 2 }}>
                            {c.template === "match-word-picture" ? `🔤 ${t("studentContent.matchWord")}` : `🃏 ${t("studentContent.memoryCard")}`}
                            {" · "}{c.items?.length || 0} {t("studentContent.items")}
                            {c.description ? ` · ${c.description}` : ""}
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          {limit !== null && (
                            <span style={{ fontSize: 12, color: limitReached ? "#f43f5e" : "#a78bfa", fontWeight: 600 }}>
                              {played}/{limit} plays
                            </span>
                          )}
                          <button
                            className={limitReached ? "btn-cancel" : "btn-register"}
                            style={{ fontSize: 13, padding: "0.3rem 0.75rem" }}
                            disabled={limitReached}
                            onClick={() => !limitReached && setSelected(c)}
                          >
                            {limitReached ? t("studentContent.limitReached") : played > 0 ? t("studentContent.playAgain") : t("studentContent.play")}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {selected && (
        <ContentModal
          contentId={selected._id}
          onClose={() => setSelected(null)}
          onPlayed={loadContents}
        />
      )}
    </div>
  );
};

export default StudentContentsPage;
