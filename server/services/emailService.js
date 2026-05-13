/**
 * ══════════════════════════════════════════════════════════════════════════════
 * Email Service - Resend Implementation
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Production-grade email service using Resend (replaces Gmail SMTP).
 *
 * Features:
 * - Async/await with proper error handling
 * - Timeout protection (15s default)
 * - Detailed logging for debugging
 * - HTML OTP email templates
 * - Graceful error recovery
 * - No hanging requests
 *
 * Usage:
 *   const { sendOtpEmail } = require('./services/emailService');
 *   await sendOtpEmail('user@example.com', '123456', 'register');
 */

const { Resend } = require("resend");
const env = require("../config/env");

// ── Initialize Resend client ───────────────────────────────────────────────────
const resend = new Resend(env.RESEND_API_KEY);

const OTP_CONFIGS = {
  register: {
    subject: "Verify your email – Fun English",
    title: "📧 Email Verification",
    description: "Your verification code for account registration:",
  },
  "login-2fa": {
    subject: "Your login code – Fun English",
    title: "🔐 Two-Factor Authentication",
    description: "Your login verification code:",
  },
  reset: {
    subject: "Reset your password – Fun English",
    title: "🔑 Password Reset",
    description: "Use this code to reset your password:",
  },
};

/**
 * Generate HTML template for OTP email
 */
function generateOtpHtml(otp, title, description) {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .container { max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px; }
      h2 { color: #6366f1; margin-top: 0; margin-bottom: 16px; }
      .description { color: #334155; margin: 16px 0; }
      .otp-box { font-size: 40px; font-weight: 700; letter-spacing: 10px; color: #1e293b; text-align: center; background: #e0e7ff; border-radius: 8px; padding: 20px 0; margin: 24px 0; }
      .footer { color: #64748b; font-size: 14px; margin-top: 24px; }
      .footer strong { font-weight: 600; }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>${title}</h2>
      <p class="description">${description}</p>
      <div class="otp-box">${otp}</div>
      <div class="footer">
        <p>This code is valid for <strong>5 minutes</strong>.</p>
        <p>If you did not make this request, please ignore this email.</p>
      </div>
    </div>
  </body>
</html>
  `;
}

/**
 * Send OTP email via Resend
 *
 * @param {string} email - Recipient email address
 * @param {string} otp - One-time password (usually 6 digits)
 * @param {string} purpose - Email purpose: 'register', 'login-2fa', or 'reset'
 * @param {number} timeoutMs - Timeout in milliseconds (default: 15000)
 * @throws {Error} - If email sending fails or times out
 * @returns {Promise<{success: true, messageId: string}>}
 */
async function sendOtpEmail(email, otp, purpose = "register", timeoutMs = 15000) {
  const cfg = OTP_CONFIGS[purpose] || OTP_CONFIGS["register"];

  console.log(`[EMAIL] Sending OTP email to: ${email} (purpose: ${purpose})`);

  // Create timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Email sending timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    // Race between email sending and timeout
    const result = await Promise.race([
      resend.emails.send({
        from: env.EMAIL_FROM,
        to: email,
        subject: cfg.subject,
        html: generateOtpHtml(otp, cfg.title, cfg.description),
      }),
      timeoutPromise,
    ]);

    // Check if Resend returned an error
    if (result.error) {
      throw new Error(`Resend error: ${result.error.message || JSON.stringify(result.error)}`);
    }

    console.log(`[EMAIL] ✅ OTP sent successfully to: ${email}`);
    console.log(`[EMAIL]    Message ID: ${result.id}`);

    return {
      success: true,
      messageId: result.id,
    };
  } catch (error) {
    console.error(`[EMAIL] ❌ Failed to send OTP to: ${email}`);
    console.error(`[EMAIL]    Error: ${error.message}`);

    // Provide specific error guidance
    if (error.message.includes("timeout")) {
      console.error(`[EMAIL]    ⚠️ Timeout - Resend not responding. Check API key and network.`);
    }
    if (error.message.includes("Unauthorized")) {
      console.error(`[EMAIL]    ⚠️ Invalid RESEND_API_KEY. Check env configuration.`);
    }
    if (error.message.includes("invalid_to_email")) {
      console.error(`[EMAIL]    ⚠️ Invalid email address.`);
    }

    // Re-throw with context for route handler
    throw error;
  }
}

/**
 * Health check for email service
 */
async function checkEmailService() {
  try {
    if (!env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }
    console.log("[EMAIL] ✅ Service configured with Resend");
    return true;
  } catch (err) {
    console.error("[EMAIL] ❌ Service check failed:", err.message);
    return false;
  }
}

module.exports = {
  sendOtpEmail,
  checkEmailService,
};
