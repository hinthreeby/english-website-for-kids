import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "en", flag: "🇬🇧", label: "EN" },
  { code: "vi", flag: "🇻🇳", label: "VI" },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith("vi") ? "vi" : "en";

  return (
    <div className="lang-switcher">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          className={`lang-btn${current === lang.code ? " lang-btn--active" : ""}`}
          onClick={() => i18n.changeLanguage(lang.code)}
          aria-label={`Switch to ${lang.label}`}
          title={lang.code === "en" ? "English" : "Tiếng Việt"}
        >
          {lang.flag} {lang.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
