const seaStoryCover = "/story/sea_story/MIA_SEA_STORY.png";
const luckyCoinCover = "/story/Lucky_coin/Lucky_coin.png";
const lilyCover = "/story/Lily/Lily.png";

export const storySeries = [
  {
    id: "sea-adventure",
    title: "Sea Adventure",
    description: "Dive deep with Mia as she uncovers magical secrets beneath the waves!",
    thumbnail: seaStoryCover,
    theme: "#42B8FF",
    currentEpisode: 1,
    episodes: [
      { id: 1, title: "The Deep Blue", videoPath: "/story/sea_story/MIA_SEA_STORY.mp4", duration: "4:10" },
      { id: 2, title: "The Hidden Cave", videoPath: "/story/sea_story/MIA_SEA_STORY.mp4", duration: "3:55" },
      { id: 3, title: "The Pearl Kingdom", videoPath: "/story/sea_story/MIA_SEA_STORY.mp4", duration: "4:25" },
      { id: 4, title: "The Storm Returns", videoPath: "/story/sea_story/MIA_SEA_STORY.mp4", duration: "3:40" },
      { id: 5, title: "Friends of the Sea", videoPath: "/story/sea_story/MIA_SEA_STORY.mp4", duration: "4:00" },
      { id: 6, title: "Home at Last", videoPath: "/story/sea_story/MIA_SEA_STORY.mp4", duration: "4:15" },
    ],
  },
  {
    id: "lily-journey",
    title: "Lily's Journey",
    description: "Follow Lily through bright and joyful learning adventures every day!",
    thumbnail: lilyCover,
    theme: "#FF89C2",
    currentEpisode: 1,
    episodes: [
      { id: 1, title: "A New Day", videoPath: "/story/Lily/Lily.mp4", duration: "3:30" },
      { id: 2, title: "The Garden Surprise", videoPath: "/story/Lily/Lily.mp4", duration: "3:20" },
      { id: 3, title: "Making New Friends", videoPath: "/story/Lily/Lily.mp4", duration: "3:45" },
      { id: 4, title: "The Big Show", videoPath: "/story/Lily/Lily.mp4", duration: "3:55" },
    ],
  },
];

export const quickVideos = [
  {
    id: "secret-of-the-sea",
    title: "Secret of the Sea",
    description: "Uncover magical secrets beneath the waves.",
    emoji: "🌊",
    thumbnail: seaStoryCover,
    theme: "#42B8FF",
    videoPath: "/story/sea_story/MIA_SEA_STORY.mp4",
    duration: "12:30",
  },
  {
    id: "lucky-coin",
    title: "Lucky Coin",
    description: "Join the adventure to find the magical lucky coin.",
    emoji: "🪙",
    thumbnail: luckyCoinCover,
    theme: "#FFD700",
    videoPath: "/story/Lucky_coin/Lucky_coin.mp4",
    duration: "10:45",
  },
  {
    id: "lily",
    title: "Lily",
    description: "Follow Lily on a bright and joyful learning journey.",
    emoji: "🌼",
    thumbnail: lilyCover,
    theme: "#FF89C2",
    videoPath: "/story/Lily/Lily.mp4",
    duration: "09:30",
  },
];

export const songs = [
  {
    id: "abc-song",
    title: "ABC Song",
    emoji: "🔤",
    theme: "#FF6B9D",
    duration: "2:30",
    audioPath: "/songs/abc-song.mp3",
  },
  {
    id: "wheels-on-the-bus",
    title: "Wheels on the Bus",
    emoji: "🚌",
    theme: "#4ADE80",
    duration: "3:15",
    audioPath: "/songs/wheels-on-the-bus.mp3",
  },
  {
    id: "twinkle-star",
    title: "Twinkle Little Star",
    emoji: "⭐",
    theme: "#FFD700",
    duration: "2:00",
    audioPath: "/songs/twinkle-star.mp3",
  },
  {
    id: "if-youre-happy",
    title: "If You're Happy",
    emoji: "😊",
    theme: "#60A5FA",
    duration: "2:45",
    audioPath: "/songs/if-youre-happy.mp3",
  },
];

// Backward-compat alias used by StoryPlayerPage
export const stories = quickVideos;
