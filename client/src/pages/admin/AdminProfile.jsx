import { useRef, useState } from "react";
import api from "../../lib/api";
import Navbar from "../../components/Navbar";
import StarBackground from "../../components/StarBackground";
import { useAuth } from "../../context/AuthContext";

const AdminProfile = () => {
  const { user, setUser } = useAuth();
  const initial = (user?.displayName || user?.username || "A")[0].toUpperCase();

  const [email, setEmail] = useState(user?.email || "");
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [profileMsg, setProfileMsg] = useState({ text: "", error: false });
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMsg, setPwMsg] = useState({ text: "", error: false });
  const [pwLoading, setPwLoading] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarMsg, setAvatarMsg] = useState({ text: "", error: false });
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMsg({ text: "", error: false });
    setProfileLoading(true);
    try {
      const res = await api.patch("/api/admin/profile", { email, displayName });
      if (setUser) setUser(res.data.user);
      setProfileMsg({ text: "Profile updated successfully.", error: false });
    } catch (err) {
      setProfileMsg({ text: err?.response?.data?.error || "Failed to update profile", error: true });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg({ text: "", error: false });
    if (newPassword !== confirmPassword) {
      setPwMsg({ text: "New passwords do not match", error: true });
      return;
    }
    setPwLoading(true);
    try {
      await api.patch("/api/admin/change-password", { currentPassword, newPassword });
      setPwMsg({ text: "Password changed successfully.", error: false });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwMsg({ text: err?.response?.data?.error || "Failed to change password", error: true });
    } finally {
      setPwLoading(false);
    }
  };

  const uploadAvatarFile = async (file) => {
    setAvatarMsg({ text: "", error: false });
    setAvatarLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/api/upload/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (setUser) setUser(res.data.user);
      setAvatarMsg({ text: "Avatar updated!", error: false });
    } catch (err) {
      setAvatarMsg({ text: err?.response?.data?.error || "Upload failed", error: true });
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleAvatarUrlSave = async (e) => {
    e.preventDefault();
    if (!avatarUrl.trim()) return;
    setAvatarMsg({ text: "", error: false });
    setAvatarLoading(true);
    try {
      const res = await api.post("/api/upload/avatar", { avatarUrl: avatarUrl.trim() });
      if (setUser) setUser(res.data.user);
      setAvatarMsg({ text: "Avatar updated!", error: false });
      setAvatarUrl("");
    } catch (err) {
      setAvatarMsg({ text: err?.response?.data?.error || "Failed to set avatar", error: true });
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <div className="screen with-bg role-page">
      <StarBackground />
      <Navbar />
      <main className="role-wrap">
        <section className="role-hero glass-card">
          <h1>Admin Profile</h1>
          <p>Manage your account credentials and display name.</p>
        </section>

        {/* Avatar section */}
        <section className="glass-card" style={{ textAlign: "center" }}>
          <h2 style={{ marginBottom: "1.25rem" }}>🖼️ Profile Photo</h2>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>

            {/* Avatar circle — click to upload */}
            <div
              onClick={() => fileInputRef.current?.click()}
              title="Click to upload photo"
              style={{
                width: "110px", height: "110px", borderRadius: "50%",
                border: "3px solid rgba(124,58,237,0.7)",
                boxShadow: "0 0 24px rgba(124,58,237,0.35), 0 0 6px rgba(124,58,237,0.15)",
                overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "linear-gradient(135deg,rgba(124,58,237,0.25),rgba(6,182,212,0.2))",
                fontSize: "2.5rem", color: "#c4b5fd", fontWeight: 700,
                cursor: "pointer", transition: "box-shadow 0.2s",
                flexShrink: 0,
              }}
            >
              {user?.avatar
                ? <img src={user.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span>{initial}</span>
              }
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: "none" }}
              onChange={(e) => { if (e.target.files[0]) uploadAvatarFile(e.target.files[0]); }}
            />

            <button
              type="button"
              className="btn-secondary-glass"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
              style={{ fontSize: "0.88rem" }}
            >
              {avatarLoading ? "Uploading…" : "📷 Upload Photo"}
            </button>

            <form
              onSubmit={handleAvatarUrlSave}
              style={{ display: "flex", gap: "0.5rem", width: "100%", maxWidth: "420px" }}
            >
              <input
                className="profile-input"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="Or paste an image URL…"
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                className="btn-register"
                disabled={avatarLoading || !avatarUrl.trim()}
                style={{ flexShrink: 0 }}
              >
                Set URL
              </button>
            </form>

            {avatarMsg.text
              ? <p className={avatarMsg.error ? "error-msg" : "success-msg"} style={{ margin: 0 }}>{avatarMsg.text}</p>
              : null}
          </div>
        </section>

        <section className="glass-card role-grid role-grid-2">
          {/* Account info */}
          <div>
            <h2>Account Info</h2>
            <form className="profile-form" onSubmit={handleProfileSave}>
              <label className="profile-label">
                Display Name
                <input
                  className="profile-input"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Administrator"
                />
              </label>
              <label className="profile-label">
                Email
                <input
                  className="profile-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                />
              </label>
              {profileMsg.text
                ? <p className={profileMsg.error ? "error-msg" : "success-msg"}>{profileMsg.text}</p>
                : null}
              <button className="btn-register" type="submit" disabled={profileLoading}>
                {profileLoading ? "Saving…" : "Save Changes"}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div>
            <h2>Change Password</h2>
            <form className="profile-form" onSubmit={handlePasswordChange}>
              <label className="profile-label">
                Current Password
                <input
                  className="profile-input"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </label>
              <label className="profile-label">
                New Password
                <input
                  className="profile-input"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </label>
              <label className="profile-label">
                Confirm New Password
                <input
                  className="profile-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </label>
              {pwMsg.text
                ? <p className={pwMsg.error ? "error-msg" : "success-msg"}>{pwMsg.text}</p>
                : null}
              <button className="btn-register" type="submit" disabled={pwLoading}>
                {pwLoading ? "Updating…" : "Change Password"}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminProfile;
