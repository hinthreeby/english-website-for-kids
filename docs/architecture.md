# Architecture

## Request flow
```
Browser (React, :5173)
  → Axios /api/*
  → Vite proxy → Express (:5000)
  → authMiddleware (JWT from cookie)
  → Route handler
  → Mongoose → MongoDB
```

## Frontend architecture

**Entry**: `client/src/main.jsx` → `App.jsx` (React Router, AuthContext Provider)

**State management**: Context API only (`AuthContext`). No Redux/Zustand.

**Routing**: React Router v7 with nested routes and role guards.

**Auth flow**:
1. User logs in → server sets JWT in HTTP-only cookie
2. `AuthContext` stores user object in state
3. `ProtectedRoute` + role-specific guards (`ChildOnly`, `ParentOnly`, etc.) wrap pages

**Styling**: Tailwind CSS utility classes. Some components have co-located `.css` files (e.g., `CleanOceanHero.css`, `MyHome.css`).

## Backend architecture

**Entry**: `server/server.js` — Express app setup, MongoDB connection, route mounting.

**Middleware stack** (in order):
1. `cors` — allow `CLIENT_URL`
2. `express.json` — parse JSON bodies
3. `cookie-parser` — parse cookies
4. `authMiddleware` — JWT verification (applied per-router, not globally)

**Route modules**:
| Module | Mount | Purpose |
|--------|-------|---------|
| auth.js | `/api/auth` | Login, register, logout, profile |
| progress.js | `/api/progress` | Save and fetch game progress |
| shop.js | `/api/shop` | Items, purchases, inventory |
| parent.js | `/api/parent` | Child linking and progress view |
| teacher.js | `/api/teacher` | Classroom and word list management |
| admin.js | `/api/admin` | User approval and system management |

## Database models
See [database-models.md](./database-models.md).

## Vite proxy
`client/vite.config.js` proxies all `/api` requests to `http://localhost:5000`, so the frontend can call `/api/auth/login` without specifying the full server URL. In production, the server would serve static files or a reverse proxy would handle routing.
