"use strict";

// ─── Mock heavy dependencies before any require ───────────────────────────────
jest.mock("../config/env", () => ({
  JWT_SECRET: "test-jwt-secret-key-for-security-tests",
  NODE_ENV: "test",
  isProduction: false,
}));

jest.mock("../config/loggers", () => ({
  security: jest.fn(),
  admin: jest.fn(),
  auth: jest.fn(),
}));

jest.mock("../config/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

jest.mock("../middleware/authMiddleware", () => ({
  protect: (req, _res, next) => { req.user = { _id: "000000000000000000000001" }; next(); },
  isParent:  (_req, _res, next) => next(),
  isTeacher: (_req, _res, next) => next(),
  isAdmin:   (_req, _res, next) => next(),
}));

jest.mock("../middleware/validateObjectId", () => () => (_req, _res, next) => next());

const mockUserFindByIdAndUpdate = jest.fn();
const mockUserFindOne = jest.fn();

jest.mock("../models/User", () => ({
  findByIdAndUpdate: (...args) => mockUserFindByIdAndUpdate(...args),
  findOne: (...args) => mockUserFindOne(...args),
  findById: jest.fn(),
}));

// ─── Imports after mocks ──────────────────────────────────────────────────────
const os = require("os");
const path = require("path");
const fsPromises = require("fs").promises;
const express = require("express");
const request = require("supertest");

const { checkMagicBytes, deleteUploadedFile } = require("../config/upload");
const { createCsrfToken, verifyCsrfToken } = require("../middleware/csrf");
const { validateDisplayName } = require("../utils/sanitize");

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function writeTempFile(bytes) {
  const tmpPath = path.join(os.tmpdir(), `test_${Date.now()}_${Math.random().toString(36).slice(2)}.bin`);
  await fsPromises.writeFile(tmpPath, Buffer.from(bytes));
  return tmpPath;
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. UPLOAD: Magic Bytes Validation
// ══════════════════════════════════════════════════════════════════════════════
describe("Upload – Magic Bytes Validation", () => {
  test("valid PNG magic bytes → accepted", async () => {
    const bytes = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d];
    const tmp = await writeTempFile(bytes);
    expect(await checkMagicBytes(tmp, "image/png")).toBe(true);
    await fsPromises.unlink(tmp);
  });

  test("plain-text file claiming to be PNG → rejected", async () => {
    const bytes = Buffer.from("This is not a PNG file, just text content");
    const tmp = await writeTempFile(bytes);
    expect(await checkMagicBytes(tmp, "image/png")).toBe(false);
    await fsPromises.unlink(tmp);
  });

  test("JPEG bytes with image/png mimetype → rejected (magic mismatch)", async () => {
    const bytes = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01];
    const tmp = await writeTempFile(bytes);
    expect(await checkMagicBytes(tmp, "image/png")).toBe(false);
    await fsPromises.unlink(tmp);
  });

  test("valid JPEG magic bytes → accepted", async () => {
    const bytes = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01];
    const tmp = await writeTempFile(bytes);
    expect(await checkMagicBytes(tmp, "image/jpeg")).toBe(true);
    await fsPromises.unlink(tmp);
  });

  test("valid WebP magic bytes → accepted", async () => {
    const bytes = [
      ...Buffer.from("RIFF"), 0x00, 0x00, 0x00, 0x00,
      ...Buffer.from("WEBP"),
    ];
    const tmp = await writeTempFile(bytes);
    expect(await checkMagicBytes(tmp, "image/webp")).toBe(true);
    await fsPromises.unlink(tmp);
  });

  test("GIF87a magic bytes → accepted", async () => {
    const bytes = [...Buffer.from("GIF87a"), 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
    const tmp = await writeTempFile(bytes);
    expect(await checkMagicBytes(tmp, "image/gif")).toBe(true);
    await fsPromises.unlink(tmp);
  });

  test("nonexistent file path → returns false (no crash)", async () => {
    expect(await checkMagicBytes("/nonexistent/path/ghost.png", "image/png")).toBe(false);
  });

  test("deleteUploadedFile silently ignores missing file", async () => {
    await expect(deleteUploadedFile("/nonexistent/path/file.bin")).resolves.toBeUndefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. CSRF: Token Session Binding
// ══════════════════════════════════════════════════════════════════════════════
describe("CSRF – Token Session Binding", () => {
  const COOKIE_A = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.userA";
  const COOKIE_B = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.userB";

  test("token created for cookie A verifies with the same cookie A", () => {
    const token = createCsrfToken(COOKIE_A);
    expect(verifyCsrfToken(token, COOKIE_A)).toBe(true);
  });

  test("token created for cookie A is rejected with cookie B (cross-session reuse blocked)", () => {
    const token = createCsrfToken(COOKIE_A);
    expect(verifyCsrfToken(token, COOKIE_B)).toBe(false);
  });

  test("token created with no cookie is rejected when a cookie is present", () => {
    const token = createCsrfToken("");
    expect(verifyCsrfToken(token, COOKIE_A)).toBe(false);
  });

  test("token created with a cookie is rejected when no cookie is supplied", () => {
    const token = createCsrfToken(COOKIE_A);
    expect(verifyCsrfToken(token, "")).toBe(false);
  });

  test("malformed token strings are rejected", () => {
    expect(verifyCsrfToken("notavalidtoken", COOKIE_A)).toBe(false);
    expect(verifyCsrfToken("", COOKIE_A)).toBe(false);
    expect(verifyCsrfToken(null, COOKIE_A)).toBe(false);
    expect(verifyCsrfToken("abc.tooshorthex", COOKIE_A)).toBe(false);
  });

  test("tampered token (altered random part) is rejected", () => {
    const token = createCsrfToken(COOKIE_A);
    const [random, sig] = token.split(".");
    const tampered = random.slice(0, -2) + "ff." + sig;
    expect(verifyCsrfToken(tampered, COOKIE_A)).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. XSS: Stored XSS Prevention via displayName Validation
// ══════════════════════════════════════════════════════════════════════════════
describe("XSS – Display Name Validation", () => {
  test("rejects <script>alert(1)</script>", () => {
    expect(validateDisplayName("<script>alert(1)</script>")).not.toBeNull();
  });

  test("rejects <img src=x onerror=alert(1)>", () => {
    expect(validateDisplayName("<img src=x onerror=alert(1)>")).not.toBeNull();
  });

  test("rejects javascript: protocol", () => {
    expect(validateDisplayName("javascript:alert(1)")).not.toBeNull();
  });

  test("rejects data: URI injection", () => {
    expect(validateDisplayName("data:text/html,<script>alert(1)</script>")).not.toBeNull();
  });

  test("rejects any HTML tag fragment", () => {
    expect(validateDisplayName("<b>bold</b>")).not.toBeNull();
    expect(validateDisplayName("<a href='x'>click</a>")).not.toBeNull();
  });

  test("accepts normal UTF-8 names", () => {
    expect(validateDisplayName("Alice Johnson")).toBeNull();
    expect(validateDisplayName("Nguyễn Văn An")).toBeNull();
    expect(validateDisplayName("Bob-123")).toBeNull();
    expect(validateDisplayName("O'Brien")).toBeNull();
  });

  test("rejects empty / whitespace-only names", () => {
    expect(validateDisplayName("")).not.toBeNull();
    expect(validateDisplayName("   ")).not.toBeNull();
  });

  test("rejects names longer than 60 characters", () => {
    expect(validateDisplayName("a".repeat(61))).not.toBeNull();
  });

  test("rejects non-string input (prevents object injection)", () => {
    expect(validateDisplayName({ $set: { role: "admin" } })).not.toBeNull();
    expect(validateDisplayName(null)).not.toBeNull();
    expect(validateDisplayName(42)).not.toBeNull();
    expect(validateDisplayName(["<script>"])).not.toBeNull();
  });

  // Route-level: XSS payload in PATCH /profile must return 400
  test("PATCH /api/parent/profile with XSS displayName returns 400", async () => {
    const app = express();
    app.use(express.json());
    app.use("/api/parent", require("../routes/parent"));

    const res = await request(app)
      .patch("/api/parent/profile")
      .send({ displayName: "<script>alert(1)</script>" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid characters/i);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. PROFILE: Mass Assignment Protection
// ══════════════════════════════════════════════════════════════════════════════
describe("Profile – Mass Assignment Protection", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/api/parent",  require("../routes/parent"));
    app.use("/api/teacher", require("../routes/teacher"));
    app.use("/api/admin",   require("../routes/admin"));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserFindOne.mockResolvedValue(null);
    mockUserFindByIdAndUpdate.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "000000000000000000000001",
        displayName: "Updated Name",
        email: "user@example.com",
        role: "parent",
      }),
    });
  });

  async function assertOnlyAllowedFields(routePath, payload) {
    const res = await request(app).patch(routePath).send(payload);
    expect(res.status).toBe(200);

    // Inspect what was passed to findByIdAndUpdate as the update object
    expect(mockUserFindByIdAndUpdate).toHaveBeenCalledTimes(1);
    const updateArg = mockUserFindByIdAndUpdate.mock.calls[0][1];

    expect(updateArg).not.toHaveProperty("role");
    expect(updateArg).not.toHaveProperty("isAdmin");
    expect(updateArg).not.toHaveProperty("permissions");
    expect(updateArg).not.toHaveProperty("totalStars");
    expect(updateArg).not.toHaveProperty("isActive");
    expect(updateArg).not.toHaveProperty("isApproved");
    expect(updateArg).not.toHaveProperty("emailVerified");
    expect(updateArg).not.toHaveProperty("planetsUnlocked");
    expect(updateArg).not.toHaveProperty("allPlanetsBonus");
    return updateArg;
  }

  test("parent cannot set role/isActive/totalStars via PATCH /profile", async () => {
    const updateArg = await assertOnlyAllowedFields("/api/parent/profile", {
      displayName: "Legit Name",
      role: "admin",
      isActive: false,
      totalStars: 99999,
      isApproved: true,
    });
    expect(updateArg).toHaveProperty("displayName", "Legit Name");
  });

  test("teacher cannot set role/totalStars via PATCH /profile", async () => {
    const updateArg = await assertOnlyAllowedFields("/api/teacher/profile", {
      displayName: "Teacher Name",
      role: "admin",
      totalStars: 9999,
      isActive: false,
    });
    expect(updateArg).toHaveProperty("displayName", "Teacher Name");
  });

  test("admin profile route cannot set role/totalStars via PATCH /profile", async () => {
    const updateArg = await assertOnlyAllowedFields("/api/admin/profile", {
      email: "admin@example.com",
      displayName: "Admin Name",
      role: "superadmin",
      totalStars: 9999,
      isActive: false,
    });
    expect(updateArg).toHaveProperty("displayName", "Admin Name");
    expect(updateArg).toHaveProperty("email", "admin@example.com");
  });

  test("object-type displayName is rejected (prevents MongoDB operator injection)", async () => {
    const res = await request(app)
      .patch("/api/parent/profile")
      .send({ displayName: { $set: { role: "admin" } } });
    expect(res.status).toBe(400);
  });

  test("object-type email is rejected", async () => {
    const res = await request(app)
      .patch("/api/parent/profile")
      .send({ email: { $gt: "" } });
    expect(res.status).toBe(400);
  });
});
