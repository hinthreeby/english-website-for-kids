# Agent Workflow

How the agent should approach tasks in this project.

## Before making changes

1. Read the relevant files — never edit from memory.
2. For new features, check if a similar pattern already exists in the codebase (games, route handlers, components).
3. Identify which role(s) are affected and verify the correct guards are in place.

## Scoping work

- Fix only what was asked. Do not refactor surrounding code, rename variables, or add logging unless requested.
- If a task touches both frontend and backend (e.g., new feature), implement both sides completely — do not leave half-finished API calls or missing route handlers.
- If the scope is unclear, ask before implementing.

## Testing changes mentally

- For API changes: trace the full request — auth middleware → route handler → model → response → frontend consumer.
- For UI changes: consider all four roles. A UI change visible to `child` should not accidentally appear for `teacher`.
- For game changes: ensure `useProgress` is called on completion and coins/XP are awarded.

## File locations quick reference

| What | Where |
|------|-------|
| New page (child) | `client/src/pages/` |
| New page (teacher) | `client/src/pages/teacher/` |
| New game | `client/src/games/` |
| New shared component | `client/src/components/` |
| New API route | `server/routes/<module>.js` |
| New DB model | `server/models/` |
| New custom hook | `client/src/hooks/` |
| Static data / constants | `client/src/data/` |

## RBAC rules (non-negotiable)

These rules are enforced **at the backend (middleware)**, not just in the UI:

| Role | Permitted scope |
|------|----------------|
| `admin` | Full system access |
| `teacher` | Own classrooms, assignments, grades; message parents of own students only |
| `parent` | Read-only access to own children's data; contact teachers of own children only |
| `child` | View lessons, submit own assignments, view own grades only |

- **Child accounts must be created by a Parent or Admin** — never allow child self-registration.
- **Never scope access by role in UI alone.** Every restricted route must have `authMiddleware` + `requireRole(...)` or equivalent ownership check in the route handler.
- **Ask before any architectural changes.**

## Do not

- Do not modify `.env` files.
- Do not add new npm packages without confirming with the user.
- Do not push to git without explicit user instruction.
- Do not create new route modules without justification.
- Do not remove route guards or bypass `authMiddleware`.
- Do not use `console.log` in production code paths (use it only for debugging, then remove it).

## Documentation

- Update `docs/api-routes.md` when adding or changing an API endpoint.
- Update `docs/database-models.md` when adding or changing a model.
- Update `docs/roles-and-permissions.md` when role rules change.
