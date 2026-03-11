import logger from "@/shared/helpers/logger";
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
const parseDurationToMinutes = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return 0;
  }

  const raw = value.trim();
  if (!raw) return 0;

  if (raw.includes(":")) {
    const parts = raw.split(":").map((part) => Number(part));
    if (parts.some((part) => !Number.isFinite(part))) {
      return 0;
    }

    if (parts.length === 3) {
      const [hours, minutes, seconds] = parts;
      return hours * 60 + minutes + seconds / 60;
    }

    if (parts.length === 2) {
      const [minutes, seconds] = parts;
      return minutes + seconds / 60;
    }
  }

  const numericMatch = raw.match(/(\d+(\.\d+)?)/);
  if (numericMatch) {
    const parsed = Number(numericMatch[1]);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const toPositiveNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

function transformLesson(lesson: any) {
  const lessonId = lesson?.id ?? lesson?._id ?? "";
  const lessonTitle = lesson?.title ?? lesson?._title ?? "Leçon sans titre";
  const lessonContent = lesson?.content ?? lesson?._content ?? "";
  const orderIndex =
    typeof lesson?.orderIndex === "number"
      ? lesson.orderIndex
      : typeof lesson?._orderIndex === "number"
        ? lesson._orderIndex
        : 0;
  const duration = parseDurationToMinutes(
    lesson?.duration ?? lesson?._duration ?? lesson?.videoDuration,
  );
  const status = lesson?.status ?? lesson?._status ?? "";
  const videoAssetId = lesson?.videoAssetId ?? lesson?._videoAssetId;
  const videoProvider = lesson?.videoProvider ?? lesson?._videoProvider;
  const explicitHasVideo =
    typeof lesson?.hasVideo === "boolean"
      ? lesson.hasVideo
      : typeof lesson?._hasVideo === "boolean"
        ? lesson._hasVideo
        : undefined;

  const lessonData = {
    id: lessonId,
    title: lessonTitle,
    content: lessonContent,
    hasVideo:
      explicitHasVideo ??
      Boolean(
        lesson?.videoUrl ||
          lesson?._videoUrl ||
          videoAssetId ||
          status === "VIDEO_UPLOADED" ||
          status === "READY",
      ),
    orderIndex,
    duration,
    status,
  };

  // Construire l'URL vidéo
  let videoUrl = lesson?.videoUrl ?? lesson?._videoUrl;
  
  // Si pas d'URL directe mais on a un assetId Bunny
  if (!videoUrl && videoAssetId && videoProvider === "BUNNY") {
    videoUrl = buildBunnyVideoUrl(videoAssetId);
    logger.log(`🎥 [Transformer] URL Bunny construite: ${videoUrl}`);
  }
  
  // Si l'URL est toujours absente, vérifier si la leçon a un statut indiquant une vidéo
  if (!videoUrl && status === "VIDEO_UPLOADED" && (videoAssetId || videoProvider)) {
    logger.warn(`⚠️ [Transformer] Vidéo uploadée mais pas d'URL pour la leçon ${lessonId}`);
  }

  return {
    ...lessonData,
    videoUrl,
    videoAssetId,
    videoProvider,
  };
}

export function transformCourseDetails(data: any): CourseDetailsData {
  logger.log("📦 Transformer: Données reçues:", JSON.stringify(data, null, 2));
  const rawCourse = data?.course ?? {};
  const rawModules = Array.isArray(data?.modules)
    ? data.modules
    : Array.isArray(rawCourse?._modules)
      ? rawCourse._modules
      : [];
  
  // Gérer les deux cas: attachment (string) ou attachments (array)
  let attachmentUrl = rawCourse?.attachment ?? rawCourse?._attachment;
  const attachmentsCandidate = rawCourse?.attachments ?? rawCourse?._attachments;

  if (!attachmentUrl && attachmentsCandidate) {
    // Si c'est un array, prendre le premier élément
    if (Array.isArray(attachmentsCandidate) && attachmentsCandidate.length > 0) {
      attachmentUrl = attachmentsCandidate[0];
      logger.log("📎 Transformer: Attachment Array -> URL:", attachmentUrl);
    } else if (typeof attachmentsCandidate === "string") {
      attachmentUrl = attachmentsCandidate;
      logger.log("📎 Transformer: Attachment String:", attachmentUrl);
    }
  }
  
  logger.log("📎 Transformer: Attachment final:", attachmentUrl);

  const hasOwn = (key: string) =>
    rawCourse && Object.prototype.hasOwnProperty.call(rawCourse, key);

  const numericEnrollmentCount = toPositiveNumber(
    rawCourse?.studentsCount ??
      rawCourse?._studentsCount ??
      rawCourse?.enrollmentCount ??
      rawCourse?.enrolledCount,
  );

  const arrayEnrollmentCount = Array.isArray(rawCourse?.enrollments)
    ? rawCourse.enrollments.length
    : Array.isArray(rawCourse?._enrollments)
      ? rawCourse._enrollments.length
      : Array.isArray(rawCourse?.students)
        ? rawCourse.students.length
        : Array.isArray(rawCourse?.enrolledStudents)
          ? rawCourse.enrolledStudents.length
          : undefined;

  const hasEnrollmentCountField =
    hasOwn("studentsCount") ||
    hasOwn("_studentsCount") ||
    hasOwn("enrollmentCount") ||
    hasOwn("enrolledCount") ||
    Array.isArray(rawCourse?.enrollments) ||
    Array.isArray(rawCourse?._enrollments) ||
    Array.isArray(rawCourse?.students) ||
    Array.isArray(rawCourse?.enrolledStudents);

  const studentsCount = hasEnrollmentCountField
    ? numericEnrollmentCount ?? arrayEnrollmentCount ?? 0
    : undefined;

  const duration =
    parseDurationToMinutes(
      rawCourse?.duration ??
        rawCourse?._duration ??
        rawCourse?.totalDuration ??
        rawCourse?.total_duration,
    ) || 0;
  
  return {
    course: {
      id: rawCourse?.id ?? rawCourse?._id ?? "",
      title: rawCourse?.title ?? rawCourse?._title ?? "Cours sans titre",
      description: rawCourse?.description ?? rawCourse?._description ?? "",
      categoryId:
        rawCourse?.categoryId ??
        rawCourse?._categoryId ??
        rawCourse?._category?._id ??
        rawCourse?._category?.id ??
        "",
      level: rawCourse?.level ?? rawCourse?._level ?? "BEGINNER",
      price:
        typeof rawCourse?.price === "number"
          ? rawCourse.price
          : typeof rawCourse?._price === "number"
            ? rawCourse._price
            : 0,
      thumbnailUrl: rawCourse?.thumbnailUrl ?? rawCourse?._thumbnailUrl,
      studentsCount,
      enrollmentCount: studentsCount,
      duration,
      attachment: attachmentUrl,  // ← URL Cloudinary du PDF
      isEnrolled:
        rawCourse?.isEnrolled ??
        rawCourse?._isEnrolled,  // ← Statut d'inscription
      isCertifying:
        rawCourse?.isCertifying ??
        rawCourse?.is_certifying ??
        rawCourse?._isCertifying ??
        false,
      quizId:
        rawCourse?.quizId ??
        rawCourse?.quiz_id ??
        rawCourse?.certificationQuizId ??
        rawCourse?.certification_quiz_id ??
        null,
      quizStatus:
        rawCourse?.quizStatus ??
        rawCourse?.quiz_status ??
        rawCourse?.certificationStatus ??
        rawCourse?.certification_status ??
        null,
    },
    modules: rawModules.map(
      (module: any) => ({
        id: module?.id ?? module?._id ?? "",
        title: module?.title ?? module?._title ?? "Module sans titre",
        description: module?.description ?? module?._description ?? "",
        orderIndex:
          typeof module?.orderIndex === "number"
            ? module.orderIndex
            : typeof module?._orderIndex === "number"
              ? module._orderIndex
              : 0,
        lessons: (
          Array.isArray(module?.lessons)
            ? module.lessons
            : Array.isArray(module?._lessons)
              ? module._lessons
              : []
        ).map(transformLesson),
        // Transformer les quiz (underscore → camelCase)
        quiz: (
          Array.isArray(module?.quiz)
            ? module.quiz
            : Array.isArray(module?._quizzes)
              ? module._quizzes
              : []
        ).map((q: any) => ({
          id: q?._id ?? q?.id ?? "",
          title: q?._title ?? q?.title ?? "Quiz",
          description: q?._description ?? q?.description ?? "",
          passingScore:
            typeof q?._passingScore === "number"
              ? q._passingScore
              : typeof q?.passingScore === "number"
                ? q.passingScore
                : 0,
          questions: (
            Array.isArray(q?._questions)
              ? q._questions
              : Array.isArray(q?.questions)
                ? q.questions
                : []
          ).map((question: any) => ({
            id: question?.id ?? question?._id ?? "",
            question: question?.question ?? question?._question ?? "",
            type:
              question?.questionType ??
              question?._questionType ??
              question?.type ??
              "MULTIPLE_CHOICE",
            options: question?.options ?? question?._options ?? [],
            correctAnswer:
              question?.correctAnswer ?? question?._correctAnswer ?? "",
            points:
              typeof question?.points === "number"
                ? question.points
                : typeof question?._points === "number"
                  ? question._points
                  : 0,
          })),
        })),
    })),
    moduleCount:
      typeof data?.moduleCount === "number" ? data.moduleCount : rawModules.length,
  };
}
