"use client";

import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  CheckCircle,
  Clock,
  Award,
  ArrowLeft,
  Check,
  Download,
  GraduationCap,
  RefreshCcw,
} from "lucide-react";
import Swal from "sweetalert2";
import { QuizApi } from "@/infrastructure/api/quiz-api";
import logger from "@/shared/helpers/logger";

interface QuizData {
  quiz: {
    id: string;
    title: string;
    description?: string;
    passingScore: number;
    dueDate?: string;
    deadline?: string;
    endDate?: string;
    expiresAt?: string;
    availableUntil?: string;
  };
  questions: Array<{
    id: string;
    question: string;
    type: string;
    options?: string[];
    points: number;
  }>;
}

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizId: string | null;
  lessonId: string;
  onQuizCompleted: (passed: boolean, score: number) => void;
  variant?: "modal" | "inline" | "page";
  mode?: "module" | "certification";
  courseId?: string;
}

const PENDING_CERTIFICATE_CLAIM_TTL_MS = 24 * 60 * 60 * 1000;
const QUIZ_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

const pendingCertificateClaimKey = (courseId: string) =>
  `pendingCertificationClaim:${courseId}`;

type PendingCertificateClaimData = {
  timestamp: number;
  paymentUrl: string | null;
};

const parsePendingCertificateClaimData = (
  stored: string,
): PendingCertificateClaimData | null => {
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

const withPaymentType = (url: string, paymentType: "course" | "certification"): string => {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("paymentType", paymentType);
    return parsed.toString();
  } catch {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}paymentType=${paymentType}`;
  }
};

const markPendingCertificateClaim = (courseId: string, paymentUrl?: string | null) => {
  if (typeof window === "undefined") return;
  const normalizedPaymentUrl =
    typeof paymentUrl === "string" && paymentUrl.trim().length > 0
      ? paymentUrl.trim()
      : null;
  window.localStorage.setItem(
    pendingCertificateClaimKey(courseId),
    JSON.stringify({
      timestamp: Date.now(),
      paymentUrl: normalizedPaymentUrl,
    } satisfies PendingCertificateClaimData),
  );
};

const clearPendingCertificateClaim = (courseId: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(pendingCertificateClaimKey(courseId));
};

const hasPendingCertificateClaim = (courseId: string): boolean => {
  if (typeof window === "undefined") return false;
  const stored = window.localStorage.getItem(pendingCertificateClaimKey(courseId));
  if (!stored) return false;

  const data = parsePendingCertificateClaimData(stored);
  if (!data) {
    clearPendingCertificateClaim(courseId);
    return false;
  }

  if (Date.now() - data.timestamp > PENDING_CERTIFICATE_CLAIM_TTL_MS) {
    clearPendingCertificateClaim(courseId);
    return false;
  }

  return true;
};

const readBooleanCandidate = (...values: unknown[]): boolean | null => {
  for (const value of values) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") {
      if (value === 1) return true;
      if (value === 0) return false;
    }
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "1", "yes", "oui"].includes(normalized)) return true;
      if (["false", "0", "no", "non"].includes(normalized)) return false;
    }
  }
  return null;
};

type StoredQuizSession = {
  timestamp: number;
  currentQuestionIndex: number;
  answers: Record<string, number>;
  showResults: boolean;
  quizResult: {
    score: number;
    passed: boolean;
    correctAnswers?: number;
    totalQuestions?: number;
    eligibleForCertificate?: boolean;
    isPaidEnrollment?: boolean;
    isCourseFree?: boolean;
  } | null;
  startTime: number | null;
  timeLeft: number | null;
};

const quizSessionStorageKey = ({
  mode,
  courseId,
  quizId,
}: {
  mode: "module" | "certification";
  courseId?: string;
  quizId: string | null;
}): string | null => {
  if (mode === "certification") {
    return courseId ? `quizSession:certification:${courseId}` : null;
  }
  if (!quizId) return null;
  return `quizSession:module:${courseId ?? "unknown"}:${quizId}`;
};

const parseStoredQuizSession = (raw: string): StoredQuizSession | null => {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return null;
    const record = parsed as Record<string, unknown>;

    const timestamp = Number(record.timestamp);
    if (!Number.isFinite(timestamp)) return null;

    const currentQuestionIndex = Number(record.currentQuestionIndex);
    if (!Number.isFinite(currentQuestionIndex)) return null;

    const answersRecord =
      typeof record.answers === "object" && record.answers !== null
        ? (record.answers as Record<string, unknown>)
        : {};
    const answers: Record<string, number> = {};
    Object.entries(answersRecord).forEach(([key, value]) => {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) {
        answers[key] = numeric;
      }
    });

    const showResults = Boolean(record.showResults);

    const quizResult =
      typeof record.quizResult === "object" && record.quizResult !== null
        ? (record.quizResult as Record<string, unknown>)
        : null;

    const normalizedQuizResult =
      quizResult &&
      typeof quizResult.score === "number" &&
      Number.isFinite(quizResult.score) &&
      typeof quizResult.passed === "boolean"
        ? ({
            score: quizResult.score,
            passed: quizResult.passed,
            correctAnswers:
              typeof quizResult.correctAnswers === "number" &&
              Number.isFinite(quizResult.correctAnswers)
                ? quizResult.correctAnswers
                : undefined,
            totalQuestions:
              typeof quizResult.totalQuestions === "number" &&
              Number.isFinite(quizResult.totalQuestions)
                ? quizResult.totalQuestions
                : undefined,
            eligibleForCertificate:
              typeof quizResult.eligibleForCertificate === "boolean"
                ? quizResult.eligibleForCertificate
                : undefined,
            isPaidEnrollment:
              typeof quizResult.isPaidEnrollment === "boolean"
                ? quizResult.isPaidEnrollment
                : undefined,
            isCourseFree:
              typeof quizResult.isCourseFree === "boolean"
                ? quizResult.isCourseFree
                : undefined,
          } satisfies NonNullable<StoredQuizSession["quizResult"]>)
        : null;

    const startTime =
      record.startTime === null || record.startTime === undefined
        ? null
        : Number(record.startTime);
    const normalizedStartTime = Number.isFinite(startTime) ? startTime : null;

    const timeLeft =
      record.timeLeft === null || record.timeLeft === undefined
        ? null
        : Number(record.timeLeft);
    const normalizedTimeLeft = Number.isFinite(timeLeft) ? timeLeft : null;

    return {
      timestamp,
      currentQuestionIndex,
      answers,
      showResults,
      quizResult: normalizedQuizResult,
      startTime: normalizedStartTime,
      timeLeft: normalizedTimeLeft,
    };
  } catch {
    return null;
  }
};

export function QuizModal({
  isOpen,
  onClose,
  quizId,
  lessonId,
  onQuizCompleted,
  variant = "modal",
  mode = "module",
  courseId,
}: QuizModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageHydrated, setStorageHydrated] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    passed: boolean;
    correctAnswers?: number;
    totalQuestions?: number;
    eligibleForCertificate?: boolean;
    isPaidEnrollment?: boolean;
    isCourseFree?: boolean;
  } | null>(null);
  const [resultVisible, setResultVisible] = useState(false);
  const storageKey = quizSessionStorageKey({ mode, courseId, quizId });

  useEffect(() => {
    if (
      isOpen &&
      ((mode === "module" && quizId) || (mode === "certification" && courseId))
    ) {
      fetchQuizData();
    } else if (!isOpen) {
      setQuizData(null);
      setError(null);
      setLoading(false);
      setStorageHydrated(false);
    }
  }, [isOpen, quizId, mode, courseId]);

  const fetchQuizData = async () => {
    if (mode === "certification" && !courseId) {
      setError("Cours introuvable pour le quiz de certification.");
      return;
    }

    if (mode === "module" && !quizId) return;

    setLoading(true);
    setStorageHydrated(false);
    setError(null);
    try {
      const data =
        mode === "certification"
          ? await QuizApi.getCertificationQuiz(courseId as string)
          : await QuizApi.getQuizQuestions(quizId as string);
      setQuizData(data);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setShowResults(false);
      setIsSubmitting(false);
      setStartTime(new Date());
      setTimeLeft(null);
      setQuizResult(null);
    } catch (error) {
      logger.error("Erreur lors du chargement du quiz:", error);
      setError(
        mode === "certification"
          ? "Aucun quiz de certification disponible pour ce cours."
          : "Aucun quiz disponible pour ce module.",
      );
    } finally {
      setLoading(false);
    }
  };

  const clearStoredSession = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!storageKey) return;
    window.sessionStorage.removeItem(storageKey);
  }, [storageKey]);

  const handleClose = useCallback(() => {
    clearStoredSession();
    setStorageHydrated(false);
    onClose();
  }, [clearStoredSession, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    if (!quizData) return;
    if (typeof window === "undefined") return;

    if (!storageKey) {
      setStorageHydrated(true);
      return;
    }

    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) {
      setStorageHydrated(true);
      return;
    }

    const parsed = parseStoredQuizSession(raw);
    if (!parsed) {
      window.sessionStorage.removeItem(storageKey);
      setStorageHydrated(true);
      return;
    }

    if (Date.now() - parsed.timestamp > QUIZ_SESSION_TTL_MS) {
      window.sessionStorage.removeItem(storageKey);
      setStorageHydrated(true);
      return;
    }

    const questionIds = new Set(quizData.questions.map((q) => q.id));
    const restoredAnswers: Record<string, number> = {};
    Object.entries(parsed.answers).forEach(([questionId, value]) => {
      if (!questionIds.has(questionId)) return;
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return;
      restoredAnswers[questionId] = numeric;
    });

    const maxIndex = Math.max(0, quizData.questions.length - 1);
    const nextIndex = Math.min(maxIndex, Math.max(0, parsed.currentQuestionIndex));

    setCurrentQuestionIndex(nextIndex);
    setAnswers(restoredAnswers);
    setShowResults(parsed.showResults);
    setQuizResult(parsed.quizResult);
    setStartTime(parsed.startTime ? new Date(parsed.startTime) : new Date());
    setTimeLeft(parsed.timeLeft);
    setStorageHydrated(true);
  }, [isOpen, quizData, storageKey]);

  useEffect(() => {
    if (!isOpen) return;
    if (!quizData) return;
    if (!storageHydrated) return;
    if (typeof window === "undefined") return;
    if (!storageKey) return;

    const payload: StoredQuizSession = {
      timestamp: Date.now(),
      currentQuestionIndex,
      answers,
      showResults,
      quizResult,
      startTime: startTime ? startTime.getTime() : null,
      timeLeft,
    };

    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (error) {
      logger.warn("Impossible de persister la session du quiz:", error);
    }
  }, [
    answers,
    currentQuestionIndex,
    isOpen,
    quizData,
    quizResult,
    showResults,
    startTime,
    storageHydrated,
    storageKey,
    timeLeft,
  ]);

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleSubmitQuiz();
    }
  }, [timeLeft]);

  useEffect(() => {
    if (!showResults) {
      setResultVisible(false);
      return;
    }

    setResultVisible(false);
    let timeoutId: number | undefined;
    const frameId = window.requestAnimationFrame(() => {
      timeoutId = window.setTimeout(() => {
        setResultVisible(true);
      }, 50);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [showResults, quizResult]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const parseDateCandidate = (value: unknown): Date | null => {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    if (typeof value === "string" || typeof value === "number") {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return null;
  };

  const getQuizDeadlineLabel = (quiz: QuizData["quiz"]): string | null => {
    const quizRecord = quiz as QuizData["quiz"] & Record<string, unknown>;
    const candidate =
      parseDateCandidate(quiz.dueDate) ||
      parseDateCandidate(quiz.deadline) ||
      parseDateCandidate(quiz.endDate) ||
      parseDateCandidate(quiz.expiresAt) ||
      parseDateCandidate(quiz.availableUntil) ||
      parseDateCandidate(quizRecord.deadlineAt) ||
      parseDateCandidate(quizRecord.due_at) ||
      parseDateCandidate(quizRecord.deadline_at);

    if (!candidate) return null;

    return candidate.toLocaleString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  const handleAnswerChange = (questionId: string, answer: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < (quizData?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quizData) return;
    if (mode === "certification" && !courseId) return;

    setIsSubmitting(true);
    try {
      const formattedAnswers: Record<string, string> = {};
      quizData.questions.forEach((question) => {
        const selectedIndex = answers[question.id];
        if (selectedIndex === undefined) return;

        let options = question.options;
        if ((!options || options.length === 0) && question.type === "TRUE_FALSE") {
          options = ["Vrai", "Faux"];
        }

        if (options && typeof selectedIndex === "number") {
          const selectedText = options[selectedIndex];
          if (typeof selectedText === "string") {
            formattedAnswers[question.id] = selectedText;
            return;
          }
        }

        formattedAnswers[question.id] = String(selectedIndex);
      });

      const result =
        mode === "certification"
          ? await QuizApi.submitCertificationAttempt(
              courseId as string,
              formattedAnswers,
            )
          : await QuizApi.submitQuiz(quizData.quiz.id, formattedAnswers);

      const rawResult = result as Record<string, unknown>;
      const normalizedScore =
        typeof result.score === "number" && Number.isFinite(result.score)
          ? result.score
          : typeof rawResult.percentage === "number" &&
              Number.isFinite(rawResult.percentage)
            ? (rawResult.percentage as number)
            : result.passed
              ? 100
              : 0;
      const normalizedTotalQuestions =
        typeof rawResult.totalQuestions === "number" &&
        Number.isFinite(rawResult.totalQuestions)
          ? (rawResult.totalQuestions as number)
          : typeof rawResult.total_questions === "number" &&
              Number.isFinite(rawResult.total_questions)
            ? (rawResult.total_questions as number)
            : quizData.questions.length;
      const fallbackCorrectAnswers = Math.round(
        (normalizedScore / 100) * normalizedTotalQuestions,
      );
      const rawCorrectAnswers =
        typeof rawResult.correctAnswers === "number" &&
        Number.isFinite(rawResult.correctAnswers)
          ? (rawResult.correctAnswers as number)
          : typeof rawResult.correct_answers === "number" &&
              Number.isFinite(rawResult.correct_answers)
            ? (rawResult.correct_answers as number)
            : fallbackCorrectAnswers;
      const normalizedCorrectAnswers = Math.max(
        0,
        Math.min(normalizedTotalQuestions, Math.round(rawCorrectAnswers)),
      );
      const isPaidEnrollment = readBooleanCandidate(
        rawResult.isPaidEnrollment,
        rawResult.is_paid_enrollment,
      );
      const isCourseFree = readBooleanCandidate(
        rawResult.isCourseFree,
        rawResult.is_course_free,
      );

      setQuizResult({
        score: normalizedScore,
        passed: result.passed,
        correctAnswers: normalizedCorrectAnswers,
        totalQuestions: normalizedTotalQuestions,
        eligibleForCertificate:
          mode === "certification" ? result.passed : undefined,
        isPaidEnrollment:
          mode === "certification" ? (isPaidEnrollment ?? undefined) : undefined,
        isCourseFree: mode === "certification" ? (isCourseFree ?? undefined) : undefined,
      });

      if (result.passed && mode !== "certification") {
        await Swal.fire({
          title: "🎉 Bravo !",
          text: `Quiz réussi avec ${Math.round(normalizedScore)}%`,
          icon: "success",
          confirmButtonText: "Fermer",
          confirmButtonColor: "#6366f1",
          showConfirmButton: true,
          allowOutsideClick: true,
          allowEscapeKey: true,
        });
      }

      if (!result.passed && mode !== "certification") {
        const roundedScore = Math.round(normalizedScore);

        await Swal.fire({
          title: "❌ Quiz échoué",
          text: `Score obtenu : ${roundedScore}%`,
          icon: "error",
          confirmButtonText: "Fermer",
          confirmButtonColor: "#6366f1",
          showConfirmButton: true,
          allowOutsideClick: true,
          allowEscapeKey: true,
        });
      }

      setShowResults(true);
      onQuizCompleted(result.passed, normalizedScore);
    } catch (error) {
      logger.error("Error submitting quiz:", error);
      await Swal.fire({
        title: "Erreur",
        text: "Une erreur est survenue lors de la soumission du quiz",
        icon: "error",
        confirmButtonText: "Fermer",
        confirmButtonColor: "#6366f1",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestart = () => {
    clearStoredSession();
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowResults(false);
    setIsSubmitting(false);
    setQuizResult(null);
    setStartTime(new Date());
    setTimeLeft(null);
  };

  const currentQuestion = quizData?.questions[currentQuestionIndex];
  const isLastQuestion =
    currentQuestionIndex === (quizData?.questions.length || 0) - 1;
  const allQuestionsAnswered = quizData?.questions.every(
    (q) => answers[q.id] !== undefined,
  );
  const isInline = variant === "inline";
  const isPage = variant === "page";

  if (!isOpen) return null;

  if (error) {
    const errorContent = (
      <div
        className={`bg-white overflow-hidden ${
          isInline || isPage
            ? "w-full rounded-xl border border-[#D1D7DC] shadow-sm"
            : "w-full max-w-md mx-4 rounded-2xl shadow-2xl"
        }`}
      >
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Erreur de chargement
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    );

    if (isInline || isPage) {
      return errorContent;
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        {errorContent}
      </div>
    );
  }

  if (!quizData) return null;

  const pageTitlePrefix = mode === "certification" ? "Certification" : "Quiz noté";
  const pageSubtitle =
    mode === "certification" ? "Certification • 30 min" : "Devoir noté • 30 min";
  const deadlineLabel = getQuizDeadlineLabel(quizData.quiz);

  const quizContent = (
    <div
      className={`bg-white overflow-hidden flex flex-col ${
        isInline || isPage
          ? "w-full rounded-xl border border-[#D1D7DC] shadow-sm"
          : "w-full max-w-sm sm:max-w-md lg:max-w-3xl mx-auto rounded-2xl shadow-2xl max-h-[95vh]"
      }`}
    >
      {/* Header */}
      {isPage ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D1D7DC] bg-[#F5F5F5] px-4 py-3">
          <div className="flex items-start gap-3">
            <button
              onClick={handleClose}
              className="inline-flex items-center gap-2 rounded border border-[#D1D7DC] bg-white px-3 py-2 text-sm font-semibold text-[#0056D2] hover:bg-[#F7F9FA]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour</span>
            </button>
            <div>
              <h2 className="text-base font-semibold text-[#1F2937] sm:text-lg">
                {pageTitlePrefix} : {quizData.quiz.title}
              </h2>
              <p className="text-xs text-[#6B7280]">{pageSubtitle}</p>
            </div>
          </div>
          {deadlineLabel && (
            <div className="flex items-center gap-2 text-sm text-[#374151]">
              <Clock className="h-4 w-4" />
              <span>Date {deadlineLabel}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-start justify-between border-b border-gray-100 p-4 sm:p-6">
          <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 sm:h-12 sm:w-12">
              <Award className="h-5 w-5 text-blue-600 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight">
                Quiz - {quizData.quiz.title}
              </h2>
              {quizData.quiz.description && (
                <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">
                  {quizData.quiz.description}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="ml-2 flex-shrink-0 rounded-full p-1.5 transition-colors hover:bg-gray-100 sm:p-1"
          >
            <X className="h-4 w-4 text-gray-500 sm:h-5 sm:w-5" />
          </button>
        </div>
      )}

      {/* Content */}
      <div className={`${isInline ? "" : "flex-1"} overflow-y-auto`}>
        <div
          className={`${isPage ? "mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8" : "p-4 sm:p-6 lg:p-8"}`}
        >
            {showResults ? (
              quizResult ? (
                <div
                  className={`transform-gpu transition-all duration-[10000ms] ease-out ${
                    resultVisible
                      ? "translate-y-0 scale-100 opacity-100"
                      : "translate-y-3 scale-[0.985] opacity-0"
                  }`}
                >
                  <QuizResults
                    quizData={quizData}
                    onClose={handleClose}
                    quizResult={quizResult}
                    onRestart={handleRestart}
                    mode={mode}
                    courseId={courseId}
                    variant={isPage ? "page" : "modal"}
                  />
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="mt-4 text-sm sm:text-base text-gray-600">
                    Chargement des résultats...
                  </p>
                </div>
              )
            ) : (
              <>
                {/* Progress Bar */}
                <div className="mb-6 sm:mb-8">
                  <div className="flex items-center justify-between text-xs sm:text-sm mb-3">
                    <span className="text-gray-600">
                      Question {currentQuestionIndex + 1} sur{" "}
                      {quizData.questions.length}
                    </span>
                    <span className="text-blue-600 font-medium">
                      {Math.round(
                        ((currentQuestionIndex + 1) /
                          quizData.questions.length) *
                          100,
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${((currentQuestionIndex + 1) / quizData.questions.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Question */}
                {currentQuestion && (
                  <QuestionCard
                    question={currentQuestion}
                    answer={
                      answers[currentQuestion.id] !== undefined
                        ? answers[currentQuestion.id]
                        : -1
                    }
                    onAnswerChange={(answer) =>
                      handleAnswerChange(currentQuestion.id, answer)
                    }
                    variant={isPage ? "page" : "modal"}
                  />
                )}
              </>
            )}
        </div>
      </div>

      {/* Footer */}
      {!showResults && (
        <div className="border-t border-gray-100 bg-white">
          {/* Progress counter - Mobile */}
          <div className="px-4 py-2 sm:hidden">
            <div className="text-xs text-gray-500 text-center">
              {Object.keys(answers).length} / {quizData.questions.length}{" "}
              répondues
            </div>
          </div>

          {/* Footer buttons */}
          <div
            className={`flex items-center justify-between px-4 py-4 sm:px-6 sm:py-6 ${
              isPage ? "mx-auto w-full max-w-4xl lg:px-8" : ""
            }`}
          >
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base ${
                isPage ? "rounded border border-[#D1D7DC] bg-white hover:bg-[#F7F9FA]" : ""
              }`}
            >
              ← Précédent
            </button>

              {/* Progress counter - Desktop */}
              <div className="hidden sm:block text-xs sm:text-sm text-gray-500">
                {Object.keys(answers).length} / {quizData.questions.length}{" "}
                répondues
              </div>

              {isLastQuestion ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={!allQuestionsAnswered || isSubmitting}
                  className={`px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base ${
                    isPage ? "min-w-[140px] justify-center" : ""
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="hidden sm:inline">Soumission...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Voir résultats</span>
                      <span className="sm:hidden">Résultats</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className={`px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-sm sm:text-base ${
                    isPage ? "min-w-[140px]" : ""
                  }`}
                >
                  <span className="hidden sm:inline">Suivant</span>
                  <span className="sm:hidden">→</span>
                </button>
              )}
            </div>
          </div>
        )}
    </div>
  );

  if (isInline || isPage) {
    return quizContent;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
      {quizContent}
    </div>
  );
}

function QuestionCard({
  question,
  answer,
  onAnswerChange,
  variant = "modal",
}: {
  question: {
    id: string;
    question: string;
    type: string;
    options?: string[];
    points: number;
  };
  answer: number;
  onAnswerChange: (answer: number) => void;
  variant?: "modal" | "page";
}) {
  const isPage = variant === "page";

  return (
    <div className="space-y-4 sm:space-y-6">
      <h3
        className={`font-semibold text-gray-900 leading-relaxed ${
          isPage ? "text-lg sm:text-xl" : "text-base sm:text-lg lg:text-xl"
        }`}
      >
        {question.question}
      </h3>

      {question.type === "MULTIPLE_CHOICE" && question.options && (
        <div className={isPage ? "space-y-3" : "space-y-2 sm:space-y-3"}>
          {question.options.map((option: string, index: number) => {
            const isSelected = answer === index;
            return (
              <label
                key={index}
                htmlFor={`option-${question.id}-${index}`}
                className={`flex items-center gap-3 cursor-pointer transition-all group ${
                  isPage
                    ? `rounded-xl border-2 px-3 py-3 sm:px-4 sm:py-4 ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30"
                      }`
                    : `p-3 sm:p-4 border-2 rounded-xl ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30"
                      }`
                }`}
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center flex-shrink-0 rounded-full border-2 text-xs font-medium transition-colors ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-gray-300 bg-white text-gray-500 group-hover:border-emerald-400"
                  }`}
                >
                  {isPage ? (
                    isSelected ? <Check className="h-3.5 w-3.5" /> : null
                  ) : (
                    String.fromCharCode(65 + index)
                  )}
                </div>
                <input
                  type="radio"
                  id={`option-${question.id}-${index}`}
                  name={`question-${question.id}`}
                  value={index}
                  checked={isSelected}
                  onChange={() => onAnswerChange(index)}
                  className="sr-only"
                />
                <span
                  className={`flex-1 leading-relaxed ${
                    isSelected ? "text-emerald-900 font-semibold" : "text-gray-800"
                  } ${isPage ? "text-[15px]" : "text-sm sm:text-base"}`}
                >
                  {option}
                </span>
                {!isPage && isSelected && (
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
                )}
              </label>
            );
          })}
        </div>
      )}

      {question.type === "TRUE_FALSE" && (
        <div className={isPage ? "space-y-3" : "space-y-2 sm:space-y-3"}>
          {["Vrai", "Faux"].map((option, index) => {
            const isSelected = answer === index;
            return (
              <label
                key={option}
                htmlFor={`option-${question.id}-${index}`}
                className={`flex items-center gap-3 cursor-pointer transition-all group ${
                  isPage
                    ? `rounded-xl border-2 px-3 py-3 sm:px-4 sm:py-4 ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30"
                      }`
                    : `p-3 sm:p-4 border-2 rounded-xl ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30"
                      }`
                }`}
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center flex-shrink-0 rounded-full border-2 text-xs font-medium transition-colors ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-gray-300 bg-white text-gray-500 group-hover:border-emerald-400"
                  }`}
                >
                  {isPage ? (
                    isSelected ? <Check className="h-3.5 w-3.5" /> : null
                  ) : (
                    String.fromCharCode(65 + index)
                  )}
                </div>
                <input
                  type="radio"
                  id={`option-${question.id}-${index}`}
                  name={`question-${question.id}`}
                  value={index}
                  checked={isSelected}
                  onChange={() => onAnswerChange(index)}
                  className="sr-only"
                />
                <span
                  className={`flex-1 ${
                    isSelected ? "text-emerald-900 font-semibold" : "text-gray-800"
                  } ${isPage ? "text-[15px]" : "text-sm sm:text-base"}`}
                >
                  {option}
                </span>
                {!isPage && isSelected && (
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
                )}
              </label>
            );
          })}
        </div>
      )}

      {question.type === "SHORT_ANSWER" && (
        <textarea
          value={answer}
          onChange={(e) => onAnswerChange(Number(e.target.value))}
          placeholder="Votre réponse..."
          className="w-full p-3 sm:p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
          rows={4}
        />
      )}
    </div>
  );
}

function QuizResults({
  quizData,
  onClose,
  quizResult,
  onRestart,
  mode,
  courseId,
  variant = "modal",
}: {
  quizData: QuizData;
  onClose: () => void;
  quizResult: {
    score: number;
    passed: boolean;
    correctAnswers?: number;
    totalQuestions?: number;
    eligibleForCertificate?: boolean;
    isPaidEnrollment?: boolean;
    isCourseFree?: boolean;
  } | null;
  onRestart: () => void;
  mode?: "module" | "certification";
  courseId?: string;
  variant?: "modal" | "page";
}) {
  const [isClaimingCertificate, setIsClaimingCertificate] = useState(false);
  const [isPollingClaim, setIsPollingClaim] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimState, setClaimState] = useState<{
    isIssued: boolean;
    certificateUrl: string | null;
    paymentRequired: boolean;
    paymentStatus: string | null;
    paymentUrl: string | null;
    checked: boolean;
  }>({
    isIssued: false,
    certificateUrl: null,
    paymentRequired: false,
    paymentStatus: null,
    paymentUrl: null,
    checked: false,
  });
  const autoClaimStartedRef = useRef(false);
  const percentage = Math.round(quizResult?.score || 0);
  const passed = quizResult?.passed || false;
  const isPage = variant === "page";
  const isCertificationMode = mode === "certification";
  const totalQuestionsCount = Math.max(
    1,
    quizResult?.totalQuestions ?? quizData.questions.length,
  );
  const fallbackCorrectAnswersCount = Math.round(
    (percentage / 100) * totalQuestionsCount,
  );
  const correctAnswersCount = Math.max(
    0,
    Math.min(
      totalQuestionsCount,
      quizResult?.correctAnswers ?? fallbackCorrectAnswersCount,
    ),
  );
  const correctAnswersLabel =
    correctAnswersCount <= 1 ? "bonne réponse" : "bonnes réponses";
  const totalQuestionsLabel =
    totalQuestionsCount <= 1 ? "question" : "questions";
  const showCertificationFailure = isCertificationMode && !passed;
  const showCertificationClaimAction = isCertificationMode && passed;

  const handleClaimCertificate = async (redirectOnPayment = true) => {
    if (!courseId) {
      await Swal.fire({
        title: "Cours introuvable",
        text: "Impossible de récupérer le certificat sans identifiant de cours.",
        icon: "error",
        confirmButtonText: "Fermer",
        confirmButtonColor: "#6366f1",
      });
      return;
    }

    setIsClaimingCertificate(true);
    setClaimError(null);
    try {
      const claim = await QuizApi.claimCertificationCertificate(courseId);
      const issued = Boolean(claim.isIssued && claim.certificateUrl);
      const paymentStatus = claim.paymentStatus
        ? claim.paymentStatus.toUpperCase()
        : null;

      setClaimState({
        isIssued: issued,
        certificateUrl: claim.certificateUrl,
        paymentRequired: claim.paymentRequired,
        paymentStatus,
        paymentUrl: claim.paymentUrl,
        checked: true,
      });

      if (issued && claim.certificateUrl) {
        clearPendingCertificateClaim(courseId);
        return;
      }

      if (claim.paymentRequired) {
        markPendingCertificateClaim(courseId, claim.paymentUrl);
        if (redirectOnPayment && paymentStatus === "PENDING" && claim.paymentUrl) {
          window.location.href = withPaymentType(
            claim.paymentUrl,
            "certification",
          );
        }
        return;
      }

      clearPendingCertificateClaim(courseId);
    } catch (error) {
      logger.error("Erreur lors du claim du certificat:", error);
      setClaimError("Impossible de récupérer le statut du certificat.");
      await Swal.fire({
        title: "Erreur",
        text: "Une erreur est survenue lors de la récupération du certificat.",
        icon: "error",
        confirmButtonText: "Fermer",
        confirmButtonColor: "#6366f1",
      });
    } finally {
      setIsClaimingCertificate(false);
    }
  };

  const handleDownloadCertificate = () => {
    if (!claimState.certificateUrl) return;
    window.open(claimState.certificateUrl, "_blank", "noopener,noreferrer");
  };

  const handleResumePayment = () => {
    if (!claimState.paymentUrl) return;
    window.location.href = withPaymentType(
      claimState.paymentUrl,
      "certification",
    );
  };

  useEffect(() => {
    setClaimState({
      isIssued: false,
      certificateUrl: null,
      paymentRequired: false,
      paymentStatus: null,
      paymentUrl: null,
      checked: false,
    });
    setClaimError(null);
    setIsClaimingCertificate(false);
    setIsPollingClaim(false);
    autoClaimStartedRef.current = false;
  }, [courseId, quizResult?.passed]);

  useEffect(() => {
    if (!showCertificationClaimAction || !courseId) return;
    if (claimState.isIssued) return;
    if (!hasPendingCertificateClaim(courseId)) return;
    if (autoClaimStartedRef.current) return;

    autoClaimStartedRef.current = true;
    let cancelled = false;

    const pollClaimStatus = async () => {
      setIsPollingClaim(true);
      try {
        for (let attempt = 1; attempt <= 10; attempt++) {
          if (cancelled) return;
          const claim = await QuizApi.claimCertificationCertificate(courseId);
          const issued = Boolean(claim.isIssued && claim.certificateUrl);
          const paymentStatus = claim.paymentStatus
            ? claim.paymentStatus.toUpperCase()
            : null;

          if (cancelled) return;

          setClaimState({
            isIssued: issued,
            certificateUrl: claim.certificateUrl,
            paymentRequired: claim.paymentRequired,
            paymentStatus,
            paymentUrl: claim.paymentUrl,
            checked: true,
          });

          if (issued && claim.certificateUrl) {
            clearPendingCertificateClaim(courseId);
            return;
          }

          if (!claim.paymentRequired) {
            clearPendingCertificateClaim(courseId);
            return;
          }

          await new Promise((resolve) => window.setTimeout(resolve, 2000));
        }

        if (!cancelled) {
          setClaimError(
            "Paiement en cours de confirmation. Réessayez dans quelques instants.",
          );
        }
      } catch (error) {
        if (!cancelled) {
          logger.error("Erreur lors du polling du certificat:", error);
          setClaimError(
            "Impossible de confirmer le certificat pour le moment. Réessayez.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsPollingClaim(false);
        }
      }
    };

    void pollClaimStatus();

    return () => {
      cancelled = true;
    };
  }, [showCertificationClaimAction, courseId, claimState.isIssued]);

  const certificationPanel = isCertificationMode ? (
    showCertificationFailure ? (
      <div className="mx-auto mb-8 w-full max-w-xl rounded-xl border border-red-200 bg-red-50 p-6 text-left sm:text-center">
        <p className="text-lg font-semibold text-red-700">
          Certification non réussie
        </p>
      </div>
    ) : showCertificationClaimAction ? (
      <div className="mx-auto mb-8 w-full max-w-xl rounded-xl border border-dashed border-[#E9C46A] bg-[#FFFBED] p-6 text-left sm:text-center">
        <p className="flex items-center justify-start gap-2 text-xl font-semibold text-[#111827] sm:justify-center">
          <GraduationCap className="h-5 w-5 text-[#111827]" />
          {claimState.isIssued
            ? "Votre certificat est prêt"
            : "Certification réussie"}
        </p>

        {!claimState.isIssued && (
          <p className="mt-2 text-sm text-[#667085]">
            {isPollingClaim
              ? "Vérification du paiement en cours..."
              : claimState.paymentRequired
                ? "Paiement requis pour finaliser l'émission du certificat."
                : "Cliquez sur \"Récupérer mon certificat\"."}
          </p>
        )}

        {claimState.isIssued && claimState.certificateUrl ? (
          <button
            type="button"
            onClick={handleDownloadCertificate}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#D7A928] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#C09117]"
          >
            <Download className="h-4 w-4" />
            Télécharger certificat
          </button>
        ) : (
          <div className="mt-5 flex flex-wrap items-center gap-3 sm:justify-center">
            <button
              type="button"
              onClick={() => {
                void handleClaimCertificate(true);
              }}
              disabled={isClaimingCertificate || isPollingClaim}
              className="inline-flex items-center gap-2 rounded-lg bg-[#D7A928] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#C09117] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isClaimingCertificate ? "Vérification..." : "Récupérer mon certificat"}
            </button>

            {claimState.paymentRequired &&
              claimState.paymentStatus === "PENDING" &&
              claimState.paymentUrl && (
                <button
                  type="button"
                  onClick={handleResumePayment}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#D7A928] bg-white px-6 py-3 font-semibold text-[#8A6A0F] transition-colors hover:bg-[#FFF6DA]"
                >
                  Continuer le paiement
                </button>
              )}
          </div>
        )}

        {claimError && <p className="mt-3 text-sm text-red-600">{claimError}</p>}
      </div>
    ) : null
  ) : null;

  if (isPage) {
    return (
      <div className="mx-auto w-full max-w-2xl py-6 text-center sm:py-10">
        <div className="mx-auto mb-7 flex h-28 w-28 items-center justify-center rounded-full border-[10px] border-[#22B573] bg-white sm:h-36 sm:w-36">
          <span className="text-4xl font-bold text-[#111827] sm:text-5xl">
            {percentage}%
          </span>
        </div>

        <h3 className="mb-3 text-3xl font-semibold text-[#111827]">
          {isCertificationMode
            ? passed
              ? "Certification réussie"
              : "Certification non réussie"
            : passed
              ? "Excellent travail!"
              : "Continuez vos efforts"}
        </h3>
        <p className="mb-8 text-lg text-[#667085]">
          Vous avez obtenu{" "}
          <span className="font-semibold text-[#111827]">{correctAnswersCount}</span>{" "}
          {correctAnswersLabel} sur{" "}
          <span className="font-semibold text-[#111827]">
            {totalQuestionsCount}
          </span>
          {" "}
          {totalQuestionsLabel}
        </p>

        {certificationPanel}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onRestart}
            className="inline-flex items-center gap-2 rounded-lg border border-[#D0D5DD] bg-white px-6 py-3 font-semibold text-[#101828] transition-colors hover:bg-[#F9FAFB]"
          >
            <RefreshCcw className="h-4 w-4" />
            Recommencer
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-[#101828] px-8 py-3 font-semibold text-white transition-colors hover:bg-[#1D2939]"
          >
            Terminer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-6 sm:space-y-8 py-6 sm:py-8">
      <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 mx-auto rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-lg">
        <span className="text-2xl sm:text-3xl lg:text-5xl font-bold text-blue-600">
          {percentage}%
        </span>
      </div>

      <div>
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
          {percentage >= 71
            ? "Excellent travail!"
            : percentage >= 41
              ? "Bon effort!"
              : "Continuez à apprendre!"}
        </h3>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600">
          Vous avez obtenu{" "}
          <span className="font-semibold text-gray-900">
            {correctAnswersCount}
          </span>{" "}
          {correctAnswersLabel} sur{" "}
          <span className="font-semibold text-gray-900">
            {totalQuestionsCount}
          </span>
          {" "}
          {totalQuestionsLabel}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4">
        <button
          onClick={onRestart}
          className="px-6 sm:px-8 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Recommencer
        </button>
        <button
          onClick={onClose}
          className="px-6 sm:px-8 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-sm sm:text-base"
        >
          Terminer
        </button>
      </div>
    </div>
  );
}
