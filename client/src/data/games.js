import abcLettersThumb from "../assets/ABCLetters.png";
import pictureWordsThumb from "../assets/PictureWords.png";
import countLearnThumb from "../assets/CountLearn.png";
import colorFunThumb from "../assets/ColorFun.png";
import animalSoundsThumb from "../assets/AnimalSounds.png";
import matchItThumb from "../assets/MatchIt.png";
import spaceSpeakThumb from "../assets/space_speak.png";
import funnyAnimalAvatarThumb from "../assets/funny_animal_game/funny_animal_game_avatar.png";
import oceanGameAvatarThumb from "../assets/ocean_game/ocean_game_avatar.png";

export const games = [
  {
    id: "abc-letters",
    name: "ABC Letters",
    emoji: "🔤",
    thumbnail: abcLettersThumb,
    theme: "#B2EBF2",
    subtitle: "Find the starting sound",
  },
  {
    id: "picture-words",
    name: "Picture Words",
    emoji: "🖼️",
    thumbnail: pictureWordsThumb,
    theme: "#FFFDE7",
    subtitle: "Tap the right word",
  },
  {
    id: "count-learn",
    name: "Count Learn",
    emoji: "🔢",
    thumbnail: countLearnThumb,
    theme: "#A8D8A8",
    subtitle: "Count and choose",
  },
  {
    id: "color-fun",
    name: "Color Fun",
    emoji: "🎨",
    thumbnail: colorFunThumb,
    theme: "#FFD7A6",
    subtitle: "Name the color",
  },
  {
    id: "animal-sounds",
    name: "Animal Sounds",
    emoji: "🐾",
    thumbnail: animalSoundsThumb,
    theme: "#FFD9D9",
    subtitle: "Guess the animal",
  },
  {
    id: "match-it",
    name: "Match It",
    emoji: "🧩",
    thumbnail: matchItThumb,
    theme: "#D9F3FF",
    subtitle: "Pair emoji and words",
  },
  {
    id: "space-pronounce",
    name: "Space Pronounce",
    emoji: "🚀",
    thumbnail: spaceSpeakThumb,
    theme: "#7b2ff7",
    subtitle: "Say the word!",
    route: "/game/space-pronounce",
  },
  {
    id: "funny-animals",
    name: "Funny Animals",
    emoji: "🐾",
    thumbnail: funnyAnimalAvatarThumb,
    theme: "#4fffb0",
    subtitle: "Touch the animal!",
    route: "/game/funny-animals",
  },
  {
    id: "clean-ocean-hero",
    name: "Clean Ocean Hero",
    emoji: "🌊",
    thumbnail: oceanGameAvatarThumb,
    theme: "#42b8ff",
    subtitle: "Clean the sea and build sentences",
    route: "/game/clean-ocean-hero",
  },
];

export const gameById = games.reduce((acc, game) => {
  acc[game.id] = game;
  return acc;
}, {});

export const celebrationMessages = [
  "WOW!",
  "Super Star! ⭐",
  "Amazing!",
  "You did it! 🎉",
  "Brilliant!",
];
