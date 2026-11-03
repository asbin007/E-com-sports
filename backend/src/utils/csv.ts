/**
 * Escape a single CSV cell.
 *
 * - Guards against formula injection: a cell starting with `=`, `+`, `-` or `@`
 *   is prefixed with a tab so spreadsheet apps treat it as text.
 * - Quotes cells containing commas, quotes or newlines (RFC 4180).
 */
export function escapeCsvCell(value: unknown): string {
  const raw = value === null || value === undefined ? "" : String(value);
  const guarded = /^[=+\-@]/.test(raw) ? `\t${raw}` : raw;

  if (/[",\n\r]/.test(guarded)) {
    return `"${guarded.replace(/"/g, '""')}"`;
  }

  return guarded;
}
