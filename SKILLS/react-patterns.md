# React Patterns

Patterns established in this codebase that the agent must follow consistently.

## Route structure

Wrap protected routes in `ProtectedRoute`, then in a role guard:

```jsx
<Route element={<ProtectedRoute />}>
  <Route element={<ChildOnly />}>
    <Route path="/games" element={<GamePage />} />
  </Route>
  <Route element={<TeacherOnly />}>
    <Route path="/teacher" element={<TeacherDashboard />} />
  </Route>
</Route>
```

Do not add `navigate` logic inside pages to enforce roles — the guards handle this.

## AuthContext usage

```jsx
import { useAuth } from '../context/AuthContext';

const { user, login, logout } = useAuth();
```

Never fetch user data from the server inside a page component on mount if it's already in `user`. Use `user` from context directly.

## API calls (Axios)

Use the Vite proxy — prefix all API calls with `/api`:

```js
import axios from 'axios';

const res = await axios.get('/api/progress/my', { withCredentials: true });
```

Always pass `{ withCredentials: true }` so the JWT cookie is sent.

Handle errors:
```js
try {
  const { data } = await axios.post('/api/shop/buy', payload, { withCredentials: true });
} catch (err) {
  const msg = err.response?.data?.message ?? 'Something went wrong';
  // show msg to user
}
```

## Game components

All games live in `client/src/games/`. Each game:
- Receives a `wordList` prop or fetches its own data.
- Calls `useProgress` to save results on completion.
- Calls `useSound` for audio feedback.
- Triggers `CelebrationModal` or navigates to `CompletionPage` on finish.

New games must follow this same shape.

## Component file structure

```
ComponentName.jsx     ← component
ComponentName.css     ← (optional) only if Tailwind is insufficient
```

Named export preferred for shared components; default export acceptable for pages.

## Framer Motion

Use for entrance/exit animations on modals and page transitions. Keep animations subtle — this is a children's app so motion should be friendly, not distracting.

```jsx
import { motion, AnimatePresence } from 'framer-motion';

<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
    >
      ...
    </motion.div>
  )}
</AnimatePresence>
```
