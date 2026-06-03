import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../lib/api";
import Navbar from "../../components/Navbar";
import StarBackground from "../../components/StarBackground";

const ROLES = ["child", "parent", "teacher", "admin"];

const ROLE_META = {
  child:   { label: "Child",   icon: "🧒", color: "#818cf8", bg: "rgba(99,102,241,0.18)",  border: "rgba(99,102,241,0.4)"  },
  parent:  { label: "Parent",  icon: "👨‍👩‍👧", color: "#34d399", bg: "rgba(16,185,129,0.18)", border: "rgba(16,185,129,0.4)" },
  teacher: { label: "Teacher", icon: "👩‍🏫", color: "#fbbf24", bg: "rgba(245,158,11,0.18)", border: "rgba(245,158,11,0.4)" },
  admin:   { label: "Admin",   icon: "🛡️",  color: "#f87171", bg: "rgba(239,68,68,0.18)",  border: "rgba(239,68,68,0.4)"  },
};

// ── Custom role dropdown ─────────────────────────────────────
const RoleDropdown = ({ current, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const meta = ROLE_META[current] || ROLE_META.child;

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      {/* Current role pill */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "inline-flex", alignItems: "center", gap: "0.35rem",
          padding: "0.25rem 0.6rem 0.25rem 0.45rem",
          borderRadius: "6px",
          border: `1.5px solid ${open ? meta.color : meta.border}`,
          background: open ? meta.bg : "rgba(255,255,255,0.04)",
          color: meta.color,
          fontSize: "0.8rem", fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
          transition: "all 0.15s", whiteSpace: "nowrap",
          boxShadow: open ? `0 0 0 3px ${meta.bg}` : "none",
        }}
      >
        <span style={{ fontSize: "0.9rem" }}>{meta.icon}</span>
        <span>{meta.label}</span>
        <span style={{ opacity: 0.55, fontSize: "0.6rem", marginLeft: "0.1rem", transition: "transform 0.15s", display: "inline-block", transform: open ? "rotate(180deg)" : "none" }}>▼</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 5px)", left: 0, zIndex: 100,
          background: "rgba(8, 4, 20, 0.97)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "10px", padding: "0.3rem",
          boxShadow: "0 12px 36px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.05)",
          backdropFilter: "blur(14px)",
          minWidth: "130px",
          animation: "fadeInUp 0.15s ease",
        }}>
          {ROLES.map((r) => {
            const m = ROLE_META[r];
            const active = r === current;
            return (
              <button
                key={r}
                type="button"
                onClick={() => { onChange(r); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  width: "100%", padding: "0.42rem 0.7rem",
                  borderRadius: "6px", border: "none",
                  background: active ? m.bg : "transparent",
                  color: active ? m.color : "rgba(255,255,255,0.7)",
                  fontSize: "0.82rem", fontWeight: active ? 700 : 500,
                  cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                  transition: "background 0.12s, color 0.12s",
                }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#fff"; } }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; } }}
              >
                <span style={{ fontSize: "1rem" }}>{m.icon}</span>
                <span style={{ flex: 1 }}>{m.label}</span>
                {active && <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Main page ────────────────────────────────────────────────
const AdminUsers = () => {
  const { t } = useTranslation();
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

  useEffect(() => { loadUsers(); }, []);

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
          <h1>{t("admin.users.title")}</h1>
          <p>{t("admin.users.subtitle")}</p>
        </section>

        <section className="glass-card">
          {error ? <p className="error-msg">{error}</p> : null}
          <div className="table-wrap">
            <table className="role-table">
              <thead>
                <tr>
                  <th>{t("admin.users.username")}</th>
                  <th>{t("admin.users.role")}</th>
                  <th>{t("admin.users.status")}</th>
                  <th>{t("admin.users.approved")}</th>
                  <th>{t("admin.users.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const rm = ROLE_META[user.role] || ROLE_META.child;
                  return (
                    <tr key={user._id}>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                          <span style={{ fontWeight: 600, color: "#e2e8f0" }}>{user.displayName || user.username}</span>
                          {user.displayName ? <span style={{ fontSize: "0.75rem", color: "#64748b" }}>@{user.username}</span> : null}
                        </div>
                      </td>
                      <td>
                        <RoleDropdown
                          current={user.role}
                          onChange={(newRole) => updateUser(user._id, { role: newRole })}
                        />
                      </td>
                      <td>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "0.3rem",
                          padding: "0.2rem 0.55rem", borderRadius: "5px", fontSize: "0.75rem", fontWeight: 600,
                          background: user.isActive ? "rgba(16,185,129,0.15)" : "rgba(100,116,139,0.15)",
                          border: `1px solid ${user.isActive ? "rgba(16,185,129,0.35)" : "rgba(100,116,139,0.3)"}`,
                          color: user.isActive ? "#34d399" : "#64748b",
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                          {user.isActive ? t("common.active") : t("common.disabled")}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "0.3rem",
                          padding: "0.2rem 0.55rem", borderRadius: "5px", fontSize: "0.75rem", fontWeight: 600,
                          background: user.isApproved ? "rgba(99,102,241,0.15)" : "rgba(245,158,11,0.12)",
                          border: `1px solid ${user.isApproved ? "rgba(99,102,241,0.35)" : "rgba(245,158,11,0.3)"}`,
                          color: user.isApproved ? "#818cf8" : "#fbbf24",
                        }}>
                          {user.isApproved ? `✓ ${t("admin.users.yes")}` : t("admin.users.pending")}
                        </span>
                      </td>
                      <td>
                        <div className="role-actions">
                          <button
                            type="button"
                            className={user.isActive ? "btn-secondary-glass" : "btn-register"}
                            style={{ fontSize: "0.78rem", padding: "0.3rem 0.75rem" }}
                            onClick={() => updateUser(user._id, { isActive: !user.isActive })}
                          >
                            {user.isActive ? t("admin.users.deactivate") : t("admin.users.activate")}
                          </button>
                          {!user.isApproved ? (
                            <button
                              type="button"
                              className="btn-register"
                              style={{ fontSize: "0.78rem", padding: "0.3rem 0.75rem" }}
                              onClick={() => updateUser(user._id, { isApproved: true })}
                            >
                              {t("admin.users.approve")}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminUsers;
