import { test } from "node:test";
import assert from "node:assert/strict";
import { createRateLimiter } from "../src/middleware/rateLimiter.js";

type Handler = ReturnType<typeof createRateLimiter>;

/** Minimal Express-ish doubles — enough to drive the middleware. */
const makeReq = (ip: string) => ({ ip, socket: { remoteAddress: ip } }) as never;

const makeRes = () => {
  const state = { status: 0, body: null as unknown, headers: {} as Record<string, unknown> };
  const res = {
    setHeader(name: string, value: unknown) { state.headers[name] = value; },
    status(code: number) { state.status = code; return res; },
    json(payload: unknown) { state.body = payload; return res; },
  };
  return { res: res as never, state };
};

/** Run one request; returns true when it was allowed through. */
const hit = (limiter: Handler, ip: string): boolean => {
  let passed = false;
  const { res } = makeRes();
  limiter(makeReq(ip), res, () => { passed = true; });
  return passed;
};

test("allows up to max requests, then blocks", () => {
  const limiter = createRateLimiter({ max: 3 });
  assert.equal(hit(limiter, "1.1.1.1"), true);
  assert.equal(hit(limiter, "1.1.1.1"), true);
  assert.equal(hit(limiter, "1.1.1.1"), true);
  assert.equal(hit(limiter, "1.1.1.1"), false, "4th request over a max of 3 must be blocked");
});

test("counts each client separately", () => {
  const limiter = createRateLimiter({ max: 1 });
  assert.equal(hit(limiter, "1.1.1.1"), true);
  assert.equal(hit(limiter, "2.2.2.2"), true, "a different IP has its own budget");
  assert.equal(hit(limiter, "1.1.1.1"), false);
});

test("each limiter keeps its own counter", () => {
  // Regression: a shared store let ordinary browsing spend the strict auth
  // budget, so a shopper who browsed a few pages could not log in.
  const general = createRateLimiter({ max: 100 });
  const auth = createRateLimiter({ max: 2 });

  for (let i = 0; i < 50; i++) {
    assert.equal(hit(general, "9.9.9.9"), true, `general request ${i + 1} should pass`);
  }

  assert.equal(hit(auth, "9.9.9.9"), true, "browsing must not consume the auth budget");
  assert.equal(hit(auth, "9.9.9.9"), true);
  assert.equal(hit(auth, "9.9.9.9"), false, "auth limiter still enforces its own max");
});

test("blocked response reports 429 and a retry hint", () => {
  const limiter = createRateLimiter({ max: 1, message: "slow down" });
  hit(limiter, "3.3.3.3");

  const { res, state } = makeRes();
  limiter(makeReq("3.3.3.3"), res, () => assert.fail("should not call next"));

  assert.equal(state.status, 429);
  const body = state.body as { message: string; retryAfter: number };
  assert.equal(body.message, "slow down");
  assert.ok(body.retryAfter > 0, "retryAfter should be a positive number of seconds");
  assert.equal(state.headers["X-RateLimit-Limit"], 1);
  assert.equal(state.headers["X-RateLimit-Remaining"], 0);
});

test("budget resets after the window passes", () => {
  const limiter = createRateLimiter({ max: 1, windowMs: 20 });
  assert.equal(hit(limiter, "4.4.4.4"), true);
  assert.equal(hit(limiter, "4.4.4.4"), false);

  const start = Date.now();
  while (Date.now() - start < 25) { /* wait out the tiny window */ }

  assert.equal(hit(limiter, "4.4.4.4"), true, "a new window starts with a fresh count");
});
