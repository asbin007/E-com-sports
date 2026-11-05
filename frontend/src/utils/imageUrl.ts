type ImageLike = string | { url?: string | null } | null | undefined;

const CLOUDINARY_BASE =
  "https://res.cloudinary.com/dxpe7jikz/image/upload/v1/";

export function getImageUrl(image: ImageLike): string | undefined {
  if (!image) return undefined;

  if (typeof image === "string") {
    const trimmed = image.trim();
    if (!trimmed) return undefined;

    // Direct URL from backend / already cloudinary URL.
    if (trimmed.startsWith("http")) return trimmed;

    const publicId = trimmed.replace("/uploads/", "");
    return `${CLOUDINARY_BASE}${publicId}`;
  }

  const url = image.url;
  if (typeof url === "string") return getImageUrl(url);

  return undefined;
}

export function getFirstImageUrl(
  images: unknown
): string | undefined {
  if (!Array.isArray(images)) return undefined;

  for (const img of images) {
    const url = getImageUrl(img as ImageLike);
    if (url) return url;
  }

  return undefined;
}


/**
 * A Cloudinary-hosted product photo with its background removed, for the hero
 * where the product has to sit on the page rather than inside a card.
 *
 * The catalogue images are stored padded on white (`c_pad,b_white`), so the
 * transformation strips that back off: remove the background, trim the empty
 * margin, then fit to a height. Anything not served from our Cloudinary
 * account is returned unchanged — a remote URL has no transformation to apply.
 */
export function getCutoutUrl(image: ImageLike, height = 700): string | undefined {
  const url = getImageUrl(image);
  if (!url) return undefined;

  const marker = "/image/upload/";
  const at = url.indexOf(marker);
  if (!url.startsWith("https://res.cloudinary.com/") || at === -1) return url;

  const head = url.slice(0, at + marker.length);
  // Drop any existing transformation segments and the version prefix so the
  // cut-out is derived from the original asset, not from the padded render.
  const tail = url
    .slice(at + marker.length)
    .split("/")
    .filter((part) => !/^(v\d+|[a-z]{1,3}_[^/]*)$/.test(part))
    .join("/");

  return `${head}e_background_removal/e_trim:25/f_auto,q_auto,h_${height},c_limit/${tail}`;
}
