# Full Project Analysis & Audit Report

**Project:** Brothers Sports House — Sports E-commerce  
**Audit Date:** July 8, 2026  
**Auditor:** Kiro (code-level analysis)

---

## 1. PROJECT SUMMARY

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend (Customer)** | React 19 + Vite 7 + TailwindCSS 3 + Framer Motion + React Router 7 |
| **Frontend (Admin)** | React 19 + Vite 8 + TailwindCSS 4 + Recharts |
| **Backend** | Node.js + Express 5 (beta) + TypeScript |
| **Database** | PostgreSQL (hosted, SSL) via Sequelize-TypeScript ORM |
| **Auth** | JWT (access + refresh tokens) + Google OAuth2 + OTP email verification |
| **Payment** | Khalti (Nepal gateway) — redirect-based, QR code, Cash on Delivery |
| **File Storage** | Cloudinary (image uploads) |
| **Email** | Resend API |
| **Notifications** | WhatsApp API (order confirmations & status updates) |

### Architecture

**Monorepo** with 3 folders:
- `backend/` — Express REST API, MVC-ish pattern (routes → controllers → models)
- `frontend/` — Customer-facing SPA (Vite + React)
- `admin/` — Admin dashboard SPA (Vite + React)

### Module Map

```
backend/src/
├── config/         → env config, Google OAuth passport strategy
├── controllers/    → 18 controllers (auth, admin, products, orders, payment, delivery, etc.)
├── database/
│   ├── connection/ → Sequelize setup + inline schema migrations + relationship definitions
│   ├── models/     → 22 Sequelize-TypeScript models
│   └── seeders/    → Admin seeder, category/brand/sport seeders
├── middleware/     → auth guard, role guard, rate limiter, input sanitizer, multer, error handler
├── routes/         → 17 route files
├── services/       → JWT, email (Resend + Nodemailer), WhatsApp, inventory, notifications, Khalti
└── utils/          → delivery charge calculator, order number generator, slugify
```

### What's Implemented ✅
- Full product catalog with categories, brands, sports, variants (size/color/price), images
- Cart system (per-user, variant-aware)
- Order flow: cart → checkout → payment → order creation → status tracking
- Payment: Khalti integration + QR manual + COD
- Admin panel: product CRUD, order management, delivery boy assignment, reviews moderation, inventory, dashboard analytics
- Delivery boy system with status transitions (preparation → on the way → delivered)
- Product reviews with verified purchase badges
- Wishlist
- Collections/curated lists
- Google OAuth login
- OTP email verification on registration
- WhatsApp order notifications
- User profile management + saved addresses
- CSV order export
- Performance indexes on key tables

### What's Clearly Missing ❌
- No test suite whatsoever (no test runner, no tests)
- No CI/CD pipeline
- No database migration system (uses inline ALTER TABLE + `sequelize.sync`)
- No structured logging or monitoring (Sentry, Datadog, etc.)
- No privacy policy / terms of service content (links exist but are dead)
- No cookie consent
- No GDPR data deletion flow
- No guest checkout
- No coupon/discount system
- No search engine (relies on `ILIKE` pattern matching)
- No abandoned cart recovery
- No email for order confirmation (only WhatsApp)

---

## 2. SECURITY ISSUES

### 🔴 CRITICAL

#### C1: `error: error.message` leaked to clients in 50+ catch blocks
**Files:** Every controller (`authController.ts:138`, `orderController.ts:342`, `cartController.ts:114`, `userController.ts:43`, `adminController.ts:61`, `deliveryController.ts:40`, `reviewController.ts:82`, `productController.ts:120`, `recommendationController.ts:69`, `collectionController.ts:43`, `dashboardController.ts:69`, etc.)  
**Severity:** Critical  
**Why:** Exposes internal stack traces, SQL errors, file paths, and ORM details to attackers. A SQL error can reveal table/column names. An ORM error can reveal model structure.  
**Fix:** Batch replace across all controllers:
```typescript
// WRONG (currently in ~50 places):
res.status(500).json({ message: "Internal server error", error: error.message });

// RIGHT:
res.status(500).json({ message: "Internal server error" });
// Keep console.error for server logs only
```

#### C2: Google OAuth passes tokens in URL query parameters
**File:** `backend/src/controllers/authController.ts:322`  
**Severity:** Critical  
**Why:** `?token=...&refreshToken=...` is logged in browser history, server access logs, browser extensions, and any analytics scripts on the callback page. Tokens can be stolen from history.  
**Fix:** Use a short-lived authorization code exchange or set tokens as httpOnly cookies:
```typescript
// Option A: One-time code exchange
const code = crypto.randomUUID();
await redis.set(`auth_code:${code}`, JSON.stringify({ token, refreshToken }), 'EX', 60);
res.redirect(`${frontendUrl}/auth/callback?code=${code}`);
// Frontend calls POST /auth/exchange { code } to get actual tokens
```

#### C3: Frontend stores JWT in localStorage — XSS steals everything
**Files:** `frontend/src/context/AuthContext.tsx:37`, `admin/src/context/AuthContext.tsx:25`  
**Severity:** Critical  
**Why:** Any XSS vulnerability (from a product description, review, etc.) can steal the token. `localStorage` is accessible from any JavaScript on the page.  
**Current state:** The sanitizer (validation.ts) now encodes HTML entities, which mitigates this partially, but defense-in-depth requires httpOnly cookies for production.

---

### 🟠 HIGH

#### H1: OTP stored as plaintext in database
**File:** `backend/src/controllers/authController.ts:43`  
**Severity:** High  
**Why:** If database is compromised, attacker can verify any unverified account. OTPs should be hashed like passwords.  
**Fix:**
```typescript
const otpHash = await bcrypt.hash(otp, 6); // Lower cost factor is fine for 6-digit OTP
await User.create({ ...data, otp: otpHash });
// Verify with: await bcrypt.compare(userInputOtp, user.otp)
```

#### H2: No account lockout after failed login attempts
**File:** `backend/src/controllers/authController.ts:218-228`  
**Severity:** High  
**Why:** Even with rate limiting (10 req/15min per IP), an attacker can rotate IPs or use a botnet. No per-account lockout after N failures.  
**Fix:** Track failed attempts per email in the User model:
```typescript
// On failed password check:
await user.increment('failedLoginAttempts');
if (user.failedLoginAttempts >= 5) {
  await user.update({ lockedUntil: new Date(Date.now() + 30 * 60 * 1000) });
  res.status(423).json({ message: "Account locked. Try again in 30 minutes." });
  return;
}
// On successful login: reset counter
await user.update({ failedLoginAttempts: 0, lockedUntil: null });
```

#### H3: Rate limiter uses in-memory Map — doesn't survive restarts
**File:** `backend/src/middleware/rateLimiter.ts:8`  
**Severity:** High  
**Why:** Any server restart clears all rate limit counters. In multi-instance deployment (PM2 cluster, multiple containers), each instance has its own counter — effectively no rate limiting.  
**Fix:** For a 1-day deadline, this is acceptable for single-instance deployment. For production at scale, switch to Redis-backed store.

#### H4: `getOrders` returns ALL orders without pagination for admin/delivery roles
**File:** `backend/src/controllers/orderController.ts:280-311`  
**Severity:** High  
**Why:** As order volume grows, this query will load thousands of orders with nested includes (OrderItems → Product → ProductImages). Response could be 10+ MB, causing timeouts and memory spikes.  
**Fix:** Add pagination:
```typescript
const page = Number(req.query.page) || 1;
const limit = Number(req.query.limit) || 20;
const offset = (page - 1) * limit;

const { count, rows: orders } = await Order.findAndCountAll({
  where,
  include: [...],
  limit,
  offset,
  order: [["createdAt", "DESC"]],
});
```

#### H5: Admin seeder runs on every dev startup — uses env credentials
**File:** `backend/src/database/seeders/adminSeeder.ts` + `backend/server.ts:26-28`  
**Severity:** High  
**Why:** If `ADMIN_EMAIL`/`ADMIN_PASSWORD` in .env use weak or default values, and someone accidentally deploys with `NODE_ENV=development`, the seeder creates a known-credentials admin account.  
**Fix:** Add a guard:
```typescript
if (process.env.NODE_ENV === "production") {
  console.log("⚠️ Skipping seeders in production");
  return;
}
```
(This guard already exists in `server.ts:22` but should be double-checked in deployment scripts.)

#### H6: Checkout sends `price` from client in items array
**File:** `frontend/src/pages/Checkout.tsx:137`  
**Severity:** High (mitigated)  
**Why:** The checkout sends `price: item.variantPrice || item.price` from client state. **However**, the backend (`orderController.ts:96`) correctly re-fetches the price from the database variant (`const price = targetVariant.price`), so the client-sent price is ignored. The field is still sent unnecessarily.  
**Status:** ✅ Backend correctly ignores client prices — this is informational only.

---

### 🟡 MEDIUM

#### M1: `exportOrders` CSV injection vulnerability
**File:** `backend/src/controllers/orderController.ts:516-545`  
**Severity:** Medium  
**Why:** Customer names, cities, and notes are embedded in CSV without escaping formulas. A name like `=CMD("calc.exe")` will execute when opened in Excel.  
**Fix:** Prefix fields that start with `=`, `+`, `-`, `@` with a tab character:
```typescript
function escapeCSV(val: string): string {
  if (/^[=+\-@]/.test(val)) return `\t${val}`;
  if (val.includes(',') || val.includes('"')) return `"${val.replace(/"/g, '""')}"`;
  return val;
}
```

#### M2: Dead imports in authController
**File:** `backend/src/controllers/authController.ts:2-3`  
**Severity:** Low (code quality)  
**Detail:** `otpGenerator` and `checkOtpExpiration` are imported but never used.

#### M3: Delivery boy can auto-assign themselves to any unassigned order
**File:** `backend/src/controllers/deliveryController.ts:80-83`  
**Severity:** Medium  
**Why:** Any delivery role user can call `PATCH /delivery/orders/:id/status` on any order that has no `deliveryBoyId`, auto-assigning themselves. This could allow a malicious delivery account to intercept orders.

#### M4: No password required for profile update (avatar URL injection)
**File:** `backend/src/controllers/userController.ts:57`  
**Severity:** Medium  
**Why:** `avatar` field accepts any URL string without validation. Could be used for stored XSS if rendered with `<img onerror=...>`, or for tracking pixels.

#### M5: Order cancellation stock restore is not transactional
**File:** `backend/src/controllers/orderController.ts:447-453`  
**Severity:** Medium  
**Why:** `cancelOrder` increments stock in a loop without a transaction. If the process crashes mid-loop, some items get stock restored and others don't.

---

### 🟢 LOW

| # | Issue | File |
|---|-------|------|
| L1 | Password minimum is only 6 chars, no complexity | `authController.ts:23` |
| L2 | CORS allows all non-browser requests (`!origin → true`) | `app.ts:65` |
| L3 | Root endpoint (`/`) exposes all API route paths | `app.ts:92-111` |
| L4 | `console.log` statements with user data in passport.ts and googleCallback | `passport.ts`, `authController.ts:295-298` |
| L5 | No Content-Disposition header sanitization on export filename | `orderController.ts:541` |

---

## 3. CODE QUALITY ISSUES

### Duplication
- **Delivery charge logic duplicated:** `frontend/src/pages/Checkout.tsx:28-33` and `backend/src/utils/deliveryCharge.ts` both implement the same city-based shipping calculation. If rates change, both must be updated.
- **Error response pattern repeated 50+ times:** Every controller has identical `catch` blocks. Should use a central error handler middleware (the `errorHandler.ts` wrapper exists but doesn't strip `error.message`).
- **Product normalization logic duplicated** in `getAllProducts` and `getProductById` in `productController.ts` (lines 90-100 and 165-175).

### Inconsistent Patterns
- **Mixed auth middleware approaches:** Admin routes use `requireAdmin` from `roleMiddleware.ts`, but delivery routes use `userMiddleware.accessTo(Role.Delivery, Role.Admin)`. Two different middleware files doing the same thing differently.
- **Some routes use `errorHandler` wrapper, some don't:** `adminRoute.ts` has inline handlers for delivery boy CRUD (lines 18-78) without errorHandler, but uses it for everything else.
- **Model relationships defined in connection.ts** (200+ lines of manual `belongsTo`/`hasMany`) instead of using Sequelize-TypeScript decorators consistently. Some models use decorators, others rely on the connection file.

### Missing Error Handling
- **WhatsApp service failures are swallowed:** `.catch(() => {})` throughout orderController — fine for fire-and-forget, but should at least log.
- **No validation on UUID params:** Routes like `/orders/:id` don't validate that `:id` is a valid UUID before hitting the database.
- **Payment verification doesn't check order ownership:** `verifyKhalti` accepts any `orderId`/`pidx` combination from any authenticated user (the user who verifies need not own the order).

### No Tests
- Zero test files in the entire project
- No test runner configured
- No testing dependencies in any package.json
- Critical paths (order creation, payment verification, stock management) have no regression protection

---

## 4. PERFORMANCE CONCERNS

### N+1 Query Potential
**File:** `backend/src/controllers/orderController.ts:72-111`  
In `createOrder`, when processing items from the request body, each item does a separate `Product.findByPk` with includes. For an order with 10 items, that's 10 sequential DB round trips before the transaction even starts. Could be batched:
```typescript
const productIds = items.map(i => i.productId);
const products = await Product.findAll({
  where: { id: productIds },
  include: [Category, { model: Variant, as: "variants" }]
});
const productMap = new Map(products.map(p => [p.id, p]));
```

### Admin `getOrders` — Unbounded Query
**File:** `backend/src/controllers/orderController.ts:280-311`  
Returns ALL orders with 3 levels of nested includes (Order → OrderItem → Product → ProductImage). No limit, no cursor pagination. At 1000 orders this will be visibly slow (~5-10 seconds).

### Review Stats Calculated on Every Request
**File:** `backend/src/controllers/reviewController.ts:108-120`  
`getProductReviews` fetches ALL reviews for a product twice: once paginated, once for stats. The stats query (`findAll` with all ratings) recalculates average on every page load. Should use a denormalized `averageRating` column on the Product model, updated on review create/update/delete.

### Database Connection File Is 400+ Lines
**File:** `backend/src/database/connection/connection.ts`  
Contains all relationship definitions AND inline schema migrations (ALTER TABLE statements). On every startup in dev, it runs 15+ ALTER TABLE queries, several CREATE INDEX statements, and a DELETE query. This slows cold starts by 2-5 seconds.

### Frontend Bundle Size
- `gsap` (GreenSock) + `framer-motion` both included — double animation library
- `react-slick` + `slick-carousel` add another ~50KB for carousels (could use CSS-only or lighter alternative)

---

## 5. WHAT'S MISSING FOR PRODUCTION

| Category | Gap | Impact |
|----------|-----|--------|
| **Logging** | No structured logging (just `console.error`). No request ID tracking. No audit log for admin actions. | Can't debug production issues, can't detect attacks |
| **Monitoring** | No error tracking (Sentry), no APM (Datadog/New Relic), no uptime monitoring | Silent failures, no alerting |
| **Database Migrations** | Uses `sequelize.sync()` + inline ALTER TABLE. No versioned migration files. | Schema changes in production are dangerous and untrackable |
| **Backups** | No backup configuration visible. If using managed DB (Neon/Supabase), may have auto-backups, but no verification. | Data loss risk |
| **CI/CD** | No GitHub Actions, no deployment scripts, no staging environment | Manual deploys are error-prone |
| **Tests** | Zero tests. No unit, integration, or E2E tests. | Regressions ship silently |
| **Environment Validation** | App starts even if critical env vars are missing (jwtSecret). Only Cloudinary vars throw at startup. | Runtime crashes in production |
| **Graceful Shutdown** | No `SIGTERM`/`SIGINT` handler to close DB connections cleanly | Connection leaks on restart |
| **Request Validation** | No schema validation library (Zod/Joi). Validation is manual if/else in each controller. | Inconsistent validation, easy to miss fields |
| **HTTPS Enforcement** | No redirect from HTTP to HTTPS at app level (relies entirely on reverse proxy) | If misconfigured, traffic flows unencrypted |
| **Session/Token Revocation** | No way to invalidate tokens (stolen token valid until expiry) | Compromised accounts can't be force-logged-out |
| **Legal Pages** | Privacy Policy, Terms of Service, Refund Policy links point to `#` | Legal liability |

---

## 6. FEATURE SUGGESTIONS

Ranked by conversion impact vs. implementation effort:

| # | Feature | Impact | Effort | Why |
|---|---------|--------|--------|-----|
| 1 | **Order Confirmation Email** | 🔴 High | 🟢 Low | You already have Resend configured. Send order summary + tracking info email on order creation. Customers currently only get WhatsApp, which requires them to click a link. |
| 2 | **Guest Checkout** | 🔴 High | 🟡 Medium | ~30% of users abandon at mandatory registration. Your order model already stores all contact info — just make `userId` nullable and offer "create account" post-purchase. |
| 3 | **Abandoned Cart Recovery via WhatsApp** | 🔴 High | 🟢 Low | WhatsApp integration is already built. Add a cron job that finds cart items older than 2 hours and sends a templated message. This alone can recover 5-15% of abandoned carts. |
| 4 | **Product Search with Filters** | 🔴 High | 🟡 Medium | Current search is basic `ILIKE`. Add filter by: price range, size availability, sport, brand. This is table-stakes for an e-commerce store with 100+ products. Can implement with Sequelize `where` clauses — no need for Elasticsearch yet. |
| 5 | **Order Tracking Page** (public, no login required) | 🟠 Medium | 🟢 Low | You already have `StatusHistory` model with timestamps. Create a `/track/:orderNumber` page showing timeline. Reduces "where's my order?" support load. |
| 6 | **Saved Addresses** | 🟠 Medium | 🟢 Low | `Address` model already exists with `isDefault` field! The backend has it — just wire the frontend checkout to pre-fill from saved addresses. |
| 7 | **Related Products ("You may also like")** | 🟠 Medium | 🟢 Low | `recommendationController.ts` already exists. Surface it on product detail pages. Increases average order value by 10-15%. |
| 8 | **Multi-size Add to Cart** (buy 2 sizes at once) | 🟡 Low-Medium | 🟢 Low | Common for shoe stores — let users add multiple sizes of the same shoe to cart easily. Current cart already supports multiple entries per product with different sizes. Just needs UI. |

### Top 3 Quickest Wins (under 2 hours each):
1. **Saved addresses on checkout** — model exists, just fetch and pre-fill
2. **Order confirmation email** — Resend is configured, just call it in `createOrder`
3. **Order tracking page** — StatusHistory exists, make a simple timeline component

---

## TOP 3 ISSUES TO FIX BEFORE PRODUCTION

1. **Strip `error: error.message` from all 50+ catch blocks** — A single database error will leak your schema. This is a 15-minute find-and-replace but has Critical impact.

2. **Fix Google OAuth token-in-URL** — Every Google login creates a browser history entry with valid JWT tokens. Use a short-lived authorization code exchange instead.

3. **Add pagination to admin `getOrders`** — Without it, your admin panel will crash once you have a few hundred orders. The admin panel fetches this endpoint on load.

---

*This report is based on static code analysis of the actual codebase. File paths and line numbers reference the state of the code at audit time.*
