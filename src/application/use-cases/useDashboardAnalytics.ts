"use client";

import { useEffect, useState } from "react";
import { API_ENDPOINTS, buildApiUrl } from "@/infrastructure/api/baseConfig";
import logger from "@/shared/helpers/logger";

export interface DashboardMonthlyStat {
  month: string;
  enrollments: number;
  revenue: number;
}

export interface DashboardAnalyticsData {
  statistics: {
    totalRevenue: number;
    totalEnrollments: number;
    totalCategories: number;
  };
  gender: {
    male: number;
    female: number;
    other: number;
    notSpecified: number;
  };
  residence: {
    urban: number;
    rural: number;
  };
  disability: {
    total: number;
    visual: number;
    hearing: number;
    motor: number;
    cognitive: number;
    other: number;
  };
  monthlyStats: DashboardMonthlyStat[];
}

interface DashboardAnalyticsState {
  dashboard: DashboardAnalyticsData;
  loading: boolean;
  error: string | null;
}

const EMPTY_DASHBOARD: DashboardAnalyticsData = {
  statistics: { totalRevenue: 0, totalEnrollments: 0, totalCategories: 0 },
  gender: { male: 0, female: 0, other: 0, notSpecified: 0 },
  residence: { urban: 0, rural: 0 },
  disability: {
    total: 0,
    visual: 0,
    hearing: 0,
    motor: 0,
    cognitive: 0,
    other: 0,
  },
  monthlyStats: [],
};

export function useDashboardAnalytics(): DashboardAnalyticsState {
  const [state, setState] = useState<DashboardAnalyticsState>({
    dashboard: EMPTY_DASHBOARD,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const response = await fetch(buildApiUrl(API_ENDPOINTS.DASHBOARD.ANALYTICS), {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: analytics indisponibles`);
        }

        const payload = await response.json();
        const dashboard = payload?.dashboard ?? EMPTY_DASHBOARD;

        setState({
          dashboard: {
            ...EMPTY_DASHBOARD,
            ...dashboard,
            statistics: {
              ...EMPTY_DASHBOARD.statistics,
              ...(dashboard.statistics ?? {}),
            },
            gender: {
              ...EMPTY_DASHBOARD.gender,
              ...(dashboard.gender ?? {}),
            },
            residence: {
              ...EMPTY_DASHBOARD.residence,
              ...(dashboard.residence ?? {}),
            },
            disability: {
              ...EMPTY_DASHBOARD.disability,
              ...(dashboard.disability ?? {}),
            },
            monthlyStats: Array.isArray(dashboard.monthlyStats)
              ? dashboard.monthlyStats
              : [],
          },
          loading: false,
          error: null,
        });
      } catch (error) {
        logger.error("Erreur dashboard analytics:", error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        }));
      }
    };

    fetchAnalytics();
  }, []);

  return state;
}
