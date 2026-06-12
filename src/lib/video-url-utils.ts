/**
 * Détermine si une URL peut être lue directement sans passer par /video/signed.
 */
export function isDirectPlayableVideoUrl(url?: string | null): boolean {
  if (!url?.trim()) return false;

  const normalized = url.trim().toLowerCase();

  if (
    normalized.includes("mediadelivery.net/embed/") ||
    normalized.includes("mediadelivery.net/play/")
  ) {
    return true;
  }

  if (
    normalized.includes("youtube.com/embed/") ||
    normalized.includes("youtu.be/") ||
    normalized.includes("youtube.com/watch")
  ) {
    return true;
  }

  if (/\.(mp4|m3u8|webm|ogg|mov)(\?|#|$)/i.test(normalized)) {
    return true;
  }

  if (
    normalized.includes("cloudinary.com") &&
    /\.(mp4|m3u8)(\?|#|$)/i.test(normalized)
  ) {
    return true;
  }

  return false;
}

/** URL admin Bunny ou absente → récupérer l'URL signée via le backend. */
export function shouldFetchSignedVideoUrl(url?: string | null): boolean {
  if (!url?.trim()) return true;

  const normalized = url.trim().toLowerCase();

  if (normalized.includes("video.bunnycdn.com/library/")) {
    return true;
  }

  return !isDirectPlayableVideoUrl(url);
}
