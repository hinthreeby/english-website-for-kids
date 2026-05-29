import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "../components/Navbar";
import SpaceBackground from "../components/SpaceBackground";
import api from "../lib/api";

const GRADIENT_TITLE = {
  background: "linear-gradient(90deg,#ffd700,#ff6b9d,#a78bfa)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  filter: "drop-shadow(0 0 16px rgba(255,215,0,0.4))",
};

const ClassroomsPage = () => {
  const { t } = useTranslation();
  const [classrooms, setClassrooms] = useState([]);
  const [joinCode, setJoinCode] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api.get("/api/progress/classrooms")
      .then((res) => { if (!cancelled) setClassrooms(res.data.classrooms || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const handleJoin = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await api.post("/api/progress/join-classroom", { joinCode });
      setMsg({ ok: true, text: `Joined "${res.data.classroomName}"! 🎉` });
      setJoinCode("");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setMsg({ ok: false, text: err?.response?.data?.error || "Could not join classroom." });
    }
  };

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
              <h1 style={GRADIENT_TITLE}>My Classrooms</h1>
              <p style={{ color: "#c4b5fd" }}>Enter a join code from your teacher to join a classroom.</p>
            </div>
            <Link to="/my-content" className="btn-register" style={{ textDecoration: "none", whiteSpace: "nowrap" }}>
              📚 {t("nav.classContent")}
            </Link>
          </div>
        </section>

        <section className="glass-card">
          <h2>Join a Classroom</h2>
          {msg && (
            <p style={{ color: msg.ok ? "#10b981" : "#f43f5e", marginBottom: "0.75rem", fontWeight: 600 }}>
              {msg.text}
            </p>
          )}
          <form className="role-form role-inline-form" onSubmit={handleJoin}>
            <input
              placeholder="Enter code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              style={{ textTransform: "uppercase", letterSpacing: "0.12em", maxWidth: 200 }}
              required
            />
            <button type="submit" className="btn-register">
              Join
            </button>
          </form>
        </section>

        <section className="glass-card">
          <h2>Enrolled Classrooms</h2>
          {loading ? (
            <p>Loading...</p>
          ) : classrooms.length === 0 ? (
            <p style={{ color: "#94a3b8" }}>You have not joined any classrooms yet.</p>
          ) : (
            <div className="role-list">
              {classrooms.map((room) => (
                <article key={room._id} className="role-item">
                  <div>
                    <strong style={{ fontSize: "1.05rem" }}>{room.name}</strong>
                    <p style={{ color: "#94a3b8", fontSize: 13, marginTop: "0.2rem" }}>
                      Code: <span style={{ letterSpacing: "0.08em", color: "#c4b5fd" }}>{room.joinCode}</span>
                    </p>
                  </div>
                  <span className="badge-ok">Enrolled</span>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default ClassroomsPage;
