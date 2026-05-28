/**
 * Seed script for Map 1 - Planet Adventure
 * Run: node server/seed/seedRoadmap.js
 *
 * Safe to re-run — checks by title before inserting.
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Roadmap = require("../models/Roadmap");
const RoadmapUnit = require("../models/RoadmapUnit");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/fun-english";

const UNITS = [
  { unitNumber: 1, name: "Unit 1", planetName: "Mercury", imageKey: "mercury", order: 1, isLockedDefault: false, description: "Explore Mercury, the closest planet to the Sun!" },
  { unitNumber: 2, name: "Unit 2", planetName: "Venus",   imageKey: "venus",   order: 2, isLockedDefault: true,  description: "Discover Venus, the hottest planet in our solar system!" },
  { unitNumber: 3, name: "Unit 3", planetName: "Earth",   imageKey: "earth",   order: 3, isLockedDefault: true,  description: "Learn about Earth, our beautiful home planet!" },
  { unitNumber: 4, name: "Unit 4", planetName: "Mars",    imageKey: "mars",    order: 4, isLockedDefault: true,  description: "Journey to Mars, the Red Planet!" },
  { unitNumber: 5, name: "Unit 5", planetName: "Jupiter", imageKey: "jupiter", order: 5, isLockedDefault: true,  description: "Visit Jupiter, the largest planet in the solar system!" },
  { unitNumber: 6, name: "Unit 6", planetName: "Saturn",  imageKey: "saturn",  order: 6, isLockedDefault: true,  description: "Admire Saturn and its magnificent rings!" },
  { unitNumber: 7, name: "Unit 7", planetName: "Uranus",  imageKey: "uranus",  order: 7, isLockedDefault: true,  description: "Explore Uranus, the ice giant that spins on its side!" },
  { unitNumber: 8, name: "Unit 8", planetName: "Neptune", imageKey: "neptune", order: 8, isLockedDefault: true,  description: "Venture to Neptune, the windiest planet!" },
  { unitNumber: 9, name: "Unit 9", planetName: "Pluto",   imageKey: "pluto",   order: 9, isLockedDefault: true,  description: "Visit Pluto, the beloved dwarf planet at the edge of the solar system!" },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("[SEED] Connected to MongoDB");

  // Check if already exists
  const existing = await Roadmap.findOne({ title: "MAP 1 - PLANET ADVENTURE" });
  if (existing) {
    console.log("[SEED] Map 1 already exists, skipping.");
    await mongoose.disconnect();
    return;
  }

  // Create roadmap
  const roadmap = await Roadmap.create({
    title: "MAP 1 - PLANET ADVENTURE",
    description: "Learn English through the Solar System",
    theme: "space",
    order: 1,
    isActive: true,
  });
  console.log(`[SEED] Created roadmap: ${roadmap.title}`);

  // Create units
  const unitDocs = await RoadmapUnit.insertMany(
    UNITS.map((u) => ({ ...u, roadmapId: roadmap._id, questions: [] }))
  );
  console.log(`[SEED] Created ${unitDocs.length} units`);

  // Link units to roadmap
  roadmap.units = unitDocs.map((u) => u._id);
  await roadmap.save();

  console.log("[SEED] Done! Map 1 - Planet Adventure seeded successfully.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("[SEED] Error:", err.message);
  process.exit(1);
});
