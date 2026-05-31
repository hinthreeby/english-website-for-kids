const express = require("express");
const { checkDrawing } = require("../services/aiVisionService");
const { drawLimiter } = require("../config/rateLimiters");

const router = express.Router();

// No auth required: stateless AI inference, guests can play too
router.post("/check", drawLimiter, async (req, res) => {
  const { imageBase64, keyword } = req.body;

  if (!imageBase64 || typeof imageBase64 !== "string")
    return res.status(400).json({ error: "imageBase64 is required." });
  if (!keyword || typeof keyword !== "string" || keyword.length > 50)
    return res.status(400).json({ error: "keyword is required." });
  // ~1MB base64 limit (covers up to 750KB JPEG image)
  if (imageBase64.length > 1_400_000)
    return res.status(400).json({ error: "Image too large." });

  try {
    const result = await checkDrawing(imageBase64, keyword.trim().toLowerCase());
    return res.json(result);
  } catch {
    return res.status(503).json({
      error: "AI service unavailable. Please try again later.",
    });
  }
});

module.exports = router;
