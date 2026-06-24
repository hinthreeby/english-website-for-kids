const express = require("express");
const router = express.Router();
const { protect, isTeacher } = require("../middleware/authMiddleware");
const env = require("../config/env");

// GET /api/images/search?q=keyword&page=1
router.get("/search", protect, isTeacher, async (req, res) => {
  const { q, page = 1 } = req.query;
  if (!q?.trim()) return res.status(400).json({ error: "Query required" });

  const apiKey = env.PIXABAY_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "Image search not configured. Add PIXABAY_API_KEY to your .env file.",
      setup: "Get a free key at https://pixabay.com/api/docs/",
    });
  }

  try {
    const url = new URL("https://pixabay.com/api/");
    url.searchParams.set("key",         apiKey);
    url.searchParams.set("q",           q.trim());
    url.searchParams.set("image_type",  "photo");
    url.searchParams.set("safesearch",  "true");
    url.searchParams.set("per_page",    "20");
    url.searchParams.set("page",        String(page));
    url.searchParams.set("lang",        "en");

    const resp = await fetch(url.toString());

    if (!resp.ok) {
      return res.status(resp.status).json({ error: `Pixabay API error ${resp.status}` });
    }

    const data = await resp.json();
    const images = (data.hits || []).map((hit) => ({
      url:       hit.largeImageURL,
      thumbnail: hit.previewURL,
      title:     hit.tags,
      width:     hit.imageWidth,
      height:    hit.imageHeight,
      user:      hit.user,
    }));

    res.json({ images, total: data.totalHits });
  } catch (err) {
    res.status(500).json({ error: "Image search failed" });
  }
});

module.exports = router;
