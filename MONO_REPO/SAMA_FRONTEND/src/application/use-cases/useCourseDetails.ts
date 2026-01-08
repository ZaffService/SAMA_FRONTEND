"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import { isValidResourceId } from "@/shared/helpers/safeFetch";

// Cache mémoire pour les détails de cours
const courseMemoryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedCourse(courseId: string): any | null {
  const memoryCache = courseMemoryCache.get(courseId);
  if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_DURATION) {
    console.log("test Cache mémoire utilisé:", courseId);
    return memoryCache.data;
  }
  return null;
}

function setCourseCache(courseId: string, data: any): void {
  courseMemoryCache.set(courseId, {
    data,
    timestamp: Date.now(),
  });
}

export function useCourseDetails(courseId: string) {
  const [course, setCourse] = useState<any>(null);
  const [contents, setContents] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [allLessons, setAllLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const isMountedRef = useRef(true);

  const fetchCourseDetails = useCallback(async () => {
    if (!isValidResourceId(courseId)) {
      console.warn(`[useCourseDetails] Invalid courseId: "${courseId}"`);
      setLoading(false);
      setError(`ID de cours invalide: ${courseId}`);
      return;
    }

    if (fetchingRef.current) {
      console.log("test Fetch already in progress, skipping...");
      return;
    }

    const cached = getCachedCourse(courseId);
    if (cached) {
      setCourse(cached.course);
      setContents(cached.contents || []);
      setTopics(cached.topics || []);
      setAllLessons(cached.allLessons || []);
      setLoading(false);
      return;
    }

    fetchingRef.current = true;

    try {
      setLoading(true);
      setError(null);

      console.log("test Chargement du cours ID:", courseId);
      const start = performance.now();

      // 1. Charger les infos du cours
      const coursePromise = CoursesApi.getCourseDetails(courseId).catch(
        (e: any) => {
          console.warn("test Erreur details:", e);
          return null;
        },
      );

      // 2. Charger les topics du cours
      const topicsPromise = CoursesApi.getCourseContents(courseId).catch(
        (e: any) => {
          console.warn("test Erreur topics:", e);
          return { data: [] };
        },
      );

      const [courseData, topicsData] = await Promise.all([
        coursePromise,
        topicsPromise,
      ]);

      if (!isMountedRef.current) return;

      const courseResult = courseData || null;
      const topicsResult = (Array.isArray(topicsData) ? topicsData : [])
        .map((topic: any) => ({
          ID: topic.id,
          post_title: topic.title,
          post_content: topic.summary,
          menu_order: topic.id,
          lessons: topic.lessons || [],
        }))
        .sort((a: any, b: any) => a.ID - b.ID);

      if (courseResult) {
        console.log(
          "test Cours chargé:",
          courseResult?.course?.title || "Titre non disponible",
        );
      }

      if (topicsResult?.length > 0) {
        console.log(`test ${topicsResult.length} topics chargés`);
      }

      // 3. Pour chaque topic, charger les leçons
      const allLessonsResult: any[] = [];

      if (topicsResult.length > 0) {
        const topicLessons: any[] = [];

        for (const topic of topicsResult) {
          if (!isMountedRef.current) return;

          try {
            const res = await CoursesApi.getLessons(topic.ID);
            topicLessons.push({
              topicId: topic.ID,
              topicTitle: topic.post_title,
              topicOrder: topic.ID,
              lessons: Array.isArray(res) ? res : [],
            });
          } catch (e) {
            console.warn(`test Erreur lessons pour topic ${topic.ID}:`, e);
            topicLessons.push({
              topicId: topic.ID,
              topicTitle: topic.post_title,
              topicOrder: topic.ID,
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
              menuOrder: lesson.order
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

        console.log(`test ${allLessonsResult.length} leçons trouvées`);
      }

      const end = performance.now();
      console.log(`test Chargement complété en ${(end - start).toFixed(0)}ms`);

      // Mettre en cache
      const cacheData = {
        course: courseResult,
        contents: [],
        topics: topicsResult,
        allLessons: allLessonsResult,
      };
      setCourseCache(courseId, cacheData);

      if (isMountedRef.current) {
        setCourse(courseResult);
        setContents([]);
        setTopics(topicsResult);
        setAllLessons(allLessonsResult);

        if (!courseResult) {
          setError(`Cours ${courseId} non trouvé`);
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur inconnue";
      console.error("test Erreur:", errorMessage);
      if (isMountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      fetchingRef.current = false;
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [courseId]);

  useEffect(() => {
    isMountedRef.current = true;

    if (courseId && isValidResourceId(courseId)) {
      fetchCourseDetails();
    } else if (courseId) {
      setLoading(false);
      setError(`ID de cours invalide: ${courseId}`);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [courseId, fetchCourseDetails]);

  return { course, contents, topics, allLessons, loading, error };
}
