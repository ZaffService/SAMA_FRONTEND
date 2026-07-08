"use client";

import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import { buildApiUrl, API_ENDPOINTS } from "@/infrastructure/api/baseConfig";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { usePayment } from "@/application/use-cases/usePayment";
import { QuizApi } from "@/infrastructure/api/quiz-api";
import { SecureVideoPlayer } from "@/components/secure-video-player";
import { transformCourseDetails } from "@/lib/transformers/course-transformer";
import { VideoApi } from "@/infrastructure/api/video-api";
import Swal from "sweetalert2";
import { LockedVideoOverlay } from "@/components/LockedVideoOverlay";
import { QuizModal } from "@/components/QuizModal";
import { TEXTS } from "@/lib/constants";
import type { CourseDetailsData, Quiz } from "@/types/course";
import {
  Play,
  ArrowLeft,
  ChevronDown,
  AlertTriangle,
  RefreshCw,
  X,
  Lock,
  Clock,
  Target,
  Award,
  Check,
  PlayCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
} from "lucide-react";
import Cookies from "js-cookie";
import logger from "@/shared/helpers/logger";

const TRACKING_INTERVAL_MS = 2000;
const TRACKING_COMPLETION_THRESHOLD = 0.95;
const TRACKING_PROGRESS_STEP = 0.05;

type PaymentType = "course" | "certification";

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

const getAttachmentFilename = (url?: string | null): string => {
  if (!url) return "Ressource du cours";
  const cleaned = url.split("?")[0].split("#")[0];
  const parts = cleaned.split("/");
  const lastPart = parts[parts.length - 1];
  if (!lastPart) return "Ressource du cours";
  try {
    return decodeURIComponent(lastPart);
  } catch {
    return lastPart;
  }
};

const PENDING_CERTIFICATION_CLAIM_TTL_MS = 24 * 60 * 60 * 1000;
const pendingCertificationClaimKey = (courseId: string) =>
  `pendingCertificationClaim:${courseId}`;

const hasPendingCertificationClaim = (courseId: string): boolean => {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(pendingCertificationClaimKey(courseId));
  if (!stored) return false;

  const timestamp = (() => {
    const numeric = Number(stored);
    if (Number.isFinite(numeric)) return numeric;

    try {
      const parsed = JSON.parse(stored) as unknown;
      if (typeof parsed === "number" && Number.isFinite(parsed)) {
        return parsed;
      }

      if (typeof parsed !== "object" || parsed === null) return null;
      const record = parsed as Record<string, unknown>;
      const timestamp = Number(record.timestamp);
      return Number.isFinite(timestamp) ? timestamp : null;
    } catch {
      return null;
    }
  })();

  if (timestamp === null) {
    localStorage.removeItem(pendingCertificationClaimKey(courseId));
    return false;
  }

  if (Date.now() - timestamp > PENDING_CERTIFICATION_CLAIM_TTL_MS) {
    localStorage.removeItem(pendingCertificationClaimKey(courseId));
    return false;
  }

  return true;
};

const clearPendingCertificationClaim = (courseId: string) => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(pendingCertificationClaimKey(courseId));
};

// ✅ Utilitaires pour persistance état enrollment (Cookies + LocalStorage pour mobile)

// 🔐 Sauvegarder état AVANT redirection Paydunya
const savePendingEnrollment = (courseId: string, userId?: string | number) => {
  // Cookies - pour compatibilité backend
  Cookies.set("pendingCourseId", courseId, { expires: 1 }); // 1 jour
  Cookies.set("pendingEnrollmentTime", Date.now().toString(), { expires: 1 });

  // LocalStorage - PLUS FIABLE sur mobile
  const pendingData = {
    courseId,
    userId,
    timestamp: Date.now(),
    status: "AWAITING_PAYMENT",
    returnUrl: typeof window !== "undefined" ? window.location.href : "",
  };
  if (typeof window !== "undefined") {
    localStorage.setItem("pendingEnrollment", JSON.stringify(pendingData));
    logger.log("✅ État sauvegardé avant redirection Paydunya:", pendingData);
  }
};

// 🔄 Restaurer état APRÈS retour Paydunya
const restorePendingEnrollment = () => {
  if (typeof window === "undefined") return null;

  // LocalStorage en priorité (plus fiable mobile)
  const localData = localStorage.getItem("pendingEnrollment");

  if (localData) {
    const data = JSON.parse(localData);

    // Vérifier expiration (30 minutes)
    if (Date.now() - data.timestamp < 30 * 60 * 1000) {
      logger.log("🔄 Enrollment pending retrouvé:", data);
      return data;
    } else {
      localStorage.removeItem("pendingEnrollment");
      logger.log("⏰ Pending enrollment expiré");
    }
  }

  // Fallback cookies
  const courseId = Cookies.get("pendingCourseId");
  const time = Cookies.get("pendingEnrollmentTime");

  if (courseId && time) {
    return {
      courseId,
      timestamp: parseInt(time),
      source: "cookies",
    };
  }

  return null;
};

// 🧹 Nettoyer après vérification réussie
const clearPendingEnrollment = () => {
  Cookies.remove("pendingCourseId");
  Cookies.remove("pendingEnrollmentTime");
  if (typeof window !== "undefined") {
    localStorage.removeItem("pendingEnrollment");
    logger.log("🧹 Pending enrollment nettoyé");
  }
};

type VideoProgressWindow = {
  lessonId: string;
  fromTime: number;
  toTime: number;
  duration: number;
};

const loadYouTubeIframeApi = (): Promise<void> => {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).YT?.Player) return Promise.resolve();

  return new Promise((resolve) => {
    const waitForApi = () => {
      if ((window as any).YT?.Player) {
        resolve();
        return true;
      }
      return false;
    };

    if (waitForApi()) return;

    const existingScript = document.getElementById("youtube-iframe-api");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "youtube-iframe-api";
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);
    }

    const poll = window.setInterval(() => {
      if (waitForApi()) {
        window.clearInterval(poll);
      }
    }, 100);
  });
};

// ✅ Player YouTube avec tracking de progression par segments
function VideoWithLoading({
  lessonId,
  videoId,
  title,
  onTrackProgress,
  onEnded,
}: {
  lessonId: string;
  videoId: string;
  title?: string;
  onTrackProgress: (payload: VideoProgressWindow) => void;
  onEnded?: () => void;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasPlaybackIssue, setHasPlaybackIssue] = useState(false);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const trackingIntervalRef = useRef<number | null>(null);
  const lastTrackedTimeRef = useRef(0);

  const flushTrackedWindow = useCallback(() => {
    const player = playerRef.current;
    if (!player || typeof player.getCurrentTime !== "function") return;

    const current = Number(player.getCurrentTime()) || 0;
    const duration = Number(player.getDuration()) || 0;
    onTrackProgress({
      lessonId,
      fromTime: lastTrackedTimeRef.current,
      toTime: current,
      duration,
    });
    lastTrackedTimeRef.current = current;
  }, [lessonId, onTrackProgress]);

  const stopTracking = useCallback(() => {
    if (trackingIntervalRef.current) {
      window.clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
  }, []);

  const startTracking = useCallback(() => {
    stopTracking();
    trackingIntervalRef.current = window.setInterval(() => {
      flushTrackedWindow();
    }, TRACKING_INTERVAL_MS);
  }, [flushTrackedWindow, stopTracking]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setHasPlaybackIssue(false);
    lastTrackedTimeRef.current = 0;

    const initPlayer = async () => {
      await loadYouTubeIframeApi();
      if (!isMounted || !hostRef.current) return;

      const YT = (window as any).YT;
      if (!YT?.Player) return;

      playerRef.current = new YT.Player(hostRef.current, {
        videoId,
        playerVars: {
          controls: 1,
          modestbranding: 1,
          rel: 0,
          autoplay: 0,
          playsinline: 1,
        },
        events: {
          onReady: (event: any) => {
            setIsLoading(false);
            lastTrackedTimeRef.current = Number(event.target.getCurrentTime()) || 0;
          },
          onError: () => {
            setIsLoading(false);
            setHasPlaybackIssue(true);
            stopTracking();
          },
          onStateChange: (event: any) => {
            const state = event.data;
            const PlayerState = YT.PlayerState;

            if (state === PlayerState.PLAYING) {
              startTracking();
              return;
            }

            stopTracking();
            flushTrackedWindow();

            if (state === PlayerState.ENDED) {
              onEnded?.();
            }
          },
        },
      });
    };

    void initPlayer();

    return () => {
      isMounted = false;
      stopTracking();
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        playerRef.current.destroy();
      }
      playerRef.current = null;
    };
  }, [videoId, flushTrackedWindow, onEnded, startTracking, stopTracking]);

  useEffect(() => {
    if (!isLoading) return;

    const timeoutId = window.setTimeout(() => {
      setHasPlaybackIssue(true);
      setIsLoading(false);
      stopTracking();
    }, 12000);

    return () => window.clearTimeout(timeoutId);
  }, [isLoading, stopTracking]);

  return (
    <div className="absolute inset-0 h-full w-full bg-black">
      {hasPlaybackIssue && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black px-4">
          <div className="text-center text-white">
            <PlayCircle className="mx-auto mb-4 h-12 w-12 text-white/45" />
            <p className="text-base font-medium text-white/90">
              Vidéo indisponible pour le moment
            </p>
            <p className="mt-1 text-sm text-white/60">
              Veuillez réessayer un peu plus tard.
            </p>
          </div>
        </div>
      )}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900">
          <div className="text-center text-white">
            <div className="mx-auto mb-3 h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
            <p className="text-sm">Chargement de la vidéo...</p>
          </div>
        </div>
      )}
      <div
        ref={hostRef}
        title={title || "Vidéo YouTube"}
        className={`h-full w-full transition-opacity duration-300 ${
          isLoading || hasPlaybackIssue ? "opacity-0" : "opacity-100"
        }`}
      />
    </div>
  );
}

function CourseDetailsPageComponent() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useLocalAuth();
  const { verifyPayment } = usePayment();
  const courseId = params?.id as string;

  // ✅ Check if user is admin - they should have access to all courses
  const isAdmin = user?.role === "ADMIN";

  const [courseData, setCourseData] = useState<CourseDetailsData | null>(null);
  const [enrollmentCount, setEnrollmentCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "videos" | "resources" | "support"
  >("videos");
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");
  const [currentLessonIndex, setCurrentLessonIndex] = useState<number>(0);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(),
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const initialViewParam = (searchParams.get("view") || "").toLowerCase();
  const initialQuizModuleIdParam = searchParams.get("moduleId");
  const initialQuizModeParam = (searchParams.get("quizMode") || "").toLowerCase();
  const initialQuizMode: "module" | "certification" =
    initialQuizModeParam === "certification" ? "certification" : "module";
  const initialActiveQuizModuleId =
    initialViewParam === "quiz" && initialQuizModuleIdParam
      ? initialQuizModuleIdParam
      : null;
  const initialContentMode: "video" | "quiz" = initialActiveQuizModuleId
    ? "quiz"
    : "video";

  const [contentMode, setContentMode] = useState<"video" | "quiz">(
    initialContentMode,
  );
  const [activeQuizModuleId, setActiveQuizModuleId] = useState<string | null>(
    initialActiveQuizModuleId,
  );
  const [activeQuizMode, setActiveQuizMode] = useState<
    "module" | "certification"
  >(initialActiveQuizModuleId ? initialQuizMode : "module");

  // Course access states
  const [isEnrolled, setIsEnrolled] = useState<boolean | undefined>(undefined);
  const [isPaid, setIsPaid] = useState(false);
  const [isFree, setIsFree] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<{
    type: "warning" | "info" | "success";
    paymentType: PaymentType;
    title: string;
    message: string;
    actionLabel?: string;
    actionUrl?: string;
  } | null>(null);
  const hasCourseAccess = isEnrolled === true || isAdmin;

  // ✅ NOUVEAU: Flag pour éviter les requêtes d'enrollment multiples
  const [enrollmentCheckComplete, setEnrollmentCheckComplete] = useState(false);

  // Lesson progress states
  const [lessonProgress, setLessonProgress] = useState<Record<string, boolean>>(
    {},
  );

  // Quiz states
  const [moduleQuizzes, setModuleQuizzes] = useState<Record<string, boolean>>(
    {},
  );
  const [checkingQuizzes, setCheckingQuizzes] = useState<Set<string>>(
    new Set(),
  );
  const [certificationQuiz, setCertificationQuiz] = useState<Quiz | null>(null);
  const [hasCertificationQuiz, setHasCertificationQuiz] = useState(false);
  const [certificationQuizLoading, setCertificationQuizLoading] =
    useState(false);

  // Tracking automatique de progression vidéo
  const lessonProgressRef = useRef<Record<string, boolean>>({});
  const lessonMaxProgressRef = useRef<Record<string, number>>({});
  const lessonLastReportedProgressRef = useRef<Record<string, number>>({});
  const lessonDurationsRef = useRef<Record<string, number>>({});
  const completionInFlightRef = useRef<Set<string>>(new Set());
  const syncedCompletedLessonsRef = useRef<Set<string>>(new Set());
  const handledPaymentReturnRef = useRef<Set<string>>(new Set());
  const initialLessonSelectionRef = useRef(false);

  useEffect(() => {
    completionInFlightRef.current.clear();
    syncedCompletedLessonsRef.current.clear();
    lessonMaxProgressRef.current = {};
    lessonLastReportedProgressRef.current = {};
    lessonDurationsRef.current = {};
  }, [courseId, user?.id]);

  // Helper function to validate UUID format (defined before useEffects)
  const isValidUUID = (id: string): boolean => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  // Helper function to get YouTube video ID
  const getYouTubeVideoId = (url?: string | null): string | null => {
    if (!url || typeof url !== "string") return null;
    const iframeRegex =
      /<iframe[^>]*src=["'](?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/embed\/|youtu\.be\/)([^"']{11})[^"']*["'][^>]*>/gi;
    const iframeMatch = iframeRegex.exec(url);
    if (iframeMatch && iframeMatch[1]) return iframeMatch[1];
    const urlRegex =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/gi;
    const urlMatch = urlRegex.exec(url);
    if (urlMatch && urlMatch[1]) return urlMatch[1];
    const simpleRegex =
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/gi;
    const simpleMatch = simpleRegex.exec(url);
    if (simpleMatch && simpleMatch[1]) return simpleMatch[1];
    return null;
  };

  // Enrollment check states
  // Popup d'inscription retiré - causait des boucles d'affichage

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Nettoyer le cache des URLs signées périodiquement
  useEffect(() => {
    const interval = setInterval(
      () => {
        VideoApi.cleanExpiredCache();
      },
      5 * 60 * 1000,
    ); // Toutes les 5 minutes

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!courseId) {
        logger.log(" Pas d'ID de cours fourni");
        return;
      }

      logger.log(`🔄 Composant: Chargement du cours ${courseId}`);

      try {
        setLoading(true);
        const rawData = await CoursesApi.getCourseDetails(courseId);

        // ✅ Transformer les données
        const data = transformCourseDetails(rawData);
        logger.log("✅ Composant: Données transformées:", data);

        setCourseData(data);
        const initialEnrollmentCount =
          typeof data.course.enrollmentCount === "number" &&
          Number.isFinite(data.course.enrollmentCount)
            ? data.course.enrollmentCount
            : typeof data.course.studentsCount === "number" &&
                Number.isFinite(data.course.studentsCount)
              ? data.course.studentsCount
              : null;
        setEnrollmentCount(initialEnrollmentCount);

        const courseIsFree =
          data.course.price === 0 || data.course.isFree === true;
        setIsFree(courseIsFree);

        // ✅ Utiliser isEnrolled depuis les données du cours si disponible
        if (data.course.isEnrolled !== undefined) {
          logger.log(`✅ Statut d'inscription depuis le backend: ${data.course.isEnrolled}`);
          setIsEnrolled(data.course.isEnrolled);
          setIsPaid(data.course.isEnrolled);
          setEnrollmentCheckComplete(true);
        }

        if (data.modules && data.modules.length > 0) {
          // ✅ Ouvrir le premier module par défaut UNIQUEMENT sur desktop
          // Sur mobile, on garde tous les modules fermés
          const initialExpanded = isMobile
            ? new Set<string>()
            : new Set([data.modules[0].id]);
          setExpandedModules(initialExpanded);
        }
      } catch (err) {
        logger.error("❌ Composant: Erreur lors du chargement:", err);
        setError("Impossible de charger les détails du cours");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId, isMobile]);

  useEffect(() => {
    const courseInfo = courseData?.course;
    if (!courseInfo?.id || !courseInfo?.title) return;

    let isMounted = true;

    const fetchEnrollmentCount = async () => {
      try {
        const result = await CoursesApi.getCourses(1, 100, {
          query: courseInfo.title,
          userRole: user?.role,
        });

        let match = result.courses.find(
          (course) => course.id === courseInfo.id,
        );

        if (!match && courseInfo.title) {
          const fallbackResult = await CoursesApi.getCourses(1, 200, {
            userRole: user?.role,
          });
          match = fallbackResult.courses.find(
            (course) => course.id === courseInfo.id,
          );
        }

        const count =
          typeof match?.enrollmentCount === "number" &&
          Number.isFinite(match.enrollmentCount)
            ? match.enrollmentCount
            : null;

        if (isMounted) {
          setEnrollmentCount(count);
        }
      } catch (error) {
        logger.warn(
          "⚠️ [CourseDetails] Impossible de récupérer enrollmentCount via search:",
          error,
        );
      }
    };

    void fetchEnrollmentCount();

    return () => {
      isMounted = false;
    };
  }, [
    courseData?.course?.id,
    courseData?.course?.title,
    user?.role,
  ]);

  // Vérifier le statut d'inscription au chargement et quand l'utilisateur change
  useEffect(() => {
    const checkEnrollmentStatus = async () => {
      // ✅ EMPÊCHER LES REQUÊTES MULTIPLES
      if (enrollmentCheckComplete) {
        logger.log("⚠️ Vérification d'inscription déjà effectuée, skip");
        return;
      }

      if (!user?.id || !courseId) {
        logger.log(
          "ℹ️ Pas d'utilisateur ou courseId, skip vérification inscription",
        );
        setIsEnrolled(false);
        setIsPaid(false);
        setEnrollmentCheckComplete(true);
        return;
      }

      // Valider le format du courseId avant de faire l'appel API
      if (!isValidUUID(courseId)) {
        logger.warn(`⚠️ Format de courseId invalide: ${courseId}`);
        setIsEnrolled(false);
        setIsPaid(false);
        setEnrollmentCheckComplete(true);
        return;
      }

      try {
        logger.log("🔍 Vérification statut d'inscription...");
        const isEnrolled = await CoursesApi.checkEnrollmentStatus(courseId);

        if (isEnrolled) {
          logger.log("✅ Utilisateur déjà inscrit au cours");
          setIsEnrolled(true);
          setIsPaid(true);
        } else {
          logger.log("ℹ️ Utilisateur non inscrit - accès limité au contenu");
          setIsEnrolled(false);
          setIsPaid(false);
        }
      } catch (error) {
        logger.error("❌ Erreur vérification inscription:", error);
        // En cas d'erreur, considérer comme non inscrit pour sécurité
        setIsEnrolled(false);
        setIsPaid(false);
      } finally {
        // ✅ Marque la vérification comme terminée
        setEnrollmentCheckComplete(true);
      }
    };

    checkEnrollmentStatus();
  }, [courseId, user?.id, enrollmentCheckComplete]);

  useEffect(() => {
    const fetchProgress = async () => {
      // Ne pas bloquer si isEnrolled est false au démarrage
      if (!courseId) return;
      if (!(isEnrolled === true || isAdmin)) {
        logger.log("ℹ️ Skip fetchProgress: utilisateur non inscrit");
        setLessonProgress({});
        return;
      }

      // Valider le format du courseId avant de faire l'appel API
      if (!isValidUUID(courseId)) {
        logger.warn(`⚠️ Format de courseId invalide: ${courseId}`);
        setLessonProgress({});
        return;
      }

      try {
        logger.log("📥 Tentative de chargement de la progression...");

        const response = await fetch(
          buildApiUrl(API_ENDPOINTS.COURSES.PROGRESS(courseId)),
          { credentials: "include" },
        );

        if (response.ok) {
          const data = await response.json();
          logger.log("✅ Progression récupérée depuis l'API:", data);

          // Transformer les données en format { lessonId: completed }
          const progress: Record<string, boolean> = {};
          if (data.lessonsProgress) {
            data.lessonsProgress.forEach((moduleProgress: any) => {
              moduleProgress.lessons.forEach((lessonProgress: any) => {
                progress[lessonProgress.lessonId] =
                  lessonProgress.status === "COMPLETED";
              });
            });
          }

          logger.log("💾 Progression transformée:", progress);
          setLessonProgress(progress);
        } else if (response.status === 400) {
          // Erreur de validation - ID invalide
          logger.warn("⚠️ Erreur de validation du courseId");
          setLessonProgress({});
          // Ne pas définir error state pour ce cas - c'est normal si non inscrit
        } else if (response.status === 404 || response.status === 403) {
          logger.log("ℹ️ Aucune progression trouvée (normal si non inscrit)");
          setLessonProgress({});
        } else if (response.status === 500) {
          // Vérifier si c'est une erreur "not enrolled"
          try {
            const errorData = await response.json();
            if (
              errorData.message &&
              errorData.message.includes("not enrolled")
            ) {
              logger.log("ℹ️ Utilisateur non inscrit, progression vide");
              setLessonProgress({});
              setIsEnrolled(false);
              return;
            }
            if (errorData.errorCode === "VALIDATION_FAILED") {
              logger.log("⚠️ Erreur de validation backend, progression vide");
              setLessonProgress({});
              return;
            }
          } catch (e) {
            // Ignore
          }
          logger.error("❌ Erreur récupération progression:", response.status);
          setLessonProgress({});
        } else {
          logger.error("❌ Erreur récupération progression:", response.status);
          setLessonProgress({});
        }
      } catch (error) {
        logger.error("💥 Erreur lors du chargement de la progression:", error);
        setLessonProgress({});
      }
    };

    // Attendre que le statut d'inscription soit vérifié
    // On lance fetchProgress après checkEnrollmentStatus
    if (isEnrolled !== undefined) {
      fetchProgress();
    }
  }, [courseId, isEnrolled, isAdmin]);

  useEffect(() => {
    lessonProgressRef.current = lessonProgress;
    Object.entries(lessonProgress).forEach(([lessonId, completed]) => {
      if (completed) {
        syncedCompletedLessonsRef.current.add(lessonId);
        lessonMaxProgressRef.current[lessonId] = 1;
        lessonLastReportedProgressRef.current[lessonId] = 1;
      }
    });
  }, [lessonProgress]);

  // Détecter et gérer automatiquement les modules terminés
  useEffect(() => {
    if (!courseData?.modules?.length) return;

    const newCompletedModules = new Set<string>();

    courseData.modules.forEach((module) => {
      const moduleLessons = module.lessons.filter((l) => l.hasVideo);
      const allLessonsCompleted = moduleLessons.every(
        (lesson) => lessonProgress[lesson.id],
      );

      if (allLessonsCompleted && moduleLessons.length > 0) {
        newCompletedModules.add(module.id);
      }
    });

    // Auto-collapse des modules terminés (sauf si l'utilisateur les a manuellement ouverts)
    setExpandedModules((prev) => {
      const newExpanded = new Set(prev);
      newCompletedModules.forEach((moduleId) => {
        if (!newExpanded.has(moduleId)) {
          // Le module est terminé et n'était pas ouvert, on le laisse fermé
          newExpanded.delete(moduleId);
        }
      });
      return newExpanded;
    });
  }, [lessonProgress, courseData?.modules]);

  // Vérifier l'existence des quiz pour les modules ouverts (affichés)
  useEffect(() => {
    if (!courseData?.modules?.length || !isEnrolled) return;

    const checkQuizzesForExpandedModules = async () => {
      const modulesToCheck = courseData.modules.filter((module) => {
        if (!expandedModules.has(module.id)) return false;
        if (module.quiz?.length) return false;
        if (moduleQuizzes[module.id] !== undefined) return false;
        if (checkingQuizzes.has(module.id)) return false;
        return true;
      });

      for (const module of modulesToCheck) {
        await checkQuizExists(module.id);
      }
    };

    checkQuizzesForExpandedModules();
  }, [courseData?.modules, expandedModules, isEnrolled, moduleQuizzes, checkingQuizzes]);

  // ✅ NOUVEAU: Détection retour paiement Paydunya
  useEffect(() => {
    const detectPaymentReturn = async () => {
      const paymentTypeParam = (
        searchParams.get("paymentType") || searchParams.get("payment_type") || ""
      ).toLowerCase();
      const paymentToken = searchParams.get("token");
      const paymentStatus = (searchParams.get("payment_status") || "").toLowerCase();
      const statusParam = (searchParams.get("status") || "").toLowerCase();
      const successParam = (searchParams.get("success") || "").toLowerCase();
      const cancelledParam = (searchParams.get("cancelled") || "").toLowerCase();
      const txRef = searchParams.get("tx_ref");
      const transactionId = searchParams.get("transaction_id");
      const pending = restorePendingEnrollment();
      const pendingMatchesCourse = pending?.courseId === courseId;
      const hasPendingCertificationContext = courseId
        ? hasPendingCertificationClaim(courseId)
        : false;
      const paymentType: PaymentType =
        paymentTypeParam === "certification"
          ? "certification"
          : paymentTypeParam === "course"
            ? "course"
            : pendingMatchesCourse
              ? "course"
              : hasPendingCertificationContext
                ? "certification"
                : "course";

      const normalizePaymentStatus = (payload: any): string => {
        return String(
          payload?.status ||
            payload?.paymentStatus ||
            payload?.payment_status ||
            payload?.data?.status ||
            payload?.result?.status ||
            "",
        ).toUpperCase();
      };

      const isPaymentConfirmedStatus = (status: string): boolean =>
        ["SUCCESS", "SUCCEEDED", "COMPLETED", "ACTIVE", "PAID", "APPROVED"].includes(
          status,
        );

      const isPaymentFailedStatus = (status: string): boolean =>
        ["FAILED", "CANCELLED", "CANCELED", "EXPIRED", "REJECTED"].includes(status);

      const isCancelledReturn =
        cancelledParam === "true" ||
        successParam === "false" ||
        statusParam === "cancelled" ||
        statusParam === "canceled" ||
        paymentStatus === "cancelled" ||
        paymentStatus === "canceled" ||
        statusParam === "failed" ||
        paymentStatus === "failed";

      if (courseId && isCancelledReturn) {
        const cancelKey = `${courseId}:${paymentType}:cancelled:${paymentToken || txRef || transactionId || "return"}`;
        if (handledPaymentReturnRef.current.has(cancelKey)) {
          return;
        }
        handledPaymentReturnRef.current.add(cancelKey);

        clearPendingEnrollment();
        if (paymentType === "certification") {
          clearPendingCertificationClaim(courseId);
        }
        setPaymentNotice({
          type: "warning",
          paymentType,
          title:
            paymentType === "certification"
              ? "Paiement certification annulé"
              : "Paiement cours annulé",
          message:
            paymentType === "certification"
              ? "Le paiement de certification a été annulé. Vous pouvez relancer l'achat de la certification."
              : "Paiement annulé. Votre inscription n'a pas été finalisée. Vous pouvez relancer le paiement quand vous voulez.",
        });

        if (typeof window !== "undefined") {
          window.history.replaceState({}, "", `/course-details/${courseId}`);
        }
        return;
      }

      // Détecter paramètres Paydunya dans l'URL
      const hasPaymentReturn =
        successParam === "true" ||
        statusParam === "completed" ||
        statusParam === "success" ||
        paymentStatus === "completed" ||
        paymentStatus === "success" ||
        Boolean(txRef) ||
        Boolean(transactionId) ||
        Boolean(paymentToken);

      if (hasPaymentReturn && courseId) {
        const returnKey = `${courseId}:${paymentType}:${paymentToken || txRef || transactionId || "return"}`;
        if (handledPaymentReturnRef.current.has(returnKey)) {
          logger.log("ℹ️ Retour paiement déjà traité, skip", { returnKey });
          return;
        }
        handledPaymentReturnRef.current.add(returnKey);

        logger.log("🔄 Retour paiement Paydunya détecté", {
          courseId,
          paymentToken,
          paymentStatus,
          successParam,
          txRef,
          transactionId,
        });

        if (!pendingMatchesCourse && !paymentToken && paymentType !== "certification") {
          logger.log("ℹ️ Aucun contexte pending/token pour confirmer le paiement");
          return;
        }

        let paymentConfirmed =
          successParam === "true" ||
          statusParam === "completed" ||
          statusParam === "success" ||
          paymentStatus === "completed" ||
          paymentStatus === "success";

        try {
          if (paymentToken) {
            logger.log("🔍 Vérification token PayDunya avec polling...");
            for (let attempt = 1; attempt <= 12; attempt++) {
              const verification = await verifyPayment(paymentToken);
              const status = normalizePaymentStatus(verification);
              logger.log("🔍 Résultat verifyPayment", {
                attempt,
                status,
                verification,
              });

              if (isPaymentConfirmedStatus(status)) {
                paymentConfirmed = true;
                logger.log("✅ Paiement confirmé par verifyPayment", {
                  attempt,
                  status,
                });
                break;
              }

              if (isPaymentFailedStatus(status)) {
                paymentConfirmed = false;
                logger.error("❌ Paiement rejeté/échoué", { attempt, status });
                break;
              }

              await new Promise((resolve) => setTimeout(resolve, 1500));
            }
          }
        } catch (error) {
          logger.error("❌ verifyPayment a échoué:", error);
        }

        if (paymentType === "certification") {
          try {
            if (!paymentConfirmed) {
              setPaymentNotice({
                type: "warning",
                paymentType: "certification",
                title: "Paiement certification non confirmé",
                message:
                  "Le paiement de certification n'a pas encore été confirmé. Veuillez réessayer dans quelques instants.",
              });
              return;
            }

            let certificateUrl: string | null = null;
            for (let attempt = 1; attempt <= 12; attempt++) {
              const claim = await QuizApi.claimCertificationCertificate(courseId);
              const issued = Boolean(claim.isIssued && claim.certificateUrl);

              if (issued && claim.certificateUrl) {
                certificateUrl = claim.certificateUrl;
                break;
              }

              const stillPendingPayment =
                claim.paymentRequired &&
                (claim.paymentStatus || "").toUpperCase() === "PENDING";
              if (!stillPendingPayment) {
                break;
              }

              await new Promise((resolve) => setTimeout(resolve, 1500));
            }

            if (certificateUrl) {
              clearPendingEnrollment();
              clearPendingCertificationClaim(courseId);
              setPaymentNotice({
                type: "success",
                paymentType: "certification",
                title: "Achat de certification réussi",
                message:
                  "Votre certificat est prêt. Vous pouvez le télécharger maintenant.",
                actionLabel: "Télécharger ma certification",
                actionUrl: certificateUrl,
              });
            } else {
              setPaymentNotice({
                type: "info",
                paymentType: "certification",
                title: "Achat de certification réussi",
                message:
                  "Paiement confirmé. Le certificat est en cours de génération, veuillez réessayer dans un instant.",
              });
            }
          } catch (error) {
            logger.error("❌ Erreur vérification claim certificat:", error);
            setPaymentNotice({
              type: "warning",
              paymentType: "certification",
              title: "Erreur de vérification certification",
              message:
                "Le paiement est revenu, mais le certificat n'a pas pu être confirmé immédiatement.",
            });
          } finally {
            if (typeof window !== "undefined") {
              window.history.replaceState({}, "", `/course-details/${courseId}`);
            }
          }
          return;
        }

        logger.log("🔍 Vérification inscription après paiement...");
        if (paymentConfirmed) {
          logger.log("✅ Déblocage immédiat côté UI après confirmation paiement");
          setIsEnrolled(true);
          setIsPaid(true);
          setEnrollmentCheckComplete(true);
        }

        try {
          let isNowEnrolled = false;
          for (let attempt = 1; attempt <= 12; attempt++) {
            isNowEnrolled = await CoursesApi.checkEnrollmentStatus(courseId);
            logger.log("🔍 Tentative check enrollment post-paiement", {
              attempt,
              isNowEnrolled,
            });
            if (isNowEnrolled) break;
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }

          if (isNowEnrolled) {
            logger.log("✅ Inscription confirmée après paiement !");
            setIsEnrolled(true);
            setIsPaid(true);
            setEnrollmentCheckComplete(true);
            clearPendingEnrollment();
            setPaymentNotice({
              type: "success",
              paymentType: "course",
              title: "Achat du cours réussi",
              message: "Votre cours est maintenant accessible.",
            });

            Swal.fire({
              title: "Paiement confirmé! 🎉",
              text: "Votre cours est maintenant accessible. Bon apprentissage !",
              icon: "success",
              timer: 3000,
              confirmButtonColor: "#6366f1",
            });

            if (isMobile) {
              setTimeout(() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }, 500);
            }
          } else {
            logger.warn(
                "⚠️ Paiement retourné mais inscription non active après retries",
                { courseId, paymentToken, pending, paymentConfirmed },
              );
              setPaymentNotice({
                type: "info",
                paymentType: "course",
                title: "Achat du cours en cours de confirmation",
                message:
                  "Votre paiement est reçu. L'activation du cours peut prendre quelques instants.",
              });

              Swal.fire({
                title: "Paiement en cours de confirmation",
              text: "Votre paiement est reçu. L'activation du cours peut prendre quelques instants.",
              icon: "info",
              confirmButtonColor: "#6366f1",
            });
          }
        } catch (error) {
          logger.error("❌ Erreur vérification post-paiement:", error);
        } finally {
          // Nettoyer URL
          if (typeof window !== "undefined") {
            window.history.replaceState({}, "", `/course-details/${courseId}`);
          }
        }
      }
    };

    detectPaymentReturn();
  }, [searchParams, courseId, isMobile, verifyPayment]);

  const updateCourseDetailsUrl = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      updater(params);
      const nextQuery = params.toString();
      const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      router.replace(nextUrl, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setQuizViewInUrl = useCallback(
    (moduleId: string, mode: "module" | "certification") => {
      updateCourseDetailsUrl((params) => {
        params.set("view", "quiz");
        params.set("moduleId", moduleId);
        params.set("quizMode", mode);
      });
    },
    [updateCourseDetailsUrl],
  );

  const clearQuizViewInUrl = useCallback(() => {
    updateCourseDetailsUrl((params) => {
      params.delete("view");
      params.delete("moduleId");
      params.delete("quizMode");
    });
  }, [updateCourseDetailsUrl]);

  const exitQuizView = useCallback(() => {
    clearQuizViewInUrl();
    setContentMode("video");
    setActiveQuizModuleId(null);
    setActiveQuizMode("module");
    setActiveTab("videos");
    if (isMobile) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    }
  }, [clearQuizViewInUrl, isMobile]);

  useEffect(() => {
    const viewParam = (searchParams.get("view") || "").toLowerCase();
    const moduleIdParam = searchParams.get("moduleId");
    const quizModeParam = (searchParams.get("quizMode") || "").toLowerCase();
    const quizMode: "module" | "certification" =
      quizModeParam === "certification" ? "certification" : "module";

    if (viewParam === "quiz" && moduleIdParam) {
      if (
        contentMode !== "quiz" ||
        activeQuizModuleId !== moduleIdParam ||
        activeQuizMode !== quizMode
      ) {
        setContentMode("quiz");
        setActiveQuizModuleId(moduleIdParam);
        setActiveQuizMode(quizMode);
        setActiveTab("videos");
        if (isMobile) {
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }, 100);
        }
      }
      return;
    }

    if (contentMode === "quiz") {
      setContentMode("video");
      setActiveQuizModuleId(null);
      setActiveQuizMode("module");
      setActiveTab("videos");
    }
  }, [
    activeQuizMode,
    activeQuizModuleId,
    contentMode,
    isMobile,
    searchParams,
  ]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const openCoursePlayer = useCallback(() => {
    clearQuizViewInUrl();
    setActiveQuizModuleId(null);
    setActiveQuizMode("module");
    setContentMode("video");
    setActiveTab("videos");
    if (isMobile) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    }
  }, [clearQuizViewInUrl, isMobile]);

  // Gestion du suivi du cours (inscription ou redirection paiement)
  const handleFollowCourse = async () => {
    if (!courseId) return;

    // ✅ EMPÊCHER LES REQUÊTES MULTIPLES
    if (enrolling) {
      logger.log("⚠️ Inscription déjà en cours, ignore");
      return;
    }

    try {
      setEnrolling(true);

      // ✅ Vérifier d'abord si l'utilisateur est déjà inscrit (double vérification)
      const alreadyEnrolled = await CoursesApi.checkEnrollmentStatus(courseId);
      if (alreadyEnrolled) {
        logger.log("✅ Utilisateur déjà inscrit à ce cours");
        setIsEnrolled(true);
        setIsPaid(true);
        openCoursePlayer();
        return;
      }

      // ✅ Tentative d'inscription avec idempotence
      const result = await CoursesApi.followCourse(courseId);

      // ✅ GESTION DES DIFFÉRENTS RÉSULTATS
      if (result.status === "DUPLICATE") {
        // L'inscription existe déjà (ou a été créée entre-temps)
        logger.log("⚠️ Inscription duplicate, vérification de l'état...");

        // Vérifier si l'utilisateur est maintenant inscrit
        const checkResult = await CoursesApi.checkEnrollmentStatus(courseId);
        if (checkResult) {
          setIsEnrolled(true);
          setIsPaid(true);
          openCoursePlayer();
          return;
        }
      }

      if (result && "payment_url" in result && result.payment_url) {
        // 🔄 Redirection vers le paiement (cours payant)
        const paymentUrl = withPaymentType(result.payment_url, "course");
        logger.log("💳 Redirection vers Paydunya:", paymentUrl);
        // 🔐 CRITIQUE: Sauvegarder état AVANT redirection
        savePendingEnrollment(courseId, user?.id);
        window.location.href = paymentUrl;
      } else if (result && result.course && result.status === "ACTIVE") {
        // ✅ Inscription réussie (cours gratuit)
        logger.log("✅ Inscription réussie pour cours gratuit");
        setIsEnrolled(true);
        setIsPaid(true);
        openCoursePlayer();
      } else {
        // ❓ Cas inattendu
        logger.warn("⚠️ Réponse inattendue de l'API:", result);
        throw new Error("Réponse inattendue du serveur");
      }
    } catch (error) {
      logger.error("❌ Erreur lors du suivi du cours:", error);

      // ✅ Vérifier si l'erreur est due à une duplication
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes("409") ||
        errorMessage.includes("duplicate") ||
        errorMessage.includes("already enrolled")
      ) {
        logger.log(
          "⚠️ Inscription duplicate détectée, vérification de l'état...",
        );

        // Vérifier si l'utilisateur est maintenant inscrit
        const checkResult = await CoursesApi.checkEnrollmentStatus(courseId);
        if (checkResult) {
          logger.log("✅ Utilisateur déjà inscrit (confirmation)");
          setIsEnrolled(true);
          setIsPaid(true);
          openCoursePlayer();
          return;
        }
      }

      // Gestion spécifique des erreurs
      let displayMessage = "Impossible de suivre ce cours. Veuillez réessayer.";
      if (errorMessage.includes("403")) {
        displayMessage = "Accès refusé. Vérifiez vos permissions.";
      } else if (errorMessage.includes("500")) {
        displayMessage = "Erreur serveur. Veuillez réessayer plus tard.";
      } else if (
        errorMessage.includes("network") ||
        errorMessage.includes("fetch")
      ) {
        displayMessage =
          "Erreur de connexion. Vérifiez votre connexion internet.";
      }

      Swal.fire({
        title: "Erreur",
        text: displayMessage,
        icon: "error",
        confirmButtonText: "Fermer",
        confirmButtonColor: "#6366f1",
      });
    } finally {
      setEnrolling(false);
    }
  };

  // Vérifier s'il y a un paiement en cours pour ce cours
  const checkPendingPayment = async (
    courseId: string,
  ): Promise<string | null> => {
    try {
      logger.log(
        `🔍 Vérification paiement en cours pour le cours ${courseId}`,
      );
      // Cette fonction pourrait appeler une API dédiée si nécessaire
      // Pour l'instant, on s'appuie sur la logique backend
      return null; // Le backend gère cette logique
    } catch (error) {
      logger.error("❌ Erreur vérification paiement en cours:", error);
      return null;
    }
  };

  // Gestion du clic sur le bouton d'inscription/paiement
  const handleEnrollClick = async () => {
    // ✅ Vérification rapide avant de procéder
    if (isEnrolled === true) {
      openCoursePlayer();
      return;
    }

    await handleFollowCourse();
  };

  // Vérifier le statut d'inscription au chargement
  const checkEnrollmentStatus = async () => {
    // ✅ EMPÊCHER LES REQUÊTES MULTIPLES
    if (enrollmentCheckComplete) {
      logger.log("⚠️ checkEnrollmentStatus déjà effectué, skip");
      return;
    }

    if (!user?.id || !courseId) {
      logger.log(
        "ℹ️ Pas d'utilisateur ou courseId, skip vérification inscription",
      );
      setEnrollmentCheckComplete(true);
      return;
    }

    try {
      logger.log("🔍 Vérification statut d'inscription...");
      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.COURSES.FOLLOW(courseId)),
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (response.ok) {
        logger.log("✅ Utilisateur déjà inscrit au cours");
        setIsEnrolled(true);
        setIsPaid(true);
      } else {
        logger.log("ℹ️ Utilisateur non inscrit ou accès refusé");
        setIsEnrolled(false);
        setIsPaid(false);
      }
    } catch (error) {
      logger.log("ℹ️ Erreur vérification inscription:", error);
      setIsEnrolled(false);
      setIsPaid(false);
    } finally {
      setEnrollmentCheckComplete(true);
    }
  };

  const modules = courseData?.modules || [];
  const course = courseData?.course;
  const isCertifying = Boolean(course?.isCertifying);
  const certificationConfigured =
    Boolean(course?.quizId) || course?.quizStatus === "CONFIGURED";
  const sortedModules = useMemo(
    () => [...modules].sort((a, b) => a.orderIndex - b.orderIndex),
    [modules],
  );
  const lastModuleId = sortedModules[sortedModules.length - 1]?.id;

  useEffect(() => {
    if (!courseId || !isCertifying) {
      setCertificationQuiz(null);
      setHasCertificationQuiz(false);
      return;
    }

    // Se baser d'abord sur les infos du cours
    setHasCertificationQuiz(certificationConfigured);

    if (!certificationConfigured) {
      setCertificationQuiz(null);
      return;
    }

    const fetchCertificationQuiz = async () => {
      setCertificationQuizLoading(true);
      try {
        const data = await QuizApi.getCertificationQuiz(courseId);
        setCertificationQuiz(data.quiz ?? null);
      } catch (error) {
        logger.warn(
          " Quiz de certification indisponible pour ce cours:",
          error,
        );
        setCertificationQuiz(null);
      } finally {
        setCertificationQuizLoading(false);
      }
    };

    fetchCertificationQuiz();
  }, [courseId, isCertifying, certificationConfigured]);

  // ✅ Helper: Obtenir le quiz d'un module
  const getModuleQuiz = (moduleId: string): Quiz | undefined => {
    const module = courseData?.modules.find((m) => m.id === moduleId);
    return module?.quiz?.[0]; // Prendre le premier quiz du module
  };

  // ✅ Vérifier si un quiz existe pour un module
  const hasQuizForModule = (moduleId: string): boolean => {
    if (moduleQuizzes[moduleId] !== undefined) {
      return moduleQuizzes[moduleId];
    }
    return Boolean(getModuleQuiz(moduleId));
  };

  const lessonsWithVideos = useMemo(() => {
    if (!courseData?.modules) return [];

    return courseData.modules
      .flatMap((module) =>
        module.lessons.map((lesson) => ({
          ...lesson,
          moduleId: module.id,
          moduleOrderIndex: module.orderIndex,
        })), 
      )
      .filter((lesson) => lesson.hasVideo)
      .sort((a, b) => {
        if (a.moduleOrderIndex !== b.moduleOrderIndex) {
          return a.moduleOrderIndex - b.moduleOrderIndex;
        }
        return a.orderIndex - b.orderIndex;
      });
  }, [courseData]);

  const selectedLesson = useMemo(() => {
    return lessonsWithVideos[currentLessonIndex] || null;
  }, [lessonsWithVideos, currentLessonIndex]);

  const lessonIdParam = searchParams.get("lessonId") || searchParams.get("lesson");

  useEffect(() => {
    if (initialLessonSelectionRef.current) return;
    if (!lessonsWithVideos.length) return;

    let targetLessonId = lessonIdParam;

    if (!targetLessonId && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("last_activity");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.courseId === courseId && parsed?.lessonId) {
            targetLessonId = parsed.lessonId;
          }
        }
      } catch (error) {
        logger.warn("⚠️ Impossible de lire last_activity:", error);
      }
    }

    if (targetLessonId) {
      const targetIndex = lessonsWithVideos.findIndex(
        (lesson) => lesson.id === targetLessonId,
      );
      if (targetIndex >= 0) {
        setCurrentLessonIndex(targetIndex);
        initialLessonSelectionRef.current = true;
        return;
      }

      logger.warn("⚠️ lessonId non trouvé dans le cours:", {
        lessonId: targetLessonId,
        courseId,
      });
    }

    setCurrentLessonIndex(0);
    initialLessonSelectionRef.current = true;
  }, [courseId, lessonIdParam, lessonsWithVideos]);

  // Update selectedLessonId when currentLessonIndex changes
  useEffect(() => {
    const lesson = lessonsWithVideos[currentLessonIndex];
    if (!lesson) return;
    setSelectedLessonId(lesson.id);
  }, [currentLessonIndex, lessonsWithVideos]);
  
  const handleVideoEnd = useCallback(() => {
    if (
      currentLessonIndex >= 0 &&
      currentLessonIndex < lessonsWithVideos.length - 1
    ) {
      setCurrentLessonIndex(currentLessonIndex + 1);
      if (isMobile) {
        setTimeout(() => {
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        }, 100);
      }
    }
  }, [lessonsWithVideos, currentLessonIndex, isMobile]);

  const handlePreviousLesson = useCallback(() => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
      setContentMode("video");
      setActiveQuizModuleId(null);
      setActiveQuizMode("module");
      setActiveTab("videos");
      if (isMobile) {
        setTimeout(() => {
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        }, 100);
      }
    }
  }, [currentLessonIndex, isMobile]);

  // ✅ Handler quiz complété
  const handleQuizCompleted = useCallback((passed: boolean, score: number) => {
    logger.log(`Quiz terminé: ${passed ? "Réussi" : "Échoué"} avec ${score}%`);
  }, []);

  const checkQuizExists = async (moduleId: string): Promise<boolean> => {
    if (moduleQuizzes[moduleId] !== undefined) {
      return moduleQuizzes[moduleId];
    }

    if (checkingQuizzes.has(moduleId)) {
      return false; // Already checking
    }

    setCheckingQuizzes((prev) => new Set(prev).add(moduleId));

    try {
      logger.log(
        `🔍 Vérification de l'existence du quiz pour le module: ${moduleId}`,
      );
      const response = await fetch(
        buildApiUrl(`course/quiz/module/${moduleId}/questions`),
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (response.ok) {
        const data = await response.json();
        // Vérifier si le quiz existe réellement (pas null)
        const exists = data.quiz !== null && data.quiz !== undefined;
        setModuleQuizzes((prev) => ({ ...prev, [moduleId]: exists }));
        logger.log(
          `✅ Quiz ${exists ? "existe" : "n'existe pas"} pour le module ${moduleId}`,
        );
        return exists;
      } else {
        setModuleQuizzes((prev) => ({ ...prev, [moduleId]: false }));
        logger.log(
          `❌ Quiz n'existe pas pour le module ${moduleId} (réponse non-ok)`,
        );
        return false;
      }
    } catch (error) {
      logger.error(
        `❌ Erreur lors de la vérification du quiz pour le module ${moduleId}:`,
        error,
      );
      setModuleQuizzes((prev) => ({ ...prev, [moduleId]: false }));
      return false;
    } finally {
      setCheckingQuizzes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(moduleId);
        return newSet;
      });
    }
  };

  // ✅ Handler pour démarrer un quiz
  const handleStartQuiz = async (moduleId: string) => {
    logger.log("🎯 Démarrage du quiz pour le module:", moduleId);

    let quizAvailable = hasQuizForModule(moduleId);

    if (!quizAvailable && moduleQuizzes[moduleId] === undefined) {
      quizAvailable = await checkQuizExists(moduleId);
    }

    if (!quizAvailable) {
      Swal.fire({
        title: "Aucun quiz disponible",
        text: "Ce module n'a pas de quiz pour le moment.",
        icon: "info",
        confirmButtonText: "Compris",
        confirmButtonColor: "#6366f1",
      });
      return;
    }

    setActiveQuizModuleId(moduleId);
    setActiveQuizMode("module");
    setContentMode("quiz");
    setActiveTab("videos");
    setQuizViewInUrl(moduleId, "module");
    if (isMobile) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    }
  };

  // Gestion du clic sur un module
  const handleModuleClick = (moduleId: string) => {
    // Pour tous les utilisateurs, permettre l'expansion du module (aperçu)
    logger.log("Ouverture du module:", moduleId);
    toggleModule(moduleId);
  };

  const totalLessons = lessonsWithVideos.length;
  const totalCourseDurationFromLessons = lessonsWithVideos.reduce(
    (sum, lesson) => sum + (lesson.duration || 0),
    0,
  );
  const totalCourseDuration =
    totalCourseDurationFromLessons > 0
      ? totalCourseDurationFromLessons
      : course?.duration || 0;

  const getLevelLabel = (level: string) => {
    const levels: Record<string, string> = {
      BEGINNER: "Débutant",
      INTERMEDIATE: "Intermédiaire",
      ADVANCED: "Avancé",
    };
    return levels[level] || level;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
    if (hours > 0) return `${hours}h`;
    return `${mins}min`;
  };

  const getLegacyTrackingStorageKey = useCallback(
    (lessonId: string) => `course-progress-tracking:${courseId}:${lessonId}`,
    [courseId],
  );

  const getTrackingStorageKey = useCallback(
    (lessonId: string) => {
      if (!user?.id) {
        return getLegacyTrackingStorageKey(lessonId);
      }
      return `course-progress-tracking:${user.id}:${courseId}:${lessonId}`;
    },
    [courseId, getLegacyTrackingStorageKey, user?.id],
  );

  const readTrackingFromStorage = useCallback(
    (lessonId: string) => {
      if (typeof window === "undefined") return null;

      try {
        const primaryKey = getTrackingStorageKey(lessonId);
        const legacyKey = getLegacyTrackingStorageKey(lessonId);
        let raw = localStorage.getItem(primaryKey);

        if (!raw && !user?.id) {
          raw = localStorage.getItem(legacyKey);
        }

        if (!raw) return null;
        const parsed = JSON.parse(raw) as {
          maxProgress?: number;
          lastReportedProgress?: number;
          duration?: number;
          completed?: boolean;
        };

        return {
          maxProgress:
            typeof parsed.maxProgress === "number" &&
            parsed.maxProgress >= 0 &&
            parsed.maxProgress <= 1
              ? parsed.maxProgress
              : 0,
          lastReportedProgress:
            typeof parsed.lastReportedProgress === "number" &&
            parsed.lastReportedProgress >= 0 &&
            parsed.lastReportedProgress <= 1
              ? parsed.lastReportedProgress
              : 0,
          duration:
            typeof parsed.duration === "number" && parsed.duration > 0
              ? parsed.duration
              : 0,
          completed: parsed.completed === true,
        };
      } catch (error) {
        logger.error("Erreur lecture tracking localStorage:", error);
        return null;
      }
    },
    [getLegacyTrackingStorageKey, getTrackingStorageKey, user?.id],
  );

  const persistTrackingToStorage = useCallback(
    (
      lessonId: string,
      payload: {
        duration: number;
        maxProgress: number;
        completed: boolean;
        lastReportedProgress: number;
      },
    ) => {
      if (typeof window === "undefined") return;

      try {
        const primaryKey = getTrackingStorageKey(lessonId);
        localStorage.setItem(
          primaryKey,
          JSON.stringify({
            duration: payload.duration,
            maxProgress: payload.maxProgress,
            completed: payload.completed,
            lastReportedProgress: payload.lastReportedProgress,
            updatedAt: Date.now(),
          }),
        );

        if (user?.id) {
          const legacyKey = getLegacyTrackingStorageKey(lessonId);
          if (legacyKey !== primaryKey) {
            localStorage.removeItem(legacyKey);
          }
        }
      } catch (error) {
        logger.error("Erreur sauvegarde tracking localStorage:", error);
      }
    },
    [getLegacyTrackingStorageKey, getTrackingStorageKey, user?.id],
  );

  const markLessonCompletedAutomatically = useCallback(
    async (
      lessonId: string,
      options?: {
        forceComplete?: boolean;
        source?: string;
      },
    ) => {
      if (!lessonId) return;
      if (completionInFlightRef.current.has(lessonId)) return;
      if (
        syncedCompletedLessonsRef.current.has(lessonId) &&
        lessonProgressRef.current[lessonId]
      ) {
        return;
      }

      completionInFlightRef.current.add(lessonId);
      try {
        let marked = false;
        let lastError: unknown = null;

        // Endpoint principal déjà utilisé ailleurs dans l'app.
        try {
          await CoursesApi.markLessonCompleted(lessonId, {
            forceComplete: options?.forceComplete === true,
          });
          marked = true;
          logger.log("✅ [TRACKING] complétion via CoursesApi.markLessonCompleted", {
            lessonId,
            source: options?.source || "unknown",
            forceComplete: options?.forceComplete === true,
          });
        } catch (error) {
          lastError = error;
          logger.warn("⚠️ [TRACKING] endpoint principal a échoué, fallback...", {
            lessonId,
            source: options?.source || "unknown",
            forceComplete: options?.forceComplete === true,
            error,
          });
        }

        // Endpoint alternatif /course/lesson/complete/:lessonId
        if (!marked) {
          try {
            const alternateResponse = await fetch(
              buildApiUrl(`${API_ENDPOINTS.COURSES.LESSON_COMPLETE}/${lessonId}`),
              {
                method: "POST",
                credentials: "include",
              },
            );

            if (alternateResponse.ok || alternateResponse.status === 409) {
              marked = true;
              logger.log("✅ [TRACKING] complétion via endpoint alternatif", {
                lessonId,
                source: options?.source || "unknown",
                forceComplete: options?.forceComplete === true,
                status: alternateResponse.status,
              });
            }
          } catch (error) {
            lastError = error;
            logger.warn("⚠️ [TRACKING] endpoint alternatif a échoué", {
              lessonId,
              source: options?.source || "unknown",
              forceComplete: options?.forceComplete === true,
              error,
            });
          }
        }

        // Fallback sur l'autre route utilisée par certains environnements.
        if (!marked) {
          const fallbackPayload: Record<string, unknown> = {};
          if (options?.forceComplete === true) {
            fallbackPayload.forceComplete = true;
          }
          const hasFallbackBody = Object.keys(fallbackPayload).length > 0;

          const fallbackResponse = await fetch(
            buildApiUrl(API_ENDPOINTS.LESSONS.COMPLETE(lessonId)),
            {
              method: "POST",
              credentials: "include",
              headers: hasFallbackBody
                ? { "Content-Type": "application/json" }
                : undefined,
              body: hasFallbackBody
                ? JSON.stringify(fallbackPayload)
                : undefined,
            },
          );

          if (!fallbackResponse.ok && fallbackResponse.status !== 409) {
            const legacyPayload: Record<string, unknown> = { lessonId };
            if (options?.forceComplete === true) {
              legacyPayload.forceComplete = true;
            }

            const legacyResponse = await fetch(
              buildApiUrl("/course/mark-lesson-completed"),
              {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(legacyPayload),
              },
            );

            if (!legacyResponse.ok && legacyResponse.status !== 409) {
              logger.error("❌ Tracking auto: erreur marquage leçon", {
                lessonId,
                source: options?.source || "unknown",
                forceComplete: options?.forceComplete === true,
                fallbackStatus: fallbackResponse.status,
                legacyStatus: legacyResponse.status,
                lastError,
              });
              return;
            }

            logger.log("✅ [TRACKING] complétion via endpoint legacy", {
              lessonId,
              source: options?.source || "unknown",
              forceComplete: options?.forceComplete === true,
              status: legacyResponse.status,
            });
          } else {
            logger.log("✅ [TRACKING] complétion via endpoint fallback", {
              lessonId,
              source: options?.source || "unknown",
              forceComplete: options?.forceComplete === true,
              status: fallbackResponse.status,
            });
          }
        }

        logger.log("✅ [TRACKING] leçon marquée complétée", {
          lessonId,
          source: options?.source || "unknown",
          forceComplete: options?.forceComplete === true,
          status: "OK",
        });

        syncedCompletedLessonsRef.current.add(lessonId);
        setLessonProgress((prev) => ({
          ...prev,
          [lessonId]: true,
        }));

        const currentDuration = lessonDurationsRef.current[lessonId] || 0;
        const currentMaxProgress = Math.max(
          lessonMaxProgressRef.current[lessonId] || 0,
          1,
        );
        lessonMaxProgressRef.current[lessonId] = currentMaxProgress;
        lessonLastReportedProgressRef.current[lessonId] = 1;
        persistTrackingToStorage(
          lessonId,
          {
            duration: currentDuration,
            maxProgress: currentMaxProgress,
            completed: true,
            lastReportedProgress: 1,
          },
        );
      } catch (error) {
        logger.error("💥 Tracking auto: échec marquage leçon:", error);
      } finally {
        completionInFlightRef.current.delete(lessonId);
      }
    },
    [persistTrackingToStorage],
  );

  const handleManualLessonComplete = useCallback(
    (lessonId: string) => {
      if (!lessonId) return;
      if (!hasCourseAccess) return;
      void markLessonCompletedAutomatically(lessonId, {
        forceComplete: true,
        source: "manual_sidebar",
      });
    },
    [hasCourseAccess, markLessonCompletedAutomatically],
  );

  const handleVideoTrackingProgress = useCallback(
    ({ lessonId, fromTime, toTime, duration }: VideoProgressWindow) => {
      if (!lessonId) return;
      if (!Number.isFinite(duration) || duration <= 0) {
        logger.warn("[TRACKING] durée invalide, progression ignorée", {
          lessonId,
          fromTime,
          toTime,
          duration,
        });
        return;
      }

      const maxTime = Math.max(0, Math.max(fromTime, toTime));
      const currentProgress = Math.min(1, Math.max(0, maxTime / duration));

      if (typeof lessonMaxProgressRef.current[lessonId] !== "number") {
        const stored = readTrackingFromStorage(lessonId);
        lessonMaxProgressRef.current[lessonId] = stored?.maxProgress || 0;
        lessonLastReportedProgressRef.current[lessonId] =
          stored?.lastReportedProgress || 0;
        if (stored?.duration && stored.duration > 0) {
          lessonDurationsRef.current[lessonId] = stored.duration;
        }
        if (stored?.completed) {
          syncedCompletedLessonsRef.current.add(lessonId);
        }
      }

      const maxProgress = Math.max(
        lessonMaxProgressRef.current[lessonId] || 0,
        currentProgress,
      );
      lessonMaxProgressRef.current[lessonId] = maxProgress;
      lessonDurationsRef.current[lessonId] = duration;

      const isCompleted =
        lessonProgressRef.current[lessonId] ||
        syncedCompletedLessonsRef.current.has(lessonId);
      const previousReported = lessonLastReportedProgressRef.current[lessonId] || 0;
      const steppedProgress =
        Math.floor(maxProgress / TRACKING_PROGRESS_STEP) * TRACKING_PROGRESS_STEP;

      if (
        !isCompleted &&
        steppedProgress > previousReported &&
        steppedProgress < TRACKING_COMPLETION_THRESHOLD
      ) {
        lessonLastReportedProgressRef.current[lessonId] = steppedProgress;
        logger.log("[TRACKING] progression intermédiaire", {
          lessonId,
          progressPercent: Math.round(steppedProgress * 100),
          fromTime,
          toTime,
          duration,
        });
      }

      logger.log("[TRACKING] segment reçu", {
        lessonId,
        fromTime,
        toTime,
        duration,
        maxProgress: Number((maxProgress * 100).toFixed(2)),
        currentProgress: Number((currentProgress * 100).toFixed(2)),
        reportedProgress: Number(
          (lessonLastReportedProgressRef.current[lessonId] * 100).toFixed(2),
        ),
        isCompleted,
      });

      persistTrackingToStorage(lessonId, {
        duration,
        maxProgress,
        completed: isCompleted,
        lastReportedProgress:
          lessonLastReportedProgressRef.current[lessonId] || 0,
      });

      if (!isCompleted && maxProgress >= TRACKING_COMPLETION_THRESHOLD) {
        lessonLastReportedProgressRef.current[lessonId] = 1;
        logger.log("[TRACKING] seuil atteint, complétion auto", {
          lessonId,
          maxProgress: Number((maxProgress * 100).toFixed(2)),
          threshold: TRACKING_COMPLETION_THRESHOLD * 100,
          reason: "threshold_95_percent",
        });
        void markLessonCompletedAutomatically(lessonId, {
          forceComplete: true,
          source: "threshold_95_percent",
        });
      }
    },
    [
      markLessonCompletedAutomatically,
      persistTrackingToStorage,
      readTrackingFromStorage,
    ],
  );

  const handleLessonVideoEnded = useCallback(() => {
    const lessonId = selectedLesson?.id;
    if (lessonId) {
      logger.log("[TRACKING] fin vidéo détectée, complétion forcée", {
        lessonId,
      });
      void markLessonCompletedAutomatically(lessonId, {
        forceComplete: true,
        source: "video_ended_event",
      });
    }
    handleVideoEnd();
  }, [handleVideoEnd, markLessonCompletedAutomatically, selectedLesson?.id]);

  const handleNextLesson = useCallback(() => {
    if (currentLessonIndex < lessonsWithVideos.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
      setContentMode("video");
      setActiveQuizModuleId(null);
      setActiveQuizMode("module");
      setActiveTab("videos");
      if (isMobile) {
        setTimeout(() => {
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        }, 100);
      }
    }
  }, [
    currentLessonIndex,
    isMobile,
    lessonsWithVideos,
  ]);

  useEffect(() => {
    if (!selectedLessonId) return;

    const stored = readTrackingFromStorage(selectedLessonId);
    if (!stored) return;

    lessonMaxProgressRef.current[selectedLessonId] = stored.maxProgress || 0;
    lessonLastReportedProgressRef.current[selectedLessonId] =
      stored.lastReportedProgress || 0;
    if (stored.duration > 0) {
      lessonDurationsRef.current[selectedLessonId] = stored.duration;
    }
    if (stored.completed) {
      syncedCompletedLessonsRef.current.add(selectedLessonId);
    }

    const alreadyCompleted = lessonProgressRef.current[selectedLessonId];
    if (
      !alreadyCompleted &&
      (stored.completed || stored.maxProgress >= TRACKING_COMPLETION_THRESHOLD)
    ) {
      void markLessonCompletedAutomatically(selectedLessonId, {
        forceComplete: true,
        source: "storage_recovery",
      });
    }
  }, [
    markLessonCompletedAutomatically,
    readTrackingFromStorage,
    selectedLessonId,
  ]);

  if (!courseId || courseId === "undefined") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-red-600 text-xl mb-4">ID de cours invalide</p>
          <button
            onClick={() => router.back()}
            className="text-indigo-600 hover:underline"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !courseData || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-red-600 text-xl mb-4">
            {error || "Cours introuvable"}
          </p>
          <button
            onClick={() => router.back()}
            className="text-indigo-600 hover:underline"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const hasVideo = !!selectedLesson?.hasVideo;
  const hasVideoContent = lessonsWithVideos.length > 0;
  const safeSelectedLesson = selectedLesson ?? lessonsWithVideos[0] ?? null;
  const selectedLessonVideoUrl =
    typeof safeSelectedLesson?.videoUrl === "string"
      ? safeSelectedLesson.videoUrl.trim()
      : "";
  const hasVideoFileExtension = /\.(mp4|m3u8|webm|ogg|mov)(\?|#|$)/i.test(
    selectedLessonVideoUrl,
  );
  const isKnownVideoProvider =
    selectedLessonVideoUrl.includes("mediadelivery.net") ||
    selectedLessonVideoUrl.includes("bunnycdn.com") ||
    selectedLessonVideoUrl.includes("youtube.com") ||
    selectedLessonVideoUrl.includes("youtu.be") ||
    selectedLessonVideoUrl.includes("vimeo.com") ||
    selectedLessonVideoUrl.includes("cloudinary.com");
  const isSameOriginAppUrl = (() => {
    if (!selectedLessonVideoUrl || typeof window === "undefined") return false;
    if (selectedLessonVideoUrl.startsWith("/")) return true;

    try {
      const parsed = new URL(selectedLessonVideoUrl);
      return parsed.origin === window.location.origin;
    } catch {
      return false;
    }
  })();
  const isInvalidDirectVideoUrl = (() => {
    if (!selectedLessonVideoUrl) return false;

    const lowerUrl = selectedLessonVideoUrl.toLowerCase();
    const isCoursePageLikeUrl =
      isSameOriginAppUrl &&
      !hasVideoFileExtension &&
      !isKnownVideoProvider;
    const isMaintenanceLikeUrl =
      isSameOriginAppUrl &&
      (lowerUrl.includes("maintenance") ||
        lowerUrl.includes("/courses") ||
        lowerUrl.includes("/course-details") ||
        lowerUrl.includes("/admin"));

    return isCoursePageLikeUrl || isMaintenanceLikeUrl;
  })();
  const shouldShowVideoUnavailableState =
    !safeSelectedLesson ||
    !hasVideo ||
    (selectedLessonVideoUrl && isInvalidDirectVideoUrl);

  const isLessonCompleted = (lessonId: string) => {
    return lessonProgress[lessonId] || false;
  };

  // ✅ Composant Sidebar réutilisable
  const LessonsSidebar = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border border-[#D1D7DC] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#D1D7DC] px-4 py-4">
        <h3 className="text-xl font-bold leading-6 text-[#1C1D1F]">
          Contenu du cours
        </h3>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le panneau contenu du cours"
            className="rounded-sm p-1 text-[#6A6F73] transition-colors duration-200 hover:bg-[#F7F9FA] hover:text-[#1C1D1F]"
          >
            <X className="h-5 w-5" />
          </button>
        ) : (
          <div className="h-7 w-7" />
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {sortedModules.map((module, moduleIndex) => {
          const isExpanded = expandedModules.has(module.id);
          const moduleQuiz = getModuleQuiz(module.id);
          const moduleHasQuiz = hasQuizForModule(module.id);
          const isLastModule = module.id === lastModuleId;
          const showCertificationQuiz =
            isCertifying && isLastModule && hasCertificationQuiz;
          const moduleLessons = [...module.lessons]
            .filter((l) => l.hasVideo)
            .sort((a, b) => a.orderIndex - b.orderIndex);
          const completedLessonsCount = moduleLessons.filter((lesson) =>
            isLessonCompleted(lesson.id),
          ).length;
          const totalModuleDuration = moduleLessons.reduce(
            (sum, l) => sum + l.duration,
            0,
          );

            return (
            <div key={module.id} className="border-b border-[#D1D7DC] last:border-b-0">
              <button
                onClick={() => handleModuleClick(module.id)}
                className={`w-full px-4 py-4 text-left transition-colors duration-150 ${
                  isExpanded ? "bg-[#F7F9FA]" : "bg-[#F7F9FA] hover:bg-[#EEF1F3]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold leading-6 text-[#1C1D1F]">
                      Section {moduleIndex + 1}: {module.title}
                    </p>
                    <p className="mt-1 text-xs text-[#6A6F73]">
                      {completedLessonsCount} / {moduleLessons.length}
                      {totalModuleDuration > 0
                        ? ` | ${formatDuration(totalModuleDuration)}`
                        : ""}
                    </p>
                  </div>
                  <ChevronDown
                    className={`mt-2 h-5 w-5 flex-shrink-0 text-[#6A6F73] transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {isExpanded && (
                <div className="bg-white">
                  {moduleLessons.map((lesson, lessonIndex) => {
                    const completed = isLessonCompleted(lesson.id);
                    const canManuallyComplete = hasCourseAccess && !completed;

                    return (
                      <div
                        key={lesson.id}
                        className={`border-t border-[#D1D7DC] transition-colors ${
                          selectedLessonId === lesson.id
                            ? "border-l-4 border-l-[#002c75] bg-[#EAF2FF]"
                            : "bg-white hover:bg-[#F7F9FA]"
                        }`}
                      >
                        <div className="flex flex-col gap-2 px-4 py-3">
                          <button
                            onClick={() => {
                              const lessonIndex = lessonsWithVideos.findIndex(
                                (l) => l.id === lesson.id,
                              );
                              if (lessonIndex !== -1) {
                                setCurrentLessonIndex(lessonIndex);
                                setContentMode("video");
                                setActiveQuizModuleId(null);
                                setActiveQuizMode("module");
                                setActiveTab("videos");
                              }
                              if (isMobile) {
                                window.scrollTo({
                                  top: 0,
                                  behavior: "smooth",
                                });
                              }
                            }}
                            className="flex items-start gap-3 text-left"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-sm leading-5 text-[#1C1D1F]">
                                {lessonIndex + 1}. {lesson.title}
                              </p>
                              <div className="mt-1 flex items-center gap-1 text-xs text-[#6A6F73]">
                                {isEnrolled ? (
                                  <PlayCircle className="h-4 w-4 flex-shrink-0" />
                                ) : (
                                  <Lock className="h-4 w-4 flex-shrink-0" />
                                )}
                                <span>
                                  {lesson.duration > 0
                                    ? formatDuration(lesson.duration)
                                    : "0min"}
                                </span>
                              </div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleManualLessonComplete(lesson.id)}
                            disabled={!hasCourseAccess || completed}
                            aria-label={
                              completed
                                ? "Leçon terminée"
                                : "Marquer la leçon comme terminée"
                            }
                            title={
                              completed
                                ? "Leçon terminée"
                                : "Marquer comme terminée"
                            }
                            className={`inline-flex items-center gap-2 text-xs font-medium transition-colors ${
                              completed
                                ? "text-[#6A6F73]"
                                : "text-[#002c75] hover:text-[#001f52]"
                            } ${canManuallyComplete ? "cursor-pointer" : "cursor-not-allowed"}`}
                          >
                            <span
                              className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
                                completed
                                  ? "border-[#3ECF8E] bg-[#3ECF8E]"
                                  : canManuallyComplete
                                    ? "border-[#6A6F73] bg-white hover:border-[#002c75] hover:bg-[#EAF2FF]"
                                    : "border-[#D1D7DC] bg-[#F7F9FA]"
                              }`}
                            >
                              {completed ? (
                                <Check className="h-3 w-3 text-white" />
                              ) : (
                                <span className="h-2 w-2 rounded-full border border-[#D1D7DC]" />
                              )}
                            </span>
                            <span>
                              {completed
                                ? "Marqué comme terminé"
                                : "Marquer comme terminé"}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {moduleHasQuiz && (
                    <div
                      className={`border-t border-[#D1D7DC] transition-colors ${
                        contentMode === "quiz" &&
                        activeQuizModuleId === module.id &&
                        activeQuizMode === "module"
                          ? "border-l-4 border-l-[#002c75] bg-[#EAF2FF]"
                          : "bg-white hover:bg-[#F7F9FA]"
                      }`}
                    >
                      <button
                        onClick={() => handleStartQuiz(module.id)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#1C1D1F]">
                            {moduleQuiz?.title
                              ? `Quiz noté : ${moduleQuiz.title}`
                              : "Défi du module : passez le quiz"}
                          </p>
                          <p className="text-xs text-[#6A6F73]">
                            Obligatoire pour valider et continuer
                          </p>
                        </div>
                      </button>
                    </div>
                  )}

                  {showCertificationQuiz && (
                    <div
                      className={`border-t border-[#D1D7DC] transition-colors ${
                        contentMode === "quiz" &&
                        activeQuizModuleId === module.id &&
                        activeQuizMode === "certification"
                          ? "border-l-4 border-l-[#002c75] bg-[#EAF2FF]"
                          : "bg-white hover:bg-[#F7F9FA]"
                      }`}
                    >
                      <button
                        onClick={() => {
                          if (certificationQuizLoading) return;
                          if (!hasCertificationQuiz) {
                            Swal.fire({
                              title: "Quiz de certification indisponible",
                              text: "Aucun quiz de certification n'est encore configuré pour ce cours.",
                              icon: "info",
                              confirmButtonText: "Compris",
                              confirmButtonColor: "#6366f1",
                            });
                            return;
                          }
                          setActiveQuizModuleId(module.id);
                          setActiveQuizMode("certification");
                          setContentMode("quiz");
                          setActiveTab("videos");
                          setQuizViewInUrl(module.id, "certification");
                          if (isMobile) {
                            setTimeout(() => {
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }, 100);
                          }
                        }}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#1C1D1F]">
                            {certificationQuiz?.title
                              ? `Quiz de certification : ${certificationQuiz.title}`
                              : "Quiz de certification"}
                          </p>
                          <p className="text-xs text-[#6A6F73]">
                            Obligatoire pour obtenir la certification
                          </p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            );
          })}
      </div>
    </div>
  );

  const completedLessonsCount = lessonsWithVideos.filter((lesson) =>
    isLessonCompleted(lesson.id),
  ).length;
  const progressPercent =
    totalLessons > 0
      ? Math.min(100, Math.round((completedLessonsCount / totalLessons) * 100))
      : 0;
  const totalQuizCount =
    typeof courseData?.quizCount === "number"
      ? courseData.quizCount
      : modules.reduce((sum, module) => sum + (module.quiz?.length || 0), 0);
  const hasAttachment = Boolean(
    course.attachment && course.attachment !== "undefined",
  );
  const attachmentUrl = hasAttachment ? course.attachment : null;
  const attachmentFilename = getAttachmentFilename(attachmentUrl);
  const levelLabel = getLevelLabel(course.level);
  const studentsCount =
    typeof enrollmentCount === "number" && Number.isFinite(enrollmentCount)
      ? enrollmentCount
      : typeof course.studentsCount === "number" &&
          Number.isFinite(course.studentsCount)
        ? course.studentsCount
        : typeof course.enrollmentCount === "number" &&
            Number.isFinite(course.enrollmentCount)
          ? course.enrollmentCount
          : 0;

  const normalizedLearningPoints = modules
    .flatMap((module) => {
      const modulePoints = module.lessons
        .filter((lesson) => lesson.hasVideo)
        .slice(0, 4)
        .map((lesson) => {
          const trimmed = lesson.content?.trim();
          if (trimmed && trimmed.length >= 20) {
            return trimmed;
          }
          return `Maîtriser ${lesson.title || "les concepts clés de la leçon"}`;
        });

      if (module.description?.trim()) {
        modulePoints.unshift(module.description.trim());
      }

      return modulePoints;
    })
    .filter((value) => value && value.trim().length > 0);

  const learningPoints = Array.from(
    new Map(
      normalizedLearningPoints.map((point) => [
        point.toLowerCase().trim(),
        point.trim(),
      ]),
    ).values(),
  ).slice(0, 8);
  const hasLearningPoints = learningPoints.length > 0;

  const courseIncludes: Array<{
    key: string;
    icon: ReactNode;
    label: string;
  }> = [
    {
      key: "videos",
      icon: <Play className="h-4 w-4 text-[#6A6F73]" />,
      label: `${totalLessons} leçons vidéo (${formatDuration(totalCourseDuration)})`,
    },
    {
      key: "modules",
      icon: <Target className="h-4 w-4 text-[#6A6F73]" />,
      label: `${modules.length} modules structurés`,
    },
    {
      key: "level",
      icon: <Award className="h-4 w-4 text-[#6A6F73]" />,
      label: `Niveau ${levelLabel}`,
    },
    {
      key: "updates",
      icon: <Clock className="h-4 w-4 text-[#6A6F73]" />,
      label: "Accès continu aux futures mises à jour",
    },
    ...(totalQuizCount > 0
      ? [
          {
            key: "quizzes",
            icon: <Check className="h-4 w-4 text-[#6A6F73]" />,
            label: `${totalQuizCount} quiz d'évaluation`,
          },
        ]
      : []),
    ...(hasAttachment
      ? [
          {
            key: "resources",
            icon: <FileText className="h-4 w-4 text-[#6A6F73]" />,
            label: "Ressource téléchargeable incluse",
          },
        ]
      : []),
  ];

  const enrollCtaLabel = enrolling
    ? "Inscription..."
    : isFree
      ? "Commencer ce parcours"
      : "Acheter et démarrer";
  const priceLabel = course.price ? `${course.price} FCFA` : "Gratuit";
  const paymentBadgeLabel = isFree ? "Inscription immédiate" : "Paiement sécurisé";

  const renderPurchaseCard = ({
    showThumbnail = true,
    showCta = true,
    className = "",
  }: {
    showThumbnail?: boolean;
    showCta?: boolean;
    className?: string;
  } = {}) => (
    <div
      className={`overflow-hidden rounded-2xl border border-[#DCE4EE] bg-white shadow-xl ${className}`}
    >
      {showThumbnail && (
        <div className="relative h-36 w-full overflow-hidden bg-[#0D1F3A] sm:h-44 lg:h-52">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-white/70">
              Aperçu du cours
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/65 to-transparent" />
        </div>
      )}

      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-end justify-between gap-3 sm:mb-5">
          <p className="text-3xl font-bold text-[#101828] sm:text-4xl">{priceLabel}</p>
          <span className="rounded-full bg-[#EAF2FF] px-3 py-1 text-xs font-semibold text-[#002c75]">
            {paymentBadgeLabel}
          </span>
        </div>

        <button
          onClick={handleEnrollClick}
          disabled={enrolling}
          className={`w-full rounded-lg bg-[#002c75] px-4 py-3 text-sm font-bold text-white shadow-md transition-colors duration-200 hover:bg-[#001f54] disabled:cursor-not-allowed disabled:opacity-60 ${
            showCta ? "mb-5 sm:mb-6" : "hidden"
          }`}
        >
          {enrollCtaLabel}
        </button>

        <h4 className="mb-3 text-lg font-bold text-[#101828]">Ce cours comprend</h4>
        <ul className="space-y-2 text-sm text-[#2D2F31]">
          {courseIncludes.map((item) => (
            <li key={item.key} className="flex items-center gap-2.5">
              {item.icon}
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderVideoUnavailableState = () => (
    <div className="flex h-full w-full items-center justify-center bg-black px-4">
      <div className="text-center text-white">
        <PlayCircle className="mx-auto mb-4 h-12 w-12 text-white/45" />
        <p className="text-base font-medium text-white/90">
          Vidéo indisponible pour le moment
        </p>
        <p className="mt-1 text-sm text-white/60">
          Réessayez plus tard ou passez à la leçon suivante.
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/25 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Réessayer
          </button>
          {currentLessonIndex < lessonsWithVideos.length - 1 && (
            <button
              type="button"
              onClick={() => handleNextLesson()}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/25 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
            >
              Suivant
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F9FA]">
      {/* Fullscreen Video Modal - Mobile */}
      {isFullscreen && isMobile && (
        <div className="fixed inset-0 z-50 bg-black">
          <div className="relative flex h-full w-full flex-col">
            <button
              onClick={toggleFullscreen}
              className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="flex flex-1 items-center justify-center bg-black">
              {!shouldShowVideoUnavailableState ? (
                (() => {
                  const videoId = getYouTubeVideoId(safeSelectedLesson?.videoUrl);
                  return videoId ? (
                    <VideoWithLoading
                      lessonId={safeSelectedLesson?.id || selectedLessonId}
                      videoId={videoId}
                      title={safeSelectedLesson?.title || course.title}
                      onTrackProgress={handleVideoTrackingProgress}
                      onEnded={handleLessonVideoEnded}
                    />
                  ) : (
                    <SecureVideoPlayer
                      url={safeSelectedLesson?.videoUrl}
                      key={safeSelectedLesson?.id}
                      lessonId={safeSelectedLesson?.id || selectedLessonId}
                      durationHintSeconds={(safeSelectedLesson?.duration || 0) * 60}
                      title={safeSelectedLesson?.title || course.title}
                      className="h-full w-full"
                      onProgressWindow={(fromTime, toTime, duration) =>
                        handleVideoTrackingProgress({
                          lessonId: safeSelectedLesson?.id || selectedLessonId,
                          fromTime,
                          toTime,
                          duration,
                        })
                      }
                      onEnded={handleLessonVideoEnded}
                    />
                  );
                })()
              ) : (
                renderVideoUnavailableState()
              )}
            </div>
          </div>
        </div>
      )}

      {paymentNotice && (
        <div className="mx-auto max-w-[1240px] px-4 pt-4 sm:px-6">
          <div
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
              paymentNotice.type === "warning"
                ? "border-[#F7CFA6] bg-[#FFF7ED] text-[#7C2D12]"
                : paymentNotice.type === "success"
                  ? paymentNotice.paymentType === "certification"
                    ? "border-[#86EFAC] bg-[#ECFDF3] text-[#166534]"
                    : "border-[#B9CCF6] bg-[#EEF4FF] text-[#1D4ED8]"
                  : "border-[#C7D2FE] bg-[#EEF2FF] text-[#3730A3]"
            }`}
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold">{paymentNotice.title}</p>
              <p className="mt-1 text-sm font-medium">{paymentNotice.message}</p>
              {paymentNotice.actionLabel && paymentNotice.actionUrl && (
                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      paymentNotice.actionUrl,
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                  className="mt-2 rounded-md border border-current px-3 py-1.5 text-sm font-semibold transition-opacity hover:opacity-80"
                >
                  {paymentNotice.actionLabel}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setPaymentNotice(null)}
              className="rounded p-1 transition-colors hover:bg-black/10"
              aria-label="Fermer le message de paiement"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {hasCourseAccess ? (
        <div className="flex h-screen flex-col overflow-hidden bg-[#F7F9FA]">
          <header className="z-40 flex-shrink-0 border-b border-[#3E4143] bg-[#1C1D1F] text-white">
            <div className="flex h-14 items-center justify-between px-4 lg:px-6">
              <button
                type="button"
                onClick={() => {
                  if (contentMode === "quiz" && activeQuizModuleId) {
                    exitQuizView();
                    return;
                  }
                  router.push(isAdmin ? "/admin-dashboard?focus=courses" : "/");
                }}
                aria-label="Retour"
                className="inline-flex shrink-0 items-center gap-3 text-white/90 transition-colors duration-200 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5 shrink-0" />
                {!(contentMode === "quiz" && activeQuizModuleId) && (
                  <span className="truncate text-base font-medium">{course.title}</span>
                )}
              </button>

              {!(contentMode === "quiz" && activeQuizModuleId) && (
                <div className="hidden items-center gap-3 sm:flex">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-28 rounded-full bg-[#4A4E62]">
                      <div
                        className="h-full rounded-full bg-[#002c75]"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <span className="text-sm text-white/80">Votre progression</span>
                  </div>
                </div>
              )}
            </div>
          </header>

          {contentMode === "quiz" && activeQuizModuleId ? (
            <main className="min-h-0 flex-1 overflow-y-auto bg-[#F7F9FA] py-6">
              <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
                <QuizModal
                  isOpen={true}
                  variant="page"
                  onClose={exitQuizView}
                  quizId={activeQuizModuleId}
                  mode={activeQuizMode}
                  courseId={courseId}
                  lessonId={selectedLessonId}
                  onQuizCompleted={handleQuizCompleted}
                />
              </div>
            </main>
          ) : (
            <main className="relative flex min-h-0 flex-1 overflow-hidden">
              <section className="min-h-0 flex-1 overflow-y-auto">
                <section className="border-b border-[#D1D7DC] bg-white">
                  <div className="flex flex-col bg-white">
                    {hasVideoContent ? (
                      <div className="relative w-full aspect-video max-h-[600px] bg-white">
                        {!shouldShowVideoUnavailableState ? (
                          (() => {
                            const videoId = getYouTubeVideoId(
                              safeSelectedLesson?.videoUrl,
                            );
                            return videoId ? (
                              <VideoWithLoading
                                lessonId={safeSelectedLesson?.id || selectedLessonId}
                                videoId={videoId}
                                title={safeSelectedLesson?.title || course.title}
                                onTrackProgress={handleVideoTrackingProgress}
                                onEnded={handleLessonVideoEnded}
                              />
                            ) : (
                              <SecureVideoPlayer
                                url={safeSelectedLesson?.videoUrl}
                                key={safeSelectedLesson?.id}
                                lessonId={safeSelectedLesson?.id || selectedLessonId}
                                durationHintSeconds={(safeSelectedLesson?.duration || 0) * 60}
                                title={safeSelectedLesson?.title || course.title}
                                className="h-full w-full"
                                onProgressWindow={(fromTime, toTime, duration) =>
                                  handleVideoTrackingProgress({
                                    lessonId: safeSelectedLesson?.id || selectedLessonId,
                                    fromTime,
                                    toTime,
                                    duration,
                                  })
                                }
                                onEnded={handleLessonVideoEnded}
                              />
                            );
                          })()
                        ) : (
                          <div className="w-full aspect-video">{renderVideoUnavailableState()}</div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full aspect-video">{renderVideoUnavailableState()}</div>
                    )}

                    {hasVideoContent && (
                      <div className="flex items-center justify-between gap-3 border-t border-[#2F3137] bg-[#15171B] px-4 py-3 sm:px-6">
                        <button
                          type="button"
                          onClick={handlePreviousLesson}
                          disabled={currentLessonIndex === 0}
                          className="inline-flex items-center gap-2 rounded border border-[#3E4148] px-3 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#20232A] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span>Précédent</span>
                        </button>

                        <span className="text-sm font-medium text-[#C0C4CC]">
                          Leçon {Math.min(currentLessonIndex + 1, lessonsWithVideos.length)} /{" "}
                          {lessonsWithVideos.length}
                        </span>

                        <button
                          type="button"
                          onClick={handleNextLesson}
                          disabled={currentLessonIndex >= lessonsWithVideos.length - 1}
                          className="inline-flex items-center gap-2 rounded border border-[#3E4148] px-3 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#20232A] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <span>Suivant</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </section>

                <section className="border-b border-[#D1D7DC] bg-white">
                  <div className="mx-auto max-w-[1020px] overflow-x-auto px-4">
                    <div className="flex min-w-max items-center gap-8">
                      <Search className="h-4 w-4 text-[#6A6F73]" />
                      <div className="flex items-center gap-6">
                        <button
                          onClick={() => setActiveTab("videos")}
                          className={`border-b-2 py-4 text-[15px] font-semibold transition-colors ${
                            activeTab === "videos"
                              ? "border-[#002c75] text-[#002c75]"
                              : "border-transparent text-[#6A6F73] hover:text-[#1C1D1F]"
                          }`}
                        >
                          Aperçu
                        </button>
                        {hasAttachment && (
                          <button
                            onClick={() => setActiveTab("resources")}
                            className={`border-b-2 py-4 text-[15px] font-semibold transition-colors ${
                              activeTab === "resources"
                                ? "border-[#002c75] text-[#002c75]"
                                : "border-transparent text-[#6A6F73] hover:text-[#1C1D1F]"
                            }`}
                          >
                            Ressources
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <div className="bg-[#F7F9FA]">
                  {isMobile && hasVideoContent && (
                    <section className="border-b border-[#D1D7DC] bg-white">
                      <LessonsSidebar />
                    </section>
                  )}

                  {activeTab === "videos" && (
                    <section className="mx-auto max-w-[1020px] px-4 py-8 lg:px-8">
                      <h1 className="text-4xl font-bold leading-tight text-[#1C1D1F]">
                        {selectedLesson?.title || course.title}
                      </h1>

                      <p className="mt-6 max-w-3xl text-lg leading-8 text-[#2D2F31]">
                        {selectedLesson?.content ||
                          course.description ||
                          "Ce module vous guide pas à pas avec une approche pratique, des exemples concrets et des exercices progressifs."}
                      </p>

                      <div className="mt-8 grid gap-4 border border-[#D1D7DC] bg-white p-6 md:grid-cols-3">
                        <div>
                          <p className="text-sm text-[#6A6F73]">Niveau</p>
                          <p className="text-xl font-semibold text-[#1C1D1F]">{levelLabel}</p>
                        </div>
                        {/* <div>
                          <p className="text-sm text-[#6A6F73]">Étudiants</p>
                          <p className="text-xl font-semibold text-[#1C1D1F]">
                            {studentsCount}
                          </p>
                        </div> */}
                        <div>
                          <p className="text-sm text-[#6A6F73]">Durée totale</p>
                          <p className="text-xl font-semibold text-[#1C1D1F]">
                            {formatDuration(totalCourseDuration)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-8 border border-[#D1D7DC] bg-white p-6">
                        <h3 className="mb-6 text-3xl font-bold text-[#1C1D1F]">
                          Ce que vous apprendrez
                        </h3>
                        {hasLearningPoints ? (
                          <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
                            {learningPoints.map((point, index) => (
                              <div key={`${point}-${index}`} className="flex items-start gap-3">
                                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#002c75]" />
                                <span className="text-sm leading-6 text-[#2D2F31]">{point}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-[#6A6F73]">
                            Les objectifs d&apos;apprentissage apparaîtront ici une fois le contenu
                            pédagogique détaillé dans les modules.
                          </p>
                        )}
                      </div>

                      <div className="mt-8 border-t border-[#D1D7DC] pt-8">
                        <h3 className="text-2xl font-bold text-[#1C1D1F]">Description</h3>
                        <p className="mt-4 max-w-4xl text-[17px] leading-8 text-[#2D2F31]">
                          {course.description ||
                            "Ce cours est conçu pour vous donner une compréhension solide et pratique du sujet, avec un parcours progressif et orienté vers l'application réelle."}
                        </p>
                      </div>
                    </section>
                  )}

                  {activeTab === "resources" && (
                    <section className="mx-auto max-w-[1020px] px-4 py-8 lg:px-8">
                      <h2 className="text-3xl font-bold text-[#1C1D1F]">
                        Ressources du cours
                      </h2>

                      {hasAttachment ? (
                        <div className="mt-6 rounded-xl border border-[#D1D7DC] bg-white p-6">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#EEF4FF] text-[#002c75]">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-base font-semibold text-[#1C1D1F]">
                                  {attachmentFilename}
                                </p>
                                <p className="text-sm text-[#6A6F73]">
                                  Document PDF
                                </p>
                              </div>
                            </div>
                            {attachmentUrl && (
                              <a
                                href={attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={attachmentFilename}
                                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#002c75] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#001f54]"
                              >
                                <div className="flex items-center gap-2">
                                  <Download className="h-4 w-4" />
                                 <p>Télécharger</p>
                                </div>
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-6 rounded-xl border border-[#D1D7DC] bg-white p-6 text-sm text-[#6A6F73]">
                          Aucune ressource disponible pour ce cours.
                        </div>
                      )}
                    </section>
                  )}
                </div>
              </section>

              {!isMobile && hasVideoContent && (
                <>
                  <aside
                    className={`hidden flex-shrink-0 overflow-hidden transition-[width,min-width] duration-300 ease-in-out lg:flex lg:min-h-0 lg:flex-col lg:bg-white ${
                      isDesktopSidebarOpen
                        ? "w-[340px] min-w-[340px]"
                        : "w-0 min-w-0"
                    }`}
                  >
                    <div
                      className={`h-full w-[340px] transform transition-transform duration-300 ease-in-out ${
                        isDesktopSidebarOpen ? "translate-x-0" : "translate-x-full"
                      }`}
                    >
                      <LessonsSidebar
                        onClose={() => {
                          setIsDesktopSidebarOpen(false);
                        }}
                      />
                    </div>
                  </aside>

                  {!isDesktopSidebarOpen && (
                    <button
                      type="button"
                      onClick={() => setIsDesktopSidebarOpen(true)}
                      aria-label="Ouvrir le panneau contenu du cours"
                      className="absolute right-0 top-1/2 z-30 hidden h-12 w-9 -translate-y-1/2 items-center justify-center rounded-l-md bg-[#002c75] text-white shadow-lg transition-all duration-200 hover:bg-[#001f54] lg:flex"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                  )}
                </>
              )}
            </main>
          )}
        </div>
      ) : (
        <>
          <header className="sticky top-0 z-40 border-b border-[#D1D7DC] bg-white">
            <div className="mx-auto flex h-14 max-w-[1200px] items-center px-4 sm:px-6">
              <button
                onClick={() =>
                  router.push(isAdmin ? "/admin-dashboard?focus=courses" : "/")
                }
                className="flex items-center gap-2 text-sm font-medium text-[#2D2F31] transition-colors duration-200 hover:text-[#002c75]"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Retour aux cours</span>
              </button>
            </div>
          </header>

          <main className="bg-[#F3F7FB] pb-28 lg:pb-14">
            <div className="border-b border-[#DCE4EE] bg-white px-4 py-4 sm:px-6 lg:hidden">
              {renderPurchaseCard({ showThumbnail: false, showCta: false })}
            </div>

            <section className="relative overflow-hidden bg-gradient-to-br from-[#001945] via-[#002c75] to-[#0A4AA8] text-white">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-[#28C7E0]/20 blur-3xl" />
                <div className="absolute -bottom-40 left-0 h-96 w-96 rounded-full bg-[#7E78FF]/20 blur-3xl" />
              </div>

              <div className="relative mx-auto max-w-[1240px] px-4 pb-8 pt-6 sm:px-6 sm:pb-12 sm:pt-8 lg:pb-28 lg:pt-14">
                <div className="max-w-4xl">
                  <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[#D6E6FF] sm:mb-6 sm:text-sm">
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 font-medium backdrop-blur">
                      Catalogue
                    </span>
                    <span className="text-white/50">/</span>
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 font-medium backdrop-blur">
                      Niveau {levelLabel}
                    </span>
                    <span className="text-white/50">/</span>
                    <span className="truncate text-white">{course.title}</span>
                  </div>

                  <h1 className="mb-3 text-2xl font-bold leading-tight tracking-tight sm:mb-5 sm:text-3xl lg:text-5xl">
                    {course.title}
                  </h1>
                  <p className="max-w-3xl text-sm leading-6 text-[#D8E6F8] line-clamp-3 sm:text-base sm:leading-7 sm:line-clamp-none lg:text-lg">
                    {course.description ||
                      "Un parcours premium, structuré et orienté résultats pour développer des compétences immédiatement applicables."}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-8 sm:gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur sm:px-4 sm:py-3">
                      <p className="text-[10px] uppercase tracking-wide text-[#A8C8ED] sm:text-xs">
                        Leçons vidéo
                      </p>
                      <p className="mt-0.5 text-xl font-bold text-white sm:mt-1 sm:text-2xl">
                        {totalLessons}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur sm:px-4 sm:py-3">
                      <p className="text-[10px] uppercase tracking-wide text-[#A8C8ED] sm:text-xs">
                        Durée totale
                      </p>
                      <p className="mt-0.5 text-xl font-bold text-white sm:mt-1 sm:text-2xl">
                        {formatDuration(totalCourseDuration)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur sm:px-4 sm:py-3">
                      <p className="text-[10px] uppercase tracking-wide text-[#A8C8ED] sm:text-xs">
                        Modules
                      </p>
                      <p className="mt-0.5 text-xl font-bold text-white sm:mt-1 sm:text-2xl">
                        {modules.length}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur sm:px-4 sm:py-3">
                      <p className="text-[10px] uppercase tracking-wide text-[#A8C8ED] sm:text-xs">
                        Quiz
                      </p>
                      <p className="mt-0.5 text-xl font-bold text-white sm:mt-1 sm:text-2xl">
                        {totalQuizCount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="relative mx-auto max-w-[1240px] px-4 pb-14 sm:px-6">
              <div className="-mt-8 grid grid-cols-1 gap-8 lg:-mt-16 lg:grid-cols-12 lg:items-start">
                <div className="space-y-7 lg:col-span-8 lg:pt-16">
                  <div className="rounded-2xl border border-[#DCE4EE] bg-white p-6 shadow-sm lg:p-8">
                    <h2 className="mb-6 text-2xl font-bold text-[#101828]">
                      Ce que vous apprendrez
                    </h2>
                    {hasLearningPoints ? (
                      <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
                        {learningPoints.map((point, index) => (
                          <div
                            key={`${point}-${index}`}
                            className="flex items-start gap-3 rounded-lg bg-[#F8FAFC] px-3 py-2"
                          >
                            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#002c75]" />
                            <span className="text-sm leading-6 text-[#2D2F31]">
                              {point}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[#6A6F73]">
                        Les objectifs d&apos;apprentissage apparaîtront ici une fois le contenu
                        pédagogique détaillé dans les modules.
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-[#DCE4EE] bg-white p-6 shadow-sm lg:p-8">
                    <h3 className="mb-4 text-2xl font-bold text-[#101828]">
                      Structure du parcours
                    </h3>
                    <div className="space-y-3">
                      {[...modules]
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((module, index) => (
                          <div
                            key={module.id}
                            className="flex flex-col justify-between gap-2 rounded-xl border border-[#E2E8F0] px-4 py-3 sm:flex-row sm:items-center"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#1C1D1F]">
                                Module {index + 1}: {module.title}
                              </p>
                              <p className="text-xs text-[#6A6F73]">
                                {module.description || "Module orienté pratique"}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="hidden lg:col-span-4 lg:block">
                  {renderPurchaseCard({
                    className:
                      "lg:sticky lg:top-[4.5rem] lg:max-h-[calc(100vh-5.5rem)] lg:self-start lg:overflow-y-auto",
                  })}
                </div>
              </div>
            </section>
          </main>

          <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#DCE4EE] bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-sm lg:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto flex max-w-[1240px] items-center gap-3">
              <div className="min-w-0 shrink-0">
                <p className="text-xl font-bold leading-tight text-[#101828]">{priceLabel}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#002c75]">
                  {paymentBadgeLabel}
                </p>
              </div>
              <button
                onClick={handleEnrollClick}
                disabled={enrolling}
                className="min-w-0 flex-1 rounded-lg bg-[#002c75] px-4 py-3 text-sm font-bold text-white shadow-md transition-colors duration-200 hover:bg-[#001f54] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {enrollCtaLabel}
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

export default function CourseDetailsPage() {
  return (
    <ProtectedRoute>
      <CourseDetailsPageComponent />
    </ProtectedRoute>
  );
}
