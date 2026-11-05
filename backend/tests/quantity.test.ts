import { test } from "node:test";
import assert from "node:assert/strict";
import { parseQuantity, MAX_QUANTITY } from "../src/utils/quantity.js";

test("accepts whole quantities in range, as number or string", () => {
  assert.equal(parseQuantity(1), 1);
  assert.equal(parseQuantity(7), 7);
  assert.equal(parseQuantity("3"), 3);
  assert.equal(parseQuantity(MAX_QUANTITY), MAX_QUANTITY);
});

test("rejects negatives, which would credit stock and cut the order total", () => {
  assert.equal(parseQuantity(-1), null);
  assert.equal(parseQuantity(-99), null);
  assert.equal(parseQuantity("-3"), null);
});

test("rejects zero, fractions and out-of-range values", () => {
  assert.equal(parseQuantity(0), null);
  assert.equal(parseQuantity(1.5), null);
  assert.equal(parseQuantity("2.5"), null);
  assert.equal(parseQuantity(MAX_QUANTITY + 1), null);
});

test("rejects anything that is not a number at all", () => {
  for (const bad of [null, undefined, "", "   ", "abc", NaN, Infinity, {}, [], true]) {
    assert.equal(parseQuantity(bad), null, `expected ${JSON.stringify(bad)} to be rejected`);
  }
});
