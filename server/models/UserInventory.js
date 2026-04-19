const mongoose = require("mongoose");

const userInventorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    equippedHouse: { type: String, default: null },
    equippedCar: { type: String, default: null },
    equippedRooms: {
      living_room: { type: String, default: null },
      kitchen: { type: String, default: null },
      bedroom: { type: String, default: null },
      bathroom: { type: String, default: null },
      dining_room: { type: String, default: null },
    },
    ownedHouses: [{ type: String }],
    ownedCars: [{ type: String }],
    ownedRooms: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserInventory", userInventorySchema);
