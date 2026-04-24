"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Mail,
  Phone,
  RefreshCw,
  Users,
} from "lucide-react";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { userService } from "@/services/userService";
import type { User as StudentUser } from "@/types/user";
import logger from "@/shared/helpers/logger";

type StudentRow = {
  id: string;
  fullName: string;
  email: string;
  telephone: string;
  progress: number;
};

type EnrollmentRecord = Record<string, any>;

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

const extractCourseRecord = (payload: any): Record<string, any> => {
  return payload?.course ?? payload?.data?.course ?? payload?.data ?? payload ?? {};
};

const resolveCourseIdentity = (record: Record<string, any>): string => {
  return normalizeText(
    record?.id ?? record?._id ?? record?.courseId ?? record?.course_id,
  );
};

const findCourseInListPayload = (
  payload: any,
  courseId: string,
): Record<string, any> | null => {
  const candidateLists = [
    Array.isArray(payload) ? payload : null,
    Array.isArray(payload?.courses) ? payload.courses : null,
    Array.isArray(payload?.data?.courses) ? payload.data.courses : null,
    Array.isArray(payload?.items) ? payload.items : null,
  ].filter((list): list is Record<string, any>[] => Array.isArray(list));

  for (const list of candidateLists) {
    const match = list.find((record) => resolveCourseIdentity(record) === courseId);
    if (match) {
      return match;
    }
  }

  return null;
};

const extractEnrollmentRecords = (payload: any): EnrollmentRecord[] => {
  const courseRecord = extractCourseRecord(payload);
  const candidates = [
    courseRecord?.enrollments,
    courseRecord?._enrollments,
    courseRecord?.students,
    courseRecord?.enrolledStudents,
    payload?.enrollments,
    payload?._enrollments,
    payload?.students,
    payload?.enrolledStudents,
  ];

  return candidates.find(Array.isArray) ?? [];
};

const extractStudentSource = (record: EnrollmentRecord): Record<string, any> => {
  return (
    record?.user ??
    record?.student ??
    record?.profile ??
    record?.studentData ??
    record
  );
};

const resolveEnrollmentUserId = (record: EnrollmentRecord): string => {
  const candidates = [
    record?.userId,
    record?.user_id,
    record?.studentId,
    record?.student_id,
    record?.user?.id,
    record?.user?.userId,
    record?.student?.id,
    record?.student?.userId,
  ];

  for (const candidate of candidates) {
    const value = normalizeText(candidate);
    if (value) return value;
  }

  return "";
};

const resolveProgress = (record: EnrollmentRecord, source?: Record<string, any>) => {
  const candidates = [
    record?.progressPercentage,
    record?.progress_percentage,
    record?.progress,
    record?.completionPercentage,
    record?.completion_percentage,
    source?.progressPercentage,
    source?.progress_percentage,
    source?.progress,
  ];

  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null || candidate === "") continue;
    return clampProgress(candidate);
  }

  return 0;
};

const resolveFullName = (source: Record<string, any>): string => {
  const directName = normalizeText(
    source?.display_name ?? source?.displayName ?? source?.name ?? source?.username,
  );
  if (directName) return directName;

  const firstName = normalizeText(
    source?.firstName ?? source?.first_name ?? source?.prenom,
  );
  const lastName = normalizeText(
    source?.lastName ?? source?.last_name ?? source?.nom,
  );

  const combined = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (combined) return combined;

  const email = normalizeText(source?.email);
  if (email) return email;

  return "Étudiant";
};

const resolveEmail = (source: Record<string, any>): string => {
  return normalizeText(source?.email) || "-";
};

const resolveTelephone = (source: Record<string, any>): string => {
  const candidates = [
    source?.telephone,
    source?.phone,
    source?.phoneNumber,
    source?.phone_number,
    source?.userProfile?.phone,
    source?.userProfile?.telephone,
    source?.profile?.phone,
    source?.profile?.telephone,
  ];

  for (const candidate of candidates) {
    const value = normalizeText(candidate);
    if (value) return value;
  }

  return "-";
};

const resolveCourseTitle = (payload: any): string => {
  const courseRecord = extractCourseRecord(payload);
  return (
    normalizeText(courseRecord?.title) ||
    normalizeText(courseRecord?._title) ||
    "Cours sans titre"
  );
};

const resolveCourseStudentCount = (payload: any): number => {
  const courseRecord = extractCourseRecord(payload);
  const candidates = [
    courseRecord?.studentsCount,
    courseRecord?._studentsCount,
    courseRecord?.enrollmentCount,
    courseRecord?.enrolledCount,
    Array.isArray(courseRecord?.enrollments) ? courseRecord.enrollments.length : null,
    Array.isArray(courseRecord?._enrollments) ? courseRecord._enrollments.length : null,
    Array.isArray(courseRecord?.students) ? courseRecord.students.length : null,
    Array.isArray(courseRecord?.enrolledStudents)
      ? courseRecord.enrolledStudents.length
      : null,
  ];

  for (const candidate of candidates) {
    const numeric = Number(candidate);
    if (Number.isFinite(numeric)) {
      return Math.max(0, Math.round(numeric));
    }
  }

  return 0;
};

const getAllStudents = async (): Promise<StudentUser[]> => {
  const pageSize = 100;
  const maxPages = 20;
  const collected: StudentUser[] = [];
  let currentPage = 1;
  let total = 0;

  while (currentPage <= maxPages) {
    const response = await userService.getUsersByRole({
      role: "STUDENT",
      page: currentPage,
      limit: pageSize,
    });

    collected.push(...response.users);
    total = response.total || collected.length;

    if (response.users.length === 0) break;
    if (collected.length >= total) break;

    currentPage += 1;
  }

  return collected;
};

const buildStudentRows = (
  enrollmentRecords: EnrollmentRecord[],
  studentsDirectory: StudentUser[],
): StudentRow[] => {
  const directoryById = new Map<string, StudentUser>();

  studentsDirectory.forEach((student) => {
    directoryById.set(String(student.id), student);
  });

  const rows: StudentRow[] = [];
  const seen = new Set<string>();

  enrollmentRecords.forEach((record, index) => {
    const userId = resolveEnrollmentUserId(record);
    const nestedSource = extractStudentSource(record);
    const directoryStudent = userId ? directoryById.get(userId) : undefined;
    const source = directoryStudent ?? nestedSource;
    const rowId = userId || String(source?.id ?? record?.id ?? `enrollment-${index}`);

    if (seen.has(rowId)) return;
    seen.add(rowId);

    rows.push({
      id: rowId,
      fullName: resolveFullName(source),
      email: resolveEmail(source),
      telephone: resolveTelephone(source),
      progress: resolveProgress(record, source),
    });
  });

  return rows;
};

function CourseStudentsPageContent() {
  const params = useParams();
  const courseId = resolveRouteCourseId(
    (params as { courseId?: string | string[] })?.courseId,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState("...");
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [students, setStudents] = useState<StudentRow[]>([]);

  const loadData = useCallback(async () => {
    if (!courseId) {
      setError("Identifiant de cours introuvable");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [courseListResult, courseDetailsResult, directoryResult] =
        await Promise.allSettled([
          CoursesApi.getCourses(1, 200, { userRole: "ADMIN" }),
          CoursesApi.getCourseDetails(courseId),
          getAllStudents(),
        ]);

      const courseFromList =
        courseListResult.status === "fulfilled"
          ? findCourseInListPayload(courseListResult.value, courseId)
          : null;
      const courseFromDetails =
        courseDetailsResult.status === "fulfilled"
          ? extractCourseRecord(courseDetailsResult.value)
          : null;
      const listEnrollmentRecords = courseFromList
        ? extractEnrollmentRecords(courseFromList)
        : [];
      const detailEnrollmentRecords = courseFromDetails
        ? extractEnrollmentRecords(courseFromDetails)
        : [];
      const selectedCourse =
        listEnrollmentRecords.length > 0
          ? courseFromList
          : detailEnrollmentRecords.length > 0
            ? courseFromDetails
            : courseFromList ?? courseFromDetails;

      if (!selectedCourse) {
        const firstError =
          courseListResult.status === "rejected"
            ? courseListResult.reason
            : courseDetailsResult.status === "rejected"
              ? courseDetailsResult.reason
              : null;
        throw firstError instanceof Error
          ? firstError
          : new Error("Impossible de charger les informations du cours");
      }

      const enrollmentRecords =
        listEnrollmentRecords.length > 0
          ? listEnrollmentRecords
          : detailEnrollmentRecords;

      const studentsDirectory =
        directoryResult.status === "fulfilled" ? directoryResult.value : [];

      const rows = buildStudentRows(enrollmentRecords, studentsDirectory);

      setCourseTitle(resolveCourseTitle(selectedCourse));
      setEnrollmentCount(
        enrollmentRecords.length > 0
          ? enrollmentRecords.length
          : resolveCourseStudentCount(selectedCourse),
      );
      setStudents(rows);

      logger.log("📚 [CourseStudentsPage] Course record:", selectedCourse);
      logger.log("📚 [CourseStudentsPage] Enrollments:", enrollmentRecords);
      logger.log("📚 [CourseStudentsPage] Students rows:", rows);
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
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const renderLoading = () => (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="size-7 text-[#002c75]" />
        <p className="text-sm font-medium text-slate-600">
          Chargement des étudiants inscrits...
        </p>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
        <Users className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">
        Aucun étudiant inscrit sur ce cours
      </h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
        Les inscriptions apparaîtront ici dès qu'un étudiant sera enrôlé.
      </p>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-[#F4F7FC]">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-10 lg:py-8">
        <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-br from-[#002c75]/10 via-transparent to-[#FF3B3F]/5" />

        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/60 bg-white/90 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <Button
                  asChild
                  variant="ghost"
                  className="w-fit gap-2 rounded-full border border-slate-200 bg-white/80 px-4 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                >
                  <Link href="/admin-dashboard?focus=courses">
                    <ArrowLeft className="h-4 w-4" />
                    Retour
                  </Link>
                </Button>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Gestion des cours
                  </p>
                  <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                    Étudiants inscrits — {courseTitle}
                  </h1>
                  <p className="text-sm text-slate-600">
                    {enrollmentCount} étudiant(s) inscrit(s)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Total
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {enrollmentCount}
                  </p>
                </div>

                <Button
                  variant="outline"
                  onClick={() => void loadData()}
                  disabled={loading}
                  className="gap-2 rounded-full"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Rafraîchir
                </Button>
              </div>
            </div>
          </div>

          {loading ? (
            renderLoading()
          ) : error ? (
            <Alert variant="destructive" className="border-red-200 bg-white">
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
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-50/60">
                <CardTitle className="text-lg text-slate-900">
                  Liste des étudiants
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Nom, coordonnées et progression individuelle
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {students.length === 0 ? (
                  <div className="p-6">{renderEmptyState()}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">#</TableHead>
                          <TableHead>Nom complet</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Téléphone</TableHead>
                          <TableHead className="min-w-[260px]">
                            Progression
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student, index) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium text-slate-500">
                              {index + 1}
                            </TableCell>
                            <TableCell>
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#002c75] to-[#1d4ed8] text-xs font-semibold text-white shadow-sm">
                                  {student.fullName
                                    .split(" ")
                                    .filter(Boolean)
                                    .slice(0, 2)
                                    .map((part) => part[0])
                                    .join("")
                                    .toUpperCase() || "E"}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-slate-900">
                                    {student.fullName}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600">
                              <div className="inline-flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5 text-slate-400" />
                                <span>{student.email}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600">
                              <div className="inline-flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5 text-slate-400" />
                                <span>{student.telephone || "-"}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Progress
                                  value={student.progress}
                                  className="h-2 flex-1 bg-slate-200"
                                />
                                <span className="min-w-[3.5rem] text-right text-sm font-semibold text-slate-900">
                                  {student.progress}%
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
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
