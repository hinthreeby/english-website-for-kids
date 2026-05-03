# Database Models

All models live in `server/models/`. MongoDB via Mongoose.

## User
File: `server/models/User.js`

Core fields (inferred from routes and auth):
- `username` / `email` — login credentials
- `password` — bcrypt-hashed
- `role` — `'child' | 'parent' | 'teacher' | 'admin'`
- `isApproved` — admin approval flag (teachers/parents may require approval)
- `coins` / `xp` / `streak` — child progress metrics
- `linkedChildren` — parent→child references (likely ObjectId array)

## GameResult
File: `server/models/GameResult.js`

Stores per-game session outcomes for children:
- `userId` — ref to User
- `gameId` — game identifier string
- `score`
- `completedAt`

## Classroom
File: `server/models/Classroom.js`

Teacher-managed groups:
- `teacherId` — ref to User
- `name`
- `students` — array of User refs
- `wordListId` — ref to WordList

## WordList
File: `server/models/WordList.js`

Vocabulary sets used in games:
- `createdBy` — teacher ref
- `name`
- `words` — array of word objects `{ word, imageUrl, audioUrl }`

## UserInventory
File: `server/models/UserInventory.js`

Shop items owned by a child:
- `userId` — ref to User
- `items` — array of owned item objects
- `equippedItems` — currently active room decorations
