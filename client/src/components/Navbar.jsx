import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import useSound from "../hooks/useSound";
import { getRoleHome } from "../lib/roleHome";
import LanguageSwitcher from "./LanguageSwitcher";

const Navbar = () => {
  const { user, logout, isChild, isParent, isTeacher, isAdmin } = useAuth();
  const { playPop } = useSound();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const userName = user?.displayName || user?.username || "Kid Explorer";

  const handleLogout = async () => {
    playPop();
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="navbar">
      <div className="navbar-row-1">
        <Link className="navbar-logo" to="/" onClick={playPop}>
          <span>⭐</span> Fun English
        </Link>

        <div className="navbar-links" aria-label="Primary navigation">
          <Link className="nav-link roadmap-btn" to="/roadmap" onClick={playPop}>
            🚀 {t("nav.roadmap")}
          </Link>

          {isChild ? (
            <>
              <Link className="nav-link" to="/collection" onClick={playPop}>
                {t("nav.collection")}
              </Link>
              <Link className="nav-link" to="/shop" onClick={playPop}>
                {t("nav.store")}
              </Link>
              <Link className="nav-link" to="/my-home" onClick={playPop}>
                {t("nav.myHome")}
              </Link>
              <Link className="nav-link" to="/my-classrooms" onClick={playPop}>
                {t("nav.myClass")}
              </Link>
            </>
          ) : null}

          {isParent ? (
            <>
              <Link className="nav-link" to="/parent/dashboard" onClick={playPop}>
                {t("nav.dashboard")}
              </Link>
              <Link className="nav-link" to="/parent/children" onClick={playPop}>
                {t("nav.myChildren")}
              </Link>
              <Link className="nav-link" to="/parent/profile" onClick={playPop}>
                {t("nav.profile")}
              </Link>
            </>
          ) : null}

          {isTeacher ? (
            <>
              <Link className="nav-link" to="/teacher/dashboard" onClick={playPop}>
                {t("nav.dashboard")}
              </Link>
              <Link className="nav-link" to="/teacher/contents" onClick={playPop}>
                {t("nav.myContent")}
              </Link>
              <Link className="nav-link" to="/teacher/profile" onClick={playPop}>
                {t("nav.profile")}
              </Link>
            </>
          ) : null}

          {isAdmin ? (
            <>
              <Link className="nav-link" to="/admin/dashboard" onClick={playPop}>
                {t("nav.dashboard")}
              </Link>
              <Link className="nav-link" to="/admin/users" onClick={playPop}>
                {t("nav.users")}
              </Link>
              <Link className="nav-link" to="/admin/approvals" onClick={playPop}>
                {t("nav.approvals")}
              </Link>
              <Link className="nav-link" to="/admin/profile" onClick={playPop}>
                {t("nav.profile")}
              </Link>
            </>
          ) : null}

          {!user ? (
            <>
              <Link className="nav-link join-now" to="/register" onClick={playPop}>
                {t("nav.registerNow")}
              </Link>
              <Link className="nav-link" to="/login" onClick={playPop}>
                {t("nav.logIn")}
              </Link>
            </>
          ) : (
            <button type="button" className="nav-link" onClick={handleLogout}>
              {t("nav.logOut")}
            </button>
          )}
        </div>

        <div className="navbar-auth">
          {user ? (
            <span className={`role-badge role-${user.role}`}>
              {user.role === "child" ? "👶" : null}
              {user.role === "parent" ? "👨‍👩‍👧" : null}
              {user.role === "teacher" ? "👩‍🏫" : null}
              {user.role === "admin" ? "🛡️" : null}
              {userName}
            </span>
          ) : (
            <span className="nav-email-badge">{t("nav.guest")}</span>
          )}
          {user ? (
            <>
              {isChild ? <span className="nav-stars">⭐ {user.totalStars || 0}</span> : null}
              <Link className="btn-stars" to={getRoleHome(user.role)} onClick={playPop}>
                {t("nav.home")}
              </Link>
            </>
          ) : null}
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
