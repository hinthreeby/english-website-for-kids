import morningBg from "./morning.png";
import afternoonBg from "./afternoon.png";
import nightBg from "./night.png";

import house1 from "./house_1.png";
import house2 from "./house_2.png";
import house3 from "./house_3.png";
import house4 from "./house_4.png";
import house5 from "./house_5.png";

import livingRoom1 from "./living_room_1.png";
import livingRoom2 from "./living_room_2.png";
import kitchen1 from "./kitchen_1.png";
import kitchen2 from "./kitchen_2.png";
import bedroom1 from "./bedroom_1.png";
import bedroom2 from "./bedroom_2.png";
import bathroom1 from "./bathroom.png";
import diningRoom1 from "./dining_room_1.png";
import diningRoom2 from "./dining_room_2.png";

import car1 from "./car_1.png";
import car2 from "./car_2.png";
import car3 from "./car_3.png";
import car4 from "./car_4.png";
import bicycle from "./bicycle.png";

export const getTimeBackground = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return morningBg;
  if (hour >= 12 && hour < 18) return afternoonBg;
  return nightBg;
};

export const HOME_AUDIO = "/src/assets/shop/home.mp3";
export const CAR_AUDIO = "/src/assets/shop/car.mp3";

export const HOUSES = [
  { id: "house_1", name: "Cozy Cottage", image: house1, price: 50, tier: 1 },
  { id: "house_2", name: "Family House", image: house2, price: 120, tier: 2 },
  { id: "house_3", name: "Sunny Villa", image: house3, price: 190, tier: 3 },
  { id: "house_4", name: "Royal Manor", image: house4, price: 260, tier: 4 },
  { id: "house_5", name: "Dream Palace", image: house5, price: 330, tier: 5 },
];

export const ROOM_TYPES = {
  living_room: {
    label: "Living Room",
    emoji: "🛋️",
    items: [
      { id: "living_room_1", name: "Simple Living Room", image: livingRoom1, price: 30, tier: 1 },
      { id: "living_room_2", name: "Cozy Living Room", image: livingRoom2, price: 80, tier: 2 },
    ],
  },
  kitchen: {
    label: "Kitchen",
    emoji: "🍳",
    items: [
      { id: "kitchen_1", name: "Basic Kitchen", image: kitchen1, price: 30, tier: 1 },
      { id: "kitchen_2", name: "Modern Kitchen", image: kitchen2, price: 80, tier: 2 },
    ],
  },
  bedroom: {
    label: "Bedroom",
    emoji: "🛏️",
    items: [
      { id: "bedroom_1", name: "Simple Bedroom", image: bedroom1, price: 30, tier: 1 },
      { id: "bedroom_2", name: "Cozy Bedroom", image: bedroom2, price: 80, tier: 2 },
    ],
  },
  bathroom: {
    label: "Bathroom",
    emoji: "🛁",
    items: [{ id: "bathroom_1", name: "Simple Bathroom", image: bathroom1, price: 30, tier: 1 }],
  },
  dining_room: {
    label: "Dining Room",
    emoji: "🍽️",
    items: [
      { id: "dining_room_1", name: "Simple Dining", image: diningRoom1, price: 30, tier: 1 },
      { id: "dining_room_2", name: "Fancy Dining", image: diningRoom2, price: 80, tier: 2 },
    ],
  },
};

export const CARS = [
  { id: "car_1", name: "Little Red Car", image: car1, price: 40, tier: 1 },
  { id: "car_2", name: "Family Wagon", image: car2, price: 100, tier: 2 },
  { id: "car_3", name: "Turbo Cruiser", image: car3, price: 160, tier: 3 },
  { id: "car_4", name: "Galaxy Racer", image: car4, price: 220, tier: 4 },
  { id: "bicycle", name: "Happy Bicycle", image: bicycle, price: 25, tier: 1 },
];

export const ROOM_CATEGORY_LIST = [
  { id: "living_room", label: "Living Room", emoji: "🛋️" },
  { id: "kitchen", label: "Kitchen", emoji: "🍳" },
  { id: "bedroom", label: "Bedroom", emoji: "🛏️" },
  { id: "bathroom", label: "Bathroom", emoji: "🛁" },
  { id: "dining_room", label: "Dining Room", emoji: "🍽️" },
];
