// Inline data-URL placeholder shown when a product has no images.
// Replaces dependency on via.placeholder.com (which is no longer reliably available).

const PLACEHOLDER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <rect width="100%" height="100%" fill="#f3f4f6"/>
  <g fill="#9ca3af">
    <path d="M340 320h120a30 30 0 0 1 30 30v140a30 30 0 0 1-30 30H340a30 30 0 0 1-30-30V350a30 30 0 0 1 30-30zm0 20a10 10 0 0 0-10 10v120l50-50 40 40 70-70 30 30V350a10 10 0 0 0-10-10H340z"/>
    <circle cx="370" cy="380" r="14"/>
  </g>
  <text x="400" y="600" text-anchor="middle" fill="#6b7280" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="600">No Image</text>
</svg>`.trim();

export const NO_IMAGE_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(PLACEHOLDER_SVG)}`;

/** Returns the first non-empty url from a list of image objects, or the placeholder. */
export function pickProductImageUrl(
  images: Array<{ url?: string | null; isThumbnail?: boolean } | string> | undefined
): string {
  if (!images || images.length === 0) return NO_IMAGE_PLACEHOLDER;

  for (const img of images) {
    if (typeof img === "string" && img.trim()) return img;
    if (img && typeof img === "object" && img.url && img.url.trim()) {
      return img.url;
    }
  }
  return NO_IMAGE_PLACEHOLDER;
}
