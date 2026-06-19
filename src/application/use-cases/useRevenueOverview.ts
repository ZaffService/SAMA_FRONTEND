"use client";

import { useEffect, useState } from "react";
import { DashboardApi } from "@/infrastructure/api/dashboard-api";
import { API_BASE_URL } from "@/infrastructure/api/baseConfig";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import {
  type DashboardPeriodParams,
  getCurrentYearPeriod,
} from "@/shared/helpers/dashboard-period";
import logger from "@/shared/helpers/logger";

export interface CourseRevenueItem {
  courseId: string;
  title: string;
  revenue: number;
  enrollments: number;
}

export interface RevenueOverviewData {
  totalRevenue: number;
  completedPaymentsCount: number;
  period: {
    startDate: string;
    endDate: string;
  };
  courses: CourseRevenueItem[];
}

interface RevenueOverviewState {
  data: RevenueOverviewData | null;
  loading: boolean;
  error: string | null;
}

const fetchCourseOverviewStats = async (
  courseId: string,
  courseTitle: string,
  year: number,
): Promise<CourseRevenueItem> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/course/${courseId}/overview?year=${year}`,
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

export function useRevenueOverview(
  period: DashboardPeriodParams = getCurrentYearPeriod(),
): RevenueOverviewState {
  const [state, setState] = useState<RevenueOverviewState>({
    data: null,
    loading: true,
    error: null,
  });

  const startDate = period.startDate ?? "";
  const endDate = period.endDate ?? "";

  useEffect(() => {
    let cancelled = false;

    const fetchRevenue = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const kpisPayload = await DashboardApi.getKpis(period);
        const totalRevenue = kpisPayload.kpis.revenue.totalFcfa;
        const completedPaymentsCount =
          kpisPayload.kpis.revenue.completedPaymentsCount;
        const resolvedPeriod = kpisPayload.period;

        const { courses } = await CoursesApi.getAdminCourses(1, 500);
        const overviewYear = new Date(resolvedPeriod.endDate).getUTCFullYear();

        const courseStats = await Promise.all(
          courses.map((course: { id: string; title: string }) =>
            fetchCourseOverviewStats(course.id, course.title, overviewYear),
          ),
        );

        if (!cancelled) {
          setState({
            data: {
              totalRevenue,
              completedPaymentsCount,
              period: resolvedPeriod,
              courses: courseStats.sort((a, b) =>
                a.title.localeCompare(b.title, "fr"),
              ),
            },
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        logger.error("Erreur revenue overview:", error);
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
          });
        }
      }
    };

    fetchRevenue();

    return () => {
      cancelled = true;
    };
  }, [startDate, endDate]);

  return state;
}
