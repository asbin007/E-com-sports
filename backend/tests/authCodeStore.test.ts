import { test } from "node:test";
import assert from "node:assert/strict";
import { AuthCodeStore } from "../src/services/authCodeStore.js";

const tokens = { token: "access", refreshToken: "refresh" };

test("a code redeems exactly once", () => {
  const store = new AuthCodeStore();
  const code = store.issue(tokens);
  assert.match(code, /^[A-Za-z0-9_-]{40,}$/);
  assert.deepEqual(store.redeem(code), tokens);
  assert.equal(store.redeem(code), null, "second redeem must fail");
});

test("unknown codes are rejected", () => {
  const store = new AuthCodeStore();
  assert.equal(store.redeem("nope"), null);
});

test("codes expire after the ttl", () => {
  let now = 1_000_000;
  const store = new AuthCodeStore(60_000, () => now);
  const code = store.issue(tokens);
  now += 60_000;
  assert.equal(store.redeem(code), null);
});

test("expired codes are swept on the next issue", () => {
  let now = 0;
  const store = new AuthCodeStore(1_000, () => now);
  store.issue(tokens);
  store.issue(tokens);
  assert.equal(store.size, 2);
  now = 5_000;
  store.issue(tokens);
  assert.equal(store.size, 1);
});
