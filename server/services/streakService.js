const PLANETS = [
  { id: "mercury", name: "Mercury", requiredStreak: 2  },
  { id: "venus",   name: "Venus",   requiredStreak: 4  },
  { id: "earth",   name: "Earth",   requiredStreak: 6  },
  { id: "mars",    name: "Mars",    requiredStreak: 8  },
  { id: "jupiter", name: "Jupiter", requiredStreak: 10 },
  { id: "saturn",  name: "Saturn",  requiredStreak: 12 },
  { id: "uranus",  name: "Uranus",  requiredStreak: 14 },
  { id: "neptune", name: "Neptune", requiredStreak: 16 },
];

const BONUS_STARS = 50;

const normalizeDate = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getDayGap = (from, to) =>
  Math.round((normalizeDate(to) - normalizeDate(from)) / 86_400_000);

/**
 * Compute new streak value based on lastPlayedDate.
 * Returns { newStreak, streakBroken, dayGap }
 */
function computeNewStreak(currentStreak, lastPlayedDate, now = new Date()) {
  if (!lastPlayedDate) {
    return { newStreak: 1, streakBroken: false, dayGap: null };
  }
  const dayGap = getDayGap(lastPlayedDate, now);
  if (dayGap === 0) {
    return { newStreak: currentStreak || 1, streakBroken: false, dayGap };
  }
  if (dayGap === 1) {
    return { newStreak: (currentStreak || 0) + 1, streakBroken: false, dayGap };
  }
  return { newStreak: 1, streakBroken: true, dayGap };
}

/**
 * Returns planet ids that should be unlocked for a given streak value.
 */
function getPlanetsForStreak(streak) {
  return PLANETS.filter((p) => streak >= p.requiredStreak).map((p) => p.id);
}

/**
 * Merges newly earned planets with existing, returns update info.
 */
function computePlanetUpdate(existingPlanets, newStreak) {
  const earned = getPlanetsForStreak(newStreak);
  const newlyUnlocked = earned.filter((p) => !existingPlanets.includes(p));
  const updatedPlanets = [...new Set([...existingPlanets, ...earned])];
  return {
    updatedPlanets,
    newlyUnlocked,                         // array (may be empty)
    newPlanet: newlyUnlocked[newlyUnlocked.length - 1] ?? null, // latest one
    allUnlocked: updatedPlanets.length === PLANETS.length,
  };
}

/**
 * Returns next planet info relative to current streak.
 */
function getNextPlanet(streak) {
  const next = PLANETS.find((p) => p.requiredStreak > streak);
  return next
    ? { ...next, daysLeft: next.requiredStreak - streak }
    : null;
}

module.exports = {
  PLANETS,
  BONUS_STARS,
  getDayGap,
  computeNewStreak,
  getPlanetsForStreak,
  computePlanetUpdate,
  getNextPlanet,
};
