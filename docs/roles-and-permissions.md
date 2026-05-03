# Roles & Permissions

## Role definitions

| Role | Description |
|------|-------------|
| `child` | End-user learner. Plays games, earns coins/XP, reads stories, shops, decorates room. |
| `parent` | Linked to one or more children. Monitors progress. Cannot access child gameplay directly. |
| `teacher` | Creates classrooms and custom word lists. Monitors classroom progress. |
| `admin` | Full system access. Approves pending accounts, manages all users. |

## Route guards (frontend)

Guards live in `client/src/components/guards/`:

| Guard component | Allowed role |
|-----------------|-------------|
| `ChildOnly` | `child` |
| `ParentOnly` | `parent` |
| `TeacherOnly` | `teacher` |
| `AdminOnly` | `admin` |

`ProtectedRoute` handles unauthenticated redirect (to `/login`).

Usage in `App.jsx`:
```jsx
<Route element={<ProtectedRoute />}>
  <Route element={<ChildOnly />}>
    <Route path="/games" element={<GamePage />} />
  </Route>
</Route>
```

## Backend authorization

`server/middleware/authMiddleware.js` verifies JWT from cookie and attaches `req.user`.
Route files apply the middleware and may additionally check `req.user.role`.

Pattern:
```js
router.get('/dashboard', authMiddleware, requireRole('teacher'), handler)
```

## Pages by role

| Role | Pages |
|------|-------|
| `child` | HomePage, GamePage, StoryPlayerPage, ShopPage, RoomPage, MyHomePage, CompletionPage |
| `parent` | `pages/parent/` — DashboardPage, child progress views |
| `teacher` | `pages/teacher/` — classroom management, word lists |
| `admin` | `pages/admin/` — user management, approvals |
