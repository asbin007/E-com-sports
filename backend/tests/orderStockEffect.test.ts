import { test } from "node:test";
import assert from "node:assert/strict";
import { stockEffectOf } from "../src/utils/orderStockEffect.js";

test("cancelling an open order puts its stock back", () => {
  for (const current of ["pending", "confirmed", "preparation", "ontheway", "delivered"]) {
    assert.equal(stockEffectOf(current, "cancelled"), "restore");
  }
});

test("other status changes leave stock alone", () => {
  assert.equal(stockEffectOf("pending", "confirmed"), "none");
  assert.equal(stockEffectOf("ontheway", "delivered"), "none");
});

test("a cancelled order cannot restore stock twice or reopen", () => {
  assert.equal(stockEffectOf("cancelled", "cancelled"), "refuse");
  assert.equal(stockEffectOf("cancelled", "pending"), "refuse");
});
