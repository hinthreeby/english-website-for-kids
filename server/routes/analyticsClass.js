const express = require("express");
const router = express.Router();
const { protect, isTeacher } = require("../middleware/authMiddleware");
const Classroom = require("../models/Classroom");
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

async function verifyClassAccess(req, res) {
  const classroom = await Classroom.findById(req.params.classId).lean();
  if (!classroom || classroom.teacherId.toString() !== req.user._id.toString()) {
    res.status(403).json({ error: "Not your classroom" });
    return null;
  }
  return classroom;
}

// GET /api/classes/:classId/average-scores
router.get("/:classId/average-scores", protect, isTeacher, async (req, res) => {
  try {
    const classroom = await verifyClassAccess(req, res);
    if (!classroom) return;

    const cacheKey = `class-avg-scores:${req.params.classId}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const studentIds = classroom.students;
    if (!studentIds.length) return res.json({ data: [] });

    const raw = await GameResult.aggregate([
      { $match: { userId: { $in: studentIds } } },
      {
        $group: {
          _id: "$gameId",
          avgStars: { $avg: "$starsEarned" },
          totalPlays: { $sum: 1 },
        },
      },
      { $sort: { avgStars: -1 } },
    ]);

    const data = raw.map((r) => ({
      gameId: r._id,
      avgStars: Math.round(r.avgStars * 100) / 100,
      totalPlays: r.totalPlays,
    }));

    const result = { data };
    cache.set(cacheKey, result, 3_600_000);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/classes/:classId/students-analytics?sort=stars&order=desc&page=1&limit=20&filter=
router.get("/:classId/students-analytics", protect, isTeacher, async (req, res) => {
  try {
    const classroom = await verifyClassAccess(req, res);
    if (!classroom) return;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const sort = ["stars", "streak", "name", "completion"].includes(req.query.sort)
      ? req.query.sort
      : "stars";
    const order = req.query.order === "asc" ? 1 : -1;
    const filter = (req.query.filter || "").trim().toLowerCase();

    const studentIds = classroom.students;
    if (!studentIds.length) return res.json({ data: [], total: 0, page, limit });

    const [students, gameAgg] = await Promise.all([
      User.find({ _id: { $in: studentIds } })
        .select("username displayName totalStars currentStreak lastPlayedDate")
        .lean(),
      GameResult.aggregate([
        { $match: { userId: { $in: studentIds } } },
        {
          $group: {
            _id: { userId: "$userId", gameId: "$gameId" },
          },
        },
        {
          $group: {
            _id: "$_id.userId",
            distinctGames: { $sum: 1 },
          },
        },
      ]),
    ]);

    const gameCountMap = new Map(gameAgg.map((g) => [g._id.toString(), g.distinctGames]));
    const total = VALID_GAME_IDS.length;

    let rows = students.map((s) => {
      const distinctGames = gameCountMap.get(s._id.toString()) || 0;
      const completionRate = Math.round((Math.min(distinctGames, total) / total) * 100);
      return {
        _id: s._id,
        name: s.displayName || s.username,
        username: s.username,
        totalStars: s.totalStars || 0,
        currentStreak: s.currentStreak || 0,
        lastPlayedDate: s.lastPlayedDate || null,
        completionRate,
        distinctGames,
      };
    });

    if (filter) {
      rows = rows.filter((r) => r.name.toLowerCase().includes(filter) || r.username.toLowerCase().includes(filter));
    }

    const sortKey = { stars: "totalStars", streak: "currentStreak", name: "name", completion: "completionRate" }[sort];
    rows.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string") return order * av.localeCompare(bv);
      return order * (av - bv);
    });

    const totalCount = rows.length;
    const paged = rows.slice((page - 1) * limit, page * limit);

    return res.json({ data: paged, total: totalCount, page, limit });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/classes/:classId/completion-summary
router.get("/:classId/completion-summary", protect, isTeacher, async (req, res) => {
  try {
    const classroom = await verifyClassAccess(req, res);
    if (!classroom) return;

    const cacheKey = `class-completion-summary:${req.params.classId}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const studentIds = classroom.students;
    if (!studentIds.length) return res.json({ completed: 0, pending: 0, rate: 0 });

    const totalPossible = studentIds.length * VALID_GAME_IDS.length;

    const raw = await GameResult.aggregate([
      { $match: { userId: { $in: studentIds }, gameId: { $in: VALID_GAME_IDS } } },
      {
        $group: {
          _id: { userId: "$userId", gameId: "$gameId" },
        },
      },
      { $count: "completed" },
    ]);

    const completed = raw[0]?.completed || 0;
    const pending = totalPossible - completed;
    const rate = Math.round((completed / totalPossible) * 100);

    const result = { completed, pending, rate, totalPossible };
    cache.set(cacheKey, result, 3_600_000);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/classes/:classId/progress-history?weeks=8
router.get("/:classId/progress-history", protect, isTeacher, async (req, res) => {
  try {
    const classroom = await verifyClassAccess(req, res);
    if (!classroom) return;

    const weeks = Math.min(Math.max(parseInt(req.query.weeks, 10) || 8, 2), 26);
    const cacheKey = `class-progress-history:${req.params.classId}:${weeks}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const studentIds = classroom.students;
    if (!studentIds.length) return res.json({ data: [] });

    const since = new Date();
    since.setDate(since.getDate() - weeks * 7);

    const raw = await GameResult.aggregate([
      { $match: { userId: { $in: studentIds }, completedAt: { $gte: since } } },
      {
        $group: {
          _id: {
            year: { $year: "$completedAt" },
            week: { $isoWeek: "$completedAt" },
          },
          avgStars: { $avg: "$starsEarned" },
          totalPlays: { $sum: 1 },
          date: { $min: "$completedAt" },
        },
      },
      { $sort: { date: 1 } },
    ]);

    const data = raw.map((r) => ({
      date: r.date,
      avgStars: Math.round(r.avgStars * 100) / 100,
      totalPlays: r.totalPlays,
      label: `W${String(r._id.week).padStart(2, "0")}`,
    }));

    const result = { data };
    cache.set(cacheKey, result, 3_600_000);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
