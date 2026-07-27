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

export function isYouTubeShortsUrl(url?: string | null): boolean {
  return typeof url === "string" && /youtube\.com\/shorts\//i.test(url);
}

/**
 * Détecte portrait vs paysage pour cadrer comme Bunny.
 * 1) URL /shorts/
 * 2) oEmbed height > width
 * 3) Analyse miniature hqdefault (bandes noires latérales = portrait)
 */
export async function detectYouTubeOrientation(
  url?: string | null,
): Promise<"portrait" | "landscape"> {
  if (!url?.trim()) return "landscape";
  if (isYouTubeShortsUrl(url)) return "portrait";

  const id = getYouTubeVideoId(url);
  if (!id) return "landscape";

  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(
        `https://www.youtube.com/watch?v=${id}`,
      )}&format=json`,
    );
    if (res.ok) {
      const data = (await res.json()) as { width?: number; height?: number };
      const w = Number(data.width) || 16;
      const h = Number(data.height) || 9;
      if (h > w) return "portrait";
    }
  } catch {
    // continue
  }

  const fromThumb = await detectPortraitFromYouTubeThumbnail(id);
  if (fromThumb === true) return "portrait";
  if (fromThumb === false) return "landscape";

  return "landscape";
}

/** hqdefault est en 4:3 : portrait → piliers noirs ; paysage → bandes haut/bas. */
function detectPortraitFromYouTubeThumbnail(
  videoId: string,
): Promise<boolean | null> {
  if (typeof window === "undefined") return Promise.resolve(null);

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const done = (value: boolean | null) => resolve(value);

    img.onload = () => {
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (w < 16 || h < 16) {
          done(null);
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          done(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const lum = (x: number, y: number) => {
          const d = ctx.getImageData(
            Math.max(0, Math.min(w - 1, x)),
            Math.max(0, Math.min(h - 1, y)),
            1,
            1,
          ).data;
          return (d[0] + d[1] + d[2]) / 3;
        };
        const midX = Math.floor(w / 2);
        const midY = Math.floor(h / 2);
        const left =
          (lum(4, midY) + lum(10, midY) + lum(4, Math.floor(h * 0.35))) / 3;
        const right =
          (lum(w - 5, midY) +
            lum(w - 11, midY) +
            lum(w - 5, Math.floor(h * 0.35))) /
          3;
        const top =
          (lum(midX, 4) + lum(midX, 10) + lum(Math.floor(w * 0.35), 4)) / 3;
        const bottom =
          (lum(midX, h - 5) +
            lum(midX, h - 11) +
            lum(Math.floor(w * 0.35), h - 5)) /
          3;
        const center =
          (lum(midX, midY) +
            lum(midX, Math.floor(h * 0.4)) +
            lum(midX, Math.floor(h * 0.6))) /
          3;

        const edgeDark = 48;
        const centerBright = 55;
        const sidePillars =
          left < edgeDark && right < edgeDark && center > centerBright;
        const topBottomBars =
          top < edgeDark && bottom < edgeDark && center > centerBright;

        if (sidePillars && !topBottomBars) {
          done(true);
          return;
        }
        if (topBottomBars && !sidePillars) {
          done(false);
          return;
        }
        done(null);
      } catch {
        done(null);
      }
    };
    img.onerror = () => done(null);
    img.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  });
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
