"use client";

import { useEffect, useState } from "react";
import {
  DashboardApi,
  type DashboardKpisResponse,
} from "@/infrastructure/api/dashboard-api";
import {
  type DashboardPeriodParams,
  getCurrentYearPeriod,
} from "@/shared/helpers/dashboard-period";
import logger from "@/shared/helpers/logger";

export type {
  DashboardKpisResponse,
  DashboardLearnerKpis,
  DashboardUserKpis,
} from "@/infrastructure/api/dashboard-api";

interface DashboardKpisState {
  data: DashboardKpisResponse | null;
  loading: boolean;
  error: string | null;
}

export function useDashboardKpis(
  period: DashboardPeriodParams = getCurrentYearPeriod(),
): DashboardKpisState {
  const [state, setState] = useState<DashboardKpisState>({
    data: null,
    loading: true,
    error: null,
  });

  const startDate = period.startDate ?? "";
  const endDate = period.endDate ?? "";

  useEffect(() => {
    let cancelled = false;

    const fetchKpis = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const data = await DashboardApi.getKpis(period);

        if (!cancelled) {
          setState({ data, loading: false, error: null });
        }
      } catch (error) {
        logger.error("Erreur dashboard KPIs:", error);
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
          });
        }
      }
    };

    fetchKpis();

    return () => {
      cancelled = true;
    };
  }, [startDate, endDate]);

  return state;
}
