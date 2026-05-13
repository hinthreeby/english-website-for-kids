/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import api from "../../lib/api";
import Navbar from "../../components/Navbar";
import StarBackground from "../../components/StarBackground";

const ROLES = ["child", "parent", "teacher", "admin"];

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  const loadUsers = async () => {
    try {
      const res = await api.get("/api/admin/users?limit=100");
      setUsers(res.data.users || []);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load users");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateUser = async (id, payload) => {
    try {
      await api.patch(`/api/admin/user/${id}`, payload);
      loadUsers();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to update user");
    }
  };

  return (
    <div className="screen with-bg role-page">
      <StarBackground />
      <Navbar />
      <main className="role-wrap">
        <section className="role-hero glass-card">
          <h1>User Management</h1>
          <p>Activate, deactivate, approve, and update user roles.</p>
        </section>

        <section className="glass-card">
          {error ? <p className="error-msg">{error}</p> : null}
          <div className="table-wrap">
            <table className="role-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Approved</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.displayName || user.username}</td>
                    <td>
                      <select
                        value={user.role}
                        onChange={(e) => updateUser(user._id, { role: e.target.value })}
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{user.isActive ? "Active" : "Disabled"}</td>
                    <td>{user.isApproved ? "Yes" : "No"}</td>
                    <td>
                      <div className="role-actions">
                        <button
                          type="button"
                          className="btn-secondary-glass"
                          onClick={() => updateUser(user._id, { isActive: !user.isActive })}
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </button>
                        {!user.isApproved ? (
                          <button
                            type="button"
                            className="btn-register"
                            onClick={() => updateUser(user._id, { isApproved: true })}
                          >
                            Approve
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminUsers;
