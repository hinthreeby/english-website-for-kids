import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import StarBackground from "../components/StarBackground";
import api from "../lib/api";

const ClassroomsPage = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [joinCode, setJoinCode] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get("/api/progress/classrooms");
      setClassrooms(res.data.classrooms || []);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleJoin = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await api.post("/api/progress/join-classroom", { joinCode });
      setMsg({ ok: true, text: `Joined "${res.data.classroomName}"! 🎉` });
      setJoinCode("");
      load();
    } catch (err) {
      setMsg({ ok: false, text: err?.response?.data?.error || "Could not join classroom." });
    }
  };

  return (
    <div className="screen with-bg role-page">
      <StarBackground />
      <Navbar />
      <main className="role-wrap">
        <section className="role-hero glass-card">
          <h1>My Classrooms</h1>
          <p>Enter a join code from your teacher to join a classroom.</p>
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
