import type { CourseDetailsData } from "@/types/course";

// Constante pour l'URL de base Bunny CDN
const BUNNY_CDN_URL = "https://video.bunnycdn.com";
// Library ID pour Bunny (devrait venir des variables d'environnement en production)
const BUNNY_LIBRARY_ID = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || "library-id";

/**
 * Construit l'URL Bunny CDN pour une vidéo
 */
function buildBunnyVideoUrl(videoAssetId: string): string {
  if (!videoAssetId) return "";
  return `${BUNNY_CDN_URL}/library/${BUNNY_LIBRARY_ID}/videos/${videoAssetId}`;
}

/**
 * Transforme les données d'une leçon en incluant l'URL vidéo
 */
function transformLesson(lesson: any) {
  const lessonData = {
    id: lesson.id,
    title: lesson.title,
    content: lesson.content,
    hasVideo: lesson.hasVideo,
    orderIndex: lesson.orderIndex,
    duration: lesson.duration,
    status: lesson.status,
  };

  // Construire l'URL vidéo
  let videoUrl = lesson.videoUrl;
  
  // Si pas d'URL directe mais on a un assetId Bunny
  if (!videoUrl && lesson.videoAssetId && lesson.videoProvider === 'BUNNY') {
    videoUrl = buildBunnyVideoUrl(lesson.videoAssetId);
    console.log(`🎥 [Transformer] URL Bunny construite: ${videoUrl}`);
  }
  
  // Si l'URL est toujours absente, vérifier si la leçon a un statut indiquant une vidéo
  if (!videoUrl && lesson.status === 'VIDEO_UPLOADED') {
    console.warn(`⚠️ [Transformer] Vidéo uploadée mais pas d'URL pour la leçon ${lesson.id}`);
  }

  return {
    ...lessonData,
    videoUrl,
    videoAssetId: lesson.videoAssetId,
    videoProvider: lesson.videoProvider,
  };
}

export function transformCourseDetails(data: any): CourseDetailsData {
  console.log("📦 Transformer: Données reçues:", JSON.stringify(data, null, 2));
  
  // Gérer les deux cas: attachment (string) ou attachments (array)
  let attachmentUrl = data.course?.attachment;
  if (!attachmentUrl && data.course?.attachments) {
    // Si c'est un array, prendre le premier élément
    if (Array.isArray(data.course.attachments) && data.course.attachments.length > 0) {
      attachmentUrl = data.course.attachments[0];
      console.log("📎 Transformer: Attachment Array -> URL:", attachmentUrl);
    } else if (typeof data.course.attachments === 'string') {
      attachmentUrl = data.course.attachments;
      console.log("📎 Transformer: Attachment String:", attachmentUrl);
    }
  }
  
  console.log("📎 Transformer: Attachment final:", attachmentUrl);
  
  return {
    course: {
      id: data.course.id,
      title: data.course.title,
      description: data.course.description,
      categoryId: data.course.categoryId,
      level: data.course.level,
      price: data.course.price,
      thumbnailUrl: data.course.thumbnailUrl,
      attachment: attachmentUrl,  // ← URL Cloudinary du PDF
      isEnrolled: data.course.isEnrolled,  // ← Statut d'inscription
    },
    modules: data.modules.map((module: any) => ({
      id: module.id,
      title: module.title,
      description: module.description,
      orderIndex: module.orderIndex,
      lessons: module.lessons.map(transformLesson),
      // Transformer les quiz (underscore → camelCase)
      quiz:
        module.quiz?.map((q: any) => ({
          id: q._id,
          title: q._title,
          description: q._description,
          passingScore: q._passingScore,
          questions: q._questions.map((question: any) => ({
            id: question.id,
            question: question.question,
            type: question.questionType,
            options: question.options,
            correctAnswer: question.correctAnswer,
            points: question.points,
          })),
        })) || [],
    })),
    moduleCount: data.moduleCount,
  };
}
