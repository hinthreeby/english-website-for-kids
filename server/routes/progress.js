const express = require("express");
const GameResult = require("../models/GameResult");
const User = require("../models/User");
const Classroom = require("../models/Classroom");
const { protect, isChild } = require("../middleware/authMiddleware");
const {
  PLANETS,
  BONUS_STARS,
  computeNewStreak,
  computePlanetUpdate,
  getNextPlanet,
} = require("../services/streakService");

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
  // Roadmap unit games
  "family-photo",
  "school-find",
  "guest-merge",
];

router.post("/save", protect, isChild, async (req, res) => {
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

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const now = new Date();

    // Duplicate check (skip for guest-merge)
    if (gameId !== "guest-merge") {
      const duplicateWindow = new Date(now.getTime() - 5000);
      const recentDuplicate = await GameResult.findOne({
        userId: user._id,
        gameId,
        starsEarned: normalizedStars,
        completedAt: { $gte: duplicateWindow },
      });
      if (recentDuplicate) {
        return res.status(200).json({
          success: true,
          starsEarned: normalizedStars,
          totalStars: user.totalStars,
          streak: user.currentStreak,
          planetsUnlocked: user.planetsUnlocked,
          newPlanet: null,
          bonusAwarded: false,
          duplicate: true,
        });
      }
    }

    // Streak computation
    const { newStreak } = computeNewStreak(
      user.currentStreak,
      user.lastPlayedDate,
      now
    );

    // Planet computation
    const { updatedPlanets, newPlanet, allUnlocked } = computePlanetUpdate(
      user.planetsUnlocked || [],
      newStreak
    );

    // Bonus stars if all planets just unlocked
    const bonusAwarded = allUnlocked && !user.allPlanetsBonus;
    const bonusStars = bonusAwarded ? BONUS_STARS : 0;

    await GameResult.create({ userId: user._id, gameId, starsEarned: normalizedStars, completedAt: now });

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $inc: { totalStars: normalizedStars + bonusStars },
        $set: {
          currentStreak: newStreak,
          lastPlayedDate: now,
          planetsUnlocked: updatedPlanets,
          ...(bonusAwarded && { allPlanetsBonus: true }),
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
      planetsUnlocked: updatedUser.planetsUnlocked,
      newPlanet,
      bonusAwarded,
      bonusStars,
      totals: {
        totalStars: updatedUser.totalStars,
        currentStreak: updatedUser.currentStreak,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to save progress." });
  }
});

router.get("/me", protect, isChild, async (req, res) => {
  try {
    const [results, user] = await Promise.all([
      GameResult.find({ userId: req.user._id }).sort({ completedAt: -1 }),
      User.findById(req.user._id).select("username totalStars currentStreak planetsUnlocked"),
    ]);
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.json({ user, results, totalStars: user.totalStars });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch progress." });
  }
});

router.get("/planets", protect, isChild, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "currentStreak planetsUnlocked allPlanetsBonus totalStars"
    );
    if (!user) return res.status(404).json({ message: "User not found." });

    const existing = user.planetsUnlocked || [];
    const { updatedPlanets, newlyUnlocked, allUnlocked } = computePlanetUpdate(
      existing,
      user.currentStreak
    );

    // Retroactively save any planets missing from DB
    if (newlyUnlocked.length > 0) {
      const bonusAwarded = allUnlocked && !user.allPlanetsBonus;
      await User.findByIdAndUpdate(user._id, {
        $set: {
          planetsUnlocked: updatedPlanets,
          ...(bonusAwarded && { allPlanetsBonus: true }),
        },
        ...(bonusAwarded && { $inc: { totalStars: BONUS_STARS } }),
      });
    }

    const nextPlanet = getNextPlanet(user.currentStreak);
    return res.json({
      streak: user.currentStreak,
      planetsUnlocked: updatedPlanets,
      allPlanets: PLANETS,
      nextPlanet,
      allPlanetsBonus: user.allPlanetsBonus,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch planets." });
  }
});

router.get("/classrooms", protect, isChild, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("classrooms", "name joinCode teacherId").lean();
    const classrooms = (user?.classrooms || []).map((c) => ({
      _id: c._id,
      name: c.name,
      joinCode: c.joinCode,
    }));
    return res.json({ classrooms });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/join-classroom", protect, isChild, async (req, res) => {
  const { joinCode } = req.body;
  if (!joinCode?.trim())
    return res.status(400).json({ error: "Join code is required." });

  try {
    const classroom = await Classroom.findOne({ joinCode: joinCode.trim().toUpperCase() });
    if (!classroom)
      return res.status(404).json({ error: "Classroom not found. Check the join code." });
    if (!classroom.isActive)
      return res.status(400).json({ error: "This classroom is no longer active." });

    const alreadyIn = classroom.students.some((id) => id.toString() === req.user._id.toString());
    if (alreadyIn)
      return res.status(400).json({ error: "You are already in this classroom." });

    await Promise.all([
      Classroom.findByIdAndUpdate(classroom._id, { $push: { students: req.user._id } }),
      User.findByIdAndUpdate(req.user._id, { $push: { classrooms: classroom._id } }),
    ]);

    return res.json({ success: true, classroomName: classroom.name });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
