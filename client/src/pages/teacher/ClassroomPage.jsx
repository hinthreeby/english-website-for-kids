import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../lib/api";
import Navbar from "../../components/Navbar";
const ClassroomPage = () => {
  const { id } = useParams();
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/teacher/classroom/${id}/students`);
        setStudents(res.data.students || []);
      } catch (err) {
        setError(err?.response?.data?.error || "Failed to load students");
      }
    };
    load();
  }, [id]);

  return (
    <div className="screen with-bg role-page">
      <Navbar />
      <main className="role-wrap">
        <section className="role-hero glass-card">
          <h1>Classroom Students</h1>
          <p>Track stars, streaks, and recent activity for each learner.</p>
        </section>

        <section className="glass-card">
          {error ? <p className="error-msg">{error}</p> : null}
          <div className="role-list">
            {students.map((student) => (
              <article className="role-item" key={student._id}>
                <div>
                  <strong>{student.displayName || student.username}</strong>
                  <p>Last played: {student.lastPlayedDate ? new Date(student.lastPlayedDate).toLocaleDateString() : "N/A"}</p>
                </div>
                <div className="role-stats">
                  <span className="nav-stars">⭐ {student.totalStars || 0}</span>
                  <span className="badge-pill">Streak {student.currentStreak || 0}</span>
                </div>
              </article>
            ))}
            {students.length === 0 ? <p>No students in this classroom yet.</p> : null}
          </div>
        </section>
      </main>
    </div>
  );
};

export default ClassroomPage;
