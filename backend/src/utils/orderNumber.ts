/**
 * Order number generation utility.
 * Format: BSH-YYYYMMDD-XXXX
 * - BSH: Brothers Sports House prefix
 * - YYYYMMDD: Current date in Nepal time (UTC+5:45)
 * - XXXX: Random 4-character alphanumeric string
 */

function generateRandomAlphanumeric(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateOrderNumber(): string {
  const now = new Date();

  // Convert to Nepal time (UTC+5:45)
  const nepalOffsetMs = (5 * 60 + 45) * 60 * 1000;
  const nepalTime = new Date(now.getTime() + nepalOffsetMs + now.getTimezoneOffset() * 60 * 1000);

  const year = nepalTime.getFullYear();
  const month = String(nepalTime.getMonth() + 1).padStart(2, '0');
  const day = String(nepalTime.getDate()).padStart(2, '0');

  const datePart = `${year}${month}${day}`;
  const randomPart = generateRandomAlphanumeric(4);

  return `BSH-${datePart}-${randomPart}`;
}
