/* eslint-disable react-hooks/set-state-in-effect */
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../lib/api";
import Navbar from "../components/Navbar";
import StarBackground from "../components/StarBackground";
import ParentMascot from "../components/ParentMascot";
import { useAuth } from "../context/AuthContext";
import useMouseParticles from "../hooks/useMouseParticles";
const profileAudio = "/sounds/parent_profile.mp3";

const PROFILE_LINES = [
  "You can change your personal information here! ✨"
];

const UserProfilePage = ({ apiBase, roleLabel }) => {
  useMouseParticles();
  const { t } = useTranslation();
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

  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarMsg, setAvatarMsg] = useState({ text: "", error: false });
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMsg({ text: "", error: false });
    setProfileLoading(true);
    try {
      const res = await api.patch(`/api${apiBase}/profile`, { displayName, email });
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
      await api.patch(`/api${apiBase}/change-password`, { currentPassword, newPassword });
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
      const form = new FormData();
      form.append("file", file);
      const res = await api.post("/api/upload/avatar", form, {
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
          <h1>{roleLabel} {t("userProfile.title")}</h1>
          <p>{t("userProfile.subtitle")}</p>
        </section>

        {/* Avatar section */}
        <section className="glass-card" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ marginBottom: "1rem" }}>{t("userProfile.avatar")}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
            <div className="avatar-preview-lg">
              {user?.avatar
                ? <img src={user.avatar} alt="avatar" />
                : <span>{(user?.displayName || user?.username || "?")[0].toUpperCase()}</span>
              }
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: "0.75rem" }}>
                {t("userProfile.avatarHint")}
              </p>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <button
                  className="btn-secondary-glass"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarLoading}
                >
                  {t("userProfile.uploadImage")}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    if (e.target.files?.[0]) uploadAvatarFile(e.target.files[0]);
                    e.target.value = "";
                  }}
                />
              </div>
              <form onSubmit={handleAvatarUrlSave} style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  className="profile-input"
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  style={{ flex: 1 }}
                />
                <button className="btn-register" type="submit" disabled={avatarLoading || !avatarUrl.trim()}>
                  {avatarLoading ? t("common.loading") : t("userProfile.setUrl")}
                </button>
              </form>
              {avatarMsg.text
                ? <p className={avatarMsg.error ? "error-msg" : "success-msg"} style={{ marginTop: "0.5rem" }}>{avatarMsg.text}</p>
                : null
              }
            </div>
          </div>
        </section>

        <section className="glass-card role-grid role-grid-2">
          <div>
            <h2>{t("userProfile.accountInfo")}</h2>
            <form className="profile-form" onSubmit={handleProfileSave}>
              <label className="profile-label">
                {t("userProfile.displayName")}
                <input
                  className="profile-input"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                />
              </label>
              <label className="profile-label">
                {t("userProfile.email")}
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
                {profileLoading ? t("common.loading") : t("userProfile.saveChanges")}
              </button>
            </form>
          </div>

          <div>
            <h2>{t("userProfile.changePassword")}</h2>
            <form className="profile-form" onSubmit={handlePasswordChange}>
              <label className="profile-label">
                {t("userProfile.currentPassword")}
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
                {t("userProfile.newPassword")}
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
                {t("userProfile.confirmPassword")}
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
                {pwLoading ? t("common.loading") : t("userProfile.changePassword")}
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
