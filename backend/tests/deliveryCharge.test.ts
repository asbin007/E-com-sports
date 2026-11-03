import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateDeliveryCharge, getDeliveryChargeLabel } from "../src/utils/deliveryCharge.js";

test("Kathmandu valley is tier 1", () => {
  assert.equal(calculateDeliveryCharge("Kathmandu"), 100);
  assert.equal(calculateDeliveryCharge("  lalitpur "), 100);
  assert.equal(getDeliveryChargeLabel("Bhaktapur"), "Kathmandu Valley");
});

test("major cities are tier 2", () => {
  assert.equal(calculateDeliveryCharge("Pokhara"), 150);
  assert.equal(getDeliveryChargeLabel("BIRATNAGAR"), "Major City");
});

test("unknown cities fall back to remote tier", () => {
  assert.equal(calculateDeliveryCharge("Jumla"), 200);
  assert.equal(calculateDeliveryCharge(""), 200);
  assert.equal(getDeliveryChargeLabel("Nowhere"), "Remote Area");
});
