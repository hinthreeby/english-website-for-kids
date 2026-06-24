const express = require("express");
const router = express.Router();
const { protect, isTeacher } = require("../middleware/authMiddleware");
const env = require("../config/env");

// GET /api/audio/search?q=keyword&page=1
router.get("/search", protect, isTeacher, async (req, res) => {
  const { q, page = 1 } = req.query;
  if (!q?.trim()) return res.status(400).json({ error: "Query required" });

  const apiKey = env.FREESOUND_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "Audio search not configured. Add FREESOUND_API_KEY to your .env file.",
      setup: "Get a free key at https://freesound.org/apiv2/apply/",
    });
  }

  try {
    const url = new URL("https://freesound.org/apiv2/search/text/");
    url.searchParams.set("query",    q.trim());
    url.searchParams.set("token",    apiKey);
    url.searchParams.set("fields",   "id,name,previews,tags,duration,username,license");
    url.searchParams.set("filter",   "duration:[0 TO 30]");
    url.searchParams.set("page_size", "20");
    url.searchParams.set("page",     String(page));

    const resp = await fetch(url.toString());
    if (!resp.ok) {
      return res.status(resp.status).json({ error: `Freesound API error ${resp.status}` });
    }

    const data = await resp.json();
    const sounds = (data.results || []).map((s) => ({
      id:       s.id,
      name:     s.name,
      preview:  s.previews?.["preview-hq-mp3"] || s.previews?.["preview-lq-mp3"] || "",
      duration: Math.round(s.duration),
      tags:     (s.tags || []).slice(0, 5).join(", "),
      user:     s.username,
    }));

    res.json({ sounds, total: data.count, hasMore: !!data.next });
  } catch (err) {
    res.status(500).json({ error: "Audio search failed" });
  }
});

module.exports = router;
