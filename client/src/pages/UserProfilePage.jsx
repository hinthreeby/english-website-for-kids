import { useState } from "react";
import api from "../lib/api";
import Navbar from "../components/Navbar";
import StarBackground from "../components/StarBackground";
import ParentMascot from "../components/ParentMascot";
import { useAuth } from "../context/AuthContext";
import useMouseParticles from "../hooks/useMouseParticles";
import profileAudio from "../assets/general/sound/parent_profile.mp3";

const PROFILE_LINES = [
  "Update your profile here! ✨",
  "Keep your info up to date!",
  "You're a wonderful parent! 🌟",
];

const UserProfilePage = ({ apiBase, roleLabel }) => {
  useMouseParticles();
  const { user, setUser } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileMsg, setProfileMsg] = useState({ text: "", error: false });
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMsg, setPwMsg] = useState({ text: "", error: false });
  const [pwLoading, setPwLoading] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMsg({ text: "", error: false });
    setProfileLoading(true);
    try {
      const res = await api.patch(`${apiBase}/profile`, { displayName, email });
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
      await api.patch(`${apiBase}/change-password`, { currentPassword, newPassword });
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

  return (
    <div className="screen with-bg role-page">
      <StarBackground />
      <Navbar />
      <main className="role-wrap">
        <section className="role-hero glass-card">
          <h1>{roleLabel} Profile</h1>
          <p>Update your display name, email, and password.</p>
        </section>

        <section className="glass-card role-grid role-grid-2">
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
                  placeholder="Your name"
                />
              </label>
              <label className="profile-label">
                Email
                <input
                  className="profile-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </label>
              {profileMsg.text ? (
                <p className={profileMsg.error ? "error-msg" : "success-msg"}>{profileMsg.text}</p>
              ) : null}
              <button className="btn-register" type="submit" disabled={profileLoading}>
                {profileLoading ? "Saving…" : "Save Changes"}
              </button>
            </form>
          </div>

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
                  minLength={6}
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
              {pwMsg.text ? (
                <p className={pwMsg.error ? "error-msg" : "success-msg"}>{pwMsg.text}</p>
              ) : null}
              <button className="btn-register" type="submit" disabled={pwLoading}>
                {pwLoading ? "Updating…" : "Change Password"}
              </button>
            </form>
          </div>
        </section>
      </main>
      {roleLabel === "Parent" ? <ParentMascot audioSrc={profileAudio} lines={PROFILE_LINES} /> : null}
    </div>
  );
};

export default UserProfilePage;
