# Fun English — Project Overview

## What it is
An interactive English learning platform for children, with role-based access for children, parents, teachers, and admins. Children play games and read stories to learn English; parents and teachers monitor progress; admins manage the system.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS 4, React Router v7 |
| Backend | Express.js 5, Node.js |
| Database | MongoDB (Mongoose 9) |
| Auth | JWT + bcryptjs, stored in HTTP-only cookies |
| Animations | Framer Motion, canvas-confetti |
| HTTP client | Axios (proxied via Vite to `http://localhost:5000`) |

## Running the project

```bash
# From project root — starts both client (5173) and server (5000) concurrently
npm run dev

# Client only
cd client && npm run dev

# Server only
cd server && npm run dev
```

## Environment variables (server/.env)
```
MONGODB_URI=mongodb://localhost:27017/funEnglish
JWT_SECRET=your_secret_here
PORT=5000
CLIENT_URL=http://localhost:5173
```

## User Roles

| Role | Key capabilities |
|------|----------------|
| `child` | Play games, read stories, buy items in shop, decorate room |
| `parent` | View child progress, link child accounts |
| `teacher` | Manage classrooms, create word lists |
| `admin` | Approve users, manage all accounts |

## Games (12 total)
ABCLetters, AnimalSounds, CleanOceanHero, ColorFun, CountLearn, FunnyAnimals, MatchIt, PictureWords, SpacePronounce + others under `/client/src/games/`.

## Key directories
```
project/
├── client/src/
│   ├── assets/        static assets (images, audio, story data)
│   ├── components/    shared UI components + route guards
│   ├── context/       AuthContext (global auth state)
│   ├── data/          static JSON/JS data constants
│   ├── games/         individual game components
│   ├── hooks/         useProgress, useSound
│   ├── pages/         page-level views, sub-divided by role
│   └── styles/        global CSS
└── server/
    ├── middleware/    authMiddleware (JWT verification)
    ├── models/        Mongoose schemas
    └── routes/        Express route handlers
```
