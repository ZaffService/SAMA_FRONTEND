"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboardKpis } from "@/application/use-cases/useDashboardKpis";
import {
  AdminKpiFinanceBlock,
  AdminKpiPopulationTable,
  AdminKpiSummaryBar,
  buildSummaryMetrics,
} from "@/components/AdminKpiSection";
import { DashboardPeriodFilter } from "@/components/DashboardPeriodFilter";
import {
  formatDashboardPeriodLabel,
  getCurrentYearPeriod,
  type DashboardPeriodParams,
} from "@/shared/helpers/dashboard-period";

const EMPTY_SEGMENT = {
  totalRegistered: 0,
  under35: 0,
  female: 0,
  femaleUnder35: 0,
  rural: 0,
  disabled: 0,
  connectedAtLeastOnce: 0,
};

const EMPTY_LEARNERS = {
  ...EMPTY_SEGMENT,
  completedTraining: 0,
  certifiedAfterEvaluation: 0,
};

export function AdminKpisView() {
  const [period, setPeriod] = useState<DashboardPeriodParams>(
    getCurrentYearPeriod(),
  );

  const { data: kpisData, loading, error } = useDashboardKpis(period);

  const activePeriod = kpisData?.period;
  const kpis = kpisData?.kpis;

  const summaryItems = useMemo(
    () =>
      buildSummaryMetrics({
        usersTotal: kpis?.users.totalRegistered ?? 0,
        learnersTotal: kpis?.learners.totalRegistered ?? 0,
        revenue: kpis?.revenue.totalFcfa ?? 0,
        certified: kpis?.learners.certifiedAfterEvaluation ?? 0,
        loading: loading || !kpis,
      }),
    [kpis, loading],
  );

  if (error) {
    return (
      <div className="space-y-6 text-white">
        <h1 className="text-3xl font-semibold">KPIs</h1>
        <Card className="border border-[#3B3754] bg-[#1F1D2B]">
          <CardContent className="p-6">
            <p className="text-white">
              Erreur lors du chargement des KPIs : {error}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      <div className="overflow-hidden rounded-xl border border-[#3B3754] bg-[#1F1D2B]">
        <div className="flex flex-col gap-5 border-b border-[#3B3754] bg-[#26233A]/60 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">KPIs</h1>
            <p className="mt-1 text-sm font-medium text-white/75">
              {formatDashboardPeriodLabel(activePeriod)}
            </p>
          </div>
          <DashboardPeriodFilter
            variant="toolbar"
            value={period}
            activePeriod={activePeriod}
            onChange={setPeriod}
            loading={loading}
          />
        </div>
      </div>

      <AdminKpiSummaryBar items={summaryItems} loading={loading} />

      <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2">
        <AdminKpiPopulationTable
          users={kpis?.users ?? EMPTY_SEGMENT}
          learners={kpis?.learners ?? EMPTY_LEARNERS}
          loading={loading || !kpis}
        />
        <AdminKpiFinanceBlock
          totalRevenue={kpis?.revenue.totalFcfa ?? 0}
          completedPayments={kpis?.revenue.completedPaymentsCount ?? 0}
          completedTraining={kpis?.learners.completedTraining ?? 0}
          instructors={kpis?.instructors.totalRegistered ?? 0}
          loading={loading || !kpis}
        />
      </div>
    </div>
  );
}
