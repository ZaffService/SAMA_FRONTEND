"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Accessibility,
  BookUser,
  CircleUserRound,
  GraduationCap,
  House,
  Landmark,
  Shapes,
  UserRound,
} from "lucide-react";
import { motion } from "framer-motion";
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
import { useDashboardAnalytics } from "@/application/use-cases/useDashboardAnalytics";
import { API_ENDPOINTS, buildApiUrl } from "@/infrastructure/api/baseConfig";
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
  const { dashboard, loading, error } = useDashboardAnalytics();
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    const fetchStudentCount = async () => {
      try {
        const url = new URL(buildApiUrl(API_ENDPOINTS.USER.BY_ROLE));
        url.searchParams.set("role", "STUDENT");
        url.searchParams.set("page", "1");
        url.searchParams.set("limit", "1");

        const response = await fetch(url.toString(), {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) return;

        const payload = await response.json();
        setTotalStudents(Number(payload?.total) || 0);
      } catch {
        setTotalStudents(0);
      }
    };

    fetchStudentCount();
  }, []);

  const stats = [
    {
      title: "Total etudiants",
      value: totalStudents.toLocaleString("fr-FR"),
      subtitle: "Etudiants inscrits sur la plateforme",
      icon: GraduationCap,
      accent: "text-[#A9F5E5]",
    },
    {
      title: "Apprenants actifs",
      value: dashboard.statistics.totalEnrollments.toLocaleString("fr-FR"),
      subtitle: "En cours de formations",
      icon: BookUser,
      accent: "text-[#80B5FF]",
    },
    {
      title: "CATEGORIES",
      value: dashboard.statistics.totalCategories.toLocaleString("fr-FR"),
      subtitle: "Categories disponibles",
      icon: Shapes,
      accent: "text-[#C8B5FF]",
    },
  ];

  const genderRows = [
    { icon: UserRound, label: "Hommes", value: dashboard.gender.male },
    { icon: CircleUserRound, label: "Femmes", value: dashboard.gender.female },
    { icon: CircleUserRound, label: "Autres", value: dashboard.gender.other },
    // {
    //   icon: CircleUserRound,
    //   label: "Non specifie",
    //   value: dashboard.gender.notSpecified,
    // },
  ];

  if (error) {
    return (
      <div className="space-y-6 text-[#FFFFFF]">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">Dashboard analytique</h1>
          <p className="text-sm text-[#FFFFFF]">
            Apercu global de votre plateforme d&apos;apprentissage
          </p>
        </div>
        <Card className="border border-[#3B3754] bg-[#1F1D2B]">
          <CardContent className="p-6">
            <p className="text-[#FF8D9A]">
              Erreur lors du chargement des analytics: {error}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-[#FFFFFF]">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold md:text-4xl">
          Dashboard analytique
        </h1>
        <p className="text-sm text-[#FFFFFF] md:text-base">
          Apercu global de votre plateforme d&apos;apprentissage
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
            whileHover={{ y: -4 }}
          >
            <Card className="border border-[#302D47] bg-[#1F1D2B] shadow-none transition-all duration-300 hover:border-[#A9F5E5]/30">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold tracking-[0.12em] text-[#FFFFFF]">
                    {stat.title}
                  </p>
                  <stat.icon className={`h-4 w-4 ${stat.accent}`} />
                </div>
                <p className="text-3xl font-semibold text-[#FFFFFF]">{stat.value}</p>
                <p className="text-xs text-[#FFFFFF]">{stat.subtitle}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="border border-[#302D47] bg-[#1F1D2B] shadow-none">
          <CardContent className="p-5">
            <h3 className="mb-4 text-lg font-semibold text-[#80B5FF]">
              Statistiques mensuelles
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboard.monthlyStats}>
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
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#302D47] bg-[#1F1D2B] shadow-none">
          <CardContent className="p-5">
            <h3 className="mb-4 text-lg font-semibold text-[#73C84A]">
              Distribution revenus mensuels
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboard.monthlyStats}>
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
                  <Bar
                    isAnimationActive
                    dataKey="revenue"
                    fill="#73C84A"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="border border-[#302D47] bg-[#1F1D2B] shadow-none xl:col-span-1">
          <CardContent className="space-y-4 p-5 text-[#FFFFFF]">
            <h3 className="text-lg font-semibold text-[#FFFFFF]">Repartition par sexe</h3>
            {genderRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#FFFFFF]">
                  <row.icon className="h-4 w-4" />
                  <span>{row.label}</span>
                </div>
                <span className="font-semibold">{row.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-[#302D47] bg-[#1F1D2B] shadow-none xl:col-span-1">
          <CardContent className="space-y-4 p-5 text-[#FFFFFF]">
            <h3 className="text-lg font-semibold text-[#FFFFFF]">Repartition par zone</h3>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#FFFFFF]">
                <House className="h-4 w-4" />
                <span>Urbain</span>
              </div>
              <span className="font-semibold">{dashboard.residence.urban}</span>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#FFFFFF]">
                <Landmark className="h-4 w-4" />
                <span>Rural</span>
              </div>
              <span className="font-semibold">{dashboard.residence.rural}</span>
            </div>
            {/* <div className="rounded-xl border border-[#383453] bg-[#181721] p-3 text-xs text-[#FFFFFF]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MapPinHouse className="h-3.5 w-3.5" />
                  <span>Total zones mappees</span>
                </div>
                <span className="text-sm font-semibold text-[#FFFFFF]">
                  {dashboard.residence.urban + dashboard.residence.rural}
                </span>
              </div>
            </div> */}
          </CardContent>
        </Card>

        <Card className="border border-[#302D47] bg-[#1F1D2B] shadow-none xl:col-span-1">
          <CardContent className="space-y-4 p-5 text-[#FFFFFF]">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[#FFFFFF]">
              <Accessibility className="h-4 w-4 text-[#80B5FF]" />
              Accessibilite
            </h3>
            <div className="flex items-center gap-2">
              <p className="text-5xl font-semibold">{dashboard.disability.total}</p>
              <p className="text-sm text-[#FFFFFF]">Utilisateurs avec handicap</p>
            </div>
            {loading && <p className="text-xs text-[#FFFFFF]">Chargement en cours...</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
