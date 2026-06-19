"use client";

import {
  Accessibility,
  CircleUserRound,
  Landmark,
  UserRound,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useDashboardAnalytics } from "@/application/use-cases/useDashboardAnalytics";
import {
  formatFcfa,
  getCurrentYearPeriod,
} from "@/shared/helpers/dashboard-period";
import { type DashboardView } from "./AdminLayout";

interface AdminOverviewProps {
  onViewChange: (view: DashboardView) => void;
  onOpenCategoryDialog: () => void;
}

export function AdminOverview({
  onViewChange: _onViewChange,
  onOpenCategoryDialog: _onOpenCategoryDialog,
}: AdminOverviewProps) {
  void _onViewChange;
  void _onOpenCategoryDialog;

  const { data: analyticsData, loading, error } = useDashboardAnalytics(
    getCurrentYearPeriod(),
  );

  const analytics = analyticsData;
  const monthlyStats = analytics?.monthlyStats ?? [];

  const genderRows = [
    { icon: UserRound, label: "Hommes", value: analytics?.gender.male ?? 0 },
    { icon: CircleUserRound, label: "Femmes", value: analytics?.gender.female ?? 0 },
    { icon: CircleUserRound, label: "Autres", value: analytics?.gender.other ?? 0 },
  ];

  if (error) {
    return (
      <div className="space-y-6 text-white">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">Dashboard analytique</h1>
          <p className="text-sm text-white/70">
            Aperçu global de votre plateforme d&apos;apprentissage
          </p>
        </div>
        <Card className="border border-[#3B3754] bg-[#1F1D2B]">
          <CardContent className="p-6">
            <p className="text-[#FF8D9A]">
              Erreur lors du chargement du dashboard: {error}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-white">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold md:text-4xl">
          Dashboard analytique
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="border border-[#302D47] bg-[#1F1D2B] shadow-none">
          <CardContent className="p-5">
            <h3 className="mb-1 text-lg font-semibold text-[#80B5FF]">
              Inscriptions mensuelles
            </h3>
            <p className="mb-4 text-xs text-white/45">Évolution sur la période</p>
            <div className="h-72">
              {loading ? (
                <div className="flex h-full items-center justify-center text-sm text-white/60">
                  Chargement…
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyStats}>
                    <defs>
                      <linearGradient id="enrollmentsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#80B5FF" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#80B5FF" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#2D2A42" strokeDasharray="3 3" />
                    <XAxis dataKey="month" stroke="#FFFFFF" />
                    <YAxis stroke="#FFFFFF" />
                    <Tooltip
                      contentStyle={{
                        background: "#181721",
                        border: "1px solid #3B3754",
                        borderRadius: "10px",
                        color: "#fff",
                      }}
                    />
                    <Area
                      isAnimationActive
                      type="monotone"
                      dataKey="enrollments"
                      stroke="#80B5FF"
                      fill="url(#enrollmentsFill)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#302D47] bg-[#1F1D2B] shadow-none">
          <CardContent className="p-5">
            <h3 className="mb-1 text-lg font-semibold text-[#73C84A]">
              Revenus mensuels
            </h3>
            <p className="mb-4 text-xs text-white/45">Encaissements par mois</p>
            <div className="h-72">
              {loading ? (
                <div className="flex h-full items-center justify-center text-sm text-white/60">
                  Chargement…
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyStats}>
                    <CartesianGrid stroke="#2D2A42" strokeDasharray="3 3" />
                    <XAxis dataKey="month" stroke="#FFFFFF" />
                    <YAxis stroke="#FFFFFF" />
                    <Tooltip
                      contentStyle={{
                        background: "#181721",
                        border: "1px solid #3B3754",
                        borderRadius: "10px",
                        color: "#fff",
                      }}
                      formatter={(value) => [
                        formatFcfa(Number(value ?? 0)),
                        "Revenu",
                      ]}
                    />
                    <Bar
                      isAnimationActive
                      dataKey="revenue"
                      fill="#73C84A"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-white">
          Démographie des inscrits
        </h2>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="border border-white/[0.08] bg-[#1F1D2B] shadow-none">
            <CardContent className="space-y-4 p-5 text-white">
              <h3 className="text-base font-semibold text-white">
                Répartition par sexe
              </h3>
              {genderRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <row.icon className="h-4 w-4 text-white" />
                    <span>{row.label}</span>
                  </div>
                  <span className="font-semibold tabular-nums text-white">
                    {loading ? "—" : row.value.toLocaleString("fr-FR")}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-white/[0.08] bg-[#1F1D2B] shadow-none">
            <CardContent className="space-y-4 p-5 text-white">
              <h3 className="text-base font-semibold text-white">
                Zone de résidence
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <Landmark className="h-4 w-4 text-white" />
                  <span>Urbain</span>
                </div>
                <span className="font-semibold tabular-nums text-white">
                  {loading ? "—" : (analytics?.residence.urban ?? 0).toLocaleString("fr-FR")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <Landmark className="h-4 w-4 text-white" />
                  <span>Rural</span>
                </div>
                <span className="font-semibold tabular-nums text-white">
                  {loading ? "—" : (analytics?.residence.rural ?? 0).toLocaleString("fr-FR")}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-white/[0.08] bg-[#1F1D2B] shadow-none">
            <CardContent className="space-y-4 p-5 text-white">
              <h3 className="flex items-center gap-2 text-base font-semibold text-white">
                <Accessibility className="h-4 w-4 text-white" />
                Accessibilité
              </h3>
              <div className="flex items-end gap-3">
                <p className="text-4xl font-semibold tabular-nums text-white">
                  {loading ? "—" : analytics?.disability.total ?? 0}
                </p>
                <p className="pb-1 text-sm text-white">
                  personnes déclarant un handicap
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
