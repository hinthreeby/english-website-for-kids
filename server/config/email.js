const nodemailer = require("nodemailer");

// ── Production-safe Nodemailer configuration ──────────────────────────────────
// Forces IPv4 and includes proper timeout handling for Render container
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,           // Start unencrypted, upgrade with STARTTLS
  requireTLS: true,        // Enforce TLS upgrade
  family: 4,               // Force IPv4 (fixes ENETUNREACH IPv6 issues on Render)
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,   // 10 seconds
  socketTimeout: 10000,     // 10 seconds
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Verify transporter connection on startup ──────────────────────────────────
if (process.env.NODE_ENV === "production") {
  transporter.verify((err, success) => {
    if (err) {
      console.error("❌ SMTP Transporter Error:", err.message);
      console.error("   Host:", transporter.options.host);
      console.error("   Port:", transporter.options.port);
    } else {
      console.log("✅ SMTP Transporter Ready");
    }
  });
}

module.exports = transporter;
