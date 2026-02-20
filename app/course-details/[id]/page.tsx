"use client";

import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import { buildApiUrl, API_ENDPOINTS } from "@/infrastructure/api/baseConfig";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { usePayment } from "@/application/use-cases/usePayment";
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
} from "lucide-react";
import Cookies from "js-cookie";
import logger from "@/shared/helpers/logger";

const TRACKING_INTERVAL_MS = 2000;
const TRACKING_COMPLETION_THRESHOLD = 0.95;
const TRACKING_PROGRESS_STEP = 0.05;

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

  return (
    <div className="absolute inset-0 h-full w-full bg-black">
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
          isLoading ? "opacity-0" : "opacity-100"
        }`}
      />
    </div>
  );
}

function CourseDetailsPageComponent() {
  const params = useParams();
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
  const [contentMode, setContentMode] = useState<"video" | "quiz">("video");
  const [activeQuizModuleId, setActiveQuizModuleId] = useState<string | null>(
    null,
  );

  // Course access states
  const [isEnrolled, setIsEnrolled] = useState<boolean | undefined>(undefined);
  const [isPaid, setIsPaid] = useState(false);
  const [isFree, setIsFree] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<{
    type: "warning" | "info";
    message: string;
  } | null>(null);
  const hasCourseAccess = isEnrolled === true || isAdmin;

  // ✅ NOUVEAU: Flag pour éviter les requêtes d'enrollment multiples
  const [enrollmentCheckComplete, setEnrollmentCheckComplete] = useState(false);

  // Lesson progress states
  const [lessonProgress, setLessonProgress] = useState<Record<string, boolean>>(
    {},
  );
  const [completedModules, setCompletedModules] = useState<Set<string>>(
    new Set(),
  );

  // Quiz states
  const [moduleQuizzes, setModuleQuizzes] = useState<Record<string, boolean>>(
    {},
  );
  const [checkingQuizzes, setCheckingQuizzes] = useState<Set<string>>(
    new Set(),
  );

  // Tracking automatique de progression vidéo
  const lessonProgressRef = useRef<Record<string, boolean>>({});
  const lessonMaxProgressRef = useRef<Record<string, number>>({});
  const lessonLastReportedProgressRef = useRef<Record<string, number>>({});
  const lessonDurationsRef = useRef<Record<string, number>>({});
  const completionInFlightRef = useRef<Set<string>>(new Set());
  const syncedCompletedLessonsRef = useRef<Set<string>>(new Set());
  const handledPaymentReturnRef = useRef<Set<string>>(new Set());
  const initialLessonSelectionRef = useRef(false);

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

    setCompletedModules(newCompletedModules);

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

  // Vérifier l'existence des quiz pour les modules terminés
  useEffect(() => {
    if (!courseData?.modules?.length || !isEnrolled) return;

    const checkQuizzesForCompletedModules = async () => {
      const modulesToCheck = courseData.modules.filter((module) => {
        const moduleLessons = module.lessons.filter((l) => l.hasVideo);
        const allLessonsCompleted = moduleLessons.every(
          (lesson) => lessonProgress[lesson.id],
        );
        return (
          allLessonsCompleted &&
          moduleLessons.length > 0 &&
          moduleQuizzes[module.id] === undefined &&
          !checkingQuizzes.has(module.id)
        );
      });

      for (const module of modulesToCheck) {
        await checkQuizExists(module.id);
      }
    };

    checkQuizzesForCompletedModules();
  }, [courseData?.modules, lessonProgress, isEnrolled, moduleQuizzes]);

  // ✅ NOUVEAU: Détection retour paiement Paydunya
  useEffect(() => {
    const detectPaymentReturn = async () => {
      const paymentToken = searchParams.get("token");
      const paymentStatus = (searchParams.get("payment_status") || "").toLowerCase();
      const statusParam = (searchParams.get("status") || "").toLowerCase();
      const successParam = (searchParams.get("success") || "").toLowerCase();
      const cancelledParam = (searchParams.get("cancelled") || "").toLowerCase();
      const txRef = searchParams.get("tx_ref");
      const transactionId = searchParams.get("transaction_id");

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
        const cancelKey = `${courseId}:cancelled:${paymentToken || txRef || transactionId || "return"}`;
        if (handledPaymentReturnRef.current.has(cancelKey)) {
          return;
        }
        handledPaymentReturnRef.current.add(cancelKey);

        clearPendingEnrollment();
        setPaymentNotice({
          type: "warning",
          message:
            "Paiement annulé. Votre inscription n'a pas été finalisée. Vous pouvez relancer le paiement quand vous voulez.",
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
        const returnKey = `${courseId}:${paymentToken || txRef || transactionId || "return"}`;
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

        // Restaurer état pending
        const pending = restorePendingEnrollment();
        const pendingMatchesCourse = pending?.courseId === courseId;

        if (!pendingMatchesCourse && !paymentToken) {
          logger.log("ℹ️ Aucun contexte pending/token pour confirmer le paiement");
          return;
        }

        logger.log("🔍 Vérification inscription après paiement...");

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
          [
            "SUCCESS",
            "SUCCEEDED",
            "COMPLETED",
            "ACTIVE",
            "PAID",
            "APPROVED",
          ].includes(status);

        const isPaymentFailedStatus = (status: string): boolean =>
          ["FAILED", "CANCELLED", "CANCELED", "EXPIRED", "REJECTED"].includes(
            status,
          );

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

        if (paymentConfirmed) {
          logger.log(
            "✅ Déblocage immédiat côté UI après confirmation paiement",
          );
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
    setActiveQuizModuleId(null);
    setContentMode("video");
    setActiveTab("videos");
    if (isMobile) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    }
  }, [isMobile]);

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
        logger.log("💳 Redirection vers Paydunya:", result.payment_url);
        // 🔐 CRITIQUE: Sauvegarder état AVANT redirection
        savePendingEnrollment(courseId, user?.id);
        window.location.href = result.payment_url;
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

  // ✅ Helper: Obtenir le quiz d'un module
  const getModuleQuiz = (moduleId: string): Quiz | undefined => {
    const module = courseData?.modules.find((m) => m.id === moduleId);
    return module?.quiz?.[0]; // Prendre le premier quiz du module
  };

  // ✅ Vérifier si un quiz existe pour un module
  const hasQuizForModule = (moduleId: string): boolean => {
    return !!getModuleQuiz(moduleId);
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
    if (lessonsWithVideos[currentLessonIndex]) {
      setSelectedLessonId(lessonsWithVideos[currentLessonIndex].id);
      setContentMode("video");
    }
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
  const handleStartQuiz = (moduleId: string) => {
    logger.log("🎯 Démarrage du quiz pour le module:", moduleId);

    const quiz = getModuleQuiz(moduleId);
    if (!quiz) {
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
    setContentMode("quiz");
    setActiveTab("videos");
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

  const getTrackingStorageKey = useCallback(
    (lessonId: string) => `course-progress-tracking:${courseId}:${lessonId}`,
    [courseId],
  );

  const readTrackingFromStorage = useCallback(
    (lessonId: string) => {
      if (typeof window === "undefined") return null;

      try {
        const raw = localStorage.getItem(getTrackingStorageKey(lessonId));
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
    [getTrackingStorageKey],
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
        localStorage.setItem(
          getTrackingStorageKey(lessonId),
          JSON.stringify({
            duration: payload.duration,
            maxProgress: payload.maxProgress,
            completed: payload.completed,
            lastReportedProgress: payload.lastReportedProgress,
            updatedAt: Date.now(),
          }),
        );
      } catch (error) {
        logger.error("Erreur sauvegarde tracking localStorage:", error);
      }
    },
    [getTrackingStorageKey],
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
      if (syncedCompletedLessonsRef.current.has(lessonId)) return;

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
        {[...modules]
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((module, moduleIndex) => {
          const isExpanded = expandedModules.has(module.id);
          const isModuleCompleted = completedModules.has(module.id);
          const moduleQuiz = getModuleQuiz(module.id);
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
                </div>
              )}

              {moduleQuiz && isModuleCompleted && (
                <div className="border-t border-[#D1D7DC] bg-[#F7F9FA] px-4 py-3">
                  <button
                    onClick={() => handleStartQuiz(module.id)}
                    className={`flex w-full items-start gap-3 rounded-md border px-3.5 py-3 text-left transition-all duration-200 ${
                      contentMode === "quiz" && activeQuizModuleId === module.id
                        ? "border-[#002c75] bg-[#EAF2FF] text-[#002c75] shadow-sm"
                        : "border-[#BCD3F4] bg-[#F5F9FF] text-[#002c75] hover:border-[#002c75] hover:bg-[#ECF4FF]"
                    }`}
                  >
                    <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/90 text-[#002c75]">
                      <Target className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold leading-5">
                        D&eacute;fi du module : passez le quiz
                      </p>
                      <p className="text-xs text-[#6A6F73]">
                        Obligatoire pour valider et continuer
                      </p>
                    </div>
                  </button>
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
  const totalQuizCount = modules.reduce(
    (sum, module) => sum + (module.quiz?.length || 0),
    0,
  );
  const hasAttachment = Boolean(
    course.attachment && course.attachment !== "undefined",
  );
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
              {selectedLesson?.hasVideo ? (
                (() => {
                  const videoId = getYouTubeVideoId(selectedLesson.videoUrl);
                  return videoId ? (
                    <VideoWithLoading
                      lessonId={selectedLesson.id}
                      videoId={videoId}
                      title={selectedLesson.title || course.title}
                      onTrackProgress={handleVideoTrackingProgress}
                      onEnded={handleLessonVideoEnded}
                    />
                  ) : (
                    <SecureVideoPlayer
                      url={selectedLesson.videoUrl}
                      key={selectedLesson?.id}
                      lessonId={selectedLesson.id}
                      durationHintSeconds={(selectedLesson.duration || 0) * 60}
                      title={selectedLesson.title || course.title}
                      className="h-full w-full"
                      onProgressWindow={(fromTime, toTime, duration) =>
                        handleVideoTrackingProgress({
                          lessonId: selectedLesson.id,
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
                <div className="px-4 text-center text-white">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-800">
                    <PlayCircle className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-400 sm:text-base">
                    Aucune vidéo disponible
                  </p>
                </div>
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
                : "border-[#B9CCF6] bg-[#EEF4FF] text-[#1D4ED8]"
            }`}
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <p className="flex-1 text-sm font-medium">{paymentNotice.message}</p>
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
                onClick={() => {
                  if (contentMode === "quiz" && activeQuizModuleId) {
                    setContentMode("video");
                    setActiveQuizModuleId(null);
                    setActiveTab("videos");
                    return;
                  }
                  router.push(isAdmin ? "/admin-dashboard?focus=courses" : "/");
                }}
                className="flex min-w-0 items-center gap-3 text-white/90 transition-colors duration-200 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5 flex-shrink-0" />
                <span className="truncate text-base font-medium">{course.title}</span>
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
                  onClose={() => {
                    setContentMode("video");
                    setActiveQuizModuleId(null);
                    setActiveTab("videos");
                  }}
                  quizId={activeQuizModuleId}
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
                    {hasVideo && hasVideoContent ? (
                      <div className="relative w-full aspect-video max-h-[600px] bg-white">
                        {selectedLesson?.videoUrl ? (
                          (() => {
                            const videoId = getYouTubeVideoId(selectedLesson.videoUrl);
                            return videoId ? (
                              <VideoWithLoading
                                lessonId={selectedLesson.id}
                                videoId={videoId}
                                title={selectedLesson.title || course.title}
                                onTrackProgress={handleVideoTrackingProgress}
                                onEnded={handleLessonVideoEnded}
                              />
                            ) : (
                              <SecureVideoPlayer
                                url={selectedLesson.videoUrl}
                                key={selectedLesson?.id}
                                lessonId={selectedLesson.id}
                                durationHintSeconds={(selectedLesson.duration || 0) * 60}
                                title={selectedLesson.title || course.title}
                                className="h-full w-full"
                                onProgressWindow={(fromTime, toTime, duration) =>
                                  handleVideoTrackingProgress({
                                    lessonId: selectedLesson.id,
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
                          <SecureVideoPlayer
                            url={selectedLesson.videoUrl}
                            key={selectedLesson?.id}
                            lessonId={selectedLesson.id}
                            durationHintSeconds={(selectedLesson.duration || 0) * 60}
                            title={selectedLesson.title || course.title}
                            className="h-full w-full"
                            onProgressWindow={(fromTime, toTime, duration) =>
                              handleVideoTrackingProgress({
                                lessonId: selectedLesson.id,
                                fromTime,
                                toTime,
                                duration,
                              })
                            }
                            onEnded={handleLessonVideoEnded}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="flex w-full aspect-video items-center justify-center text-sm text-gray-400">
                        Aucune vidéo disponible
                      </div>
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
                      <button
                        onClick={() => setActiveTab("videos")}
                        className="border-b-2 border-[#002c75] py-4 text-[15px] font-semibold text-[#002c75]"
                      >
                        Aperçu
                      </button>
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
                        <div>
                          <p className="text-sm text-[#6A6F73]">Étudiants</p>
                          <p className="text-xl font-semibold text-[#1C1D1F]">
                            {studentsCount}
                          </p>
                        </div>
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

          <main className="bg-[#F3F7FB]">
            <section className="relative overflow-hidden bg-gradient-to-br from-[#001945] via-[#002c75] to-[#0A4AA8] text-white">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-[#28C7E0]/20 blur-3xl" />
                <div className="absolute -bottom-40 left-0 h-96 w-96 rounded-full bg-[#7E78FF]/20 blur-3xl" />
              </div>

              <div className="relative mx-auto max-w-[1240px] px-4 pb-24 pt-10 sm:px-6 lg:pb-28 lg:pt-14">
                <div className="max-w-4xl">
                  <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-[#D6E6FF] sm:text-sm">
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

                  <h1 className="mb-5 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                    {course.title}
                  </h1>
                  <p className="max-w-3xl text-base leading-7 text-[#D8E6F8] sm:text-lg">
                    {course.description ||
                      "Un parcours premium, structuré et orienté résultats pour développer des compétences immédiatement applicables."}
                  </p>

                  <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                      <p className="text-xs uppercase tracking-wide text-[#A8C8ED]">
                        Leçons vidéo
                      </p>
                      <p className="mt-1 text-2xl font-bold text-white">{totalLessons}</p>
                    </div>
                    <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                      <p className="text-xs uppercase tracking-wide text-[#A8C8ED]">
                        Durée totale
                      </p>
                      <p className="mt-1 text-2xl font-bold text-white">
                        {formatDuration(totalCourseDuration)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                      <p className="text-xs uppercase tracking-wide text-[#A8C8ED]">
                        Modules
                      </p>
                      <p className="mt-1 text-2xl font-bold text-white">{modules.length}</p>
                    </div>
                    <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                      <p className="text-xs uppercase tracking-wide text-[#A8C8ED]">
                        Quiz
                      </p>
                      <p className="mt-1 text-2xl font-bold text-white">{totalQuizCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="relative mx-auto max-w-[1240px] px-4 pb-14 sm:px-6">
              <div className="-mt-16 grid grid-cols-1 gap-8 lg:grid-cols-12">
                <div className="order-2 space-y-7 lg:order-1 lg:col-span-8 lg:pt-16">
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
                        .map((module, index) => {
                          const moduleLessons = module.lessons.filter((l) => l.hasVideo);
                          const moduleDuration = moduleLessons.reduce(
                            (sum, lesson) => sum + (lesson.duration || 0),
                            0,
                          );

                          return (
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
                              <div className="flex items-center gap-3 text-xs font-medium text-[#475467]">
                                <span>{moduleLessons.length} leçons</span>
                                <span>•</span>
                                <span>{formatDuration(moduleDuration)}</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>

                <div className="order-1 lg:order-2 lg:col-span-4">
                  <div className="overflow-hidden rounded-2xl border border-[#DCE4EE] bg-white shadow-xl lg:sticky lg:top-24">
                    <div className="relative h-52 w-full overflow-hidden bg-[#0D1F3A]">
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
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/65 to-transparent" />
                    </div>

                    <div className="p-6">
                      <div className="mb-5 flex items-end justify-between gap-3">
                        <p className="text-4xl font-bold text-[#101828]">
                          {course.price ? `${course.price} FCFA` : "Gratuit"}
                        </p>
                        <span className="rounded-full bg-[#EAF2FF] px-3 py-1 text-xs font-semibold text-[#002c75]">
                          {isFree ? "Inscription immédiate" : "Paiement sécurisé"}
                        </span>
                      </div>

                      <button
                        onClick={handleEnrollClick}
                        disabled={enrolling}
                        className="mb-6 w-full rounded-lg bg-[#002c75] px-4 py-3 text-sm font-bold text-white shadow-md transition-colors duration-200 hover:bg-[#001f54] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {enrolling
                          ? "Inscription..."
                          : isFree
                            ? "Commencer ce parcours"
                            : "Acheter et démarrer"}
                      </button>

                      <h4 className="mb-3 text-lg font-bold text-[#101828]">
                        Ce cours comprend
                      </h4>
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
                </div>
              </div>
            </section>
          </main>
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
