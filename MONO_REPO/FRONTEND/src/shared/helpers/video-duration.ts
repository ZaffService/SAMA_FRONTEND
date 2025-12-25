export interface VideoDuration {
  hours: string;
  minutes: string;
  seconds: string;
  formatted: string;
}

/**
 * Extrait l'ID YouTube d'une URL
 */
export function extractYoutubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|\/|\/\/|embed\/|watch\?v=|&v=)([^#&?]*)/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

/**
 * Récupère la durée d'une vidéo YouTube (version mockée)
 * Retourne toujours une durée par défaut pour éviter les appels API
 */
export async function getYoutubeDuration(
  videoUrl: string,
): Promise<VideoDuration | null> {
  // Simulation d'un délai réseau
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Vérifier que c'est une URL YouTube valide
  const youtubeId = extractYoutubeId(videoUrl);
  if (!youtubeId) {
    return null;
  }

  // Retourner une durée mockée
  return {
    hours: "1",
    minutes: "30",
    seconds: "0",
    formatted: "~1h 30m",
  };
}
