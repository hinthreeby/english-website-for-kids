/**
 * Auto-seed "Map 1 – Planet Adventure" if no roadmap exists in the DB.
 * Called once on server startup after MongoDB connects.
 * Safe to call multiple times — no-op if the roadmap already exists.
 */

const Roadmap     = require("../models/Roadmap");
const RoadmapUnit = require("../models/RoadmapUnit");

const UNITS = [
  { unitNumber:1, name:"Unit 1", planetName:"Mercury", imageKey:"mercury", order:1, isLockedDefault:false, description:"Explore Mercury, the closest planet to the Sun!" },
  { unitNumber:2, name:"Unit 2", planetName:"Venus",   imageKey:"venus",   order:2, isLockedDefault:true,  description:"Discover Venus, the hottest planet in our solar system!" },
  { unitNumber:3, name:"Unit 3", planetName:"Earth",   imageKey:"earth",   order:3, isLockedDefault:true,  description:"Learn about Earth, our beautiful home planet!" },
  { unitNumber:4, name:"Unit 4", planetName:"Mars",    imageKey:"mars",    order:4, isLockedDefault:true,  description:"Journey to Mars, the Red Planet!" },
  { unitNumber:5, name:"Unit 5", planetName:"Jupiter", imageKey:"jupiter", order:5, isLockedDefault:true,  description:"Visit Jupiter, the largest planet in the solar system!" },
  { unitNumber:6, name:"Unit 6", planetName:"Saturn",  imageKey:"saturn",  order:6, isLockedDefault:true,  description:"Admire Saturn and its magnificent rings!" },
  { unitNumber:7, name:"Unit 7", planetName:"Uranus",  imageKey:"uranus",  order:7, isLockedDefault:true,  description:"Explore Uranus, the ice giant that spins sideways!" },
  { unitNumber:8, name:"Unit 8", planetName:"Neptune", imageKey:"neptune", order:8, isLockedDefault:true,  description:"Venture to Neptune, the windiest planet!" },
  { unitNumber:9, name:"Unit 9", planetName:"Pluto",   imageKey:"pluto",   order:9, isLockedDefault:true,  description:"Visit Pluto, the beloved dwarf planet!" },
];

async function autoSeedRoadmap() {
  try {
    const existing = await Roadmap.findOne({ title: "MAP 1 - PLANET ADVENTURE" });
    if (existing) return;

    const roadmap = await Roadmap.create({
      title:       "MAP 1 - PLANET ADVENTURE",
      description: "Learn English through the Solar System",
      theme:       "space",
      order:       1,
      isActive:    true,
    });

    const unitDocs = await RoadmapUnit.insertMany(
      UNITS.map(u => ({ ...u, roadmapId: roadmap._id, questions: [] }))
    );

    roadmap.units = unitDocs.map(u => u._id);
    await roadmap.save();

    console.log("[AUTO-SEED] ✅ Roadmap 'Map 1 – Planet Adventure' created with 9 units.");
  } catch (err) {
    console.error("[AUTO-SEED] ⚠️  Could not seed roadmap:", err.message);
  }
}

module.exports = autoSeedRoadmap;
