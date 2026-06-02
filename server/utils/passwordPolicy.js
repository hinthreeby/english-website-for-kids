// Minimum 8 chars, must contain uppercase, lowercase, and digit or special character.
const STRONG_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?`~]).{8,}$/;

/**
 * Returns an error string if the password is too weak, or null if it passes.
 */
function validatePassword(password) {
  if (!password || password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (!STRONG_REGEX.test(password)) {
    return "Password must include uppercase, lowercase, and a number or special character.";
  }
  return null;
}

module.exports = { validatePassword };
