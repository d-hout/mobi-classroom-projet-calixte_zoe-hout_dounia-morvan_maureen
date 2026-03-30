const fallbackSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 340">
    <rect width="240" height="340" fill="#f3efe4"/>
    <rect x="18" y="18" width="204" height="304" rx="18" fill="#ffffff" stroke="#d6c7a1" stroke-width="4"/>
    <circle cx="120" cy="120" r="34" fill="#e7dcc3"/>
    <path d="M72 236c12-34 36-52 48-52s36 18 48 52" fill="#e7dcc3"/>
    <text x="120" y="286" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#8a6f3b">
      Image indisponible
    </text>
  </svg>
`;

export const FALLBACK_CARD_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  fallbackSvg
)}`;
const failedImageUrls = new Set();
const USE_REMOTE_CARD_IMAGES = true;

export function getDisplayImageUrl(url) {
  if (
    !USE_REMOTE_CARD_IMAGES ||
    !isUsableImageUrl(url) ||
    failedImageUrls.has(url)
  ) {
    return FALLBACK_CARD_IMAGE;
  }

  return url;
}

export function handleImageError(event) {
  const failedUrl = event.currentTarget.getAttribute("src");
  if (failedUrl && failedUrl !== FALLBACK_CARD_IMAGE) {
    failedImageUrls.add(failedUrl);
  }

  if (event.currentTarget.src !== FALLBACK_CARD_IMAGE) {
    event.currentTarget.src = FALLBACK_CARD_IMAGE;
  }
}

export function isUsableImageUrl(url) {
  if (!url || typeof url !== "string") return false;

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:";
  } catch {
    return false;
  }
}

export async function getValidatedImageUrl(url) {
  return getDisplayImageUrl(url);
}
