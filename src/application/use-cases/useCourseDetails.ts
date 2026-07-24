"use client";

/**
 * Détails d'un cours via TanStack Query
 *
 * Remplace le Map mémoire maison par le cache TQ (même staleTime ~5 min).
 * L'API publique du hook reste identique.
 */

import { useQuery } from "@tanstack/react-query";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import { isValidResourceId } from "@/shared/helpers/safeFetch";
import { courseKeys } from "@/shared/helpers/query-keys";
import logger from "@/shared/helpers/logger";

type CourseDetailsPayload = {
  course: any;
  contents: any[];
  topics: any[];
  allLessons: any[];
};

async function fetchCourseDetailsPayload(
  courseId: string,
): Promise<CourseDetailsPayload> {
  const coursePromise = CoursesApi.getCourseDetails(courseId).catch(
    (e: any) => {
      logger.warn("test Erreur details:", e);
      return null;
    },
  );

  const topicsPromise = CoursesApi.getCourseContents(courseId).catch(
    (e: any) => {
      logger.warn("test Erreur topics:", e);
      return { data: [] };
    },
  );

  const [courseData, topicsData] = await Promise.all([
    coursePromise,
    topicsPromise,
  ]);

  const courseResult = courseData || null;
  let topicsResult: any[] = [];
  let allLessonsResult: any[] = [];

  if (courseResult && (courseResult as any).course?.modules) {
    topicsResult = (courseResult as any).course.modules
      .map((module: any) => {
        const sortedLessons = (module.lessons || []).sort((a: any, b: any) => {
          const orderA = a.orderIndex || 999;
          const orderB = b.orderIndex || 999;
          return orderA - orderB;
        });

        return {
          ID: module.id,
          post_title: module.title,
          orderIndex: module.orderIndex,
          lessons: sortedLessons,
        };
      })
      .sort((a: any, b: any) => a.orderIndex - b.orderIndex);

    topicsResult.forEach((module) => {
      module.lessons.forEach((lesson: any) => {
        let duration = "00:00";
        if (lesson.video && lesson.video.runtime) {
          const runtime = lesson.video.runtime;
          const hours = Number.parseInt(runtime.hours || "0");
          const minutes = Number.parseInt(runtime.minutes || "0");
          const seconds = Number.parseInt(runtime.seconds || "0");

          if (hours > 0) {
            duration = `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
          } else {
            duration = `${minutes}:${seconds.toString().padStart(2, "0")}`;
          }
        }

        allLessonsResult.push({
          ID: lesson.id,
          post_title: lesson.title,
          post_content: lesson.content || "",
          post_name: lesson.title?.toLowerCase().replace(/\//g, "-"),
          topic_id: module.ID,
          topicTitle: module.post_title,
          topicOrder: module.orderIndex,
          menuOrder: lesson.orderIndex
            ? Number.parseInt(lesson.orderIndex.toString())
            : 999,
          thumbnail: lesson.thumbnail,
          video: lesson.video || {},
          attachments: lesson.attachments || [],
          duration: duration,
        });
      });
    });

    allLessonsResult.sort((a: any, b: any) => {
      if (a.topicOrder < b.topicOrder) return -1;
      if (a.topicOrder > b.topicOrder) return 1;
      if (a.menuOrder < b.menuOrder) return -1;
      if (a.menuOrder > b.menuOrder) return 1;
      return 0;
    });
  } else {
    topicsResult = (Array.isArray(topicsData) ? topicsData : [])
      .map((topic: any) => ({
        ID: topic.id,
        post_title: topic.title,
        post_content: topic.summary,
        menu_order: topic.id,
        orderIndex: topic.orderIndex,
        lessons: topic.lessons || [],
      }))
      .sort(
        (a: any, b: any) => (a.orderIndex || a.ID) - (b.orderIndex || b.ID),
      );

    if (topicsResult.length > 0) {
      const topicLessons: any[] = [];

      for (const topic of topicsResult) {
        try {
          const res = await CoursesApi.getLessons(topic.ID);
          topicLessons.push({
            topicId: topic.ID,
            topicTitle: topic.post_title,
            topicOrder: topic.orderIndex || topic.ID,
            lessons: Array.isArray(res) ? res : [],
          });
        } catch (e) {
          logger.warn(`test Erreur lessons pour topic ${topic.ID}:`, e);
          topicLessons.push({
            topicId: topic.ID,
            topicTitle: topic.post_title,
            topicOrder: topic.orderIndex || topic.ID,
            lessons: [],
          });
        }
      }

      topicLessons.forEach((topicGroup) => {
        topicGroup.lessons.forEach((lesson: any) => {
          let duration = "00:00";
          if (lesson.video && lesson.video.runtime) {
            const runtime = lesson.video.runtime;
            const hours = Number.parseInt(runtime.hours || "0");
            const minutes = Number.parseInt(runtime.minutes || "0");
            const seconds = Number.parseInt(runtime.seconds || "0");

            if (hours > 0) {
              duration = `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
            } else {
              duration = `${minutes}:${seconds.toString().padStart(2, "0")}`;
            }
          }

          allLessonsResult.push({
            ID: lesson.id,
            post_title: lesson.title,
            post_content: lesson.content || "",
            post_name: lesson.title?.toLowerCase().replace(/\//g, "-"),
            topic_id: topicGroup.topicId,
            topicTitle: topicGroup.topicTitle,
            topicOrder: topicGroup.topicOrder,
            menuOrder: lesson.orderIndex
              ? Number.parseInt(lesson.orderIndex.toString())
              : lesson.order
                ? Number.parseInt(lesson.order.toString())
                : 999,
            thumbnail: lesson.thumbnail,
            video: lesson.video || {},
            attachments: lesson.attachments || [],
            duration: duration,
          });
        });
      });

      allLessonsResult.sort((a: any, b: any) => {
        if (a.topicOrder < b.topicOrder) return -1;
        if (a.topicOrder > b.topicOrder) return 1;
        if (a.menuOrder < b.menuOrder) return -1;
        if (a.menuOrder > b.menuOrder) return 1;
        return 0;
      });
    }
  }

  if (!courseResult) {
    throw new Error(`Cours ${courseId} non trouvé`);
  }

  return {
    course: courseResult,
    contents: [],
    topics: topicsResult,
    allLessons: allLessonsResult,
  };
}

export function useCourseDetails(courseId: string) {
  const valid = Boolean(courseId && isValidResourceId(courseId));

  const query = useQuery({
    queryKey: courseKeys.detail(courseId || "invalid"),
    queryFn: () => fetchCourseDetailsPayload(courseId),
    enabled: valid,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const invalidError =
    courseId && !valid ? `ID de cours invalide: ${courseId}` : null;

  return {
    course: query.data?.course ?? null,
    contents: query.data?.contents ?? [],
    topics: query.data?.topics ?? [],
    allLessons: query.data?.allLessons ?? [],
    loading: valid ? query.isPending : false,
    error: invalidError
      ? invalidError
      : query.error
        ? query.error instanceof Error
          ? query.error.message
          : "Erreur inconnue"
        : null,
  };
}
