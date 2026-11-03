import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeCsvCell } from "../src/utils/csv.js";

test("plain values pass through", () => {
  assert.equal(escapeCsvCell("Kathmandu"), "Kathmandu");
  assert.equal(escapeCsvCell(42), "42");
  assert.equal(escapeCsvCell(null), "");
  assert.equal(escapeCsvCell(undefined), "");
});

test("formula-leading cells are neutralised", () => {
  assert.equal(escapeCsvCell('=CMD("calc")'), '"	=CMD(""calc"")"');
  assert.equal(escapeCsvCell("+1"), "\t+1");
  assert.equal(escapeCsvCell("-1"), "\t-1");
  assert.equal(escapeCsvCell("@SUM"), "\t@SUM");
});

test("cells with commas, quotes or newlines are quoted", () => {
  assert.equal(escapeCsvCell("a,b"), '"a,b"');
  assert.equal(escapeCsvCell('say "hi"'), '"say ""hi"""');
  assert.equal(escapeCsvCell("line1\nline2"), '"line1\nline2"');
});
