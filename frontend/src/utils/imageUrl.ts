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

