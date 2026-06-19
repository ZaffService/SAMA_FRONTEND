"use client";

import type {
  DashboardLearnerKpis,
  DashboardUserKpis,
} from "@/infrastructure/api/dashboard-api";
import { formatFcfa } from "@/shared/helpers/dashboard-period";

const CARD =
  "overflow-hidden rounded-xl border border-[#3B3754] bg-[#1F1D2B]";
const CARD_HEAD =
  "border-b border-[#3B3754] bg-[#26233A] px-5 py-3.5";

export interface AdminKpiSummaryItem {
  label: string;
  value: string;
}

interface AdminKpiSummaryBarProps {
  items: AdminKpiSummaryItem[];
  loading?: boolean;
}

export function AdminKpiSummaryBar({
  items,
  loading = false,
}: AdminKpiSummaryBarProps) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={`${CARD} flex min-h-[120px] flex-col justify-between p-5`}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-white/70">
            {item.label}
          </p>
          <p className="text-[32px] font-bold leading-tight tracking-tight text-white tabular-nums">
            {loading ? "—" : item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

interface MetricRow {
  label: string;
  users: number | null;
  learners: number | null;
}

function formatMetricValue(value: number | null, loading: boolean): string {
  if (loading) return "—";
  if (value === null) return "—";
  return value.toLocaleString("fr-FR");
}

function buildPopulationRows(
  users: DashboardUserKpis,
  learners: DashboardLearnerKpis,
): MetricRow[] {
  return [
    { label: "Inscriptions", users: users.totalRegistered, learners: learners.totalRegistered },
    { label: "Moins de 35 ans", users: users.under35, learners: learners.under35 },
    { label: "Femmes", users: users.female, learners: learners.female },
    { label: "Femmes de moins de 35 ans", users: users.femaleUnder35, learners: learners.femaleUnder35 },
    { label: "Résidence rurale", users: users.rural, learners: learners.rural },
    { label: "Personnes en situation de handicap", users: users.disabled, learners: learners.disabled },
    { label: "Au moins une activité", users: users.connectedAtLeastOnce, learners: learners.connectedAtLeastOnce },
    { label: "Formations terminées", users: null, learners: learners.completedTraining },
    { label: "Certifiés", users: null, learners: learners.certifiedAfterEvaluation },
  ];
}

interface AdminKpiPopulationTableProps {
  users: DashboardUserKpis;
  learners: DashboardLearnerKpis;
  loading?: boolean;
}

export function AdminKpiPopulationTable({
  users,
  learners,
  loading = false,
}: AdminKpiPopulationTableProps) {
  const rows = buildPopulationRows(users, learners);

  return (
    <div className={`${CARD} flex h-full flex-col`}>
      <div className={CARD_HEAD}>
        <h2 className="text-sm font-semibold text-white">
          Population & parcours
        </h2>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[52%]" />
            <col className="w-[24%]" />
            <col className="w-[24%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-[#3B3754] text-left text-xs uppercase tracking-wide text-white/60">
              <th className="px-5 py-3 font-semibold">Indicateur</th>
              <th className="px-5 py-3 text-right font-semibold">Utilisateurs</th>
              <th className="px-5 py-3 text-right font-semibold">Apprenants</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.label}
                className={
                  index % 2 === 0
                    ? "border-b border-[#3B3754]/60 bg-[#1F1D2B]"
                    : "border-b border-[#3B3754]/60 bg-[#26233A]/30"
                }
              >
                <td className="px-5 py-3.5 text-white">{row.label}</td>
                <td className="px-5 py-3.5 text-right text-base font-semibold tabular-nums text-white">
                  {formatMetricValue(row.users, loading)}
                </td>
                <td className="px-5 py-3.5 text-right text-base font-semibold tabular-nums text-white">
                  {formatMetricValue(row.learners, loading)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface AdminKpiFinanceBlockProps {
  totalRevenue: number;
  completedPayments: number;
  completedTraining: number;
  instructors: number;
  loading?: boolean;
}

export function AdminKpiFinanceBlock({
  totalRevenue,
  completedPayments,
  completedTraining,
  instructors,
  loading = false,
}: AdminKpiFinanceBlockProps) {
  const fmt = (n: number) => (loading ? "—" : n.toLocaleString("fr-FR"));

  const rows = [
    { label: "Paiements validés", value: fmt(completedPayments) },
    { label: "Formations terminées", value: fmt(completedTraining) },
    { label: "Formateurs", value: fmt(instructors) },
  ];

  return (
    <div className={`${CARD} flex h-full flex-col`}>
      <div className={CARD_HEAD}>
        <h2 className="text-sm font-semibold text-white">
          Finances & équipe
        </h2>
      </div>

      <div className="border-b border-[#3B3754] p-5">
        <div className="rounded-lg border border-[#3B3754] bg-[#181721] px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-white/70">
            Revenus
          </p>
          <p className="mt-2 text-[32px] font-bold leading-tight tracking-tight text-white tabular-nums">
            {loading ? "—" : formatFcfa(totalRevenue)}
          </p>
        </div>
      </div>

      <div className="flex-1">
        {rows.map((row, index) => (
          <div
            key={row.label}
            className={`flex items-center justify-between border-b border-[#3B3754]/60 px-5 py-4 last:border-0 ${
              index % 2 === 0 ? "bg-[#1F1D2B]" : "bg-[#26233A]/30"
            }`}
          >
            <span className="text-sm text-white">{row.label}</span>
            <span className="text-lg font-semibold tabular-nums text-white">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function buildSummaryMetrics(input: {
  usersTotal: number;
  learnersTotal: number;
  revenue: number;
  certified: number;
  loading: boolean;
}): AdminKpiSummaryItem[] {
  const { usersTotal, learnersTotal, revenue, certified, loading } = input;
  const fmt = (n: number) => (loading ? "—" : n.toLocaleString("fr-FR"));

  return [
    { label: "Utilisateurs inscrits", value: fmt(usersTotal) },
    { label: "Apprenants inscrits", value: fmt(learnersTotal) },
    { label: "Apprenants certifiés", value: fmt(certified) },
    { label: "Revenus", value: loading ? "—" : formatFcfa(revenue) },
  ];
}
