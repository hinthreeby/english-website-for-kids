const express = require("express");
const GameResult = require("../models/GameResult");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getDayGap = (fromDate, toDate) => {
  const start = normalizeDate(fromDate).getTime();
  const end = normalizeDate(toDate).getTime();
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
};

router.post("/save", authMiddleware, async (req, res) => {
  try {
    const { gameId, starsEarned } = req.body;

    if (!gameId || ![1, 2, 3].includes(starsEarned)) {
      return res.status(400).json({ message: "Invalid game result payload." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const now = new Date();

    if (!user.lastPlayedDate) {
      user.currentStreak = 1;
    } else {
      const dayGap = getDayGap(user.lastPlayedDate, now);
      if (dayGap === 1) {
        user.currentStreak += 1;
      } else if (dayGap > 1) {
        user.currentStreak = 1;
      }
    }

    user.lastPlayedDate = now;
    user.totalStars += starsEarned;

    await GameResult.create({
      userId: user._id,
      gameId,
      starsEarned,
      completedAt: now,
    });

    await user.save();

    return res.status(201).json({
      message: "Progress saved.",
      totals: {
        totalStars: user.totalStars,
        currentStreak: user.currentStreak,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to save progress." });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const [results, user] = await Promise.all([
      GameResult.find({ userId: req.user.id }).sort({ completedAt: -1 }),
      User.findById(req.user.id).select("username totalStars currentStreak"),
    ]);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({
      user,
      results,
      totalStars: user.totalStars,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch progress." });
  }
});

module.exports = router;
