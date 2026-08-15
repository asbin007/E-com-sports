# Pre-Production Readiness Audit Report

**Application:** Brothers Sports House (E-commerce)  
**Stack:** React (Vite) + Node/Express 5 + PostgreSQL (Sequelize) + Khalti Payment Gateway  
**Deployment Target:** TBD (appears to be self-hosted/VPS based on manual server configuration)  
**Current State:** ~70% feature-complete  
**Audit Date:** July 8, 2026

---

## Executive Summary

The application has a reasonable foundation but contains **multiple Critical and High severity issues** that must be resolved before production deployment. The most urgent concerns are: lack of security headers (no helmet/CSP/HSTS), JWT tokens stored in localStorage (XSS-vulnerable), no CSRF protection, missing payment webhook signature verification, inventory race conditions, and absence of structured logging/monitoring.

---

## Findings by Severity

### CRITICAL (Must fix before production)

| # | Section | Issue | File/Location |
|---|---------|-------|---------------|
| C1 | Security Headers | No `helmet`, CSP, HSTS, or X-Frame-Options headers configured | `backend/src/app.ts` |
| C2 | Token Storage | JWT stored in `localStorage` — vulnerable to XSS theft | `admin/src/context/AuthContext.tsx`, frontend |
| C3 | Payment Security | No webhook/callback signature verification for Khalti payments | `backend/src/controllers/paymentController.ts` |
| C4 | Payment Security | Dummy payment mode controlled by `NODE_ENV` — if accidentally set to "development" in prod, payments are bypassed | `backend/src/controllers/paymentController.ts` |
| C5 | JWT Security | Access token and refresh token use the same secret key — compromising one compromises both | `backend/src/services/jwtService.ts` |
| C6 | Data Exposure | Error handler in production returns full error objects (`error: error.message`) to clients | Multiple controllers + `app.ts` global handler |
| C7 | Race Condition | No database-level locking on inventory decrement during order creation — two users can buy last item simultaneously | `backend/src/controllers/orderController.ts` (line: `Variant.decrement`) |

### HIGH (Fix before production)

| # | Section | Issue | File/Location |
|---|---------|-------|---------------|
| H1 | CSRF | No CSRF protection on any state-changing endpoint | Entire backend |
| H2 | Auth Brute Force | Auth rate limiter allows 50 requests/15min — too generous for login; no account lockout after failed attempts | `backend/src/middleware/rateLimiter.ts` |
| H3 | Rate Limiter | In-memory store (`Map`) — bypassed by server restarts, doesn't work with horizontal scaling | `backend/src/middleware/rateLimiter.ts` |
| H4 | Token Expiry | Access token expires in 24h (too long for an access token), refresh token in 7d | `backend/src/services/jwtService.ts`, `config.ts` |
| H5 | Input Validation | No HTML encoding in sanitizer — only removes null bytes and trims. XSS payloads pass through | `backend/src/middleware/validation.ts` |
| H6 | File Upload | No file size limit configured on multer (Cloudinary storage). No MIME-type validation beyond extension | `backend/src/middleware/multer.ts` |
| H7 | Order Manipulation | `getOrders` returns ALL orders for admin/delivery roles without pagination limit — potential DoS with large datasets | `backend/src/controllers/orderController.ts` |
| H8 | Order IDOR | `cancelOrder` checks `userId` ownership, but `getOrderById` for admin returns any order — delivery boys can see all orders | `backend/src/controllers/orderController.ts` |
| H9 | Secret Management | Config references `ADMIN_PASSWORD` and `ADMIN_EMAIL` env vars used in seeder — default credentials risk | `backend/src/config/config.ts` |
| H10 | No Token Revocation | No token blacklist or refresh token rotation — if token is stolen, no way to invalidate it | Backend auth system |

### MEDIUM (Fix soon after launch)

| # | Section | Issue | File/Location |
|---|---------|-------|---------------|
| M1 | CORS | `origin: true` for requests with no origin header (non-browser clients always pass) — weaker than intended | `backend/src/app.ts` |
| M2 | Password Policy | Only minimum 6 characters enforced — no complexity requirements | `backend/src/controllers/authController.ts` |
| M3 | Logging | Zero structured logging — only `console.error` statements. No audit trail for admin actions, failed logins, or payment events | Entire backend |
| M4 | Google OAuth | Tokens passed in URL redirect query params (`?token=...`) — logged in browser history, server access logs | `backend/src/controllers/authController.ts` (googleCallback) |
| M5 | Database | `sequelize.sync()` used in dev — should use migrations in production | `backend/server.ts` |
| M6 | Dependency Audit | No `npm audit` step in CI/CD. Express 5 is in beta — potential instability | `backend/package.json` |
| M7 | Health Endpoint | Exposes memory usage and uptime to unauthenticated users | `backend/src/app.ts` (`/api/health`) |
| M8 | No Idempotency | No idempotency keys on order/payment creation — network retries can create duplicate orders | `backend/src/controllers/orderController.ts` |
| M9 | OTP Security | OTP stored as plain text in database. 6-digit numeric OTP with 15-min window is reasonable but should be hashed | `backend/src/controllers/authController.ts` |

### LOW (Best practices / polish)

| # | Section | Issue | File/Location |
|---|---------|-------|---------------|
| L1 | Bcrypt | Cost factor 10 is acceptable but Argon2 would be stronger for new projects | `backend/src/controllers/authController.ts` |
| L2 | Product Search | `Op.iLike` with `%search%` in product controller — no query parameterization issue (Sequelize handles it) but no search index for performance | `backend/src/controllers/productController.ts` |
| L3 | Compliance | Footer links to "Privacy Policy", "Terms of Service", "Refund Policy" exist but likely point to `#` (no actual pages) | `frontend/src/components/layout/Footer.tsx` |
| L4 | Cookie Consent | No cookie consent banner implemented | Frontend |
| L5 | Guest Checkout | No guest checkout — all orders require authentication | Order flow |
| L6 | N+1 Queries | Cart and order listing use eager loading (good), but `createOrder` loops through items sequentially | `backend/src/controllers/orderController.ts` |

---

## Detailed Findings & Fixes

### 1. Authentication & Authorization

**Password Hashing:** ✅ bcrypt with cost factor 10 — acceptable.

**JWT Handling:**
- ❌ Same secret for access and refresh tokens
- ❌ 24h access token lifetime is too long
- ❌ Tokens stored in localStorage (XSS-vulnerable)
- ❌ No token revocation mechanism

```typescript
// FIX (jwtService.ts): Use separate secrets and shorter access token expiry
class JwtService {
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, envConfig.jwtAccessSecret as string, {
      expiresIn: "15m", // Short-lived
    });
  }

  generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, envConfig.jwtRefreshSecret as string, {
      expiresIn: "7d",
    });
  }

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, envConfig.jwtAccessSecret as string) as TokenPayload;
  }

  verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, envConfig.jwtRefreshSecret as string) as TokenPayload;
  }
}
```

**RBAC:** ✅ Admin routes properly protected server-side with `requireAdmin` middleware. Delivery boy routes use `accessTo(Role.Admin)`.

**Rate Limiting:** ⚠️ Exists but in-memory store is unsuitable for production.

```typescript
// FIX: Use Redis-backed rate limiter
import { RateLimiterRedis } from "rate-limiter-flexible";
import Redis from "ioredis";

const redisClient = new Redis(envConfig.redisUrl);

export const loginRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "login_fail",
  points: 5,        // 5 attempts
  duration: 15 * 60, // per 15 minutes
  blockDuration: 30 * 60, // Block for 30 min after exceeding
});
```

**Account Lockout:** ❌ Not implemented — no failed attempt tracking.

---

### 2. Payment & Checkout Security

**PCI Scope:** ✅ Using Khalti (redirect-based) — card data never touches server.

**Webhook Verification:** ❌ CRITICAL — `verifyKhalti` endpoint accepts any `pidx` and trusts the Khalti lookup response without verifying a cryptographic signature on inbound callbacks.

```typescript
// FIX (paymentController.ts): Validate Khalti webhook signature
async verifyKhalti(req: Request, res: Response): Promise<void> {
  const { pidx, orderId } = req.body;
  
  // Verify the payment actually belongs to this order
  const order = await Order.findByPk(orderId);
  if (!order) { res.status(404).json({ message: "Order not found" }); return; }
  
  // Server-side verification with Khalti
  const response = await axios.post(
    "https://a.khalti.com/api/v2/epayment/lookup/",
    { pidx },
    { headers: { Authorization: `Key ${envConfig.khaltiSecretKey}` } }
  );
  
  // Verify amount matches order total (prevent underpayment)
  if (response.data.total_amount !== order.totalPrice * 100) {
    res.status(400).json({ message: "Payment amount mismatch" });
    return;
  }
  
  // Verify purchase_order_id matches
  if (response.data.purchase_order_id !== orderId) {
    res.status(400).json({ message: "Order ID mismatch" });
    return;
  }
  // ... proceed with updating order
}
```

**Idempotency:** ❌ No idempotency keys — network retries can create duplicate orders.

**Server-side Price Calculation:** ✅ Prices are recalculated from variant database records during order creation (not trusted from client).

**Inventory Race Conditions:** ❌ CRITICAL — `Variant.decrement` is not atomic with the stock check. Two concurrent requests can both pass the `stock < quantity` check.

```typescript
// FIX: Use SELECT ... FOR UPDATE within the transaction
const variant = await Variant.findByPk(itemData.variantId, {
  lock: transaction.LOCK.UPDATE,
  transaction,
});

if (variant.stock < itemData.quantity) {
  await transaction.rollback();
  res.status(409).json({ message: `Insufficient stock for ${itemData.productName}` });
  return;
}

await variant.decrement("stock", { by: itemData.quantity, transaction });
```

---

### 3. Input Validation & Injection

**SQL/NoSQL Injection:** ✅ Sequelize ORM with parameterized queries used throughout. No raw SQL with user input interpolation.

**XSS:** ❌ Sanitizer only removes null bytes and trims whitespace — does NOT encode HTML entities. Product descriptions, reviews, and customer notes can contain XSS payloads.

```typescript
// FIX (validation.ts): Add HTML encoding
function sanitizeString(str: string): string {
  str = str.replace(/\0/g, "");
  str = str.trim();
  // Encode dangerous HTML characters
  str = str.replace(/&/g, "&amp;")
           .replace(/</g, "&lt;")
           .replace(/>/g, "&gt;")
           .replace(/"/g, "&quot;")
           .replace(/'/g, "&#x27;");
  if (str.length > 10000) str = str.substring(0, 10000);
  return str;
}
```

**CSRF:** ❌ No CSRF protection. Since tokens are in Authorization header (not cookies), API endpoints are mostly safe, but the Google OAuth callback uses cookies/sessions making it potentially vulnerable.

**File Upload:** ⚠️ Cloudinary validates `allowed_formats` server-side, but no file size limit is set in multer config.

```typescript
// FIX (multer.ts): Add file size limit
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 10,
  },
});
```

---

### 4. API & Data Security

**Admin API Exposure:** ✅ All admin routes require `isUserLoggedIn` + `requireAdmin`.

**Sensitive Data Exposure:** ⚠️ The `/auth/me` endpoint correctly excludes password. However, error responses in many controllers include `error: error.message` which can leak stack traces and internal details.

**Secrets in Git:** ✅ `.env` is in `.gitignore`.

**HTTPS:** ❌ Not enforced at application level. No HSTS header. Must be handled by reverse proxy.

**CORS:** ⚠️ Correctly restrictive for browser requests, but `!origin` (non-browser) always returns `true`.

---

### 5. Infrastructure & Config

**Debug Mode:** ❌ Global error handler exposes error details conditionally (`NODE_ENV === "development"`), but individual controllers always return `error: error.message` regardless of environment.

```typescript
// FIX: Never expose error.message in production responses
res.status(500).json({
  message: "Internal server error",
  ...(process.env.NODE_ENV === "development" && { error: error.message }),
});
```

**Database Backups:** ❓ Not configured in the codebase. Must be set up at infrastructure level.

**Logging & Monitoring:** ❌ Only `console.error` statements. No structured logging, no error tracking service, no audit trail.

**Dependency Audit:** ⚠️ Express 5 is used (still in beta as of mid-2025). No automated audit in CI.

**Secrets Rotation:** ⚠️ `ADMIN_EMAIL`/`ADMIN_PASSWORD` in env config used by seeders — ensure these are production-specific and not defaults.

---

### 6. Business Logic

**Coupon/Discount Abuse:** N/A — no coupon system implemented yet.

**Order Status Manipulation:** ✅ `cancelOrder` validates ownership and status. Admin-only for status advancement.

**Guest Checkout:** ❌ Not supported — all orders require authentication.

---

### 7. Performance & Reliability

**Database Indexes:** ✅ Performance indexes are created on cart_items, order_items, orders, product_images, variants, product_reviews, wishlist, and payments.

**N+1 Queries:** ⚠️ Eager loading is used for listings (good), but `createOrder` has sequential per-item processing in a loop.

**Image Optimization/CDN:** ✅ Cloudinary handles image hosting and transformations.

**Load Testing:** ❓ No evidence of load testing configuration.

---

### 8. Compliance & Legal

**Privacy/Terms:** ⚠️ Links exist in footer but likely placeholder (`#` href). Actual pages need content.

**Cookie Consent:** ❌ No implementation.

**GDPR/CCPA Data Deletion:** ❌ No user data deletion endpoint.

---

## Priority Remediation Roadmap

### Week 1 (Critical)
1. Add `helmet` middleware with CSP, HSTS, X-Frame-Options
2. Fix inventory race condition with `SELECT ... FOR UPDATE`
3. Separate JWT secrets for access/refresh tokens, reduce access token to 15min
4. Remove dummy payment mode or add environment guard that panics if used in production
5. Verify payment amounts server-side during Khalti verification

### Week 2 (High)
6. Switch to Redis-backed rate limiter with account lockout
7. Add proper HTML sanitization (consider `DOMPurify` for user content)
8. Add file size limits to multer
9. Remove `error.message` from production API responses
10. Implement refresh token rotation

### Week 3 (Medium)
11. Add structured logging (Winston/Pino) with Sentry for error tracking
12. Add idempotency keys for order creation
13. Implement proper database migrations (remove `sequelize.sync`)
14. Hash OTP values in database
15. Move to httpOnly cookies for token storage (or use BFF pattern)

---

## Suggested Features (Post-Launch)

| Priority | Feature | Impact on Conversion | Effort |
|----------|---------|---------------------|--------|
| 1 | **Abandoned Cart Recovery (WhatsApp/Email)** | High — recovers 5-15% of lost sales | Medium (WhatsApp integration already exists) |
| 2 | **Guest Checkout** | High — reduces friction, ~30% of users won't create accounts | Medium (needs order-to-account linking) |
| 3 | **Product Search with Filters** (price range, sport, size availability) | High — improves product discovery significantly | Medium (need full-text search / Elasticsearch) |
| 4 | **Order Tracking Page** (real-time status with timeline) | Medium — reduces "where's my order" support queries | Low (StatusHistory model already exists) |
| 5 | **Verified Purchase Badges on Reviews** | Medium — builds trust, increases conversion 3-5% | Low (can cross-reference OrderItem + userId) |
| 6 | **Saved Addresses** | Medium — speeds repeat purchases | Low (new Address model + user association) |
| 7 | **Related Products / "Customers Also Bought"** | Medium — increases average order value | Medium (recommendation engine exists but basic) |
| 8 | **Multi-Currency (NPR/USD/INR)** | Low-Medium — only if targeting international customers | High (pricing, payment gateway, display logic) |

### Rationale for Top 3:
1. **Abandoned cart via WhatsApp** is uniquely high-value because you already have WhatsApp integration built. A simple cron job checking carts older than 1 hour with a templated WhatsApp message could recover significant revenue with minimal new code.
2. **Guest checkout** removes the #1 friction point in e-commerce. Your order model already stores all contact info — you just need to allow order creation without `userId` being required and offer account creation post-purchase.
3. **Search with filters** is essential for a sports store with multiple categories, brands, and sizes. Current `iLike` search is functional but lacks faceted filtering that users expect.

---

*Report generated from static code analysis. Dynamic testing (penetration testing, load testing) recommended before production launch.*
