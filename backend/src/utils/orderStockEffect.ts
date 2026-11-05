export type StockEffect = "refuse" | "restore" | "none";

/**
 * Stock leaves the shelf when an order is placed, so it goes back exactly once,
 * on the move into "cancelled". A cancelled order stays cancelled: by then its
 * stock may have been sold to someone else.
 */
export const stockEffectOf = (current: string, next: string): StockEffect => {
  if (current === "cancelled") return "refuse";
  return next === "cancelled" ? "restore" : "none";
};
