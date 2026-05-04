# Fun English 🌟

An interactive English learning platform for children. Kids play games and read stories to learn English; parents and teachers monitor progress; admins manage the system.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 4, React Router v7 |
| Backend | Express.js 5, Node.js |
| Database | MongoDB (Mongoose 9) |
| Auth | JWT + bcryptjs (HTTP-only cookies) |

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
# Install dependencies for both client and server
cd client && npm install
cd ../server && npm install
```

### Environment Variables

Create `server/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/funEnglish
JWT_SECRET=your_secret_here
PORT=5000
CLIENT_URL=http://localhost:5173
```

### Run

```bash
# Start both client (port 5173) and server (port 5000)
npm run dev

# Client only
cd client && npm run dev

# Server only
cd server && npm run dev
```

### Create Admin Account

Run once to seed the first admin user:

```bash
cd server
node scripts/createAdmin.js
```

Default credentials: `admin` / `Admin@123456` — change after first login.

## User Roles

| Role | Capabilities |
|---|---|
| `child` | Play games, read stories, shop, decorate room |
| `parent` | View children's progress, link child accounts |
| `teacher` | Manage classrooms, create & submit word lists |
| `admin` | Approve teachers/word lists, manage all users |

> Child accounts must be created by a Parent or Admin — children cannot self-register.

## Project Structure

```
project/
├── client/
│   └── src/
│       ├── components/     Shared UI + role guards
│       ├── context/        AuthContext (global auth state)
│       ├── games/          Game components (12 games)
│       ├── pages/
│       │   ├── admin/      Dashboard, Users, Approvals, Profile
│       │   ├── parent/     Dashboard, Child Progress
│       │   └── teacher/    Dashboard, Classroom, Word List Editor
│       └── hooks/          useProgress, useSound
└── server/
    ├── middleware/         JWT auth middleware
    ├── models/             User, GameResult, Classroom, WordList, UserInventory
    ├── routes/             auth, progress, shop, parent, teacher, admin
    └── scripts/            createAdmin.js
```

## API Overview

| Module | Base URL | Purpose |
|---|---|---|
| Auth | `/api/auth` | Login, register, logout |
| Progress | `/api/progress` | Game results |
| Shop | `/api/shop` | Items & purchases |
| Parent | `/api/parent` | Child management |
| Teacher | `/api/teacher` | Classrooms & word lists |
| Admin | `/api/admin` | User & content management |

## Games

ABCLetters, AnimalSounds, CleanOceanHero, ColorFun, CountLearn, FunnyAnimals, MatchIt, PictureWords, SpacePronounce, and more — located in `client/src/games/`.
