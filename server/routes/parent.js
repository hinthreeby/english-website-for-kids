const express = require("express");
const router = express.Router();
const { protect, isParent } = require("../middleware/authMiddleware");
const User = require("../models/User");
const GameResult = require("../models/GameResult");

router.get("/children", protect, isParent, async (req, res) => {
  try {
    const parent = await User.findById(req.user._id).populate("children", "-password");
    return res.json({ children: parent?.children || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/child/:childId/progress", protect, isParent, async (req, res) => {
  try {
    const child = await User.findById(req.params.childId);
    if (!child || child.parentId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not your child" });
    }

    const results = await GameResult.find({ userId: req.params.childId })
      .sort({ completedAt: -1 })
      .limit(50);

    return res.json({
      child: {
        username: child.username,
        displayName: child.displayName,
        totalStars: child.totalStars,
        currentStreak: child.currentStreak,
      },
      results,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/create-child", protect, isParent, async (req, res) => {
  const { username, password, displayName, age, pin } = req.body;
  try {
    const child = await User.create({
      username,
      password,
      displayName,
      age,
      pin,
      role: "child",
      parentId: req.user._id,
      isApproved: true,
    });

    await User.findByIdAndUpdate(req.user._id, {
      $push: { children: child._id },
    });

    return res.status(201).json({ child });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

module.exports = router;
