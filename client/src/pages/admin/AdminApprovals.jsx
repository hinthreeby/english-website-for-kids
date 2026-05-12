/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import api from "../../lib/api";
import Navbar from "../../components/Navbar";
import StarBackground from "../../components/StarBackground";

const AdminApprovals = () => {
  const [teachers, setTeachers] = useState([]);
  const [wordLists, setWordLists] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [teachersRes, listsRes] = await Promise.all([
        api.get("/admin/pending-teachers"),
        api.get("/admin/pending-wordlists"),
      ]);
      setTeachers(teachersRes.data.teachers || []);
      setWordLists(listsRes.data.lists || []);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load approvals");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approveTeacher = async (id) => {
    try {
      await api.patch(`/admin/approve-teacher/${id}`);
      load();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to approve teacher");
    }
  };

  const approveWordList = async (id) => {
    try {
      await api.patch(`/admin/approve-wordlist/${id}`);
      load();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to approve word list");
    }
  };

  const rejectTeacher = async (id) => {
    try {
      await api.patch(`/admin/user/${id}`, { isActive: false });
      load();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to reject teacher");
    }
  };

  const rejectWordList = async (id) => {
    try {
      await api.patch(`/admin/reject-wordlist/${id}`);
      load();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to reject word list");
    }
  };

  return (
    <div className="screen with-bg role-page">
      <StarBackground />
      <Navbar />
      <main className="role-wrap">
        <section className="role-hero glass-card">
          <h1>Approval Queue</h1>
          <p>Review teacher accounts and custom educational content.</p>
        </section>

        <section className="glass-card role-grid role-grid-2">
          <div>
            <h2>Pending Teachers</h2>
            <div className="role-list">
              {teachers.map((teacher) => (
                <article key={teacher._id} className="role-item">
                  <div>
                    <strong>{teacher.displayName || teacher.username}</strong>
                    <p>@{teacher.username}</p>
                  </div>
                  <div className="role-actions">
                    <button className="btn-register" type="button" onClick={() => approveTeacher(teacher._id)}>
                      Approve
                    </button>
                    <button className="btn-secondary-glass" type="button" onClick={() => rejectTeacher(teacher._id)}>
                      Reject
                    </button>
                  </div>
                </article>
              ))}
              {teachers.length === 0 ? <p>No pending teachers.</p> : null}
            </div>
          </div>

          <div>
            <h2>Pending Word Lists</h2>
            <div className="role-list">
              {wordLists.map((list) => (
                <article key={list._id} className="role-item">
                  <div>
                    <strong>{list.title}</strong>
                    <p>
                      Teacher: {list.teacherId?.displayName || list.teacherId?.username || "Unknown"} •{" "}
                      {list.words?.length || 0} words
                    </p>
                  </div>
                  <div className="role-actions">
                    <button className="btn-register" type="button" onClick={() => approveWordList(list._id)}>
                      Approve
                    </button>
                    <button className="btn-secondary-glass" type="button" onClick={() => rejectWordList(list._id)}>
                      Reject
                    </button>
                  </div>
                </article>
              ))}
              {wordLists.length === 0 ? <p>No pending word lists.</p> : null}
            </div>
          </div>
        </section>

        {error ? <p className="error-msg">{error}</p> : null}
      </main>
    </div>
  );
};

export default AdminApprovals;
