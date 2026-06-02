import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import useSound from "../hooks/useSound";
import { getRoleHome } from "../lib/roleHome";

const LANGS = [
  { code: "en", flag: "🇬🇧", label: "EN" },
  { code: "vi", flag: "🇻🇳", label: "VI" },
];

const ROLE_META = {
  child:   { emoji: "👶", label: "Explorer" },
  parent:  { emoji: "👨‍👩‍👧", label: "Parent" },
  teacher: { emoji: "🎓", label: "Teacher" },
  admin:   { emoji: "🛡️",  label: "Admin" },
};

const Navbar = () => {
  const { user, logout, isChild, isParent, isTeacher, isAdmin } = useAuth();
  const { playPop } = useSound();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const currentLang = i18n.language?.startsWith("vi") ? "vi" : "en";
  const userName    = user?.displayName || user?.username || "Kid Explorer";
  const initial     = (user?.displayName || user?.username || "?")[0].toUpperCase();

  const handleLogout = async () => {
    playPop();
    await logout();
    navigate("/login", { replace: true });
  };

  const isActive = (path) => pathname.startsWith(path);

  /* NavLink — pill style, active = gradient, inactive = ghost */
  const NavLink = ({ to, children }) => (
    <Link
      to={to}
      onClick={playPop}
      className={
        isActive(to)
          ? "nav-pill nav-pill-active"
          : "nav-pill nav-pill-inactive"
      }
    >
      {children}
    </Link>
  );

  /* Profile page link for the logged-in role */
  const profileHref = isChild ? "/child/profile"
    : isParent  ? "/parent/profile"
    : isTeacher ? "/teacher/profile"
    : "/admin/profile";

  return (
    <nav className="fixed top-0 inset-x-0 z-[100] px-3 pt-2.5">
      <div className="max-w-[1320px] mx-auto navbar-glass flex items-center justify-between h-[62px] px-4 gap-3 relative">

        {/* ── LEFT: brand ──────────────────────────────────── */}
        <Link
          to="/"
          onClick={playPop}
          className="flex-shrink-0 flex items-center gap-1.5 no-underline"
        >
          <span className="text-xl leading-none" style={{ filter: "drop-shadow(0 0 7px rgba(255,215,0,0.9))" }}>⭐</span>
          <span
            className="font-bold text-[18px] tracking-tight"
            style={{
              fontFamily: "'Fredoka One','Baloo 2',sans-serif",
              background: "linear-gradient(135deg,#e9d5ff,#f9a8d4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Fun English
          </span>
        </Link>

        {/* ── CENTER: nav links (absolute center) ──────────── */}
        <div className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">

          {/* Roadmap — child only */}
          {isChild ? <NavLink to="/roadmap">🚀 {t("nav.roadmap")}</NavLink> : null}

          {/* Child links */}
          {isChild ? <>
            <NavLink to="/dashboard">{t("nav.dashboard")}</NavLink>
            <NavLink to="/collection">{t("nav.collection")}</NavLink>
            <NavLink to="/shop">{t("nav.store")}</NavLink>
            <NavLink to="/my-classrooms">{t("nav.myClass")}</NavLink>
          </> : null}

          {/* Parent links */}
          {isParent ? <>
            <NavLink to="/parent/dashboard">{t("nav.dashboard")}</NavLink>
            <NavLink to="/parent/children">{t("nav.myChildren")}</NavLink>
            <NavLink to="/parent/profile">{t("nav.profile")}</NavLink>
          </> : null}

          {/* Teacher links */}
          {isTeacher ? <>
            <NavLink to="/teacher/dashboard">{t("nav.dashboard")}</NavLink>
            <NavLink to="/teacher/contents">{t("nav.myContent")}</NavLink>
            <NavLink to="/teacher/profile">{t("nav.profile")}</NavLink>
          </> : null}

          {/* Admin links */}
          {isAdmin ? <>
            <NavLink to="/admin/dashboard">{t("nav.dashboard")}</NavLink>
            <NavLink to="/admin/users">{t("nav.users")}</NavLink>
            <NavLink to="/admin/approvals">{t("nav.approvals")}</NavLink>
            <NavLink to="/admin/profile">{t("nav.profile")}</NavLink>
          </> : null}

          {/* Guest links */}
          {!user ? <>
            <NavLink to="/register">{t("nav.registerNow")}</NavLink>
            <NavLink to="/login">{t("nav.logIn")}</NavLink>
          </> : null}

          {/* Home — child only */}
          {isChild ? (
            <Link
              to={getRoleHome(user.role)}
              onClick={playPop}
              className="nav-pill nav-home-pill"
            >
              🏠 {t("nav.home")}
            </Link>
          ) : null}
        </div>

        {/* ── RIGHT: user card + lang + logout ─────────────── */}
        <div className="flex items-center gap-2 flex-shrink-0">

          {/* User card */}
          {user ? (
            <Link
              to={profileHref}
              onClick={playPop}
              className="flex items-center gap-2 no-underline group"
            >
              {/* Avatar circle */}
              <div className="nav-user-avatar">
                {user.avatar
                  ? <img src={user.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span>{initial}</span>
                }
              </div>

              {/* Name + role badge */}
              <div className="hidden sm:flex flex-col leading-none" style={{ gap: "3px" }}>
                <span
                  className="text-white font-semibold text-sm"
                  style={{ fontFamily: "'Baloo 2',sans-serif" }}
                >
                  {userName}
                </span>
                <span className="nav-role-badge">
                  {ROLE_META[user.role]?.emoji} {ROLE_META[user.role]?.label}
                </span>
              </div>
            </Link>
          ) : (
            <span
              className="text-sm px-3 py-1.5 rounded-full"
              style={{
                color: "rgba(196,181,253,0.7)",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              {t("nav.guest")}
            </span>
          )}

          {/* Language switcher — compact pill group */}
          <div className="nav-lang-group">
            {LANGS.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => { i18n.changeLanguage(lang.code); playPop(); }}
                className={currentLang === lang.code ? "nav-lang-btn nav-lang-btn--active" : "nav-lang-btn"}
                title={lang.code === "en" ? "English" : "Tiếng Việt"}
              >
                {lang.flag} {lang.label}
              </button>
            ))}
          </div>

          {/* Logout */}
          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="nav-logout-btn"
              title={t("nav.logOut")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span className="hidden sm:inline">{t("nav.logOut")}</span>
            </button>
          ) : null}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
