const express = require("express");
const GameResult = require("../models/GameResult");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

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
  "story-puppy-adventure",
  "guest-merge",
];

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
    const normalizedStars = Number(starsEarned);

    if (!gameId || !Number.isFinite(normalizedStars)) {
      return res.status(400).json({ message: "Invalid game result payload." });
    }

    if (!VALID_GAME_IDS.includes(gameId)) {
      return res.status(400).json({ message: "Invalid gameId." });
    }

    if (normalizedStars < 0 || normalizedStars > 3) {
      return res.status(400).json({ message: "starsEarned must be between 0 and 3." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const now = new Date();

    if (gameId !== "guest-merge") {
      const duplicateWindow = new Date(now.getTime() - 5000);
      const recentDuplicate = await GameResult.findOne({
        userId: user._id,
        gameId,
        starsEarned: normalizedStars,
        completedAt: { $gte: duplicateWindow },
      }).sort({ completedAt: -1 });

      if (recentDuplicate) {
        return res.status(200).json({
          success: true,
          starsEarned: normalizedStars,
          totalStars: user.totalStars,
          streak: user.currentStreak,
          totals: {
            totalStars: user.totalStars,
            currentStreak: user.currentStreak,
          },
          duplicate: true,
        });
      }
    }

    let newStreak = user.currentStreak || 0;
    if (!user.lastPlayedDate) {
      newStreak = 1;
    } else {
      const dayGap = getDayGap(user.lastPlayedDate, now);
      if (dayGap === 1) {
        newStreak += 1;
      } else if (dayGap > 1) {
        newStreak = 1;
      }
    }

    await GameResult.create({
      userId: user._id,
      gameId,
      starsEarned: normalizedStars,
      completedAt: now,
    });

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $inc: { totalStars: normalizedStars },
        $set: {
          currentStreak: newStreak,
          lastPlayedDate: now,
        },
      },
      { new: true }
    );

    return res.status(201).json({
      success: true,
      message: "Progress saved.",
      starsEarned: normalizedStars,
      totalStars: updatedUser.totalStars,
      streak: updatedUser.currentStreak,
      totals: {
        totalStars: updatedUser.totalStars,
        currentStreak: updatedUser.currentStreak,
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
