"use client";

import { useEffect, useState } from "react";
import {
  API_ENDPOINTS,
  buildApiUrl,
} from "@/infrastructure/api/baseConfig";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import logger from "@/shared/helpers/logger";

export interface CourseRevenueItem {
  courseId: string;
  title: string;
  revenue: number;
  enrollments: number;
}

export interface RevenueOverviewData {
  totalRevenue: number;
  courses: CourseRevenueItem[];
}

interface RevenueOverviewState {
  data: RevenueOverviewData;
  loading: boolean;
  error: string | null;
}

const EMPTY_REVENUE: RevenueOverviewData = {
  totalRevenue: 0,
  courses: [],
};

const fetchCourseOverviewStats = async (
  courseId: string,
  courseTitle: string,
  year: number,
): Promise<CourseRevenueItem> => {
  try {
    const response = await fetch(
      buildApiUrl(`/course/${courseId}/overview?year=${year}`),
      {
        method: "GET",
        credentials: "include",
      },
    );
    const json = await response.json().catch(() => null);

    if (!response.ok || !json?.success) {
      return {
        courseId,
        title: courseTitle,
        revenue: 0,
        enrollments: 0,
      };
    }

    const stats = json?.data?.stats ?? {};
    return {
      courseId,
      title: courseTitle,
      revenue: Number(stats.totalRevenue) || 0,
      enrollments: Number(stats.totalEnrollments) || 0,
    };
  } catch {
    return {
      courseId,
      title: courseTitle,
      revenue: 0,
      enrollments: 0,
    };
  }
};

export function useRevenueOverview(): RevenueOverviewState {
  const [state, setState] = useState<RevenueOverviewState>({
    data: EMPTY_REVENUE,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const analyticsResponse = await fetch(
          buildApiUrl(API_ENDPOINTS.DASHBOARD.ANALYTICS),
          {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          },
        );

        if (!analyticsResponse.ok) {
          throw new Error(
            `Erreur ${analyticsResponse.status}: analytics indisponibles`,
          );
        }

        const analyticsPayload = await analyticsResponse.json();
        const totalRevenue =
          Number(analyticsPayload?.dashboard?.statistics?.totalRevenue) || 0;

        const { courses } = await CoursesApi.getAllCourses({
          userRole: "ADMIN",
        });
        const currentYear = new Date().getFullYear();

        const courseStats = await Promise.all(
          courses.map((course) =>
            fetchCourseOverviewStats(course.id, course.title, currentYear),
          ),
        );

        setState({
          data: {
            totalRevenue,
            courses: courseStats.sort((a, b) => a.title.localeCompare(b.title, "fr")),
          },
          loading: false,
          error: null,
        });
      } catch (error) {
        logger.error("Erreur revenue overview:", error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        }));
      }
    };

    fetchRevenue();
  }, []);

  return state;
}
