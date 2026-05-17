"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  BadgeDollarSign,
  BookOpenCheck,
  CalendarDays,
  LineChart as LineChartIcon,
  Search,
  RefreshCw,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import { buildApiUrl } from "@/infrastructure/api/baseConfig";
import logger from "@/shared/helpers/logger";

type DashboardStat = {
  totalRevenue: number;
  totalEnrollments: number;
  currentMonthRevenue: number;
  currentMonthEnrollments: number;
  completionRate: number;
};

type MonthlyPoint = {
  month: string;
  monthIndex: number;
  revenue: number;
  enrollments: number;
};

type StudentRow = {
  enrollmentId: string;
  fullName: string;
  email: string;
  telephone: string;
  progress: number;
  status: "ACTIVE" | "COMPLETED" | "DROPPED";
};

type CourseOverviewData = {
  title: string;
  instructorName: string;
  createdAt: string;
  stats: DashboardStat;
  monthlyData: MonthlyPoint[];
};

type StudentsPagination = {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

const normalizeText = (value: unknown): string => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed === "null" || trimmed === "undefined") return "";
  return trimmed;
};

const clampProgress = (value: unknown): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
};

const resolveRouteCourseId = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] ?? "";
  return param ?? "";
};

const formatAmount = (value: number): string => {
  return `${Math.round(value).toLocaleString("fr-FR")} CFA`;
};

const formatDate = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const resolveStatusLabel = (status: StudentRow["status"]): string => {
  if (status === "COMPLETED") return "COMPLETE";
  if (status === "DROPPED") return "ABANDON";
  return "ACTIF";
};

const resolveStatusClassName = (status: StudentRow["status"]): string => {
  if (status === "COMPLETED") {
    return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  }
  if (status === "DROPPED") {
    return "bg-rose-100 text-rose-700 border border-rose-200";
  }
  return "bg-sky-100 text-sky-700 border border-sky-200";
};

const mapOverviewPayload = (payload: any, courseFallbackTitle: string): CourseOverviewData => {
  const data = payload?.data ?? payload ?? {};
  const course = data?.course ?? {};
  const stats = data?.stats ?? {};
  const monthlyData = Array.isArray(data?.monthlyData) ? data.monthlyData : [];

  return {
    title: normalizeText(course?.title) || courseFallbackTitle || "Cours sans titre",
    instructorName: [normalizeText(course?.instructor?.firstName), normalizeText(course?.instructor?.lastName)]
      .filter(Boolean)
      .join(" ")
      .trim() || "Instructeur non renseigné",
    createdAt: normalizeText(course?.createdAt),
    stats: {
      totalRevenue: Number(stats?.totalRevenue) || 0,
      totalEnrollments: Number(stats?.totalEnrollments) || 0,
      currentMonthRevenue: Number(stats?.currentMonthRevenue) || 0,
      currentMonthEnrollments: Number(stats?.currentMonthEnrollments) || 0,
      completionRate: Number(stats?.completionRate) || 0,
    },
    monthlyData: monthlyData.map((item: any) => ({
      month: normalizeText(item?.month) || "-",
      monthIndex: Number(item?.monthIndex) || 0,
      revenue: Number(item?.revenue) || 0,
      enrollments: Number(item?.enrollments) || 0,
    })),
  };
};

const mapStudentsPayload = (payload: any): {
  students: StudentRow[];
  pagination: StudentsPagination;
} => {
  const data = payload?.data ?? payload ?? {};
  const students = Array.isArray(data?.students) ? data.students : [];
  const pagination = data?.pagination ?? {};

  return {
    students: students.map((item: any, index: number) => {
    const user = item?.user ?? {};
    const firstName = normalizeText(user?.firstName);
    const lastName = normalizeText(user?.lastName);
    const fullName =
      [firstName, lastName].filter(Boolean).join(" ").trim() || "Étudiant";
    const statusRaw = normalizeText(item?.status).toUpperCase();
    const status: StudentRow["status"] =
      statusRaw === "COMPLETED" || statusRaw === "DROPPED" ? statusRaw : "ACTIVE";
    const rawProgress = clampProgress(item?.progress);
    const totalLessons = Number(item?.lessonProgress?.totalLessons) || 0;
    const completedLessons = Number(item?.lessonProgress?.completedLessons) || 0;
    const computedProgress =
      totalLessons > 0 ? clampProgress((completedLessons / totalLessons) * 100) : 0;
    const progress = rawProgress > 0 ? rawProgress : computedProgress;

    return {
      enrollmentId: normalizeText(item?.enrollmentId) || `student-${index}`,
      fullName,
      email: normalizeText(user?.email) || "-",
      telephone: normalizeText(user?.telephone) || "-",
      progress,
      status,
    };
    }),
    pagination: {
      currentPage: Number(pagination.currentPage) || 1,
      pageSize: Number(pagination.pageSize) || 20,
      totalItems: Number(pagination.totalItems) || students.length,
      totalPages: Math.max(1, Number(pagination.totalPages) || 1),
      hasNextPage: Boolean(pagination.hasNextPage),
      hasPreviousPage: Boolean(pagination.hasPreviousPage),
    },
  };
};

function CourseStudentsPageContent() {
  const params = useParams();
  const courseId = resolveRouteCourseId(
    (params as { courseId?: string | string[] })?.courseId,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState("Cours");
  const [overview, setOverview] = useState<CourseOverviewData | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [studentsPagination, setStudentsPagination] = useState<StudentsPagination>({
    currentPage: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [studentsLoading, setStudentsLoading] = useState(false);
  const pageSize = 25;

  const loadOverview = useCallback(async () => {
    if (!courseId) {
      setError("Identifiant de cours introuvable");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const courseDetails = await CoursesApi.getCourseDetails(courseId);
      const fallbackTitle = normalizeText(courseDetails?.course?.title) || "Cours";
      setCourseTitle(fallbackTitle);

      const currentYear = new Date().getFullYear();
      const overviewPayload = await fetch(buildApiUrl(`/course/${courseId}/overview?year=${currentYear}`), {
        method: "GET",
        credentials: "include",
      }).then(async (response) => {
        const json = await response.json().catch(() => null);
        if (!response.ok || !json?.success) {
          throw new Error(json?.error?.message || `Erreur overview: ${response.status}`);
        }
        return json;
      });

      setOverview(mapOverviewPayload(overviewPayload, fallbackTitle));
    } catch (requestError) {
      logger.error(
        "❌ [CourseStudentsPage] Erreur chargement des analytics:",
        requestError,
      );
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de charger les analytics de ce cours",
      );
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const loadStudents = useCallback(async () => {
    if (!courseId) return;

    setStudentsLoading(true);
    setError(null);

    try {
      const studentsUrl = new URL(
        buildApiUrl(`/course/${courseId}/students`),
        window.location.origin,
      );
      studentsUrl.searchParams.set("page", String(currentPage));
      studentsUrl.searchParams.set("limit", String(pageSize));
      if (searchQuery) {
        studentsUrl.searchParams.set("q", searchQuery);
      }

      const studentsPayload = await fetch(studentsUrl.toString(), {
        method: "GET",
        credentials: "include",
      }).then(async (response) => {
        const json = await response.json().catch(() => null);
        if (!response.ok || !json?.success) {
          throw new Error(json?.error?.message || `Erreur students: ${response.status}`);
        }
        return json;
      });

      const mappedStudents = mapStudentsPayload(studentsPayload);
      setStudents(mappedStudents.students);
      setStudentsPagination(mappedStudents.pagination);
    } catch (requestError) {
      logger.error(
        "❌ [CourseStudentsPage] Erreur chargement des étudiants:",
        requestError,
      );
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de charger les étudiants de ce cours",
      );
    } finally {
      setStudentsLoading(false);
    }
  }, [courseId, currentPage, pageSize, searchQuery]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (!courseId) return;
    void loadStudents();
  }, [courseId, loadStudents]);

  const loadData = useCallback(async () => {
    await Promise.all([loadOverview(), loadStudents()]);
  }, [loadOverview, loadStudents]);

  const applySearch = useCallback(() => {
    const nextQuery = searchInput.trim();
    setCurrentPage(1);
    setSearchQuery(nextQuery);
  }, [searchInput]);

  const clearSearch = useCallback(() => {
    setSearchInput("");
    setSearchQuery("");
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const normalizedSearch = searchInput.trim();
      if (normalizedSearch !== searchQuery) {
        setCurrentPage(1);
        setSearchQuery(normalizedSearch);
      }
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput, searchQuery]);

  const isFiltering = Boolean(searchQuery);
  const hasStudents = students.length > 0;
  const paginationText = `Page ${studentsPagination.currentPage} / ${studentsPagination.totalPages}`;

  const renderLoading = () => (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="size-7 text-[#002c75]" />
        <p className="text-sm font-medium text-white/70">
          Chargement des étudiants inscrits...
        </p>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#3B3754] bg-[#1F1D2B] px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#26233A] shadow-sm">
        <Users className="h-8 w-8 text-white/40" />
      </div>
      <h3 className="text-lg font-semibold text-white">
        Aucun étudiant inscrit sur ce cours
      </h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">
        Les inscriptions apparaîtront ici dès qu'un étudiant sera enrôlé.
      </p>
    </div>
  );

  const currentStats = overview?.stats ?? {
    totalRevenue: 0,
    totalEnrollments: studentsPagination.totalItems,
    currentMonthRevenue: 0,
    currentMonthEnrollments: 0,
    completionRate: 0,
  };

  const monthlySeries = overview?.monthlyData ?? [];

  return (
    <div className="relative min-h-screen bg-[#151322]">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-10 lg:py-8">
        <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-linear-to-br from-[#0E1B46]/40 via-transparent to-[#1F1D2B]/30" />

        <div className="space-y-6">
          {loading ? (
            renderLoading()
          ) : error ? (
            <Alert variant="destructive" className="border-red-400/40 bg-[#1F1D2B] text-white">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Impossible de charger la liste</AlertTitle>
              <AlertDescription className="space-y-4">
                <p>{error}</p>
                <Button variant="outline" onClick={() => void loadData()}>
                  Réessayer
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                  asChild
                  className="h-10 rounded-full border border-[#3B3754] bg-[#1F1D2B] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#26233A]"
                >
                  <Link href="/admin-dashboard?focus=courses" className="flex items-center justify-baseline gap-2">
                    <div className="flex gap-2 items-center justify-center mt-1">
                      <ArrowLeft className="h-4 w-4" />
                    Retour
                    </div>
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => void loadData()}
                  disabled={loading || studentsLoading}
                  className="gap-2 rounded-full border-[#3B3754] bg-[#1F1D2B] px-4 text-white hover:bg-[#26233A]"
                >
                  <RefreshCw className={`h-4 w-4 ${(loading || studentsLoading) ? "animate-spin" : ""}`} />
                  Rafraîchir
                </Button>
              </div>

              <Card className="overflow-hidden border border-[#302D47] bg-[#1F1D2B] text-white shadow-xl">
                <CardContent className="p-6 lg:p-8">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold lg:text-3xl">
                        {overview?.title || courseTitle}
                      </h2>
                      <p className="mt-1 text-sm text-white/70">
                        Instructeur: {overview?.instructorName || "N/A"} | Cree le{" "}
                        {overview?.createdAt ? formatDate(overview.createdAt) : "-"}
                      </p>
                    </div>
                    <div className="flex w-full flex-wrap items-stretch gap-3 lg:w-auto lg:flex-nowrap">
                      <div className="min-w-[140px] flex-1 rounded-xl border border-[#3B3754] bg-[#26233A] px-3 py-2">
                        <p className="text-xs uppercase tracking-[0.15em] text-white/70">Revenu total</p>
                        <p className="mt-1 text-xl font-bold">{formatAmount(currentStats.totalRevenue)}</p>
                      </div>
                      <div className="min-w-[120px] flex-1 rounded-xl border border-[#3B3754] bg-[#26233A] px-3 py-2">
                        <p className="text-xs uppercase tracking-[0.15em] text-white/70">Inscrits</p>
                        <p className="mt-1 text-xl font-bold">{currentStats.totalEnrollments}</p>
                      </div>
                      <div className="min-w-[160px] flex-1 rounded-xl border border-[#3B3754] bg-[#26233A] px-3 py-2">
                        <p className="text-xs uppercase tracking-[0.15em] text-white/70">Revenu ce mois</p>
                        <p className="mt-1 text-xl font-bold">{formatAmount(currentStats.currentMonthRevenue)}</p>
                      </div>
                      <div className="min-w-[140px] flex-1 rounded-xl border border-[#3B3754] bg-[#26233A] px-3 py-2">
                        <p className="text-xs uppercase tracking-[0.15em] text-white/70">Taux completion</p>
                        <p className="mt-1 text-xl font-bold">{Math.round(currentStats.completionRate)}%</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-5 lg:grid-cols-2">
                <Card className="border border-[#302D47] bg-[#1F1D2B] text-white shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BadgeDollarSign className="h-4 w-4 text-[#002c75]" />
                      Revenus mensuels
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[260px] pt-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlySeries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#3B3754" />
                        <XAxis dataKey="month" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip />
                        <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="border border-[#302D47] bg-[#1F1D2B] text-white shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <LineChartIcon className="h-4 w-4 text-[#80B5FF]" />
                      Inscriptions mensuelles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[260px] pt-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlySeries}>
                        <defs>
                          <linearGradient id="monthlyEnrollmentsFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#80B5FF" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#80B5FF" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#3B3754" />
                        <XAxis dataKey="month" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip
                          contentStyle={{
                            background: "#181721",
                            border: "1px solid #3B3754",
                            borderRadius: "10px",
                            color: "#fff",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="enrollments"
                          fill="url(#monthlyEnrollmentsFill)"
                          stroke="#80B5FF"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="enrollments"
                          stroke="#80B5FF"
                          strokeWidth={2}
                          dot
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border border-[#302D47] bg-[#1F1D2B] text-white shadow-sm">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="rounded-xl bg-[#26233A] p-2">
                      <Users className="h-5 w-5 text-[#002c75]" />
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Total inscrits</p>
                      <p className="text-xl font-bold text-white">{currentStats.totalEnrollments}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border border-[#302D47] bg-[#1F1D2B] text-white shadow-sm">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="rounded-xl bg-[#26233A] p-2">
                      <BookOpenCheck className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Completion</p>
                      <p className="text-xl font-bold text-white">{Math.round(currentStats.completionRate)}%</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border border-[#302D47] bg-[#1F1D2B] text-white shadow-sm">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="rounded-xl bg-[#26233A] p-2">
                      <TrendingUp className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Inscriptions mois</p>
                      <p className="text-xl font-bold text-white">{currentStats.currentMonthEnrollments}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border border-[#302D47] bg-[#1F1D2B] text-white shadow-sm">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="rounded-xl bg-[#26233A] p-2">
                      <CalendarDays className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Date creation</p>
                      <p className="text-sm font-semibold text-white">{overview?.createdAt ? formatDate(overview.createdAt) : "-"}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="overflow-hidden border border-[#302D47] bg-[#1F1D2B] text-white shadow-sm">
                <CardHeader className="border-b border-[#302D47] bg-[#26233A]/40">
                  <CardTitle className="text-lg text-white">
                    Tableau des étudiants du cours
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    Nom, email, téléphone, progression et statut
                  </CardDescription>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                      <Input
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            applySearch();
                          }
                        }}
                        placeholder="Rechercher par prénom, nom, email ou téléphone"
                        className="h-10 border-[#3B3754] bg-[#1F1D2B] pl-9 text-white placeholder:text-white/45"
                      />
                    </div>
                    {isFiltering && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={clearSearch}
                        className="gap-2 border-[#3B3754] bg-[#1F1D2B] text-white hover:bg-[#26233A]"
                      >
                        <X className="h-4 w-4" />
                        Effacer
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {studentsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Spinner className="size-6 text-[#80B5FF]" />
                    </div>
                  ) : !hasStudents ? (
                    <div className="p-6">{renderEmptyState()}</div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <Table className="text-white">
                          <TableHeader>
                            <TableRow className="border-b border-[#302D47] hover:bg-transparent">
                              <TableHead className="text-white/75">Nom & prénom</TableHead>
                              <TableHead className="text-white/75">Email</TableHead>
                              <TableHead className="text-white/75">Téléphone</TableHead>
                              <TableHead className="min-w-[220px] text-white/75">Progression</TableHead>
                              <TableHead className="text-white/75">Statut</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {students.map((student) => (
                              <TableRow key={student.enrollmentId} className="border-b border-[#2A273D] hover:bg-[#26233A]/60">
                                <TableCell className="font-semibold text-white">
                                  {student.fullName}
                                </TableCell>
                                <TableCell className="text-white/70">{student.email}</TableCell>
                                <TableCell className="text-white/70">{student.telephone}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Progress
                                      value={student.progress}
                                      className="h-2 flex-1 bg-[#3B3754]"
                                    />
                                    <span className="min-w-12 text-sm font-semibold text-white">
                                      {student.progress}%
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span
                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${resolveStatusClassName(student.status)}`}
                                  >
                                    {resolveStatusLabel(student.status)}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="flex flex-col gap-3 border-t border-[#302D47] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-white/65">
                          {studentsPagination.totalItems} résultat(s) {isFiltering ? `pour "${searchQuery}"` : ""}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            disabled={!studentsPagination.hasPreviousPage || studentsLoading}
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            className="h-9 border-[#3B3754] bg-[#1F1D2B] text-white hover:bg-[#26233A]"
                          >
                            Précédent
                          </Button>
                          <span className="text-sm text-white/80">{paginationText}</span>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={!studentsPagination.hasNextPage || studentsLoading}
                            onClick={() => setCurrentPage((prev) => prev + 1)}
                            className="h-9 border-[#3B3754] bg-[#1F1D2B] text-white hover:bg-[#26233A]"
                          >
                            Suivant
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CourseStudentsPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <CourseStudentsPageContent />
    </ProtectedRoute>
  );
}
