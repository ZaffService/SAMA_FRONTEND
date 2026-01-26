import { buildApiUrl, API_ENDPOINTS } from "./baseConfig";

/**
 * Video upload API
 * Handles uploading videos to the backend
 */

export interface UploadProgressEvent {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  videoUrl?: string;
  videoId?: string;
  error?: string;
}

/**
 * Upload a video file to the server with progress tracking
 * @param file - The video file to upload
 * @param lessonTempId - The temporary ID of the lesson
 * @param onProgress - Callback for progress updates
 * @returns UploadResult with success status and video URL or error
 */
export async function uploadVideo(
  file: File,
  lessonTempId: string,
  onProgress?: (event: UploadProgressEvent) => void,
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("video", file);
  formData.append("lessonTempId", lessonTempId);

  console.log(`🎥 [VideoApi] Début upload vidéo: ${file.name} (${formatFileSize(file.size)})`);

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const percentage = Math.round((event.loaded / event.total) * 100);
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage,
        });
        console.log(`📊 [VideoApi] Progression: ${percentage}%`);
      }
    });

    // Handle upload completion
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          console.log(`✅ [VideoApi] Upload réussi:`, response);
          resolve({
            success: true,
            videoUrl: response.videoUrl || response.url,
            videoId: response.videoId || response.id,
          });
        } catch (error) {
          // Even if we can't parse the response, if status is 200, consider it successful
          console.log(`✅ [VideoApi] Upload réussi (status ${xhr.status})`);
          resolve({
            success: true,
            videoUrl: undefined,
          });
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          console.error(`❌ [VideoApi] Erreur upload:`, errorData);
          resolve({
            success: false,
            error: errorData.message || `Erreur ${xhr.status}`,
          });
        } catch {
          console.error(`❌ [VideoApi] Erreur upload: Status ${xhr.status}`);
          resolve({
            success: false,
            error: `Erreur ${xhr.status}`,
          });
        }
      }
    });

    // Handle network errors
    xhr.addEventListener("error", () => {
      console.error(`❌ [VideoApi] Erreur réseau`);
      resolve({
        success: false,
        error: "Connexion perdue - vérifiez votre connexion internet",
      });
    });

    // Handle upload abort
    xhr.addEventListener("abort", () => {
      console.warn(`⚠️ [VideoApi] Upload annulé`);
      resolve({
        success: false,
        error: "Upload annulé",
      });
    });

    // Timeout handling
    xhr.timeout = 30 * 60 * 1000; // 30 minutes for large videos
    xhr.ontimeout = () => {
      console.error(`❌ [VideoApi] Timeout`);
      resolve({
        success: false,
        error: "Temps d'attente dépassé - le fichier est peut-être trop volumineux",
      });
    };

    // Open and send the request
    const uploadUrl = buildApiUrl("/upload/video");
    console.log(`📡 [VideoApi] Envoi vers: ${uploadUrl}`);
    xhr.open("POST", uploadUrl, true);
    xhr.withCredentials = true;
    xhr.send(formData);
  });
}

/**
 * Upload video using fetch API (alternative to XHR)
 * Note: fetch doesn't support progress tracking natively
 */
export async function uploadVideoWithFetch(
  file: File,
  lessonTempId: string,
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("video", file);
  formData.append("lessonTempId", lessonTempId);

  console.log(`🎥 [VideoApi] Début upload vidéo (fetch): ${file.name}`);

  try {
    const response = await fetch(buildApiUrl("/upload/video"), {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`❌ [VideoApi] Erreur upload:`, errorData);
      return {
        success: false,
        error: errorData.message || `Erreur ${response.status}`,
      };
    }

    const responseData = await response.json();
    console.log(`✅ [VideoApi] Upload réussi (fetch):`, responseData);

    return {
      success: true,
      videoUrl: responseData.videoUrl || responseData.url,
      videoId: responseData.videoId || responseData.id,
    };
  } catch (error) {
    console.error(`❌ [VideoApi] Erreur réseau (fetch):`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur de connexion",
    };
  }
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Check if video file is valid
 */
export function validateVideoFile(
  file: File,
  allowedTypes: string[],
  maxSize: number,
): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Format non supporté - utilisez MP4, WebM ou MOV`,
    };
  }
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Fichier trop volumineux (500MB max) - compressez la vidéo ou choisissez-en une plus petite`,
    };
  }
  return { valid: true };
}

/**
 * Video API for signed URLs
 * Handles fetching and caching of signed video URLs
 */
export class VideoApi {
  /**
   * Cache for signed video URLs
   */
  private static urlCache: Map<string, { url: string; expiresAt: Date }> = new Map();

  /**
   * Récupère une URL signée pour la vidéo d'une leçon
   * Cache les URLs jusqu'à leur expiration
   */
  static async getSignedVideoUrl(lessonId: string): Promise<string> {
    // Vérifier le cache
    const cached = this.urlCache.get(lessonId);
    if (cached && cached.expiresAt > new Date()) {
      console.log(`✅ URL signée en cache pour leçon ${lessonId}`);
      return cached.url;
    }

    try {
      console.log(`🔍 Récupération URL signée pour leçon ${lessonId}...`);

      const response = await fetch(
        buildApiUrl(`/course/lesson/${lessonId}/video/signed`),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("UNAUTHORIZED: Vous n'êtes pas inscrit à ce cours");
        }
        if (response.status === 404) {
          throw new Error("LESSON_NOT_FOUND: Cette leçon n'existe pas");
        }
        if (response.status === 410) {
          throw new Error("VIDEO_DELETED: La vidéo a été supprimée");
        }
        throw new Error(`Erreur ${response.status} lors de la récupération de la vidéo`);
      }

      const data = await response.json() as SignedVideoUrl;

      // Mettre en cache
      this.urlCache.set(lessonId, {
        url: data.url,
        expiresAt: new Date(data.expiresAt),
      });

      console.log(`✅ URL signée obtenue, expire à ${data.expiresAt}`);
      return data.url;
    } catch (error) {
      console.error(`❌ Erreur récupération URL vidéo:`, error);
      throw error;
    }
  }

  /**
   * Invalide le cache pour une leçon
   * (À appeler après suppression/modification)
   */
  static invalidateCache(lessonId: string): void {
    this.urlCache.delete(lessonId);
    console.log(`🗑️ Cache invalidé pour leçon ${lessonId}`);
  }

  /**
   * Nettoie les URLs expirées du cache
   */
  static cleanExpiredCache(): void {
    const now = new Date();
    let cleaned = 0;

    for (const [lessonId, { expiresAt }] of this.urlCache.entries()) {
      if (expiresAt <= now) {
        this.urlCache.delete(lessonId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 ${cleaned} URL(s) expirée(s) supprimée(s) du cache`);
    }
  }
}

// Types for signed URLs
export interface SignedVideoUrl {
  url: string;
  expiresAt: string;
  lessonId: string;
}

