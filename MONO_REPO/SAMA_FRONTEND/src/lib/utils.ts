import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
export function getYoutubeVideoId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const videoId = match[1];
      // Validate videoId: should be 11 characters, alphanumeric + -_
      if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return videoId;
      }
    }
  }

  return null;
}

/**
 * Convert YouTube URL to embed URL
 */
export function getYoutubeEmbedUrl(url: string): string | null {
  const videoId = getYoutubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

/**
 * Get YouTube thumbnail URL from video URL
 */
export function getYoutubeThumbnail(url: string): string | null {
  const videoId = getYoutubeVideoId(url);
  return videoId
    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    : null;
}

/**
 * Resolve the preview media for a course (video embed or thumbnail)
 */
export function resolveCoursePreviewMedia(
  course: { thumbnailUrl?: string },
  modules: Array<{
    orderIndex: number;
    lessons: Array<{
      orderIndex: number;
      videoUrl?: string;
    }>;
  }>,
): { type: "video" | "thumbnail" | "placeholder"; url?: string } {
  // If course has thumbnail, use it
  if (course.thumbnailUrl) {
    return { type: "thumbnail", url: course.thumbnailUrl };
  }

  // Find first module (by orderIndex)
  const firstModule = modules
    .filter((m) => m.lessons && m.lessons.length > 0)
    .sort((a, b) => a.orderIndex - b.orderIndex)[0];

  if (firstModule) {
    // Find first lesson with videoUrl (by orderIndex)
    const firstLessonWithVideo = firstModule.lessons
      .filter((l) => l.videoUrl)
      .sort((a, b) => a.orderIndex - b.orderIndex)[0];

    if (firstLessonWithVideo?.videoUrl) {
      const embedUrl = getYoutubeEmbedUrl(firstLessonWithVideo.videoUrl);
      if (embedUrl) {
        return { type: "video", url: embedUrl };
      }

      // Fallback to thumbnail if embed fails
      const thumbnailUrl = getYoutubeThumbnail(firstLessonWithVideo.videoUrl);
      if (thumbnailUrl) {
        return { type: "thumbnail", url: thumbnailUrl };
      }
    }
  }

  // No media available
  return { type: "placeholder" };
}
