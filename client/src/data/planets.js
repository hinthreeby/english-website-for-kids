import mercuryImg from "../assets/streak_planet/mercury.png";
import venusImg   from "../assets/streak_planet/venus.png";
import earthImg   from "../assets/streak_planet/earth.png";
import marsImg    from "../assets/streak_planet/mars.png";
import jupiterImg from "../assets/streak_planet/jupiter.png";
import saturnImg  from "../assets/streak_planet/saturn.png";
import uranusImg  from "../assets/streak_planet/uranus.png";
import neptuneImg from "../assets/streak_planet/neptune.png";

export const PLANETS = [
  { id: "mercury", name: "Mercury", img: mercuryImg, requiredStreak: 2  },
  { id: "venus",   name: "Venus",   img: venusImg,   requiredStreak: 4  },
  { id: "earth",   name: "Earth",   img: earthImg,   requiredStreak: 6  },
  { id: "mars",    name: "Mars",    img: marsImg,    requiredStreak: 8  },
  { id: "jupiter", name: "Jupiter", img: jupiterImg, requiredStreak: 10 },
  { id: "saturn",  name: "Saturn",  img: saturnImg,  requiredStreak: 12 },
  { id: "uranus",  name: "Uranus",  img: uranusImg,  requiredStreak: 14 },
  { id: "neptune", name: "Neptune", img: neptuneImg, requiredStreak: 16 },
];

export const getPlanetById = (id) => PLANETS.find((p) => p.id === id);

export const getNextPlanet = (streak) =>
  PLANETS.find((p) => p.requiredStreak > streak) ?? null;
