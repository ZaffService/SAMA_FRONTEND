import {
  API_BASE_URL,
  API_ENDPOINTS,
} from "@/infrastructure/api/baseConfig";
import {
  type DashboardPeriodParams,
  buildDashboardQueryUrl,
} from "@/shared/helpers/dashboard-period";

/** Aligné sur dashboard.response.dto.ts (backend) */
export interface DashboardPeriodResponse {
  startDate: string;
  endDate: string;
}

export interface DashboardUserKpis {
  totalRegistered: number;
  under35: number;
  female: number;
  femaleUnder35: number;
  rural: number;
  disabled: number;
  connectedAtLeastOnce: number;
}

export interface DashboardLearnerKpis extends DashboardUserKpis {
  completedTraining: number;
  certifiedAfterEvaluation: number;
}

export interface DashboardKpisResponse {
  period: DashboardPeriodResponse;
  kpis: {
    users: DashboardUserKpis;
    learners: DashboardLearnerKpis;
    instructors: { totalRegistered: number };
    revenue: {
      totalFcfa: number;
      completedPaymentsCount: number;
    };
  };
}

export interface DashboardMonthlyStat {
  month: string;
  enrollments: number;
  revenue: number;
}

export interface DashboardAnalyticsBlock {
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

/** Aligné sur DashboardAnalyticsResponseDto */
export interface DashboardAnalyticsResponse {
  period: DashboardPeriodResponse;
  dashboard: DashboardAnalyticsBlock;
}

async function fetchDashboard<T>(
  endpoint: string,
  period?: DashboardPeriodParams,
): Promise<T> {
  const url = buildDashboardQueryUrl(endpoint, API_BASE_URL, period);

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    let message = `Erreur ${response.status}`;
    try {
      const errorBody = await response.json();
      message =
        errorBody?.error?.message ??
        errorBody?.message ??
        message;
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export const DashboardApi = {
  getKpis(period?: DashboardPeriodParams): Promise<DashboardKpisResponse> {
    return fetchDashboard<DashboardKpisResponse>(
      API_ENDPOINTS.DASHBOARD.KPIS,
      period,
    );
  },

  getAnalytics(
    period?: DashboardPeriodParams,
  ): Promise<DashboardAnalyticsResponse> {
    return fetchDashboard<DashboardAnalyticsResponse>(
      API_ENDPOINTS.DASHBOARD.ANALYTICS,
      period,
    );
  },
};
