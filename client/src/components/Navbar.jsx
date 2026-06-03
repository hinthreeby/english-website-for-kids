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
      {/* navbar-inner handles flex (mobile) → grid 1fr auto 1fr (desktop) */}
      <div className="max-w-[1320px] mx-auto navbar-glass navbar-inner h-[62px]">

        {/* ── COL 1: brand (left-aligned) ──────────────────── */}
        <Link
          to="/"
          onClick={playPop}
          className="flex items-center gap-1.5 no-underline flex-shrink-0 min-w-0"
        >
          <span className="text-2xl leading-none flex-shrink-0" style={{ filter: "drop-shadow(0 0 9px rgba(255,215,0,0.95))" }}>⭐</span>
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 800,
              fontSize: "clamp(17px, 2vw, 22px)",
              letterSpacing: "-0.01em",
              lineHeight: 1,
              whiteSpace: "nowrap",
              background: "linear-gradient(135deg,#e9d5ff,#f9a8d4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Fun English
          </span>
        </Link>

        {/* ── COL 2: nav links (auto-width, centered by grid) ──
             hidden below lg; on desktop grid takes center column */}
        <div className="hidden lg:flex items-center gap-1">

          {isChild ? <NavLink to="/roadmap">🚀 {t("nav.roadmap")}</NavLink> : null}

          {isChild ? <>
            <NavLink to="/dashboard">{t("nav.dashboard")}</NavLink>
            <NavLink to="/collection">{t("nav.collection")}</NavLink>
            <NavLink to="/shop">{t("nav.store")}</NavLink>
            <NavLink to="/my-classrooms">{t("nav.myClass")}</NavLink>
          </> : null}

          {isParent ? <>
            <NavLink to="/parent/dashboard">{t("nav.dashboard")}</NavLink>
            <NavLink to="/parent/profile">{t("nav.profile")}</NavLink>
          </> : null}

          {isTeacher ? <>
            <NavLink to="/teacher/dashboard">{t("nav.dashboard")}</NavLink>
            <NavLink to="/teacher/contents">{t("nav.myContent")}</NavLink>
            <NavLink to="/teacher/profile">{t("nav.profile")}</NavLink>
          </> : null}

          {isAdmin ? <>
            <NavLink to="/admin/dashboard">{t("nav.dashboard")}</NavLink>
            <NavLink to="/admin/users">{t("nav.users")}</NavLink>
            <NavLink to="/admin/approvals">{t("nav.approvals")}</NavLink>
            <NavLink to="/admin/profile">{t("nav.profile")}</NavLink>
          </> : null}

          {!user ? <>
            <NavLink to="/register">{t("nav.registerNow")}</NavLink>
            <NavLink to="/login">{t("nav.logIn")}</NavLink>
          </> : null}

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

        {/* ── COL 3: user card + lang + logout (right-aligned) ─ */}
        <div className="flex items-center gap-2 justify-end flex-shrink-0">

          {/* User card */}
          {user ? (
            <Link
              to={profileHref}
              onClick={playPop}
              className="flex items-center gap-2 no-underline group min-w-0"
            >
              <div className="nav-user-avatar flex-shrink-0">
                {user.avatar
                  ? <img src={user.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span>{initial}</span>
                }
              </div>
              <div className="hidden sm:flex flex-col leading-none min-w-0" style={{ gap: "3px" }}>
                <span
                  className="text-white font-semibold truncate"
                  style={{ fontFamily: "var(--font-ui)", fontSize: "13px", lineHeight: 1 }}
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
              className="hidden lg:inline"
              style={{
                fontSize: "13px",
                lineHeight: 1,
                padding: "5px 12px",
                borderRadius: "999px",
                color: "rgba(196,181,253,0.7)",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.10)",
                fontFamily: "var(--font-ui)",
                whiteSpace: "nowrap",
              }}
            >
              {t("nav.guest")}
            </span>
          )}

          {/* Mobile: register/login pills (hidden on lg since center has them) */}
          {!user && (
            <div className="flex lg:hidden items-center gap-1">
              <Link to="/register" onClick={playPop} className="nav-pill nav-pill-active" style={{ fontSize: "12px", padding: "5px 10px" }}>
                {t("nav.registerNow")}
              </Link>
              <Link to="/login" onClick={playPop} className="nav-pill nav-pill-inactive" style={{ fontSize: "12px", padding: "5px 10px" }}>
                {t("nav.logIn")}
              </Link>
            </div>
          )}

          {/* Language switcher */}
          <div className="nav-lang-group flex-shrink-0">
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
              className="nav-logout-btn flex-shrink-0"
              title={t("nav.logOut")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
