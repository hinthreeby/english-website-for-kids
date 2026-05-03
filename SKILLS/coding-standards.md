# Coding Standards

Rules the agent must follow when writing or editing code in this project.

## General

- No comments unless the WHY is non-obvious (hidden constraint, workaround, subtle invariant).
- No placeholder code, TODOs, or half-finished implementations.
- No features beyond what was asked. No preemptive abstractions.
- No error handling for impossible cases. Trust framework guarantees.
- Validate only at system boundaries (user input, external API responses).

## JavaScript / JSX

- Use ES module syntax (`import`/`export`) in both client and server (server uses CommonJS — use `require`/`module.exports` there).
- Prefer `const` over `let`. Never use `var`.
- Arrow functions for callbacks and component definitions.
- Destructure props and objects where it improves readability.
- No unused variables or imports.

## React

- Functional components only. No class components.
- One component per file.
- File names match component names (PascalCase).
- Keep components small — extract sub-components when JSX exceeds ~80 lines.
- Use `AuthContext` for auth state; do not prop-drill user data.
- Use `useProgress` and `useSound` hooks where applicable instead of duplicating logic.

## Tailwind CSS

- Use Tailwind utility classes as the primary styling method.
- Co-located `.css` files are acceptable only for complex animations or styles not achievable in Tailwind.
- Do not mix inline `style` objects with Tailwind unless absolutely necessary.

## Express (server)

- All routes go through `authMiddleware` before accessing protected resources.
- Send consistent error responses: `res.status(code).json({ message: '...' })`.
- Use `async/await` with try/catch in route handlers.
- Never expose stack traces or internal error details to the client.

## MongoDB / Mongoose

- Define schemas with explicit field types and validation.
- Use `.lean()` for read-only queries when performance matters.
- Never return password fields to the client (use `.select('-password')`).
