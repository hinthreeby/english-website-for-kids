const transporter = require("../config/email");

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

async function sendOtpEmail(email, otp, purpose) {
  const cfg = OTP_CONFIGS[purpose] || OTP_CONFIGS["login-2fa"];
  
  console.log(`📨 Sending OTP email to: ${email} (purpose: ${purpose})`);
  
  try {
    const mailOptions = {
      from: `"Fun English" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: cfg.subject,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px;">
          <h2 style="color:#6366f1;margin-top:0;">${cfg.title}</h2>
          <p style="color:#334155;">${cfg.description}</p>
          <div style="font-size:40px;font-weight:700;letter-spacing:10px;color:#1e293b;text-align:center;
                      background:#e0e7ff;border-radius:8px;padding:20px 0;margin:24px 0;">
            ${otp}
          </div>
          <p style="color:#64748b;font-size:14px;">
            This code is valid for <strong>5 minutes</strong>.<br/>
            If you did not make this request, please ignore this email.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ OTP Email sent successfully to: ${email}`);
    console.log(`   Response ID: ${info.response}`);
    
    return { success: true, info };
  } catch (error) {
    console.error(`❌ Failed to send OTP email to: ${email}`);
    console.error(`   Error Code: ${error.code}`);
    console.error(`   Error Message: ${error.message}`);
    
    // Log SMTP-specific errors
    if (error.code === "ENETUNREACH") {
      console.error(`   ⚠️ Network unreachable - IPv6 issue on Render? Check SMTP config.`);
    }
    if (error.code === "ECONNREFUSED") {
      console.error(`   ⚠️ Connection refused - SMTP host/port issue`);
    }
    if (error.code === "ETIMEDOUT") {
      console.error(`   ⚠️ Connection timeout - SMTP server not responding`);
    }
    
    // Re-throw with context for route handler
    throw new Error(`SMTP Error: ${error.message}`);
  }
}

module.exports = { sendOtpEmail };
