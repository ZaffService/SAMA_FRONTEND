"use client";

/**
 * Désactivé : l'onglet Revenus du menu admin est commenté car le backend
 * ne fournit pas GET /course/admin/all (liste cours admin → 404).
 * Les montants globaux restent sur AdminOverview via GET /api/dashboard/kpis.
 */
import { useState } from "react";
import {
  Banknote,
  BookOpen,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRevenueOverview } from "@/application/use-cases/useRevenueOverview";
import { DashboardPeriodFilter } from "@/components/DashboardPeriodFilter";
import {
  formatDashboardPeriodLabel,
  getCurrentYearPeriod,
  type DashboardPeriodParams,
} from "@/shared/helpers/dashboard-period";

const formatAmount = (value: number) =>
  `${value.toLocaleString("fr-FR")} CFA`;

export function AdminRevenueManagement() {
  const [period, setPeriod] = useState<DashboardPeriodParams>(
    getCurrentYearPeriod(),
  );
  const { data, loading, error } = useRevenueOverview(period);
  const coursesWithRevenue = [...(data?.courses ?? [])].sort(
    (a, b) => b.revenue - a.revenue,
  );

  if (error) {
    return (
      <div className="space-y-6 text-white">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold md:text-4xl">Revenus</h1>
          <p className="text-sm text-white/70 md:text-base">
            Suivi financier de la plateforme
          </p>
        </div>
        <Card className="border border-[#3B3754] bg-[#1F1D2B]">
          <CardContent className="p-6">
            <p className="text-[#FF8D9A]">
              Erreur lors du chargement des revenus: {error}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-white">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold md:text-4xl">Revenus</h1>
        <p className="text-sm text-white/70 md:text-base">
          Aperçu financier — {formatDashboardPeriodLabel(data?.period)}
        </p>
      </div>

      <DashboardPeriodFilter
        value={period}
        activePeriod={data?.period}
        onChange={setPeriod}
        loading={loading}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Card className="border border-[#302D47] bg-[#1F1D2B] shadow-none">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-[0.12em] text-white">
                  REVENU TOTAL
                </p>
                <Banknote className="h-4 w-4 text-[#A9F5E5]" />
              </div>
              <p className="text-3xl font-semibold text-white">
                {loading || !data ? "—" : formatAmount(data.totalRevenue)}
              </p>
              <p className="text-xs text-white/70">Paiements COMPLETED</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
        >
          <Card className="border border-[#302D47] bg-[#1F1D2B] shadow-none">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-[0.12em] text-white">
                  PAIEMENTS
                </p>
                <Receipt className="h-4 w-4 text-[#73C84A]" />
              </div>
              <p className="text-3xl font-semibold text-white">
                {loading || !data
                  ? "—"
                  : data.completedPaymentsCount.toLocaleString("fr-FR")}
              </p>
              <p className="text-xs text-white/70">Transactions complétées</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
        >
          <Card className="border border-[#302D47] bg-[#1F1D2B] shadow-none">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-[0.12em] text-white">
                  COURS ACTIFS
                </p>
                <TrendingUp className="h-4 w-4 text-[#80B5FF]" />
              </div>
              <p className="text-3xl font-semibold text-white">
                {loading || !data ? "—" : data.courses.length.toLocaleString("fr-FR")}
              </p>
              <p className="text-xs text-white/70">Suivi financier par cours</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card className="border border-[#302D47] bg-[#1F1D2B] shadow-none">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#73C84A]" />
            <h3 className="text-lg font-semibold text-white">
              Revenu par cours
            </h3>
          </div>
          <p className="mb-4 text-xs text-white/55">
            Détail par cours basé sur l&apos;année de fin de période sélectionnée
          </p>

          {loading ? (
            <p className="text-sm text-white/70">Chargement en cours...</p>
          ) : coursesWithRevenue.length === 0 ? (
            <p className="text-sm text-white/70">Aucun cours disponible.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#3B3754]">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#3B3754] hover:bg-transparent">
                    <TableHead className="text-white/70">Cours</TableHead>
                    <TableHead className="text-right text-white/70">
                      Inscrits
                    </TableHead>
                    <TableHead className="text-right text-white/70">
                      Revenu
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coursesWithRevenue.map((course) => (
                    <TableRow
                      key={course.courseId}
                      className="border-[#3B3754] hover:bg-[#26233A]"
                    >
                      <TableCell className="max-w-[420px] font-medium text-white">
                        {course.title}
                      </TableCell>
                      <TableCell className="text-right text-white/80">
                        {course.enrollments.toLocaleString("fr-FR")}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-[#A9F5E5]">
                        {formatAmount(course.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
