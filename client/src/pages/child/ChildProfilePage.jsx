/* eslint-disable react-hooks/set-state-in-effect */
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../lib/api";
import Navbar from "../../components/Navbar";
import StarBackground from "../../components/StarBackground";
import { useAuth } from "../../context/AuthContext";

const ChildProfilePage = () => {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();

  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarMsg, setAvatarMsg] = useState({ text: "", error: false });
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef(null);

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
      setAvatarMsg({ text: t("childProfile.avatarUpdated"), error: false });
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
      setAvatarMsg({ text: t("childProfile.avatarUpdated"), error: false });
      setAvatarUrl("");
    } catch (err) {
      setAvatarMsg({ text: err?.response?.data?.error || "Failed to set avatar", error: true });
    } finally {
      setAvatarLoading(false);
    }
  };

  const name = user?.displayName || user?.username || "Explorer";

  return (
    <div className="screen with-bg role-page">
      <StarBackground />
      <Navbar />
      <main className="role-wrap">
        <section className="role-hero glass-card">
          <h1>{t("childProfile.title")}</h1>
          <p>{t("childProfile.subtitle", { name })}</p>
        </section>

        <section className="glass-card role-grid role-grid-2">
          {/* Stats */}
          <div>
            <h2>{t("childProfile.myStats")}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
              <div className="metric-card" style={{ flexDirection: "row", gap: "1rem", justifyContent: "flex-start" }}>
                <span className="metric-icon">👤</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, color: "#94a3b8" }}>{t("childProfile.username")}</h3>
                  <p style={{ margin: 0, fontWeight: 700 }}>{user?.username}</p>
                </div>
              </div>
              <div className="metric-card" style={{ flexDirection: "row", gap: "1rem", justifyContent: "flex-start" }}>
                <span className="metric-icon">⭐</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, color: "#94a3b8" }}>{t("childProfile.totalStars")}</h3>
                  <p style={{ margin: 0, fontWeight: 700 }}>{user?.totalStars || 0}</p>
                </div>
              </div>
              <div className="metric-card" style={{ flexDirection: "row", gap: "1rem", justifyContent: "flex-start" }}>
                <span className="metric-icon">🔥</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, color: "#94a3b8" }}>{t("childProfile.dayStreak")}</h3>
                  <p style={{ margin: 0, fontWeight: 700 }}>{user?.currentStreak || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Avatar change */}
          <div>
            <h2>{t("childProfile.changeAvatar")}</h2>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", marginTop: "1rem" }}>
              <div className="avatar-preview-lg">
                {user?.avatar
                  ? <img src={user.avatar} alt="avatar" />
                  : <span>{name[0].toUpperCase()}</span>
                }
              </div>
              <button
                className="btn-register"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
                style={{ width: "100%" }}
              >
                📁 {t("childProfile.uploadImage")}
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
              <form onSubmit={handleAvatarUrlSave} style={{ display: "flex", gap: "0.5rem", width: "100%" }}>
                <input
                  className="profile-input"
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder={t("childProfile.pasteUrl")}
                  style={{ flex: 1 }}
                />
                <button className="btn-secondary-glass" type="submit" disabled={avatarLoading || !avatarUrl.trim()}>
                  {avatarLoading ? "…" : t("childProfile.set")}
                </button>
              </form>
              {avatarMsg.text
                ? <p className={avatarMsg.error ? "error-msg" : "success-msg"}>{avatarMsg.text}</p>
                : null
              }
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ChildProfilePage;
