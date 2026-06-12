"use client";

import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  CheckCircle,
  Clock,
  Award,
  Check,
  Download,
  GraduationCap,
  RefreshCcw,
  Play,
  Pause,
  Info,
} from "lucide-react";
import Swal from "sweetalert2";
import { QuizApi } from "@/infrastructure/api/quiz-api";
import logger from "@/shared/helpers/logger";
import {
  hasCertificationPassedEver,
  markCertificationPassedEver,
  persistCertificationSuccessSnapshot,
  readCertificationSuccessSnapshot,
} from "@/shared/helpers/certification-session";

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
    options?: QuizOption[];
    points: number;
    questionAudioUrl?: string;
  }>;
}

interface QuizOption {
  label: string;
  audioUrl?: string;
}

const normalizeOptionLabel = (value: string) => value.trim().toLowerCase();

const normalizeQuestionType = (value: unknown): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return "MULTIPLE_CHOICE";
  }
  return value.trim().toUpperCase();
};

const extractAudioUrl = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;

  const direct = record.audioUrl ?? record.audio_url ?? record.audio;
  if (typeof direct === "string") {
    const trimmed = direct.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (direct && typeof direct === "object") {
    const nested = direct as Record<string, unknown>;
    const nestedUrl = nested.url ?? nested.audioUrl ?? nested.audio_url;
    if (typeof nestedUrl === "string" && nestedUrl.trim().length > 0) {
      return nestedUrl.trim();
    }
  }

  return undefined;
};

const toOptionData = (entry: unknown): QuizOption | null => {
  if (typeof entry === "string") {
    const label = entry.trim();
    return label.length > 0 ? { label } : null;
  }
  if (!entry || typeof entry !== "object") return null;

  const record = entry as Record<string, unknown>;
  const label = String(
    record.option ??
      record.label ??
      record.name ??
      record.text ??
      record.response ??
      record.value ??
      "",
  ).trim();

  if (!label) return null;

  return {
    label,
    audioUrl: extractAudioUrl(record),
  };
};

const toQuestionOptions = (question: Record<string, unknown>): QuizOption[] | undefined => {
  const rawOptions = question.options;
  const rawResponses = Array.isArray(question.responses)
    ? question.responses
    : Array.isArray(question.answers)
      ? question.answers
      : Array.isArray(question.choices)
        ? question.choices
        : [];
  const responseAudios =
    Array.isArray(question.responsesAudios) ? question.responsesAudios : [];
  const legacyResponseAudios =
    Array.isArray(question.responseAudios) ? question.responseAudios : [];
  const indexedAudioUrls = [...responseAudios, ...legacyResponseAudios]
    .map((entry) => extractAudioUrl(entry))
    .filter((url): url is string => Boolean(url));
  const normalizedOptions = Array.isArray(rawOptions)
    ? rawOptions
        .map((option) => toOptionData(option))
        .filter((option): option is QuizOption => option !== null)
    : [];
  const normalizedResponses = Array.isArray(rawResponses)
    ? rawResponses
        .map((response) => toOptionData(response))
        .filter((option): option is QuizOption => option !== null)
    : [];

  if (normalizedOptions.length > 0 && normalizedResponses.length > 0) {
    const responseByLabel = new Map(
      normalizedResponses.map((response) => [
        normalizeOptionLabel(response.label),
        response,
      ]),
    );

    return normalizedOptions.map((option, index) => ({
      label: option.label || normalizedResponses[index]?.label || "",
      audioUrl:
        option.audioUrl ??
        normalizedResponses[index]?.audioUrl ??
        indexedAudioUrls[index] ??
        responseByLabel.get(normalizeOptionLabel(option.label))?.audioUrl,
    }));
  }

  if (normalizedOptions.length > 0) {
    return normalizedOptions;
  }

  if (normalizedResponses.length > 0) {
    return normalizedResponses;
  }

  return undefined;
};

const normalizeQuizPayload = (payload: unknown): QuizData | null => {
  if (!payload || typeof payload !== "object") return null;

  const root = payload as Record<string, unknown>;
  const nestedData =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : null;

  const rawQuiz =
    (root.quiz as Record<string, unknown> | undefined) ??
    (nestedData?.quiz as Record<string, unknown> | undefined);
  const rawQuestions =
    (Array.isArray(root.questions) ? root.questions : undefined) ??
    (Array.isArray(nestedData?.questions) ? nestedData?.questions : undefined);

  if (!rawQuiz || !rawQuestions) return null;

  const quizId = String(rawQuiz.id ?? "").trim();
  const quizTitle = String(rawQuiz.title ?? "").trim();
  if (!quizId || !quizTitle) return null;

  const normalizedQuestions = rawQuestions
    .map((question, index) => {
      if (!question || typeof question !== "object") return null;
      const record = question as Record<string, unknown>;
      const id = String(record.id ?? `question-${index + 1}`).trim();
      const label = String(record.question ?? record.title ?? "").trim();
      if (!id || !label) return null;

      const rawPoints = Number(record.points ?? 1);
      return {
        id,
        question: label,
        type: normalizeQuestionType(record.type ?? record.questionType),
        options: toQuestionOptions(record),
        points: Number.isFinite(rawPoints) ? rawPoints : 1,
        questionAudioUrl: extractAudioUrl(record),
      };
    })
    .filter((question): question is QuizData["questions"][number] => question !== null);

  if (normalizedQuestions.length === 0) return null;

  const passingScore = Number(rawQuiz.passingScore ?? 70);

  return {
    quiz: {
      id: quizId,
      title: quizTitle,
      description:
        typeof rawQuiz.description === "string" ? rawQuiz.description : undefined,
      passingScore: Number.isFinite(passingScore) ? passingScore : 70,
      dueDate: typeof rawQuiz.dueDate === "string" ? rawQuiz.dueDate : undefined,
      deadline: typeof rawQuiz.deadline === "string" ? rawQuiz.deadline : undefined,
      endDate: typeof rawQuiz.endDate === "string" ? rawQuiz.endDate : undefined,
      expiresAt:
        typeof rawQuiz.expiresAt === "string" ? rawQuiz.expiresAt : undefined,
      availableUntil:
        typeof rawQuiz.availableUntil === "string"
          ? rawQuiz.availableUntil
          : undefined,
    },
    questions: normalizedQuestions,
  };
};

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

/** Charte Bibocom Digital — quiz & certification (blanc + #002d76 + #ef4444). */
const QZ = {
  shell:
    "flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white text-slate-900 shadow-lg shadow-slate-200/50 ring-1 ring-slate-100",
  shellModal:
    "mx-auto flex w-full max-h-[95vh] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white text-slate-900 shadow-2xl shadow-slate-300/40 ring-1 ring-slate-100 sm:max-w-md lg:max-w-3xl",
  header: "border-b border-slate-200 bg-white",
  footer: "border-t border-slate-100 bg-slate-50/90",
  muted: "text-slate-500",
  label: "text-slate-600",
  btnGhost:
    "rounded-full border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#002d76] transition-colors hover:border-[#002d76]/35 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white",
  btnPrimary:
    "inline-flex min-w-[120px] items-center justify-center gap-2 rounded-full bg-[#ef4444] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#dc2626] disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:py-2.5",
  progressTrack: "h-2.5 w-full overflow-hidden rounded-full bg-slate-200/90",
  progressFill: "h-full rounded-full bg-[#002d76] transition-all duration-300",
} as const;

const PENDING_CERTIFICATE_CLAIM_TTL_MS = 24 * 60 * 60 * 1000;
const QUIZ_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

/** Tarif affiché pour l’achat de la certification (information côté client). */
const CERTIFICATION_FEE_FCFA = 1000;

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
  /** Évite de réafficher l’écran « succès » pendant une reprise après « Recommencer ». */
  const suppressCertificationAutoSuccessRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      suppressCertificationAutoSuccessRef.current = false;
    }
  }, [isOpen]);

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

    suppressCertificationAutoSuccessRef.current = false;
    setLoading(true);
    setStorageHydrated(false);
    setError(null);
    try {
      const data =
        mode === "certification"
          ? await QuizApi.getCertificationQuiz(courseId as string)
          : await QuizApi.getQuizQuestions(quizId as string);
      const normalizedData = normalizeQuizPayload(data);

      if (!normalizedData) {
        throw new Error("Structure de quiz invalide");
      }

      setQuizData(normalizedData);
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
    if (
      mode === "certification" &&
      courseId &&
      parsed.quizResult &&
      (parsed.quizResult.passed || parsed.quizResult.eligibleForCertificate)
    ) {
      markCertificationPassedEver(courseId);
    }
    setStartTime(parsed.startTime ? new Date(parsed.startTime) : new Date());
    setTimeLeft(parsed.timeLeft);
    setStorageHydrated(true);
  }, [isOpen, quizData, storageKey, mode, courseId]);

  /** Certification déjà réussie (sessionStorage) : afficher directement l’écran succès / certificat si pas de tentative en cours. */
  useEffect(() => {
    if (!isOpen || !quizData || mode !== "certification" || !courseId) return;
    if (!storageHydrated) return;
    if (suppressCertificationAutoSuccessRef.current) return;
    if (!hasCertificationPassedEver(courseId)) return;

    const raw =
      storageKey && typeof window !== "undefined"
        ? window.sessionStorage.getItem(storageKey)
        : null;
    const parsed = raw ? parseStoredQuizSession(raw) : null;

    if (parsed?.showResults && parsed.quizResult) {
      return;
    }

    const inProgress =
      parsed &&
      !parsed.showResults &&
      (Object.keys(parsed.answers).length > 0 || parsed.currentQuestionIndex > 0);

    if (inProgress) {
      return;
    }

    const n = Math.max(1, quizData.questions.length);
    const snapshot = readCertificationSuccessSnapshot(courseId);
    const totalQuestions = snapshot?.totalQuestions ?? n;
    const correctAnswers = snapshot?.correctAnswers ?? totalQuestions;
    const score = snapshot?.score ?? 100;

    setCurrentQuestionIndex(0);
    setAnswers({});
    setQuizResult({
      score,
      passed: true,
      correctAnswers,
      totalQuestions,
      eligibleForCertificate:
        snapshot?.eligibleForCertificate !== undefined
          ? snapshot.eligibleForCertificate
          : true,
      isPaidEnrollment: snapshot?.isPaidEnrollment,
      isCourseFree: snapshot?.isCourseFree,
    });
    setShowResults(true);
    setIsSubmitting(false);
    setStartTime(new Date());
    setTimeLeft(null);
  }, [isOpen, quizData, mode, courseId, storageHydrated, storageKey]);

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
          options = [{ label: "Vrai" }, { label: "Faux" }];
        }

        if (options && typeof selectedIndex === "number") {
          const selectedText = options[selectedIndex]?.label;
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

      const certificationEligibleFromApi =
        mode === "certification"
          ? readBooleanCandidate(
              rawResult.eligibleForCertificate,
              rawResult.eligible_for_certificate,
              (result as { eligibleForCertificate?: boolean })
                .eligibleForCertificate,
            )
          : null;

      if (
        mode === "certification" &&
        courseId &&
        (result.passed || certificationEligibleFromApi === true)
      ) {
        markCertificationPassedEver(courseId);
      }

      const eligibleForCertificate =
        mode === "certification"
          ? (certificationEligibleFromApi !== null
              ? certificationEligibleFromApi
              : result.passed) || hasCertificationPassedEver(courseId)
          : undefined;

      setQuizResult({
        score: normalizedScore,
        passed: result.passed,
        correctAnswers: normalizedCorrectAnswers,
        totalQuestions: normalizedTotalQuestions,
        eligibleForCertificate,
        isPaidEnrollment:
          mode === "certification" ? (isPaidEnrollment ?? undefined) : undefined,
        isCourseFree: mode === "certification" ? (isCourseFree ?? undefined) : undefined,
      });

      if (
        mode === "certification" &&
        courseId &&
        (result.passed || certificationEligibleFromApi === true)
      ) {
        persistCertificationSuccessSnapshot(courseId, {
          score: normalizedScore,
          correctAnswers: normalizedCorrectAnswers,
          totalQuestions: normalizedTotalQuestions,
          eligibleForCertificate: Boolean(eligibleForCertificate),
          isPaidEnrollment: isPaidEnrollment ?? undefined,
          isCourseFree: isCourseFree ?? undefined,
        });
      }

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
    if (mode === "certification") {
      suppressCertificationAutoSuccessRef.current = true;
    }
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
        className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl ${
          isInline || isPage ? "w-full" : "mx-4 w-full max-w-md"
        }`}
      >
        <div className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#ef4444]/25 bg-[#ef4444]/10">
            <svg
              className="h-8 w-8 text-[#ef4444]"
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
          <h3 className="mb-2 text-xl font-semibold text-[#002d76]">
            Erreur de chargement
          </h3>
          <p className="mb-6 text-slate-600">{error}</p>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full bg-[#ef4444] px-8 py-2.5 font-semibold text-white transition-colors hover:bg-[#dc2626]"
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#002d76]/25 p-4 backdrop-blur-[2px]">
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
      className={`flex flex-col overflow-hidden ${
        isInline || isPage ? QZ.shell : QZ.shellModal
      }`}
    >
      {/* Header */}
      {isPage ? (
        <div
          className={`flex flex-wrap items-start justify-between gap-3 px-4 py-4 sm:px-6 ${QZ.header}`}
        >
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold leading-snug text-[#002d76] sm:text-lg">
              {pageTitlePrefix} : {quizData.quiz.title}
            </h2>
            <p className={`mt-1 text-xs sm:text-sm ${QZ.muted}`}>{pageSubtitle}</p>
          </div>
          {deadlineLabel && (
            <div className={`flex shrink-0 items-center gap-2 text-sm ${QZ.label}`}>
              <Clock className="h-4 w-4 text-[#002d76]" />
              <span>Échéance : {deadlineLabel}</span>
            </div>
          )}
        </div>
      ) : (
        <div className={`flex items-start justify-between p-4 sm:p-6 ${QZ.header}`}>
          <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#002d76]/15 bg-[#002d76]/[0.07] sm:h-12 sm:w-12">
              <Award className="h-5 w-5 text-[#002d76] sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    mode === "certification"
                      ? "bg-[#ef4444] text-white shadow-sm"
                      : "border border-[#002d76]/25 bg-[#002d76]/10 text-[#002d76]"
                  }`}
                >
                  {mode === "certification" ? "Certification" : "Quiz"}
                </span>
              </div>
              <h2 className="text-lg font-bold leading-tight text-[#002d76] sm:text-xl">
                {quizData.quiz.title}
              </h2>
              {quizData.quiz.description && (
                <p className={`mt-1 line-clamp-2 text-xs sm:text-sm ${QZ.muted}`}>
                  {quizData.quiz.description}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="ml-2 shrink-0 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5 sm:h-5 sm:w-5" />
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
                <div className="py-8 text-center sm:py-12">
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-[#002d76] sm:h-12 sm:w-12" />
                  <p className={`mt-4 text-sm sm:text-base ${QZ.muted}`}>
                    Chargement des résultats...
                  </p>
                </div>
              )
            ) : (
              <>
                {/* Progress Bar */}
                <div className="mb-6 sm:mb-8">
                  <div className="mb-3 flex items-center justify-between text-xs sm:text-sm">
                    <span className={`font-medium ${QZ.label}`}>
                      Question {currentQuestionIndex + 1} sur{" "}
                      {quizData.questions.length}
                    </span>
                    <span className="font-semibold text-[#002d76]">
                      {Math.round(
                        ((currentQuestionIndex + 1) /
                          quizData.questions.length) *
                          100,
                      )}
                      %
                    </span>
                  </div>
                  <div className={QZ.progressTrack}>
                    <div
                      className={QZ.progressFill}
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
        <div className={QZ.footer}>
          {/* Progress counter - Mobile */}
          <div className="px-4 py-2 sm:hidden">
            <div className={`text-center text-xs ${QZ.muted}`}>
              {Object.keys(answers).length} / {quizData.questions.length}{" "}
              répondues
            </div>
          </div>

          {/* Footer buttons */}
          <div
            className={`flex items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5 ${
              isPage ? "mx-auto w-full max-w-4xl lg:px-8" : ""
            }`}
          >
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={`${QZ.btnGhost} px-4 py-2.5 text-sm sm:px-5 sm:text-base`}
            >
              ← Précédent
            </button>

            {/* Progress counter - Desktop */}
            <div className={`hidden text-xs sm:block sm:text-sm ${QZ.muted}`}>
              {Object.keys(answers).length} / {quizData.questions.length}{" "}
              répondues
            </div>

            {isLastQuestion ? (
              <button
                type="button"
                onClick={handleSubmitQuiz}
                disabled={!allQuestionsAnswered || isSubmitting}
                className={`${QZ.btnPrimary} ${isPage ? "min-w-[140px]" : ""}`}
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span className="hidden sm:inline">Soumission...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Voir résultats</span>
                    <span className="sm:hidden">Résultats</span>
                    <span aria-hidden>→</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className={`${QZ.btnPrimary} ${isPage ? "min-w-[140px]" : ""}`}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#002d76]/20 p-2 backdrop-blur-[2px] sm:p-4">
      {quizContent}
    </div>
  );
}

const optionRowBase =
  "group flex cursor-pointer items-center gap-4 rounded-2xl border-2 px-4 py-4 transition-all duration-200 active:scale-[0.995]";
const optionRowIdle =
  "border-slate-200 bg-white hover:border-[#002d76]/30 hover:bg-[#002d76]/5 hover:shadow-sm";
const optionRowSelected =
  "border-[#002d76] bg-[#002d76]/10 shadow-md ring-2 ring-[#002d76]/15";

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
    options?: QuizOption[];
    points: number;
    questionAudioUrl?: string;
  };
  answer: number;
  onAnswerChange: (answer: number) => void;
  variant?: "modal" | "page";
}) {
  const isPage = variant === "page";
  const titleClass = isPage
    ? "text-lg font-bold leading-relaxed text-[#002d76] sm:text-xl"
    : "text-base font-bold leading-relaxed text-[#002d76] sm:text-lg lg:text-xl";
  const bodyText = isPage ? "text-[15px] leading-relaxed" : "text-sm leading-relaxed sm:text-base";

  const OptionIndicator = ({
    index,
    selected,
  }: {
    index: number;
    selected: boolean;
  }) => (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
        selected
          ? "border-[#002d76] bg-[#002d76] text-white"
          : "border-slate-200 bg-slate-50 text-slate-500 group-hover:border-[#002d76]/35 group-hover:text-[#002d76]"
      }`}
    >
      {selected ? (
        <Check className="h-4 w-4" strokeWidth={2.5} />
      ) : (
        <span>{index + 1}</span>
      )}
    </div>
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h3 className={titleClass}>{question.question}</h3>
        {question.questionAudioUrl && (
          <div className="shrink-0 sm:pt-1">
            <InlineAudioPlayer src={question.questionAudioUrl} size="question" />
          </div>
        )}
      </div>

      {question.type === "MULTIPLE_CHOICE" && question.options && (
        <div className="space-y-3">
          {question.options.map((option, index: number) => {
            const isSelected = answer === index;
            return (
              <label
                key={`${option.label}-${index}`}
                htmlFor={`option-${question.id}-${index}`}
                className={`${optionRowBase} ${
                  isSelected ? optionRowSelected : optionRowIdle
                }`}
              >
                <OptionIndicator index={index} selected={isSelected} />
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
                  className={`min-w-0 flex-1 font-medium ${bodyText} ${
                    isSelected ? "text-[#002d76]" : "text-slate-800"
                  }`}
                >
                  {option.label}
                </span>
                {option.audioUrl && (
                  <div
                    className="shrink-0"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <InlineAudioPlayer src={option.audioUrl} size="option" />
                  </div>
                )}
                {isSelected && (
                  <CheckCircle
                    className="h-5 w-5 shrink-0 text-[#ef4444]"
                    aria-hidden
                  />
                )}
              </label>
            );
          })}
        </div>
      )}

      {question.type === "TRUE_FALSE" && (
        <div className="space-y-3">
          {["Vrai", "Faux"].map((option, index) => {
            const isSelected = answer === index;
            return (
              <label
                key={option}
                htmlFor={`option-${question.id}-${index}`}
                className={`${optionRowBase} ${
                  isSelected ? optionRowSelected : optionRowIdle
                }`}
              >
                <OptionIndicator index={index} selected={isSelected} />
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
                  className={`min-w-0 flex-1 font-semibold ${bodyText} ${
                    isSelected ? "text-[#002d76]" : "text-slate-800"
                  }`}
                >
                  {option}
                </span>
                {isSelected && (
                  <CheckCircle className="h-5 w-5 shrink-0 text-[#ef4444]" aria-hidden />
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
          className="w-full rounded-2xl border-2 border-slate-200 bg-white p-4 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-[#002d76] focus:outline-none focus:ring-2 focus:ring-[#002d76]/20 sm:text-base"
          rows={4}
        />
      )}
    </div>
  );
}

function InlineAudioPlayer({
  src,
  size = "option",
}: {
  src: string;
  size?: "question" | "option";
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, [src]);

  const handleTogglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      return;
    }

    try {
      await audio.play();
    } catch (error) {
      logger.error("Impossible de lire l'audio", error);
    }
  };

  const buttonSizeClass =
    size === "question" ? "h-9 w-9 sm:h-10 sm:w-10" : "h-8 w-8 sm:h-9 sm:w-9";
  const iconSizeClass = size === "question" ? "h-4 w-4" : "h-3.5 w-3.5";

  return (
    <div
      className="inline-flex items-center"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        className="hidden"
      />
      <button
        type="button"
        onClick={handleTogglePlay}
        className={`flex items-center justify-center rounded-full border-2 transition ${buttonSizeClass} ${
          isPlaying
            ? "border-[#002d76] bg-[#002d76] text-white hover:bg-[#001f52]"
            : "border-[#002d76]/25 bg-[#002d76]/8 text-[#002d76] hover:border-[#002d76]/45 hover:bg-[#002d76]/12"
        }`}
        aria-label={isPlaying ? "Mettre en pause" : "Lire l'audio"}
      >
        {isPlaying ? (
          <Pause className={`${iconSizeClass} fill-current`} />
        ) : (
          <Play className={`${iconSizeClass} fill-current`} />
        )}
      </button>
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
  const eligibleForCertificate = Boolean(
    quizResult?.eligibleForCertificate === true,
  );
  const showCertificationClaimAction =
    isCertificationMode && (passed || eligibleForCertificate);
  const showCertificationFailure =
    isCertificationMode && !passed && !eligibleForCertificate;

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
  }, [courseId]);

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
      <div className="mx-auto mb-8 w-full max-w-xl rounded-2xl border-2 border-[#ef4444]/25 bg-[#fef2f2] p-6 text-left sm:text-center">
        <p className="text-lg font-semibold text-[#b91c1c]">
          Certification non réussie
        </p>
      </div>
    ) : showCertificationClaimAction ? (
      <div className="mx-auto mb-8 w-full max-w-xl rounded-2xl border-2 border-dashed border-[#002d76]/25 bg-gradient-to-br from-[#002d76]/5 to-white p-6 text-left shadow-inner sm:text-center">
        <p className="flex items-center justify-start gap-2 text-xl font-bold text-[#002d76] sm:justify-center">
          <GraduationCap className="h-6 w-6 text-[#ef4444]" />
          {claimState.isIssued
            ? "Votre certificat est prêt"
            : passed
              ? "Certification réussie"
              : "Certification déjà validée"}
        </p>

        {!claimState.isIssued && (
          <p className="mt-2 text-sm text-slate-600">
            {isPollingClaim
              ? "Vérification du paiement en cours..."
              : claimState.paymentRequired
                ? "Paiement requis pour finaliser l'émission du certificat."
                : eligibleForCertificate && !passed
                  ? "Votre réussite précédente est conservée. Cliquez sur \"Récupérer mon certificat\"."
                  : "Cliquez sur \"Récupérer mon certificat\"."}
          </p>
        )}

        {!claimState.isIssued && (
          <div className="mt-4 flex gap-3 rounded-xl border border-[#002d76]/20 bg-[#002d76]/5 px-4 py-3 text-left sm:items-start sm:justify-center sm:text-center">
            <Info
              className="mt-0.5 h-5 w-5 shrink-0 text-[#002d76]"
              aria-hidden
            />
            <div className="min-w-0 text-sm text-slate-700">
              <p className="font-semibold text-[#002d76]">
                Tarif de la certification :{" "}
                {CERTIFICATION_FEE_FCFA.toLocaleString("fr-FR")} F CFA
              </p>
              <p className="mt-1.5 leading-relaxed text-slate-600">
                Le bouton « Récupérer mon certificat » lance l’achat de la
                certification et vous redirige vers la page de paiement pour
                régler ce montant.
              </p>
            </div>
          </div>
        )}

        {claimState.isIssued && claimState.certificateUrl ? (
          <button
            type="button"
            onClick={handleDownloadCertificate}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#ef4444] px-8 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-[#dc2626]"
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
              className="inline-flex items-center gap-2 rounded-full bg-[#ef4444] px-8 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-[#dc2626] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isClaimingCertificate ? "Vérification..." : "Récupérer mon certificat"}
            </button>

            {claimState.paymentRequired &&
              claimState.paymentStatus === "PENDING" &&
              claimState.paymentUrl && (
                <button
                  type="button"
                  onClick={handleResumePayment}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-[#002d76] bg-white px-6 py-3 font-semibold text-[#002d76] transition-colors hover:bg-[#002d76]/5"
                >
                  Continuer le paiement
                </button>
              )}
          </div>
        )}

        {claimError && <p className="mt-3 text-sm font-medium text-[#ef4444]">{claimError}</p>}
      </div>
    ) : null
  ) : null;

  const scoreRingBorder = isCertificationMode
    ? passed
      ? "border-[#002d76]"
      : eligibleForCertificate
        ? "border-amber-400"
        : "border-[#ef4444]"
    : passed
      ? "border-[#002d76]"
      : "border-[#ef4444]";

  if (isPage) {
    return (
      <div className="mx-auto w-full max-w-2xl py-6 text-center text-slate-900 sm:py-10">
        <div
          className={`mx-auto mb-7 flex h-28 w-28 items-center justify-center rounded-full border-[10px] bg-white shadow-md sm:h-36 sm:w-36 ${scoreRingBorder}`}
        >
          <span className="text-4xl font-bold text-[#002d76] sm:text-5xl">
            {percentage}%
          </span>
        </div>

        <h3 className="mb-3 text-3xl font-bold text-[#002d76]">
          {isCertificationMode
            ? passed
              ? "Certification réussie"
              : eligibleForCertificate
                ? "Tentative non réussie"
                : "Certification non réussie"
            : passed
              ? "Excellent travail!"
              : "Continuez vos efforts"}
        </h3>
        {isCertificationMode && !passed && eligibleForCertificate && (
          <p className="mb-3 text-center text-sm text-amber-800">
            Cette tentative n’atteint pas le score requis, mais votre certification
            reste acquise. Vous pouvez récupérer votre certificat ci-dessous.
          </p>
        )}
        <p className="mb-8 text-lg text-slate-600">
          Vous avez obtenu{" "}
          <span className="font-semibold text-[#002d76]">{correctAnswersCount}</span>{" "}
          {correctAnswersLabel} sur{" "}
          <span className="font-semibold text-[#002d76]">
            {totalQuestionsCount}
          </span>
          {" "}
          {totalQuestionsLabel}
        </p>

        {certificationPanel}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onRestart}
            className={`${QZ.btnGhost} inline-flex items-center gap-2 px-6 py-3`}
          >
            <RefreshCcw className="h-4 w-4" />
            Recommencer
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`${QZ.btnPrimary} px-8 py-3`}
          >
            Terminer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6 text-center text-slate-900 sm:space-y-8 sm:py-8">
      <div
        className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full border-[8px] bg-white shadow-lg sm:h-32 sm:w-32 sm:border-[10px] lg:h-40 lg:w-40 ${scoreRingBorder}`}
      >
        <span className="text-2xl font-bold text-[#002d76] sm:text-3xl lg:text-5xl">
          {percentage}%
        </span>
      </div>

      <div>
        <h3 className="mb-3 text-xl font-bold text-[#002d76] sm:text-2xl lg:text-3xl">
          {percentage >= 71
            ? "Excellent travail!"
            : percentage >= 41
              ? "Bon effort!"
              : "Continuez à apprendre!"}
        </h3>
        <p className="text-sm text-slate-600 sm:text-base lg:text-lg">
          Vous avez obtenu{" "}
          <span className="font-semibold text-[#002d76]">
            {correctAnswersCount}
          </span>{" "}
          {correctAnswersLabel} sur{" "}
          <span className="font-semibold text-[#002d76]">
            {totalQuestionsCount}
          </span>
          {" "}
          {totalQuestionsLabel}
        </p>
      </div>

      {certificationPanel}

      <div className="flex flex-col justify-center gap-3 pt-4 sm:flex-row sm:gap-4">
        <button
          type="button"
          onClick={onRestart}
          className={`${QZ.btnGhost} flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium sm:px-8 sm:py-3 sm:text-base`}
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
        <button type="button" onClick={onClose} className={`${QZ.btnPrimary} px-8 py-2.5 sm:py-3`}>
          Terminer
        </button>
      </div>
    </div>
  );
}
