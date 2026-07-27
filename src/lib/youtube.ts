export type LessonVideoSourceMode = "file" | "youtube";

const YOUTUBE_ID_PATTERNS = [
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i,
  /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
  /(?:youtube\.com\/watch\?.*[?&]v=)([a-zA-Z0-9_-]{11})/i,
];

/** Extrait l'ID YouTube (11 caractères) depuis une URL ou un embed. */
export function getYouTubeVideoId(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  for (const pattern of YOUTUBE_ID_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match?.[1]?.length === 11) return match[1];
  }
  return null;
}

export function isYouTubeUrl(url?: string | null): boolean {
  return getYouTubeVideoId(url) !== null;
}

/** Normalise vers une URL watch canonique, ou null si invalide. */
export function normalizeYouTubeUrl(url?: string | null): string | null {
  const id = getYouTubeVideoId(url);
  if (!id) return null;
  return `https://www.youtube.com/watch?v=${id}`;
}

export function validateYouTubeUrl(url?: string | null): string | null {
  if (!url?.trim()) return "Collez un lien YouTube";
  if (!isYouTubeUrl(url)) {
    return "Lien YouTube invalide (youtube.com ou youtu.be)";
  }
  return null;
}

/** True si la leçon doit envoyer videoUrl (pas de fichier). */
export function lessonHasExternalVideoUrl(lesson: {
  videoFile?: File | null;
  videoUrl?: string | null;
  videoSource?: LessonVideoSourceMode | string;
}): boolean {
  if (lesson.videoFile) return false;
  if (lesson.videoSource === "file") return false;
  return isYouTubeUrl(lesson.videoUrl);
}
