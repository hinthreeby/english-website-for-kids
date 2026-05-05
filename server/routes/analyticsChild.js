const express = require("express");
const router = express.Router();
const { protect, isParent } = require("../middleware/authMiddleware");
const User = require("../models/User");
const GameResult = require("../models/GameResult");
const cache = require("../utils/cache");

const VALID_GAME_IDS = [
  "abc-letters",
  "picture-words",
  "count-learn",
  "color-fun",
  "animal-sounds",
  "match-it",
  "space-pronounce",
  "funny-animals",
  "clean-ocean-hero",
];

async function verifyChildAccess(req, res) {
  const child = await User.findById(req.params.childId).lean();
  if (!child || child.parentId?.toString() !== req.user._id.toString()) {
    res.status(403).json({ error: "Not your child" });
    return null;
  }
  return child;
}

// GET /api/children/:childId/score-history?period=weekly&limit=12
router.get("/:childId/score-history", protect, isParent, async (req, res) => {
  try {
    const child = await verifyChildAccess(req, res);
    if (!child) return;

    const period = req.query.period === "monthly" ? "monthly" : "weekly";
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 52);
    const cacheKey = `score-history:${req.params.childId}:${period}:${limit}`;

    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const groupId =
      period === "monthly"
        ? { year: { $year: "$completedAt" }, month: { $month: "$completedAt" } }
        : { year: { $year: "$completedAt" }, week: { $isoWeek: "$completedAt" } };

    const raw = await GameResult.aggregate([
      { $match: { userId: child._id } },
      {
        $group: {
          _id: groupId,
          stars: { $sum: "$starsEarned" },
          plays: { $sum: 1 },
          date: { $min: "$completedAt" },
        },
      },
      { $sort: { date: 1 } },
      { $limit: limit },
    ]);

    const data = raw.map((r) => ({
      date: r.date,
      stars: r.stars,
      plays: r.plays,
      label:
        period === "monthly"
          ? `${r._id.year}/${String(r._id.month).padStart(2, "0")}`
          : `W${String(r._id.week).padStart(2, "0")}`,
    }));

    const result = { data, period };
    cache.set(cacheKey, result, 3_600_000);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/children/:childId/scores-by-game-type
router.get("/:childId/scores-by-game-type", protect, isParent, async (req, res) => {
  try {
    const child = await verifyChildAccess(req, res);
    if (!child) return;

    const cacheKey = `scores-by-game:${req.params.childId}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const raw = await GameResult.aggregate([
      { $match: { userId: child._id } },
      {
        $group: {
          _id: "$gameId",
          avgStars: { $avg: "$starsEarned" },
          totalPlays: { $sum: 1 },
          totalStars: { $sum: "$starsEarned" },
        },
      },
      { $sort: { avgStars: -1 } },
    ]);

    const data = raw.map((r) => ({
      gameId: r._id,
      avgStars: Math.round(r.avgStars * 100) / 100,
      totalPlays: r.totalPlays,
      totalStars: r.totalStars,
    }));

    const result = { data };
    cache.set(cacheKey, result, 3_600_000);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/children/:childId/completion-rate
router.get("/:childId/completion-rate", protect, isParent, async (req, res) => {
  try {
    const child = await verifyChildAccess(req, res);
    if (!child) return;

    const cacheKey = `completion-rate:${req.params.childId}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const playedGames = await GameResult.distinct("gameId", { userId: child._id });
    const completed = playedGames.filter((g) => VALID_GAME_IDS.includes(g)).length;
    const total = VALID_GAME_IDS.length;
    const rate = Math.round((completed / total) * 100);

    const result = { completed, total, rate };
    cache.set(cacheKey, result, 3_600_000);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/children/:childId/play-calendar?days=30
router.get("/:childId/play-calendar", protect, isParent, async (req, res) => {
  try {
    const child = await verifyChildAccess(req, res);
    if (!child) return;

    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 7), 90);
    const cacheKey = `play-calendar:${req.params.childId}:${days}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const since = new Date();
    since.setDate(since.getDate() - days + 1);
    since.setHours(0, 0, 0, 0);

    const raw = await GameResult.aggregate([
      { $match: { userId: child._id, completedAt: { $gte: since } } },
      {
        $group: {
          _id: {
            year: { $year: "$completedAt" },
            month: { $month: "$completedAt" },
            day: { $dayOfMonth: "$completedAt" },
          },
          stars: { $sum: "$starsEarned" },
          plays: { $sum: 1 },
        },
      },
    ]);

    const playedMap = new Map(
      raw.map((r) => {
        const key = `${r._id.year}-${String(r._id.month).padStart(2, "0")}-${String(r._id.day).padStart(2, "0")}`;
        return [key, { stars: r.stars, plays: r.plays }];
      })
    );

    const calendar = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const entry = playedMap.get(key);
      calendar.push({
        date: key,
        played: !!entry,
        stars: entry?.stars || 0,
        plays: entry?.plays || 0,
      });
    }

    const result = { calendar, days };
    cache.set(cacheKey, result, 3_600_000);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
