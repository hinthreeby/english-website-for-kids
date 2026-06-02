const HTML_TAG_RE = /<[^>]*/;
const DANGEROUS_RE = /javascript\s*:|data\s*:|vbscript\s*:/i;

function validateDisplayName(name) {
  if (typeof name !== "string") return "Display name must be a string";
  const t = name.trim();
  if (!t) return "Display name cannot be empty";
  if (t.length > 60) return "Display name is too long (max 60 characters)";
  if (HTML_TAG_RE.test(t) || DANGEROUS_RE.test(t))
    return "Display name contains invalid characters";
  return null;
}

module.exports = { validateDisplayName };
