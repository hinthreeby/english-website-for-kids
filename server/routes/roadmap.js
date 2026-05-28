const express = require("express");
const router = express.Router();
const Roadmap = require("../models/Roadmap");
const RoadmapUnit = require("../models/RoadmapUnit");
const RoadmapProgress = require("../models/RoadmapProgress");
const { protect, requireRole } = require("../middleware/authMiddleware");

// GET /api/roadmaps — list all active roadmaps
router.get("/", async (req, res) => {
  try {
    const roadmaps = await Roadmap.find({ isActive: true })
      .sort({ order: 1 })
      .select("-units");
    res.json(roadmaps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/roadmaps/:id — roadmap detail with units (no questions)
router.get("/:id", async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id);
    if (!roadmap) return res.status(404).json({ error: "Roadmap not found" });

    const units = await RoadmapUnit.find({ roadmapId: roadmap._id, isActive: true })
      .sort({ order: 1 })
      .select("-questions");

    res.json({ ...roadmap.toObject(), units });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/roadmaps/:id/progress — get or create progress for current child
router.get("/:id/progress", protect, requireRole("child", "admin"), async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id);
    if (!roadmap) return res.status(404).json({ error: "Roadmap not found" });

    let progress = await RoadmapProgress.findOne({
      userId: req.user._id,
      roadmapId: roadmap._id,
    });

    if (!progress) {
      // Find unit 1 (order: 1) to unlock by default
      const firstUnit = await RoadmapUnit.findOne({
        roadmapId: roadmap._id,
        order: 1,
        isActive: true,
      });

      progress = await RoadmapProgress.create({
        userId: req.user._id,
        roadmapId: roadmap._id,
        completedUnits: [],
        unlockedUnits: firstUnit ? [firstUnit._id] : [],
        currentUnit: firstUnit ? firstUnit._id : null,
        stars: 0,
      });
    }

    res.json(progress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/roadmaps/units/:unitId — unit detail including questions
router.get("/units/:unitId", async (req, res) => {
  try {
    const unit = await RoadmapUnit.findById(req.params.unitId);
    if (!unit) return res.status(404).json({ error: "Unit not found" });
    res.json(unit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/roadmaps/units/:unitId/complete — child marks unit complete
router.post(
  "/units/:unitId/complete",
  protect,
  requireRole("child", "admin"),
  async (req, res) => {
    try {
      const unit = await RoadmapUnit.findById(req.params.unitId);
      if (!unit) return res.status(404).json({ error: "Unit not found" });

      let progress = await RoadmapProgress.findOne({
        userId: req.user._id,
        roadmapId: unit.roadmapId,
      });

      if (!progress) {
        return res.status(400).json({ error: "Progress not initialized. Load roadmap first." });
      }

      const unitId = unit._id;
      const alreadyCompleted = progress.completedUnits.some(
        (id) => id.toString() === unitId.toString()
      );

      if (!alreadyCompleted) {
        progress.completedUnits.push(unitId);
        progress.stars += 3;

        // Unlock the next unit
        const nextUnit = await RoadmapUnit.findOne({
          roadmapId: unit.roadmapId,
          order: unit.order + 1,
          isActive: true,
        });

        if (nextUnit) {
          const alreadyUnlocked = progress.unlockedUnits.some(
            (id) => id.toString() === nextUnit._id.toString()
          );
          if (!alreadyUnlocked) {
            progress.unlockedUnits.push(nextUnit._id);
            progress.currentUnit = nextUnit._id;
          }
        }

        progress.updatedAt = new Date();
        await progress.save();
      }

      res.json({ success: true, progress });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
