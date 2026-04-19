const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const Inventory = require("../models/UserInventory");

const router = express.Router();

const ROOM_TYPES = ["living_room", "kitchen", "bedroom", "bathroom", "dining_room"];

router.get("/inventory", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("totalStars username");
    if (!user) {
      return res.status(404).json({ error: "USER_NOT_FOUND" });
    }

    let inventory = await Inventory.findOne({ userId: req.user.id });
    if (!inventory) {
      inventory = await Inventory.create({ userId: req.user.id });
    }

    return res.json({ totalStars: user.totalStars, inventory });
  } catch (_err) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/buy", authMiddleware, async (req, res) => {
  const { itemId, itemType, price } = req.body;

  try {
    const normalizedPrice = Number(price);
    if (!itemId || !itemType || !Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
      return res.status(400).json({ error: "INVALID_PAYLOAD" });
    }

    if (!["house", "car", "room"].includes(itemType)) {
      return res.status(400).json({ error: "INVALID_ITEM_TYPE" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "USER_NOT_FOUND" });
    }

    if (user.totalStars < normalizedPrice) {
      return res.status(400).json({
        error: "NOT_ENOUGH_STARS",
        message: "Not enough stars! Play more games to earn stars!",
        currentStars: user.totalStars,
        required: normalizedPrice,
      });
    }

    let inventory = await Inventory.findOne({ userId: req.user.id });
    if (!inventory) {
      inventory = await Inventory.create({ userId: req.user.id });
    }

    const owned = [...inventory.ownedHouses, ...inventory.ownedCars, ...inventory.ownedRooms];
    if (owned.includes(itemId)) {
      return res.status(400).json({ error: "ALREADY_OWNED" });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $inc: { totalStars: -normalizedPrice },
    });

    const updateField =
      itemType === "house" ? "ownedHouses" : itemType === "car" ? "ownedCars" : "ownedRooms";

    await Inventory.findOneAndUpdate(
      { userId: req.user.id },
      { $push: { [updateField]: itemId } },
      { new: true }
    );

    const updatedUser = await User.findById(req.user.id).select("totalStars");
    return res.json({ success: true, newStarBalance: updatedUser?.totalStars ?? 0 });
  } catch (_err) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/equip", authMiddleware, async (req, res) => {
  const { itemId, itemType, roomType } = req.body;

  try {
    if (!itemId || !itemType) {
      return res.status(400).json({ error: "INVALID_PAYLOAD" });
    }

    let updateField;
    if (itemType === "house") {
      updateField = "equippedHouse";
    } else if (itemType === "car") {
      updateField = "equippedCar";
    } else if (itemType === "room") {
      if (!ROOM_TYPES.includes(roomType)) {
        return res.status(400).json({ error: "INVALID_ROOM_TYPE" });
      }
      updateField = `equippedRooms.${roomType}`;
    } else {
      return res.status(400).json({ error: "INVALID_ITEM_TYPE" });
    }

    let inventory = await Inventory.findOne({ userId: req.user.id });
    if (!inventory) {
      inventory = await Inventory.create({ userId: req.user.id });
    }

    const isOwned =
      itemType === "house"
        ? inventory.ownedHouses.includes(itemId)
        : itemType === "car"
          ? inventory.ownedCars.includes(itemId)
          : inventory.ownedRooms.includes(itemId);

    if (!isOwned) {
      return res.status(400).json({ error: "NOT_OWNED" });
    }

    await Inventory.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { [updateField]: itemId } },
      { new: true }
    );

    return res.json({ success: true });
  } catch (_err) {
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
