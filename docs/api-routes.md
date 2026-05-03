# API Routes

Base URL (dev): `http://localhost:5000/api`  
All requests from the frontend use the Vite proxy, so just `/api/...`.

## Auth — `/api/auth`
File: `server/routes/auth.js`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | No | Create new account |
| POST | `/login` | No | Login, sets JWT cookie |
| POST | `/logout` | Yes | Clear JWT cookie |
| GET | `/profile` | Yes | Get current user info |

## Progress — `/api/progress`
File: `server/routes/progress.js`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/save` | Child | Save game result |
| GET | `/my` | Child | Get own progress history |
| GET | `/child/:id` | Parent | Get a linked child's progress |

## Shop — `/api/shop`
File: `server/routes/shop.js`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/items` | Yes | List all shop items |
| POST | `/buy` | Child | Purchase an item with coins |
| GET | `/inventory` | Child | Get owned items |
| POST | `/equip` | Child | Equip/unequip room item |

## Parent — `/api/parent`
File: `server/routes/parent.js`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/children` | Parent | List linked children |
| POST | `/link-child` | Parent | Link a child account |
| GET | `/child/:id/progress` | Parent | View child's game history |

## Teacher — `/api/teacher`
File: `server/routes/teacher.js`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/classrooms` | Teacher | List own classrooms |
| POST | `/classrooms` | Teacher | Create classroom |
| POST | `/classrooms/:id/students` | Teacher | Add student |
| GET | `/wordlists` | Teacher | List word lists |
| POST | `/wordlists` | Teacher | Create word list |

## Admin — `/api/admin`
File: `server/routes/admin.js`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users` | Admin | List all users |
| PUT | `/users/:id/approve` | Admin | Approve pending account |
| DELETE | `/users/:id` | Admin | Delete user |

## Health check
```
GET /api/health → { status: 'ok' }
```

## Error response format
```json
{ "message": "Description of error" }
```
HTTP status codes: 200, 201, 400 (validation), 401 (unauthenticated), 403 (unauthorized), 404, 500.
