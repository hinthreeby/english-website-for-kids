// Whitelist: Unicode letters (incl. Vietnamese), digits, space, underscore, hyphen
const DISPLAY_NAME_RE = /^[\p{L}\p{N} _\-]+$/u;

// Username: ASCII only — letters, digits, underscore, hyphen
const USERNAME_RE = /^[a-zA-Z0-9_\-]+$/;

// Dangerous URL schemes (covers obfuscated variants like jaVasCriPt:, data :, etc.)
const DANGEROUS_SCHEME_RE = /^\s*(javascript|data|vbscript)\s*:/i;

function validateDisplayName(name) {
  if (typeof name !== "string") return "Display name must be a string";
  const t = name.trim();
  if (!t) return "Display name cannot be empty";
  if (t.length > 60) return "Display name is too long (max 60 characters)";
  if (!DISPLAY_NAME_RE.test(t))
    return "Display name may only contain letters, digits, spaces, hyphens and underscores";
  return null;
}

function validateUsername(name) {
  if (typeof name !== "string") return "Username must be a string";
  const t = name.trim();
  if (!t) return "Username cannot be empty";
  if (t.length < 3) return "Username must be at least 3 characters";
  if (t.length > 30) return "Username is too long (max 30 characters)";
  if (!USERNAME_RE.test(t))
    return "Username may only contain letters, digits, hyphens and underscores";
  return null;
}

function validateAvatarUrl(url) {
  if (typeof url !== "string") return "Avatar URL must be a string";
  const t = url.trim();
  if (!t) return "Avatar URL cannot be empty";
  if (t.length > 500) return "Avatar URL is too long";

  // Block dangerous schemes unconditionally
  if (DANGEROUS_SCHEME_RE.test(t))
    return "Avatar URL uses a disallowed scheme";

  // Block inline HTML characters
  if (/[<>"']/.test(t))
    return "Avatar URL contains invalid characters";

  // Allow only relative upload paths or https:// external URLs
  if (!t.startsWith("/uploads/") && !t.startsWith("https://"))
    return "Avatar URL must be an https:// URL or a relative /uploads/ path";

  return null;
}

module.exports = { validateDisplayName, validateUsername, validateAvatarUrl };
