# 🚀 Backend Production Configuration Refactor - Complete Guide

## Overview
This document details the complete production-ready refactoring of your MERN stack backend for reliable deployment on Render with proper environment separation, Resend email service integration, and cross-origin cookie support.

---

## ✅ Changes Summary

### 1. Environment Configuration Files

#### `.env.example`
**Purpose:** Template for all environment variables
- Comprehensive documentation for each variable
- No actual secrets (template only)
- All required fields clearly marked

#### `.env.development`
**Purpose:** Local development configuration
- Uses `NODE_ENV=development`
- Local MongoDB connection
- Localhost frontend URL
- Resend API key configured
- Insecure cookies (HTTP, lax) for local testing

#### `.env.production`
**Purpose:** Render deployment configuration
- Uses `NODE_ENV=production`
- Production MongoDB Atlas connection
- Production Vercel frontend URL
- Production Resend API key
- Secure cookies (HTTPS, none, httpOnly)
- `TRUST_PROXY=true` for Render reverse proxy

---

### 2. New Configuration Modules

#### `config/env.js`
**Purpose:** Centralized environment variable management with validation

**Key Features:**
- Automatically loads `.env.development` or `.env.production` based on `NODE_ENV`
- Validates required secrets at startup
- Converts env strings to proper types (int, boolean)
- Adds derived flags (`isDevelopment`, `isProduction`)
- Logs configuration on startup for debugging
- Exits with error if required variables missing

**Usage in other files:**
```javascript
const env = require("./config/env");
console.log(env.NODE_ENV);      // 'production' or 'development'
console.log(env.JWT_SECRET);    // loaded and validated
console.log(env.MONGODB_URI);   // with full connection string
```

#### `config/cors.js`
**Purpose:** Production-ready CORS configuration

**Key Features:**
- Dynamic origin allowlist based on environment
- Development: localhost:5173, localhost:3000
- Production: only https://english-website-for-kids.vercel.app
- Enables credentials for cookie/JWT support
- Properly handles preflight requests
- Logs all blocked origins for debugging

**Why necessary:**
- Frontend (Vercel) and backend (Render) have different origins
- Browsers block cross-origin requests without proper CORS
- With `credentials: true`, browsers must have exact origin match
- `sameSite=none` + `secure=true` required for production cookies

#### `config/cookies.js`
**Purpose:** Unified cookie configuration for JWT auth across environments

**Key Features:**
- `httpOnly: true` - prevents XSS attacks (JS can't access)
- Development: `secure: false, sameSite: 'lax'` (HTTP, lax)
- Production: `secure: true, sameSite: 'none'` (HTTPS, none)
- 7-day expiration for JWT tokens
- Session cookies configured separately for OAuth flow

**Why different settings per environment:**

| Setting | Development | Production | Why |
|---------|-------------|-----------|-----|
| `secure` | false | true | Dev uses HTTP; Prod uses HTTPS |
| `sameSite` | 'lax' | 'none' | Dev is same-site; Prod is cross-site |
| `httpOnly` | true | true | Always prevent XSS |

**Cookie workflow:**
1. Frontend makes request to backend with credentials
2. Backend sends response with `Set-Cookie: token=...`
3. Browser stores cookie with specified flags
4. Browser automatically sends cookie on subsequent requests
5. Backend verifies token from cookie or Authorization header

---

### 3. Email Service Migration: Nodemailer → Resend

#### Old Approach (Problematic on Render)
```javascript
// ❌ Issues:
// - Gmail SMTP IPv6 endpoint unreachable from Render
// - Hangs indefinitely (ENETUNREACH 2607:f8b0:...)
// - IPv4-only fix wasn't working
// - Complex TLS negotiation
// - Had to force IPv4 with 'family: 4' option
```

#### New Approach: `services/emailService.js`
**Purpose:** Production-grade email service using Resend API

**Key Features:**
- Uses Resend API (no SMTP complexity)
- 15-second timeout protection (prevents hanging)
- Promise.race() to enforce timeout
- Detailed logging for debugging
- HTML email templates
- Error categorization (timeout, invalid key, invalid email)
- Zero dependency on Gmail infrastructure

**Why Resend is better:**
| Aspect | Nodemailer (SMTP) | Resend (API) |
|--------|---------|---------|
| Protocol | SMTP over port 587/465 | HTTP API call |
| IPv6 issues | Yes (Render couldn't connect) | No (HTTP standard) |
| Timeout handling | Complex | Built-in |
| Latency | Higher (handshake) | Lower (direct API) |
| Error messages | Cryptic SMTP codes | Clear HTTP errors |
| Scaling | Hard (connection limits) | Easy (API rate limits) |
| Production support | Basic | Enterprise-grade |

**Usage:**
```javascript
const { sendOtpEmail } = require('./services/emailService');
await sendOtpEmail('user@example.com', '123456', 'register');
// Returns: { success: true, messageId: 'xxx' }
// Throws: Error with clear message if fails
```

---

### 4. Refactored Server

#### Old `server.js` Issues
- Hardcoded CORS origins (not in env)
- Hardcoded JWT_SECRET from process.env
- Manual config scattered everywhere
- No trust proxy for Render
- No graceful shutdown
- Poor startup logging

#### New `server.js` - Production Ready

**Key Improvements:**

1. **Centralized Configuration Loading**
   ```javascript
   const env = require("./config/env");       // ← All env vars validated
   const corsConfig = require("./config/cors");
   const { sessionCookieOptions } = require("./config/cookies");
   ```

2. **Proxy Trust for Render**
   ```javascript
   if (env.TRUST_PROXY) {
     app.set("trust proxy", 1);  // ← Reads X-Forwarded-* headers
   }
   ```
   This ensures:
   - `req.ip` = client's real IP (not Render's reverse proxy)
   - `req.secure` = original protocol (HTTP/HTTPS)
   - Cookies work correctly with cross-origin

3. **Proper Middleware Order**
   ```
   1. Trust proxy (must be first)
   2. CORS
   3. Body parsing + error handling
   4. Cookie parser
   5. Sessions + Passport
   6. Routes
   7. Error handler (must be last)
   ```

4. **Health Check with Details**
   ```javascript
   GET /api/health → {
     ok: true,
     environment: "production",
     timestamp: "2026-05-13T..."
   }
   ```

5. **Service Verification on Startup**
   ```javascript
   await checkEmailService();  // ← Verifies Resend config
   ```

6. **Graceful Shutdown**
   ```javascript
   // Closes MongoDB connection cleanly on SIGTERM
   process.on("SIGTERM", async () => { ... })
   ```

---

### 5. Updated Auth Routes

#### Changes in `/routes/auth.js`

**Before:**
```javascript
const buildCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
```

**After:**
```javascript
const env = require("../config/env");
const { cookieOptions } = require("../config/cookies");

const signToken = (id) => jwt.sign({ id }, env.JWT_SECRET, { expiresIn: "7d" });
const sendToken = (user, res) => {
  const token = signToken(user._id);
  res.cookie("token", token, cookieOptions);  // ← Uses centralized config
  return token;
};
```

**Benefits:**
- Cookies configured consistently across environment
- `sameSite=none` automatically set in production
- `secure=true` automatically set in production
- Single source of truth for cookie policy

#### Email Sending Error Handling

All routes that send OTP now have try-catch:
```javascript
try {
  await sendOtpEmail(email, otp, "register");
} catch (emailErr) {
  console.error("[REGISTER] Email sending failed:", emailErr.message);
  return res.status(500).json({ 
    error: "Failed to send verification email. Please try again later." 
  });
}
```

**Why important:**
- Frontend receives error response (doesn't hang forever)
- Logging helps debug production issues
- User gets clear feedback

---

### 6. Middleware Updates

#### `middleware/authMiddleware.js`
**Change:** Uses `env.JWT_SECRET` instead of `process.env.JWT_SECRET`

```javascript
const env = require("../config/env");
const decoded = jwt.verify(token, env.JWT_SECRET);  // ← Uses validated env
```

#### `config/passport.js`
**Change:** Uses `env` for all Google OAuth settings

```javascript
const env = require("./env");
new GoogleStrategy({
  clientID: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  callbackURL: env.GOOGLE_CALLBACK_URL,
})
```

---

## 🌐 How It Works: Localhost → Vercel + Render

### Development (localhost)
```
Browser (http://localhost:5173)
    ↓
CORS check: Origin matches allowlist ✓
    ↓
Backend (http://localhost:5000)
    ↓
Set-Cookie: token=...; HttpOnly; Secure=false; SameSite=lax
    ↓
Browser stores (same-origin, no special rules needed)
    ↓
Next request: Cookie sent automatically (same-origin)
```

### Production (Vercel + Render)
```
Browser (https://english-website-for-kids.vercel.app)
    ↓
CORS check: Origin matches production allowlist ✓
    ↓
Backend (https://english-website-for-kids.onrender.com)
    ↓
Set-Cookie: token=...; HttpOnly; Secure=true; SameSite=none
    ↓
Browser stores (cross-origin, accepts because Secure=true + SameSite=none)
    ↓
Next request: Cookie sent automatically (even cross-origin)
```

**Critical production requirement:**
```
SameSite=none requires Secure=true
Secure=true requires HTTPS
Both FRONTEND and BACKEND must use HTTPS
```

---

## 🔍 Why Localhost Worked But Production Failed

### Email Sending (SMTP IPv6 issue)

**Localhost (worked):**
- Local network has both IPv4 and IPv6 DNS resolution
- Nodemailer could try IPv4 after IPv6 failed
- SMTP port 587 had fast fallback
- No firewall restrictions

**Render Container (failed):**
- Render's network stack routes Gmail SMTP to IPv6 endpoint first
- IPv6 endpoint unreachable from container
- Connection hung waiting for timeout
- No IPv4 fallback
- Error: `ENETUNREACH 2607:f8b0:400e:c0c::6c:465`

**Fix:** Switched to Resend (HTTP API = no IPv6 issues)

### Cookies (SameSite issue)

**Localhost (worked):**
- Same origin (`localhost:5173` → `localhost:5000`)
- `SameSite=lax` acceptable
- `Secure=false` OK (localhost HTTP)
- Browser accepts everything

**Render (failed if not fixed):**
- Different origins (`.vercel.app` → `.onrender.com`)
- `SameSite=lax` would block cookie
- Browser rejects cross-origin cookies with lax
- Need: `SameSite=none` + `Secure=true`

**Fix:** Environment-aware cookie config

### CORS (origin mismatch)

**Localhost (worked):**
- Hardcoded CORS origins included both localhost:5173 and :3000
- Could run dev server on either port

**Render (failed if not updated):**
- Hardcoded localhost origins rejected Vercel domain
- Need: production allowlist

**Fix:** Dynamic origins based on `CLIENT_URL` env var

---

## 🚀 Deployment Checklist for Render

### Step 1: Set Environment Variables in Render Dashboard

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<generate-random-32-chars>
SESSION_SECRET=<generate-random-32-chars>
CLIENT_URL=https://english-website-for-kids.vercel.app
RESEND_API_KEY=re_VkE9hPB7_LjFPwN3uzWtVgCbjuHr55vTL
EMAIL_FROM=noreply@english-website-for-kids.onrender.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://english-website-for-kids.onrender.com/auth/google/callback
COOKIE_SECURE=true
COOKIE_SAMESITE=none
TRUST_PROXY=true
```

### Step 2: Generate Secure Secrets

```bash
node -e "console.log('JWT:', require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('SESSION:', require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Verify Gmail Account Setup (if using OAuth)

1. Enable 2FA on Google account
2. Create App Password at: https://myaccount.google.com/apppasswords
3. Use this as `GOOGLE_CLIENT_SECRET` (not the main password)

### Step 4: Verify Resend Configuration

1. Get API key from: https://resend.com/api-keys
2. Add `EMAIL_FROM` domain to Resend verified domains
3. For custom domain: add CNAME/MX records (or use `onboarding@resend.dev` for testing)

### Step 5: Deploy & Test

```bash
# Push to GitHub
git add .
git commit -m "feat: productionize backend config"
git push origin main

# Render auto-redeploys
# Check logs for:
# ✅ [ENV] Configuration loaded
# ✅ [CORS] Configuration
# ✅ [COOKIES] Configuration
# ✅ [EMAIL] Service configured
# ✅ [DB] MongoDB connected
# ✅ [SERVER] Server running
```

### Step 6: Test Endpoints

```bash
# Health check
curl https://english-website-for-kids.onrender.com/api/health

# Register (should send OTP email)
curl -X POST https://english-website-for-kids.onrender.com/api/auth/register-init \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"your@email.com","password":"pass123","role":"parent"}'

# Check backend logs for: [EMAIL] ✅ OTP sent successfully
```

---

## 📊 File Changes Summary

| File | Changes | Impact |
|------|---------|--------|
| `.env.example` | New template structure | Documentation |
| `.env.development` | New development config | Local dev |
| `.env.production` | Updated with Resend settings | Render deploy |
| `config/env.js` | New centralized config | All files |
| `config/cors.js` | New CORS configuration | Production CORS |
| `config/cookies.js` | New cookie configuration | Auth flows |
| `config/passport.js` | Updated to use `env` | OAuth setup |
| `server.js` | Refactored with new configs | Server startup |
| `middleware/authMiddleware.js` | Updated to use `env` | JWT verification |
| `routes/auth.js` | Uses `env` and `cookieOptions` | All auth routes |
| `services/emailService.js` | Fully rewritten for Resend | Email sending |
| `package.json` | Added `resend` dependency | Email service |

---

## 🎯 Production Benefits

✅ **No more IPv6 hanging issues** - Resend uses HTTP API
✅ **Cross-origin cookies work** - Proper SameSite/Secure config
✅ **Environment-aware setup** - Different configs per environment
✅ **Centralized configuration** - Single source of truth
✅ **Better error handling** - Frontend gets responses, not hangs
✅ **Detailed logging** - Easy debugging on Render
✅ **Graceful shutdown** - Clean database disconnection
✅ **Trust proxy support** - Works behind Render reverse proxy
✅ **Resend stability** - Enterprise email service vs Gmail SMTP

---

## 🔗 Environment Variable Reference

### Required for All Environments
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing key (min 32 chars)
- `SESSION_SECRET` - Express-session secret (min 32 chars)
- `RESEND_API_KEY` - Resend API key

### Optional (with Defaults)
- `NODE_ENV` - defaults to 'development'
- `PORT` - defaults to 5000
- `CLIENT_URL` - defaults to http://localhost:5173
- `EMAIL_FROM` - defaults to onboarding@resend.dev

### Production-Only
- `COOKIE_SECURE=true` - HTTPS only
- `COOKIE_SAMESITE=none` - Cross-origin
- `TRUST_PROXY=true` - Behind Render proxy
- `GOOGLE_CALLBACK_URL` - Must use https://...onrender.com

---

## 🆘 Troubleshooting

### Email not sending
```
Check: [EMAIL] logs in Render console
Verify: RESEND_API_KEY is set
Verify: EMAIL_FROM is verified in Resend dashboard
```

### Cookies not working in production
```
Check: COOKIE_SECURE=true
Check: COOKIE_SAMESITE=none
Check: Both frontend and backend use HTTPS
Verify: Frontend cookies show: Secure, SameSite=None
```

### CORS errors
```
Check: CLIENT_URL matches frontend URL exactly
Check: Frontend includes credentials: true in fetch
Verify: Origins in logs show allowed: https://english-website-for-kids.vercel.app
```

### Token verification failing
```
Check: JWT_SECRET matches between localhost and production
Check: Token not expired (7 days)
Check: TOKEN cookie present in request headers
```

---

**Status:** ✅ Production Ready
**Last Updated:** May 13, 2026
**Framework:** MERN (Express + React + MongoDB)
**Deployment:** Render + Vercel
