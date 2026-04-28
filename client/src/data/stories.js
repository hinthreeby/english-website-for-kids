import seaStoryCover from "../assets/story/sea_story/MIA_SEA_STORY.png";
import luckyCoinCover from "../assets/story/Lucky_coin/Lucky_coin.png";
import lilyCover from "../assets/story/Lily/Lily.png";

export const stories = [
  {
    id: "secret-of-the-sea",
    title: "Secret of the Sea",
    description: "Uncover magical secrets beneath the waves.",
    emoji: "🌊",
    thumbnail: seaStoryCover,
    theme: "#42B8FF",
    videoPath: "/src/assets/story/sea_story/MIA_SEA_STORY.mp4",
    duration: "12:30",
  },
  {
    id: "lucky-coin",
    title: "Lucky Coin",
    description: "Join the adventure to find the magical lucky coin.",
    emoji: "🪙",
    thumbnail: luckyCoinCover,
    theme: "#FFD700",
    videoPath: "/src/assets/story/Lucky_coin/Lucky_coin.mp4",
    duration: "10:45",
  },
  {
    id: "lily",
    title: "Lily",
    description: "Follow Lily on a bright and joyful learning journey.",
    emoji: "🌼",
    thumbnail: lilyCover,
    theme: "#FF89C2",
    videoPath: "/src/assets/story/Lily/Lily.mp4",
    duration: "09:30",
  },
];
