"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import {
  AlertCircle,
  CheckCircle,
  Download,
  Loader2,
  Lock,
  Play,
  RefreshCw,
} from "lucide-react";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import { PaymentApi } from "@/infrastructure/api/payment-api";
import { QuizApi } from "@/infrastructure/api/quiz-api";
import { transformCourseDetails } from "@/lib/transformers/course-transformer";
import type { VerificationState } from "@/types/enrollment";
import logger from "@/shared/helpers/logger";

const POLLING_INTERVAL_MS = 3000;
const MAX_ATTEMPTS = 20;
const AUTO_REDIRECT_SECONDS = 5;

const SUCCESS_STATUSES = new Set([
  "SUCCESS",
  "SUCCEEDED",
  "COMPLETED",
  "PAID",
  "ACTIVE",
  "APPROVED",
]);

const PENDING_STATUSES = new Set([
  "PENDING",
  "PROCESSING",
  "WAITING",
  "IN_PROGRESS",
]);

const CANCELLED_STATUSES = new Set(["CANCELLED", "CANCELED"]);
const FAILURE_STATUSES = new Set(["FAILED", "ERROR", "REJECTED", "EXPIRED"]);

type PreviewLesson = {
  id: string;
  title: string;
  durationLabel: string;
};

type PaymentType = "course" | "certification";

const FALLBACK_LESSONS: PreviewLesson[] = [
  { id: "lesson-1", title: "Introduction au cours", durationLabel: "12:30" },
  { id: "lesson-2", title: "Les bases fondamentales", durationLabel: "24:15" },
  { id: "lesson-3", title: "Pratique guidée", durationLabel: "18:45" },
  { id: "lesson-4", title: "Projet final", durationLabel: "35:00" },
];

const normalizeStatus = (value: unknown): string =>
  String(value || "").trim().toUpperCase();

const normalizePaymentType = (value: unknown): PaymentType => {
  if (typeof value !== "string") return "course";
  return value.trim().toLowerCase() === "certification"
    ? "certification"
    : "course";
};

const withPaymentType = (url: string, paymentType: PaymentType): string => {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("paymentType", paymentType);
    return parsed.toString();
  } catch {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}paymentType=${paymentType}`;
  }
};

const minutesToClock = (durationInMinutes?: number): string => {
  if (!durationInMinutes || durationInMinutes <= 0) return "--:--";

  const totalSeconds = Math.round(durationInMinutes * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

function getPendingCourseIdFromStorage(): string | null {
  if (typeof window === "undefined") return null;

  const localPending = localStorage.getItem("pendingEnrollment");
  if (localPending) {
    try {
      const parsed = JSON.parse(localPending);
      if (parsed?.courseId && typeof parsed.courseId === "string") {
        return parsed.courseId;
      }
    } catch {
      // Ignore invalid JSON
    }
  }

  const sessionPending = sessionStorage.getItem("pendingCourseId");
  if (sessionPending) return sessionPending;

  const cookiePending = Cookies.get("pendingEnrollment");
  if (cookiePending) {
    try {
      const parsed = JSON.parse(cookiePending);
      if (parsed?.courseId && typeof parsed.courseId === "string") {
        return parsed.courseId;
      }
    } catch {
      // Ignore invalid JSON
    }
  }

  const cookieCourseId = Cookies.get("pendingCourseId");
  return cookieCourseId || null;
}

const pendingCertificationClaimKey = (courseId: string) =>
  `pendingCertificationClaim:${courseId}`;

const clearPendingCertificationClaim = (courseId: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(pendingCertificationClaimKey(courseId));
};

const PENDING_CERTIFICATION_CLAIM_TTL_MS = 24 * 60 * 60 * 1000;

type PendingCertificationClaimData = {
  timestamp: number;
  paymentUrl: string | null;
};

const parsePendingCertificationClaimData = (
  stored: string,
): PendingCertificationClaimData | null => {
  const numeric = Number(stored);
  if (Number.isFinite(numeric)) {
    return { timestamp: numeric, paymentUrl: null };
  }

  try {
    const parsed = JSON.parse(stored) as unknown;
    if (typeof parsed === "number" && Number.isFinite(parsed)) {
      return { timestamp: parsed, paymentUrl: null };
    }

    if (typeof parsed !== "object" || parsed === null) return null;
    const record = parsed as Record<string, unknown>;
    const timestamp = Number(record.timestamp);
    if (!Number.isFinite(timestamp)) return null;

    const paymentUrl =
      typeof record.paymentUrl === "string" && record.paymentUrl.trim().length > 0
        ? record.paymentUrl.trim()
        : null;

    return { timestamp, paymentUrl };
  } catch {
    return null;
  }
};

const getPendingCertificationPaymentUrl = (courseId: string): string | null => {
  if (typeof window === "undefined") return null;
  const key = pendingCertificationClaimKey(courseId);
  const stored = window.localStorage.getItem(key);
  if (!stored) return null;

  const data = parsePendingCertificationClaimData(stored);
  if (!data) {
    window.localStorage.removeItem(key);
    return null;
  }

  if (Date.now() - data.timestamp > PENDING_CERTIFICATION_CLAIM_TTL_MS) {
    window.localStorage.removeItem(key);
    return null;
  }

  return data.paymentUrl;
};

function CoursePaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");
  const statusParam = (searchParams.get("status") || "").toLowerCase();
  const paymentStatusParam = (
    searchParams.get("payment_status") || ""
  ).toLowerCase();
  const successParam = (searchParams.get("success") || "").toLowerCase();
  const cancelledParam = (searchParams.get("cancelled") || "").toLowerCase();
  const courseIdParam =
    searchParams.get("courseId") || searchParams.get("course_id");

  const cancelledFromQuery = useMemo(
    () =>
      cancelledParam === "true" ||
      successParam === "false" ||
      statusParam === "cancelled" ||
      statusParam === "canceled" ||
      paymentStatusParam === "cancelled" ||
      paymentStatusParam === "canceled" ||
      statusParam === "failed" ||
      paymentStatusParam === "failed",
    [cancelledParam, paymentStatusParam, statusParam, successParam],
  );

  const [state, setState] = useState<VerificationState>({
    status: cancelledFromQuery ? "CANCELLED" : "VERIFYING",
    attemptCount: 0,
    maxAttempts: MAX_ATTEMPTS,
    courseId: courseIdParam || undefined,
    error: cancelledFromQuery
      ? "Paiement annulé. Aucun débit n'a été effectué."
      : undefined,
  });

  const [courseTitle, setCourseTitle] = useState("Votre cours");
  const [previewLessons, setPreviewLessons] =
    useState<PreviewLesson[]>(FALLBACK_LESSONS);
  const [redirectCountdown, setRedirectCountdown] = useState(
    AUTO_REDIRECT_SECONDS,
  );

  const clearPendingEnrollment = useCallback(() => {
    Cookies.remove("pendingEnrollment");
    Cookies.remove("pendingCourseId");
    Cookies.remove("pendingEnrollmentTime");
    sessionStorage.removeItem("pendingCourseId");
    sessionStorage.removeItem("pendingEnrollment");
    localStorage.removeItem("pendingEnrollment");
  }, []);

  const goToCourse = useCallback(() => {
    if (state.courseId) {
      router.push(`/course-details/${state.courseId}`);
      return;
    }
    router.push("/mes-apprentissages");
  }, [router, state.courseId]);

  const resolveCourseId = useCallback((): string | undefined => {
    return state.courseId || courseIdParam || getPendingCourseIdFromStorage() || undefined;
  }, [courseIdParam, state.courseId]);

  const loadPreview = useCallback(async (courseId: string) => {
    try {
      const rawData = await CoursesApi.getCourseDetails(courseId);
      const data = transformCourseDetails(rawData);

      setCourseTitle(data.course.title || "Votre cours");

      const lessons = data.modules
        .flatMap((module) => module.lessons)
        .filter((lesson) => lesson.hasVideo)
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .slice(0, 4)
        .map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          durationLabel: minutesToClock(lesson.duration),
        }));

      if (lessons.length > 0) {
        setPreviewLessons(lessons);
      }
    } catch (error) {
      logger.error("❌ [PaymentSuccess] Erreur chargement aperçu cours:", error);
    }
  }, []);

  const markCompleted = useCallback(
    (courseId?: string) => {
      clearPendingEnrollment();
      setState((prev) => ({
        ...prev,
        status: "COMPLETED",
        courseId: courseId || prev.courseId,
        error: undefined,
      }));
    },
    [clearPendingEnrollment],
  );

  const runVerificationStep = useCallback(async () => {
    setState((prev) => {
      if (prev.status !== "VERIFYING") return prev;
      return { ...prev, attemptCount: prev.attemptCount + 1 };
    });

    const targetCourseId = resolveCourseId();
    if (targetCourseId && targetCourseId !== state.courseId) {
      setState((prev) => ({ ...prev, courseId: targetCourseId }));
    }

    try {
      let paymentStatus = "";
      let courseIdFromVerification: string | undefined;

      if (token) {
        const verification = await PaymentApi.verifyPayment(token);
        paymentStatus = normalizeStatus(
          verification?.status ||
            verification?.paymentStatus ||
            verification?.payment_status ||
            verification?.data?.status ||
            verification?.result?.status,
        );
        courseIdFromVerification = verification?.courseId;

        if (CANCELLED_STATUSES.has(paymentStatus)) {
          clearPendingEnrollment();
          setState((prev) => ({
            ...prev,
            status: "CANCELLED",
            error: "Paiement annulé. Vous pouvez relancer la transaction.",
          }));
          return;
        }

        if (FAILURE_STATUSES.has(paymentStatus)) {
          setState((prev) => ({
            ...prev,
            status: "ERROR",
            error:
              verification?.message ||
              "Le paiement a été refusé. Veuillez réessayer.",
          }));
          return;
        }
      } else if (cancelledFromQuery) {
        clearPendingEnrollment();
        setState((prev) => ({
          ...prev,
          status: "CANCELLED",
          error: "Paiement annulé. Vous pouvez relancer la transaction.",
        }));
        return;
      }

      const finalCourseId = courseIdFromVerification || targetCourseId;

      if (finalCourseId) {
        const enrolled = await CoursesApi.checkEnrollmentStatus(finalCourseId);
        if (enrolled) {
          markCompleted(finalCourseId);
          return;
        }
      }

      if (
        token &&
        SUCCESS_STATUSES.has(paymentStatus) &&
        !finalCourseId
      ) {
        const enrolledCourses = await CoursesApi.getEnrolledCourses();
        const firstCourseId = enrolledCourses?.[0]?.id;
        if (firstCourseId) {
          markCompleted(firstCourseId);
          return;
        }
      }

      if (
        token &&
        paymentStatus &&
        !PENDING_STATUSES.has(paymentStatus) &&
        !SUCCESS_STATUSES.has(paymentStatus)
      ) {
        setState((prev) => ({
          ...prev,
          status: "ERROR",
          error: "Statut de paiement non reconnu. Veuillez contacter le support.",
        }));
      }
    } catch (error) {
      logger.error("❌ [PaymentSuccess] Erreur pendant la vérification:", error);
      if (state.attemptCount >= MAX_ATTEMPTS - 1) {
        setState((prev) => ({
          ...prev,
          status: "ERROR",
          error: "Impossible de confirmer le paiement. Vérifiez votre connexion.",
        }));
      }
    }
  }, [
    cancelledFromQuery,
    clearPendingEnrollment,
    markCompleted,
    paymentStatusParam,
    resolveCourseId,
    state.attemptCount,
    state.courseId,
    statusParam,
    successParam,
    token,
  ]);

  useEffect(() => {
    const resolved = resolveCourseId();
    if (resolved && resolved !== state.courseId) {
      setState((prev) => ({ ...prev, courseId: resolved }));
    }
  }, [resolveCourseId, state.courseId]);

  useEffect(() => {
    if (state.courseId) {
      void loadPreview(state.courseId);
    }
  }, [loadPreview, state.courseId]);

  useEffect(() => {
    if (!cancelledFromQuery) return;

    clearPendingEnrollment();
    setState((prev) => ({
      ...prev,
      status: "CANCELLED",
      error: "Paiement annulé. Vous pouvez relancer la transaction.",
    }));
  }, [cancelledFromQuery, clearPendingEnrollment]);

  useEffect(() => {
    if (state.status !== "VERIFYING") return;
    if (state.attemptCount >= MAX_ATTEMPTS) {
      setState((prev) => ({ ...prev, status: "TIMEOUT" }));
      return;
    }

    const timeoutId = window.setTimeout(
      () => {
        void runVerificationStep();
      },
      state.attemptCount === 0 ? 0 : POLLING_INTERVAL_MS,
    );

    return () => window.clearTimeout(timeoutId);
  }, [runVerificationStep, state.attemptCount, state.status]);

  useEffect(() => {
    if (state.status !== "COMPLETED") return;

    setRedirectCountdown(AUTO_REDIRECT_SECONDS);
    const intervalId = window.setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId);
          goToCourse();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [goToCourse, state.status]);

  const handleRetry = () => {
    setState((prev) => ({
      ...prev,
      status: "VERIFYING",
      attemptCount: 0,
      error: undefined,
    }));
  };

  const iconForLesson =
    state.status === "COMPLETED" ? (
      <Play className="h-4 w-4 text-[#2FB56F]" />
    ) : (
      <Lock className="h-4 w-4 text-[#9CA3AF]" />
    );

  return (
    <div className="min-h-screen bg-[#EFEFF2] px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-[560px]">
        <div className="rounded-2xl border border-[#D5DBE3] bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 text-center">
            {state.status === "COMPLETED" ? (
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#2FB56F]">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
            ) : state.status === "VERIFYING" ? (
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#EEF0F4]">
                <Loader2 className="h-10 w-10 animate-spin text-[#243B95]" />
              </div>
            ) : (
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#FFEDED]">
                <AlertCircle className="h-10 w-10 text-[#E34D4D]" />
              </div>
            )}

            <h1 className="text-3xl font-extrabold text-[#101828]">
              {state.status === "COMPLETED"
                ? "Tout est prêt !"
                : state.status === "VERIFYING"
                  ? "Traitement en cours..."
                  : state.status === "CANCELLED"
                    ? "Paiement annulé"
                    : state.status === "TIMEOUT"
                      ? "Vérification en attente"
                      : "Vérification échouée"}
            </h1>

            <p className="mx-auto mt-3 max-w-md text-[17px] leading-7 text-[#667085]">
              {state.status === "COMPLETED"
                ? "Votre paiement est confirmé et vos cours sont débloqués. Vous pouvez commencer !"
                : state.status === "VERIFYING"
                  ? "Veuillez patienter pendant que nous confirmons votre paiement et préparons vos cours..."
                  : state.status === "CANCELLED"
                    ? "Vous avez interrompu le paiement. Aucun montant n'a été débité."
                    : state.status === "TIMEOUT"
                      ? "La confirmation prend plus de temps que prévu. Vous pouvez relancer la vérification."
                      : state.error ||
                        "Une erreur est survenue pendant la vérification de votre paiement."}
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#D4DAE2]">
            <div className="border-b border-[#D4DAE2] bg-[#F9FAFB] px-4 py-3">
              <p className="text-lg font-bold text-[#101828]">Contenu du cours</p>
              <p className="text-sm text-[#667085]">{courseTitle}</p>
            </div>

            {previewLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="flex items-center justify-between border-b border-[#E4E7EC] px-4 py-4 last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#EEF2F7]">
                    {iconForLesson}
                  </span>
                  <p className="truncate text-[22px] font-medium text-[#1D2939] sm:text-lg">
                    {lesson.title}
                  </p>
                </div>
                <span className="ml-3 text-sm text-[#667085]">{lesson.durationLabel}</span>
              </div>
            ))}
          </div>

          <div className="mt-6">
            {state.status === "COMPLETED" ? (
              <>
                <button
                  onClick={goToCourse}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#22358B] px-4 py-3 text-xl font-semibold text-white transition-colors hover:bg-[#1D2E77] sm:text-2xl"
                >
                  <Play className="h-5 w-5" />
                  Accéder à mon cours
                </button>
                <p className="mt-3 text-center text-sm text-[#667085]">
                  Redirection automatique dans {redirectCountdown}s...
                </p>
              </>
            ) : state.status === "VERIFYING" ? (
              <>
                <button
                  disabled
                  className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-[#8492C7] px-4 py-3 text-xl font-semibold text-white sm:text-2xl"
                >
                  <Loader2 className="h-5 w-5 animate-spin" />
                  En attente du déblocage...
                </button>
                <p className="mt-3 text-center text-sm text-[#98A2B3]">
                  Vérification automatique toutes les 3 secondes... (poll #
                  {state.attemptCount})
                </p>
              </>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleRetry}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#22358B] px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-[#1D2E77]"
                >
                  <RefreshCw className="h-4 w-4" />
                  Relancer la vérification
                </button>
                <button
                  onClick={() =>
                    state.courseId
                      ? router.push(`/course-details/${state.courseId}`)
                      : router.push("/courses")
                  }
                  className="w-full rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-base font-semibold text-[#344054] transition-colors hover:bg-[#F9FAFB]"
                >
                  Retourner au cours
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CertificationPaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");
  const statusParam = (searchParams.get("status") || "").toLowerCase();
  const paymentStatusParam = (
    searchParams.get("payment_status") || ""
  ).toLowerCase();
  const successParam = (searchParams.get("success") || "").toLowerCase();
  const cancelledParam = (searchParams.get("cancelled") || "").toLowerCase();
  const courseIdParam =
    searchParams.get("courseId") || searchParams.get("course_id");

  const cancelledFromQuery = useMemo(
    () =>
      cancelledParam === "true" ||
      successParam === "false" ||
      statusParam === "cancelled" ||
      statusParam === "canceled" ||
      paymentStatusParam === "cancelled" ||
      paymentStatusParam === "canceled" ||
      statusParam === "failed" ||
      paymentStatusParam === "failed",
    [cancelledParam, paymentStatusParam, statusParam, successParam],
  );

  const [state, setState] = useState<VerificationState>({
    status: cancelledFromQuery ? "CANCELLED" : "VERIFYING",
    attemptCount: 0,
    maxAttempts: MAX_ATTEMPTS,
    courseId: courseIdParam || undefined,
    error: cancelledFromQuery
      ? "Paiement annulé. Aucun débit n'a été effectué."
      : undefined,
  });
  const [courseTitle, setCourseTitle] = useState("Votre cours");
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const [resumePaymentUrl, setResumePaymentUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!state.courseId) return;
    if (resumePaymentUrl) return;
    const storedPaymentUrl = getPendingCertificationPaymentUrl(state.courseId);
    if (storedPaymentUrl) {
      setResumePaymentUrl(storedPaymentUrl);
    }
  }, [resumePaymentUrl, state.courseId]);

  const clearPendingEnrollment = useCallback(() => {
    Cookies.remove("pendingEnrollment");
    Cookies.remove("pendingCourseId");
    Cookies.remove("pendingEnrollmentTime");
    sessionStorage.removeItem("pendingCourseId");
    sessionStorage.removeItem("pendingEnrollment");
    localStorage.removeItem("pendingEnrollment");
  }, []);

  const goToCourse = useCallback(() => {
    if (state.courseId) {
      router.push(`/course-details/${state.courseId}`);
      return;
    }
    router.push("/mes-apprentissages");
  }, [router, state.courseId]);

  const resolveCourseId = useCallback((): string | undefined => {
    return state.courseId || courseIdParam || undefined;
  }, [courseIdParam, state.courseId]);

  const loadCourseTitle = useCallback(async (courseId: string) => {
    try {
      const rawData = await CoursesApi.getCourseDetails(courseId);
      const data = transformCourseDetails(rawData);
      setCourseTitle(data.course.title || "Votre cours");
    } catch (error) {
      logger.error(
        "❌ [PaymentSuccess:Certification] Erreur chargement cours:",
        error,
      );
    }
  }, []);

  const markCompleted = useCallback(
    (payload: { courseId: string; certificateUrl: string }) => {
      clearPendingEnrollment();
      clearPendingCertificationClaim(payload.courseId);
      setCertificateUrl(payload.certificateUrl);
      setState((prev) => ({
        ...prev,
        status: "COMPLETED",
        courseId: payload.courseId,
        error: undefined,
      }));
      try {
        if (typeof window !== "undefined") {
          window.history.replaceState(
            {},
            "",
            `/payment-success?courseId=${encodeURIComponent(payload.courseId)}&paymentType=certification`,
          );
        }
      } catch {
        // Ignore history errors
      }
    },
    [clearPendingEnrollment],
  );

  const runVerificationStep = useCallback(async () => {
    setState((prev) => {
      if (prev.status !== "VERIFYING") return prev;
      return { ...prev, attemptCount: prev.attemptCount + 1 };
    });

    const targetCourseId = resolveCourseId();
    if (!targetCourseId) {
      setState((prev) => ({
        ...prev,
        status: "ERROR",
        error:
          "Impossible de déterminer le cours lié au paiement. Veuillez retourner au cours et réessayer.",
      }));
      return;
    }

    if (targetCourseId && targetCourseId !== state.courseId) {
      setState((prev) => ({ ...prev, courseId: targetCourseId }));
    }

    try {
      let paymentConfirmed =
        successParam === "true" ||
        statusParam === "completed" ||
        statusParam === "success" ||
        paymentStatusParam === "completed" ||
        paymentStatusParam === "success";

      if (token) {
        const verification = await PaymentApi.verifyPayment(token);
        const paymentStatus = normalizeStatus(
          verification?.status ||
            verification?.paymentStatus ||
            verification?.payment_status ||
            verification?.data?.status ||
            verification?.result?.status,
        );

        if (CANCELLED_STATUSES.has(paymentStatus)) {
          clearPendingEnrollment();
          setState((prev) => ({
            ...prev,
            status: "CANCELLED",
            error: "Paiement annulé. Vous pouvez relancer la transaction.",
          }));
          return;
        }

        if (FAILURE_STATUSES.has(paymentStatus)) {
          const rawMessage =
            typeof verification?.message === "string" ? verification.message.trim() : "";
          const errorMessage = rawMessage.length > 0
            ? rawMessage.replace(/du cours/gi, "de la certification")
            : "Le paiement de certification a été refusé. Veuillez réessayer.";
          setState((prev) => ({
            ...prev,
            status: "ERROR",
            error: errorMessage,
          }));
          return;
        }

        if (SUCCESS_STATUSES.has(paymentStatus)) {
          paymentConfirmed = true;
        }
      } else if (cancelledFromQuery) {
        clearPendingEnrollment();
        setState((prev) => ({
          ...prev,
          status: "CANCELLED",
          error: "Paiement annulé. Vous pouvez relancer la transaction.",
        }));
        return;
      }

      if (!paymentConfirmed) {
        return;
      }

      const claim = await QuizApi.claimCertificationCertificate(targetCourseId);
      const issued = Boolean(claim.isIssued && claim.certificateUrl);

      if (issued && claim.certificateUrl) {
        markCompleted({
          courseId: targetCourseId,
          certificateUrl: claim.certificateUrl,
        });
        return;
      }

      if (claim.paymentUrl) {
        setResumePaymentUrl((prev) => prev || claim.paymentUrl);
      }

      const claimPaymentStatus = (claim.paymentStatus || "").toUpperCase();
      if (CANCELLED_STATUSES.has(claimPaymentStatus)) {
        clearPendingEnrollment();
        setState((prev) => ({
          ...prev,
          status: "CANCELLED",
          error: "Paiement annulé. Vous pouvez relancer la transaction.",
        }));
        return;
      }

      if (FAILURE_STATUSES.has(claimPaymentStatus)) {
        setState((prev) => ({
          ...prev,
          status: "ERROR",
          error:
            "Le paiement de certification a échoué. Veuillez réessayer ou reprendre le paiement.",
        }));
      }
    } catch (error) {
      logger.error(
        "❌ [PaymentSuccess:Certification] Erreur pendant la vérification:",
        error,
      );

      const httpStatus = (error as any)?.status;
      if (httpStatus === 401 || httpStatus === 403) {
        setState((prev) => ({
          ...prev,
          status: "ERROR",
          error:
            "Votre session a expiré. Veuillez vous reconnecter puis réessayer.",
        }));
        return;
      }

      if (httpStatus === 404) {
        setState((prev) => ({
          ...prev,
          status: "ERROR",
          error:
            "Cours introuvable. Veuillez vérifier l'identifiant du cours et réessayer.",
        }));
        return;
      }

      if (state.attemptCount >= MAX_ATTEMPTS - 1) {
        setState((prev) => ({
          ...prev,
          status: "ERROR",
          error:
            "Impossible de confirmer la certification. Vérifiez votre connexion.",
        }));
      }
    }
  }, [
    cancelledFromQuery,
    clearPendingEnrollment,
    markCompleted,
    resolveCourseId,
    state.attemptCount,
    state.courseId,
    token,
  ]);

  useEffect(() => {
    const resolved = resolveCourseId();
    if (resolved && resolved !== state.courseId) {
      setState((prev) => ({ ...prev, courseId: resolved }));
    }
  }, [resolveCourseId, state.courseId]);

  useEffect(() => {
    if (state.courseId) {
      void loadCourseTitle(state.courseId);
    }
  }, [loadCourseTitle, state.courseId]);

  useEffect(() => {
    if (!cancelledFromQuery) return;

    clearPendingEnrollment();
    setState((prev) => ({
      ...prev,
      status: "CANCELLED",
      error: "Paiement annulé. Vous pouvez relancer la transaction.",
    }));
  }, [cancelledFromQuery, clearPendingEnrollment]);

  useEffect(() => {
    if (state.status !== "VERIFYING") return;
    if (state.attemptCount >= MAX_ATTEMPTS) {
      setState((prev) => ({ ...prev, status: "TIMEOUT" }));
      return;
    }

    const timeoutId = window.setTimeout(
      () => {
        void runVerificationStep();
      },
      state.attemptCount === 0 ? 0 : POLLING_INTERVAL_MS,
    );

    return () => window.clearTimeout(timeoutId);
  }, [runVerificationStep, state.attemptCount, state.status]);

  const handleRetry = () => {
    setResumePaymentUrl(null);
    setState((prev) => ({
      ...prev,
      status: "VERIFYING",
      attemptCount: 0,
      error: undefined,
    }));
  };

  const handleDownload = () => {
    if (!certificateUrl) return;
    window.open(certificateUrl, "_blank", "noopener,noreferrer");
  };

  const handleResumePayment = () => {
    if (!resumePaymentUrl) return;
    window.location.href = withPaymentType(resumePaymentUrl, "certification");
  };

  return (
    <div className="min-h-screen bg-[#EFEFF2] px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-[560px]">
        <div className="rounded-2xl border border-[#D5DBE3] bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 text-center">
            {state.status === "COMPLETED" ? (
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#2FB56F]">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
            ) : state.status === "VERIFYING" ? (
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#EEF0F4]">
                <Loader2 className="h-10 w-10 animate-spin text-[#243B95]" />
              </div>
            ) : (
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#FFEDED]">
                <AlertCircle className="h-10 w-10 text-[#E34D4D]" />
              </div>
            )}

            <h1 className="text-3xl font-extrabold text-[#101828]">
              {state.status === "COMPLETED"
                ? "Votre certificat est prêt !"
                : state.status === "VERIFYING"
                  ? "Préparation du certificat..."
                  : state.status === "CANCELLED"
                    ? "Paiement annulé"
                    : state.status === "TIMEOUT"
                      ? "Génération en attente"
                      : "Vérification échouée"}
            </h1>

            <p className="mx-auto mt-3 max-w-md text-[17px] leading-7 text-[#667085]">
              {state.status === "COMPLETED"
                ? `Certification confirmée pour "${courseTitle}". Vous pouvez télécharger votre certificat.`
                : state.status === "VERIFYING"
                  ? "Veuillez patienter pendant que nous confirmons votre paiement et générons votre certificat..."
                  : state.status === "CANCELLED"
                    ? "Vous avez interrompu le paiement. Aucun montant n'a été débité."
                    : state.status === "TIMEOUT"
                      ? "La génération prend plus de temps que prévu. Vous pouvez relancer la vérification."
                      : state.error ||
                        "Une erreur est survenue pendant la vérification de votre certification."}
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {state.status === "COMPLETED" ? (
              <>
                <button
                  onClick={handleDownload}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#22358B] px-4 py-3 text-xl font-semibold text-white transition-colors hover:bg-[#1D2E77] sm:text-2xl"
                >
                  <Download className="h-5 w-5" />
                  Télécharger ma certification
                </button>
                <button
                  onClick={goToCourse}
                  className="w-full rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-base font-semibold text-[#344054] transition-colors hover:bg-[#F9FAFB]"
                >
                  Voir le cours
                </button>
              </>
            ) : state.status === "VERIFYING" ? (
              <button
                disabled
                className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-[#8492C7] px-4 py-3 text-xl font-semibold text-white sm:text-2xl"
              >
                <Loader2 className="h-5 w-5 animate-spin" />
                En attente du certificat...
              </button>
            ) : (
              <>
                <button
                  onClick={handleRetry}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#22358B] px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-[#1D2E77]"
                >
                  <RefreshCw className="h-4 w-4" />
                  Relancer la vérification
                </button>
                {resumePaymentUrl ? (
                  <button
                    onClick={handleResumePayment}
                    className="w-full rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-base font-semibold text-[#344054] transition-colors hover:bg-[#F9FAFB]"
                  >
                    Reprendre le paiement
                  </button>
                ) : null}
                <button
                  onClick={goToCourse}
                  className="w-full rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-base font-semibold text-[#344054] transition-colors hover:bg-[#F9FAFB]"
                >
                  Retourner au cours
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const paymentType = normalizePaymentType(searchParams.get("paymentType"));

  return paymentType === "certification" ? (
    <CertificationPaymentSuccessPage />
  ) : (
    <CoursePaymentSuccessPage />
  );
}
