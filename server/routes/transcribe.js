const express = require("express");
const multer  = require("multer");
const env     = require("../config/env");
const { chatLimiter } = require("../config/rateLimiters");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/", chatLimiter, upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No audio file." });
  if (!env.GROQ_API_KEY) return res.status(503).json({ error: "Groq API key not configured." });

  try {
    console.log("[transcribe] file:", req.file.originalname, "size:", req.file.size, "mime:", req.file.mimetype);

    const blob     = new Blob([req.file.buffer], { type: req.file.mimetype || "audio/webm" });
    const formData = new FormData();
    formData.append("file", blob, "audio.webm");
    formData.append("model", "whisper-large-v3-turbo");
    formData.append("language", "en");
    formData.append("response_format", "json");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.GROQ_API_KEY}` },
      body: formData,
      signal: AbortSignal.timeout(20_000),
    });

    const rawText = await response.text();
    console.log("[transcribe] Groq status:", response.status, "body:", rawText.slice(0, 300));

    if (!response.ok) throw new Error(`Groq ${response.status}: ${rawText}`);

    const data = JSON.parse(rawText);
    return res.json({ text: data.text?.trim() ?? "" });
  } catch (err) {
    console.error("[transcribe] ERROR:", err.message);
    return res.status(503).json({ error: err.message });
  }
});

module.exports = router;
