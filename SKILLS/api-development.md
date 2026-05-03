# API Development

Guidelines for adding or modifying server-side code.

## Adding a new route

1. Determine which route module it belongs to (`auth`, `progress`, `shop`, `parent`, `teacher`, `admin`).
2. Add the handler to the existing module — do not create new route files unless adding a completely new domain.
3. Apply `authMiddleware` and role checks at the router level, not inside the handler.

```js
// server/routes/shop.js
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

router.post('/buy', authMiddleware, requireRole('child'), async (req, res) => {
  try {
    // handler logic
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ message: 'Failed to purchase item' });
  }
});
```

## Response conventions

- Success: `res.json(data)` or `res.status(201).json(data)`
- Validation error: `res.status(400).json({ message: '...' })`
- Auth error: `res.status(401).json({ message: 'Unauthorized' })`
- Forbidden: `res.status(403).json({ message: 'Forbidden' })`
- Not found: `res.status(404).json({ message: 'Not found' })`
- Server error: `res.status(500).json({ message: 'Internal server error' })` — no stack trace

## Authentication middleware

JWT is stored in an HTTP-only cookie. The middleware reads it, verifies with `JWT_SECRET`, and attaches `req.user = { id, role, ... }`.

If a route needs a specific role:
```js
router.get('/admin-only', authMiddleware, requireRole('admin'), handler);
```

## Mongoose best practices

```js
// Never return passwords
const user = await User.findById(id).select('-password');

// Use lean() for read-only queries
const results = await GameResult.find({ userId }).lean();

// Validate before saving
const user = new User({ ...req.body });
await user.save(); // throws ValidationError if schema invalid
```

## Adding a new model

1. Create `server/models/ModelName.js`
2. Define schema with explicit types and validations
3. Export: `module.exports = mongoose.model('ModelName', schema)`
4. Import in the route file that uses it

## Mongoose async pre-hooks (Mongoose 8+/9)

Do **not** pass `next` into async pre-hooks — Mongoose 8+ awaits the returned Promise and does not provide `next`, so calling it throws `TypeError: next is not a function`.

```js
// WRONG — crashes on Mongoose 8+/9
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// CORRECT
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});
```

## Security rules

- Never trust `req.body` for `userId` — always use `req.user.id` from the verified JWT.
- Sanitize any data used in dynamic queries to prevent injection.
- Do not log sensitive fields (passwords, tokens).
- Environment secrets stay in `.env`, never hardcoded.
