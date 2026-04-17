export const games = [
  {
    id: "abc-letters",
    name: "ABC Letters",
    emoji: "🔤",
    theme: "#B2EBF2",
    subtitle: "Find the starting sound",
  },
  {
    id: "picture-words",
    name: "Picture Words",
    emoji: "🖼️",
    theme: "#FFFDE7",
    subtitle: "Tap the right word",
  },
  {
    id: "count-learn",
    name: "Count Learn",
    emoji: "🔢",
    theme: "#A8D8A8",
    subtitle: "Count and choose",
  },
  {
    id: "color-fun",
    name: "Color Fun",
    emoji: "🎨",
    theme: "#FFD7A6",
    subtitle: "Name the color",
  },
  {
    id: "animal-sounds",
    name: "Animal Sounds",
    emoji: "🐾",
    theme: "#FFD9D9",
    subtitle: "Guess the animal",
  },
  {
    id: "match-it",
    name: "Match It",
    emoji: "🧩",
    theme: "#D9F3FF",
    subtitle: "Pair emoji and words",
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
