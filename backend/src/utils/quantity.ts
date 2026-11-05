/**
 * Order and cart quantities arrive straight off the wire as `unknown`, and
 * nothing downstream re-checks them: the stock guard is `stock < quantity`,
 * which a negative number passes, and `Variant.decrement({ by })` with a
 * negative value *adds* stock. A single bad number therefore both lowers an
 * order total and inflates inventory, so every entry point parses here.
 */

/** Nobody orders more than this from a shop counter; it also caps abuse. */
export const MAX_QUANTITY = 99;

/**
 * Returns a whole quantity between 1 and {@link MAX_QUANTITY}, or null when the
 * input is not one. Strings are accepted because quantities also arrive through
 * `multipart/form-data` and query strings, where every value is a string.
 */
export const parseQuantity = (input: unknown): number | null => {
  if (typeof input !== "number" && typeof input !== "string") return null;
  // Number("") and Number("  ") are both 0, so reject blank strings up front.
  if (typeof input === "string" && input.trim() === "") return null;

  const value = Number(input);
  if (!Number.isFinite(value)) return null;
  if (!Number.isInteger(value)) return null;
  if (value < 1 || value > MAX_QUANTITY) return null;

  return value;
};

/** The message every endpoint returns for a rejected quantity. */
export const QUANTITY_ERROR = `Quantity must be a whole number between 1 and ${MAX_QUANTITY}`;
