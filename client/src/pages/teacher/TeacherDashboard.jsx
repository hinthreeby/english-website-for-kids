/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/api";
import Navbar from "../../components/Navbar";

const TeacherDashboard = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [wordLists, setWordLists] = useState([]);
  const [newClassroomName, setNewClassroomName] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const [classroomsRes, listsRes] = await Promise.all([
        api.get("/teacher/classrooms"),
        api.get("/teacher/wordlists"),
      ]);
      setClassrooms(classroomsRes.data.classrooms || []);
      setWordLists(listsRes.data.lists || []);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load teacher dashboard");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createClassroom = async (event) => {
    event.preventDefault();
    if (!newClassroomName.trim()) return;

    try {
      await api.post("/teacher/classroom", { name: newClassroomName.trim() });
      setNewClassroomName("");
      loadData();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to create classroom");
    }
  };

  return (
    <div className="screen with-bg role-page">
      <Navbar />
      <main className="role-wrap">
        <section className="role-hero glass-card">
          <h1>Teacher Control Deck</h1>
          <p>Manage classrooms and submit custom word lists for approval.</p>
        </section>

        <section className="glass-card role-grid role-grid-2">
          <div>
            <h2>Classrooms</h2>
            <form className="role-form role-inline-form" onSubmit={createClassroom}>
              <input
                value={newClassroomName}
                onChange={(e) => setNewClassroomName(e.target.value)}
                placeholder="New classroom name"
              />
              <button className="btn-register" type="submit">
                Create Classroom
              </button>
            </form>

            <div className="role-list">
              {classrooms.map((room) => (
                <article key={room._id} className="role-item">
                  <div>
                    <strong>{room.name}</strong>
                    <p>Join code: {room.joinCode} • Students: {room.students?.length || 0}</p>
                  </div>
                  <Link className="btn-secondary-glass" to={`/teacher/classroom/${room._id}`}>
                    View Students
                  </Link>
                </article>
              ))}
              {classrooms.length === 0 ? <p>No classrooms yet.</p> : null}
            </div>
          </div>

          <div>
            <h2>Word Lists</h2>
            <Link to="/teacher/wordlist" className="btn-register">
              Create Word List
            </Link>
            <div className="role-list">
              {wordLists.map((list) => (
                <article key={list._id} className="role-item">
                  <div>
                    <strong>{list.title}</strong>
                    <p>
                      {list.gameType} • {list.words?.length || 0} words
                    </p>
                  </div>
                  <span className={list.isApproved ? "badge-ok" : "badge-pending"}>
                    {list.isApproved ? "Approved" : "Pending"}
                  </span>
                </article>
              ))}
              {wordLists.length === 0 ? <p>No word lists yet.</p> : null}
            </div>
          </div>
        </section>

        {error ? <p className="error-msg">{error}</p> : null}
      </main>
    </div>
  );
};

export default TeacherDashboard;
