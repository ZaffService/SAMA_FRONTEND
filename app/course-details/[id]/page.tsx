"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
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
  X,
  Lock,
  Star,
  Clock,
  Target,
  Award,
  Check,
  PlayCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Search,
  Share2,
  MoreVertical,
} from "lucide-react";
import Cookies from "js-cookie";

const TRACKING_SEGMENT_SECONDS = 5;
const TRACKING_INTERVAL_MS = 2000;
const TRACKING_COMPLETION_THRESHOLD = 0.95;
const TRACKING_NEAR_END_THRESHOLD = 0.9;
const TRACKING_FALLBACK_MIN_SEGMENTS = 8;
const TRACKING_SUSPICIOUS_DURATION_SECONDS = 600;

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
    console.log("✅ État sauvegardé avant redirection Paydunya:", pendingData);
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
      console.log("🔄 Enrollment pending retrouvé:", data);
      return data;
    } else {
      localStorage.removeItem("pendingEnrollment");
      console.log("⏰ Pending enrollment expiré");
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
    console.log("🧹 Pending enrollment nettoyé");
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
  const trackedSegmentsRef = useRef<Record<string, Set<number>>>({});
  const lessonDurationsRef = useRef<Record<string, number>>({});
  const completionInFlightRef = useRef<Set<string>>(new Set());
  const syncedCompletedLessonsRef = useRef<Set<string>>(new Set());

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
        console.log(" Pas d'ID de cours fourni");
        return;
      }

      console.log(`🔄 Composant: Chargement du cours ${courseId}`);

      try {
        setLoading(true);
        const rawData = await CoursesApi.getCourseDetails(courseId);

        // ✅ Transformer les données
        const data = transformCourseDetails(rawData);
        console.log("✅ Composant: Données transformées:", data);

        setCourseData(data);

        const courseIsFree =
          data.course.price === 0 || data.course.isFree === true;
        setIsFree(courseIsFree);

        // ✅ Utiliser isEnrolled depuis les données du cours si disponible
        if (data.course.isEnrolled !== undefined) {
          console.log(`✅ Statut d'inscription depuis le backend: ${data.course.isEnrolled}`);
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

          // ✅ CORRECTION: Récupérer TOUTES les leçons de TOUS les modules
          const allLessons = data.modules.flatMap((module) =>
            module.lessons.map((lesson) => ({
              ...lesson,
              moduleId: module.id,
              moduleOrderIndex: module.orderIndex,
            })),
          );

          // ✅ Filtrer les leçons avec vidéo et trier correctement
          const lessonsWithVideo = allLessons
            .filter((lesson) => lesson.hasVideo)
            .sort((a, b) => {
              // Trier d'abord par module, puis par leçon
              if (a.moduleOrderIndex !== b.moduleOrderIndex) {
                return a.moduleOrderIndex - b.moduleOrderIndex;
              }
              return a.orderIndex - b.orderIndex;
            });

          // ✅ Sélectionner la première leçon avec vidéo
          if (lessonsWithVideo.length > 0) {
            setSelectedLessonId(lessonsWithVideo[0].id);
            setCurrentLessonIndex(0);
          }
        }
      } catch (err) {
        console.error("❌ Composant: Erreur lors du chargement:", err);
        setError("Impossible de charger les détails du cours");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId, isMobile]);

  // Vérifier le statut d'inscription au chargement et quand l'utilisateur change
  useEffect(() => {
    const checkEnrollmentStatus = async () => {
      // ✅ EMPÊCHER LES REQUÊTES MULTIPLES
      if (enrollmentCheckComplete) {
        console.log("⚠️ Vérification d'inscription déjà effectuée, skip");
        return;
      }

      if (!user?.id || !courseId) {
        console.log(
          "ℹ️ Pas d'utilisateur ou courseId, skip vérification inscription",
        );
        setIsEnrolled(false);
        setIsPaid(false);
        setEnrollmentCheckComplete(true);
        return;
      }

      // Valider le format du courseId avant de faire l'appel API
      if (!isValidUUID(courseId)) {
        console.warn(`⚠️ Format de courseId invalide: ${courseId}`);
        setIsEnrolled(false);
        setIsPaid(false);
        setEnrollmentCheckComplete(true);
        return;
      }

      try {
        console.log("🔍 Vérification statut d'inscription...");
        const isEnrolled = await CoursesApi.checkEnrollmentStatus(courseId);

        if (isEnrolled) {
          console.log("✅ Utilisateur déjà inscrit au cours");
          setIsEnrolled(true);
          setIsPaid(true);
        } else {
          console.log("ℹ️ Utilisateur non inscrit - accès limité au contenu");
          setIsEnrolled(false);
          setIsPaid(false);
        }
      } catch (error) {
        console.error("❌ Erreur vérification inscription:", error);
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

      // Valider le format du courseId avant de faire l'appel API
      if (!isValidUUID(courseId)) {
        console.warn(`⚠️ Format de courseId invalide: ${courseId}`);
        setLessonProgress({});
        return;
      }

      try {
        console.log("📥 Tentative de chargement de la progression...");

        const response = await fetch(
          buildApiUrl(API_ENDPOINTS.COURSES.PROGRESS(courseId)),
          { credentials: "include" },
        );

        if (response.ok) {
          const data = await response.json();
          console.log("✅ Progression récupérée depuis l'API:", data);

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

          console.log("💾 Progression transformée:", progress);
          setLessonProgress(progress);
        } else if (response.status === 400) {
          // Erreur de validation - ID invalide
          console.warn("⚠️ Erreur de validation du courseId");
          setLessonProgress({});
          // Ne pas définir error state pour ce cas - c'est normal si non inscrit
        } else if (response.status === 404 || response.status === 403) {
          console.log("ℹ️ Aucune progression trouvée (normal si non inscrit)");
          setLessonProgress({});
        } else if (response.status === 500) {
          // Vérifier si c'est une erreur "not enrolled"
          try {
            const errorData = await response.json();
            if (
              errorData.message &&
              errorData.message.includes("not enrolled")
            ) {
              console.log("ℹ️ Utilisateur non inscrit, progression vide");
              setLessonProgress({});
              setIsEnrolled(false);
              return;
            }
            if (errorData.errorCode === "VALIDATION_FAILED") {
              console.log("⚠️ Erreur de validation backend, progression vide");
              setLessonProgress({});
              return;
            }
          } catch (e) {
            // Ignore
          }
          console.error("❌ Erreur récupération progression:", response.status);
          setLessonProgress({});
        } else {
          console.error("❌ Erreur récupération progression:", response.status);
          setLessonProgress({});
        }
      } catch (error) {
        console.error("💥 Erreur lors du chargement de la progression:", error);
        setLessonProgress({});
      }
    };

    // Attendre que le statut d'inscription soit vérifié
    // On lance fetchProgress après checkEnrollmentStatus
    if (isEnrolled !== undefined) {
      fetchProgress();
    }
  }, [courseId, isEnrolled]);

  useEffect(() => {
    lessonProgressRef.current = lessonProgress;
    Object.entries(lessonProgress).forEach(([lessonId, completed]) => {
      if (completed) {
        syncedCompletedLessonsRef.current.add(lessonId);
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
      // Détecter paramètres Paydunya dans l'URL
      const hasPaymentReturn =
        searchParams.get("success") === "true" ||
        searchParams.get("payment_status") === "completed" ||
        searchParams.get("tx_ref") ||
        searchParams.get("transaction_id");

      if (hasPaymentReturn && courseId) {
        console.log("🔄 Retour paiement Paydunya détecté");

        // Restaurer état pending
        const pending = restorePendingEnrollment();

        if (pending && pending.courseId === courseId) {
          console.log("🔍 Vérification inscription après paiement...");

          // Attendre 2 secondes que backend traite le paiement
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Forcer vérification enrollment
          try {
            const isNowEnrolled = await CoursesApi.checkEnrollmentStatus(courseId);

            if (isNowEnrolled) {
              console.log("✅ Inscription confirmée après paiement !");
              setIsEnrolled(true);
              setIsPaid(true);

              // Nettoyer état pending
              clearPendingEnrollment();

              // Message succès
              Swal.fire({
                title: "Paiement confirmé! 🎉",
                text: "Votre cours est maintenant accessible. Bon apprentissage !",
                icon: "success",
                timer: 3000,
                confirmButtonColor: "#6366f1",
              });

              // Scroll vers vidéo sur mobile
              if (isMobile) {
                setTimeout(() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }, 500);
              }
            } else {
              console.log("⏳ Paiement en traitement, nouvelle vérification...");
              // Retry après 5 secondes
              setTimeout(async () => {
                const retry = await CoursesApi.checkEnrollmentStatus(courseId);
                if (retry) {
                  setIsEnrolled(true);
                  setIsPaid(true);
                  clearPendingEnrollment();
                }
              }, 5000);
            }
          } catch (error) {
            console.error("❌ Erreur vérification post-paiement:", error);
          }
        }

        // Nettoyer URL
        window.history.replaceState({}, "", `/course-details/${courseId}`);
      }
    };

    detectPaymentReturn();
  }, [searchParams, courseId, isMobile]);

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

  // Gestion du suivi du cours (inscription ou redirection paiement)
  const handleFollowCourse = async () => {
    if (!courseId) return;

    // ✅ EMPÊCHER LES REQUÊTES MULTIPLES
    if (enrolling) {
      console.log("⚠️ Inscription déjà en cours, ignore");
      return;
    }

    try {
      setEnrolling(true);

      // ✅ Vérifier d'abord si l'utilisateur est déjà inscrit (double vérification)
      const alreadyEnrolled = await CoursesApi.checkEnrollmentStatus(courseId);
      if (alreadyEnrolled) {
        console.log("✅ Utilisateur déjà inscrit à ce cours");
        setIsEnrolled(true);
        setIsPaid(true);
        Swal.fire({
          title: "Déjà inscrit",
          text: "Vous êtes déjà inscrit à ce cours. Vous pouvez commencer à apprendre !",
          icon: "info",
          confirmButtonText: "Commencer",
          confirmButtonColor: "#6366f1",
        });
        return;
      }

      // ✅ Tentative d'inscription avec idempotence
      const result = await CoursesApi.followCourse(courseId);

      // ✅ GESTION DES DIFFÉRENTS RÉSULTATS
      if (result.status === "DUPLICATE") {
        // L'inscription existe déjà (ou a été créée entre-temps)
        console.log("⚠️ Inscription duplicate, vérification de l'état...");

        // Vérifier si l'utilisateur est maintenant inscrit
        const checkResult = await CoursesApi.checkEnrollmentStatus(courseId);
        if (checkResult) {
          setIsEnrolled(true);
          setIsPaid(true);
          Swal.fire({
            title: "Inscription confirmée",
            text: "Votre inscription a été confirmée. Bonne apprentissage !",
            icon: "success",
            confirmButtonText: "Commencer",
            confirmButtonColor: "#6366f1",
          });
          return;
        }
      }

      if (result && "payment_url" in result && result.payment_url) {
        // 🔄 Redirection vers le paiement (cours payant)
        console.log("💳 Redirection vers Paydunya:", result.payment_url);
        // 🔐 CRITIQUE: Sauvegarder état AVANT redirection
        savePendingEnrollment(courseId, user?.id);
        window.location.href = result.payment_url;
      } else if (result && result.course && result.status === "ACTIVE") {
        // ✅ Inscription réussie (cours gratuit)
        console.log("✅ Inscription réussie pour cours gratuit");
        setIsEnrolled(true);
        setIsPaid(true);
        Swal.fire({
          title: "Inscription réussie",
          text: "Vous êtes maintenant inscrit à ce cours gratuit. Bonne apprentissage !",
          icon: "success",
          confirmButtonText: "Commencer",
          confirmButtonColor: "#6366f1",
        });
      } else {
        // ❓ Cas inattendu
        console.warn("⚠️ Réponse inattendue de l'API:", result);
        throw new Error("Réponse inattendue du serveur");
      }
    } catch (error) {
      console.error("❌ Erreur lors du suivi du cours:", error);

      // ✅ Vérifier si l'erreur est due à une duplication
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes("409") ||
        errorMessage.includes("duplicate") ||
        errorMessage.includes("already enrolled")
      ) {
        console.log(
          "⚠️ Inscription duplicate détectée, vérification de l'état...",
        );

        // Vérifier si l'utilisateur est maintenant inscrit
        const checkResult = await CoursesApi.checkEnrollmentStatus(courseId);
        if (checkResult) {
          console.log("✅ Utilisateur déjà inscrit (confirmation)");
          setIsEnrolled(true);
          setIsPaid(true);
          Swal.fire({
            title: "Inscription confirmée",
            text: "Votre inscription a été confirmée. Bonne apprentissage !",
            icon: "success",
            confirmButtonText: "Commencer",
            confirmButtonColor: "#6366f1",
          });
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
      console.log(
        `🔍 Vérification paiement en cours pour le cours ${courseId}`,
      );
      // Cette fonction pourrait appeler une API dédiée si nécessaire
      // Pour l'instant, on s'appuie sur la logique backend
      return null; // Le backend gère cette logique
    } catch (error) {
      console.error("❌ Erreur vérification paiement en cours:", error);
      return null;
    }
  };

  // Gestion du clic sur le bouton d'inscription/paiement
  const handleEnrollClick = async () => {
    // ✅ Vérification rapide avant de procéder
    if (isEnrolled === true) {
      Swal.fire({
        title: "Déjà inscrit",
        text: "Vous êtes déjà inscrit à ce cours !",
        icon: "info",
        confirmButtonText: "OK",
        confirmButtonColor: "#6366f1",
      });
      return;
    }

    await handleFollowCourse();
  };

  // Vérifier le statut d'inscription au chargement
  const checkEnrollmentStatus = async () => {
    // ✅ EMPÊCHER LES REQUÊTES MULTIPLES
    if (enrollmentCheckComplete) {
      console.log("⚠️ checkEnrollmentStatus déjà effectué, skip");
      return;
    }

    if (!user?.id || !courseId) {
      console.log(
        "ℹ️ Pas d'utilisateur ou courseId, skip vérification inscription",
      );
      setEnrollmentCheckComplete(true);
      return;
    }

    try {
      console.log("🔍 Vérification statut d'inscription...");
      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.COURSES.FOLLOW(courseId)),
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (response.ok) {
        console.log("✅ Utilisateur déjà inscrit au cours");
        setIsEnrolled(true);
        setIsPaid(true);
      } else {
        console.log("ℹ️ Utilisateur non inscrit ou accès refusé");
        setIsEnrolled(false);
        setIsPaid(false);
      }
    } catch (error) {
      console.log("ℹ️ Erreur vérification inscription:", error);
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
  }, [currentLessonIndex, isMobile, lessonsWithVideos.length]);

  // ✅ Handler quiz complété
  const handleQuizCompleted = useCallback((passed: boolean, score: number) => {
    Swal.fire({
      title: passed ? "Bravo ! 🎉" : "Dommage 😟",
      text: `Vous avez obtenu ${score}%`,
      icon: passed ? "success" : "warning",
      confirmButtonText: "Continuer",
      confirmButtonColor: "#6366f1",
    });

    console.log(`Quiz terminé: ${passed ? "Réussi" : "Échoué"} avec ${score}%`);
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
      console.log(
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
        console.log(
          `✅ Quiz ${exists ? "existe" : "n'existe pas"} pour le module ${moduleId}`,
        );
        return exists;
      } else {
        setModuleQuizzes((prev) => ({ ...prev, [moduleId]: false }));
        console.log(
          `❌ Quiz n'existe pas pour le module ${moduleId} (réponse non-ok)`,
        );
        return false;
      }
    } catch (error) {
      console.error(
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
    console.log("🎯 Démarrage du quiz pour le module:", moduleId);

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
    console.log("Ouverture du module:", moduleId);
    toggleModule(moduleId);
  };

  const totalLessons = lessonsWithVideos.length;
  const totalCourseDuration = lessonsWithVideos.reduce(
    (sum, lesson) => sum + (lesson.duration || 0),
    0,
  );

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
          segments?: number[];
          duration?: number;
          completed?: boolean;
        };

        return {
          segments: Array.isArray(parsed.segments) ? parsed.segments : [],
          duration:
            typeof parsed.duration === "number" && parsed.duration > 0
              ? parsed.duration
              : 0,
          completed: parsed.completed === true,
        };
      } catch (error) {
        console.error("Erreur lecture tracking localStorage:", error);
        return null;
      }
    },
    [getTrackingStorageKey],
  );

  const persistTrackingToStorage = useCallback(
    (
      lessonId: string,
      duration: number,
      segments: Set<number>,
      completed: boolean,
    ) => {
      if (typeof window === "undefined") return;

      try {
        localStorage.setItem(
          getTrackingStorageKey(lessonId),
          JSON.stringify({
            duration,
            segments: Array.from(segments).sort((a, b) => a - b),
            completed,
            updatedAt: Date.now(),
          }),
        );
      } catch (error) {
        console.error("Erreur sauvegarde tracking localStorage:", error);
      }
    },
    [getTrackingStorageKey],
  );

  const getViewedRatio = useCallback((segments: Set<number>, duration: number) => {
    if (!Number.isFinite(duration) || duration <= 0) return 0;
    const totalSegments = Math.max(
      1,
      Math.ceil(duration / TRACKING_SEGMENT_SECONDS),
    );
    const validCount = Array.from(segments).filter(
      (segment) => segment >= 0 && segment < totalSegments,
    ).length;
    return validCount / totalSegments;
  }, []);

  const markLessonCompletedAutomatically = useCallback(
    async (lessonId: string) => {
      if (!lessonId) return;
      if (completionInFlightRef.current.has(lessonId)) return;
      if (syncedCompletedLessonsRef.current.has(lessonId)) return;

      completionInFlightRef.current.add(lessonId);
      try {
        const response = await fetch(
          buildApiUrl(API_ENDPOINTS.LESSONS.COMPLETE(lessonId)),
          {
            method: "POST",
            credentials: "include",
          },
        );

        if (!response.ok && response.status !== 409) {
          console.error(
            "❌ Tracking auto: erreur marquage leçon",
            lessonId,
            response.status,
          );
          return;
        }

        console.log("✅ [TRACKING] leçon marquée complétée", {
          lessonId,
          status: response.status,
        });

        syncedCompletedLessonsRef.current.add(lessonId);
        setLessonProgress((prev) => ({
          ...prev,
          [lessonId]: true,
        }));

        const currentSegments = trackedSegmentsRef.current[lessonId] || new Set();
        const currentDuration = lessonDurationsRef.current[lessonId] || 0;
        persistTrackingToStorage(
          lessonId,
          currentDuration,
          currentSegments,
          true,
        );
      } catch (error) {
        console.error("💥 Tracking auto: échec marquage leçon:", error);
      } finally {
        completionInFlightRef.current.delete(lessonId);
      }
    },
    [persistTrackingToStorage],
  );

  const handleVideoTrackingProgress = useCallback(
    ({ lessonId, fromTime, toTime, duration }: VideoProgressWindow) => {
      if (!lessonId) return;
      if (!Number.isFinite(duration) || duration <= 0) {
        console.warn("[TRACKING] durée invalide, progression ignorée", {
          lessonId,
          fromTime,
          toTime,
          duration,
        });
        return;
      }

      const totalSegments = Math.max(
        1,
        Math.ceil(duration / TRACKING_SEGMENT_SECONDS),
      );
      const minTime = Math.max(0, Math.min(fromTime, toTime));
      const maxTime = Math.max(0, Math.max(fromTime, toTime));
      const startSegment = Math.min(
        totalSegments - 1,
        Math.floor(minTime / TRACKING_SEGMENT_SECONDS),
      );
      const endSegment = Math.min(
        totalSegments - 1,
        Math.floor(maxTime / TRACKING_SEGMENT_SECONDS),
      );

      if (!trackedSegmentsRef.current[lessonId]) {
        const stored = readTrackingFromStorage(lessonId);
        trackedSegmentsRef.current[lessonId] = new Set(stored?.segments || []);
        if (stored?.duration && stored.duration > 0) {
          lessonDurationsRef.current[lessonId] = stored.duration;
        }
        if (stored?.completed) {
          syncedCompletedLessonsRef.current.add(lessonId);
        }
      }

      const trackedSegments = trackedSegmentsRef.current[lessonId];
      for (let segment = startSegment; segment <= endSegment; segment++) {
        trackedSegments.add(segment);
      }

      const sanitizedSegments = new Set(
        Array.from(trackedSegments).filter(
          (segment) => segment >= 0 && segment < totalSegments,
        ),
      );
      trackedSegmentsRef.current[lessonId] = sanitizedSegments;
      lessonDurationsRef.current[lessonId] = duration;

      const ratio = getViewedRatio(sanitizedSegments, duration);
      const isCompleted =
        lessonProgressRef.current[lessonId] ||
        syncedCompletedLessonsRef.current.has(lessonId);
      const nearEndReached =
        Number.isFinite(toTime) && duration > 0
          ? toTime / duration >= TRACKING_NEAR_END_THRESHOLD
          : false;
      const suspiciousDuration =
        duration >= TRACKING_SUSPICIOUS_DURATION_SECONDS;
      const fallbackSegmentsReached =
        suspiciousDuration &&
        sanitizedSegments.size >= TRACKING_FALLBACK_MIN_SEGMENTS;

      console.log("[TRACKING] segment reçu", {
        lessonId,
        fromTime,
        toTime,
        duration,
        trackedSegments: sanitizedSegments.size,
        ratio: Number((ratio * 100).toFixed(2)),
        nearEndReached,
        suspiciousDuration,
        fallbackSegmentsReached,
        isCompleted,
      });

      persistTrackingToStorage(lessonId, duration, sanitizedSegments, isCompleted);

      if (
        !isCompleted &&
        (
          ratio >= TRACKING_COMPLETION_THRESHOLD ||
          nearEndReached ||
          fallbackSegmentsReached
        )
      ) {
        console.log("[TRACKING] seuil atteint, complétion auto", {
          lessonId,
          ratio,
          nearEndReached,
          suspiciousDuration,
          fallbackSegmentsReached,
          reason:
            ratio >= TRACKING_COMPLETION_THRESHOLD
              ? "coverage_threshold"
              : nearEndReached
                ? "near_end_threshold"
                : "fallback_segment_threshold",
        });
        void markLessonCompletedAutomatically(lessonId);
      }
    },
    [
      getViewedRatio,
      markLessonCompletedAutomatically,
      persistTrackingToStorage,
      readTrackingFromStorage,
    ],
  );

  useEffect(() => {
    if (!selectedLessonId) return;

    const stored = readTrackingFromStorage(selectedLessonId);
    if (!stored) return;

    const segments = new Set(stored.segments || []);
    trackedSegmentsRef.current[selectedLessonId] = segments;
    if (stored.duration > 0) {
      lessonDurationsRef.current[selectedLessonId] = stored.duration;
    }
    if (stored.completed) {
      syncedCompletedLessonsRef.current.add(selectedLessonId);
    }

    const alreadyCompleted = lessonProgressRef.current[selectedLessonId];
    const ratio = getViewedRatio(segments, stored.duration);
    if (!alreadyCompleted && ratio >= TRACKING_COMPLETION_THRESHOLD) {
      void markLessonCompletedAutomatically(selectedLessonId);
    }
  }, [
    getViewedRatio,
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
  const LessonsSidebar = () => (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border border-[#D1D7DC] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#D1D7DC] px-4 py-4">
        <h3 className="text-xl font-bold leading-6 text-[#1C1D1F]">
          Contenu du cours
        </h3>
        <button
          type="button"
          className="rounded-sm p-1 text-[#6A6F73] transition-colors duration-200 hover:bg-[#F7F9FA] hover:text-[#1C1D1F]"
        >
          <X className="h-5 w-5" />
        </button>
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

                    return (
                      <div
                        key={lesson.id}
                        className={`border-t border-[#D1D7DC] transition-colors ${
                          selectedLessonId === lesson.id
                            ? "border-l-4 border-l-[#5624D0] bg-[#EEF1F8]"
                            : "bg-white hover:bg-[#F7F9FA]"
                        }`}
                      >
                        <div className="flex items-start gap-3 px-4 py-3">
                          <span
                            className={`mt-1 flex h-5 w-5 items-center justify-center rounded-sm border ${
                              completed
                                ? "border-[#3ECF8E] bg-[#3ECF8E]"
                                : "border-[#6A6F73] bg-white"
                            }`}
                          >
                            {completed ? (
                              <Check className="h-3 w-3 text-white" />
                            ) : (
                              <span className="h-2.5 w-2.5 rounded-[2px] border border-[#D1D7DC]" />
                            )}
                          </span>

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
                            className="flex flex-1 items-start gap-3 text-left"
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
                        ? "border-[#5624D0] bg-[#EEE6FF] text-[#3B1178] shadow-sm"
                        : "border-[#D9CCFF] bg-[#F8F4FF] text-[#4B1E8A] hover:border-[#5624D0] hover:bg-[#F2EBFF]"
                    }`}
                  >
                    <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/80 text-[#5624D0]">
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

  const hasCourseAccess = isEnrolled === true || isAdmin;
  const completedLessonsCount = lessonsWithVideos.filter((lesson) =>
    isLessonCompleted(lesson.id),
  ).length;
  const progressPercent =
    totalLessons > 0
      ? Math.min(100, Math.round((completedLessonsCount / totalLessons) * 100))
      : 0;
  const learningPoints = modules
    .flatMap((module) =>
      module.lessons
        .filter((lesson) => lesson.hasVideo)
        .slice(0, 6)
        .map(
          (lesson) =>
            lesson.content ||
            `Comprendre et maîtriser : ${(lesson.title || "cette leçon").toLowerCase()}`,
        ),
    )
    .slice(0, 8);
  const firstCourseWord = (course.title || "Cours").split(" ")[0];

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
                      onEnded={handleVideoEnd}
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
                      onEnded={handleVideoEnd}
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

      {hasCourseAccess ? (
        <>
          <header
            className={`sticky top-0 z-40 border-b ${
              contentMode === "quiz" && activeQuizModuleId
                ? "border-[#D1D7DC] bg-white text-[#1C1D1F]"
                : "border-[#3E4143] bg-[#1C1D1F] text-white"
            }`}
          >
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
                className={`flex min-w-0 items-center gap-3 transition-colors duration-200 ${
                  contentMode === "quiz" && activeQuizModuleId
                    ? "text-[#1C1D1F] hover:text-[#5624D0]"
                    : "text-white/90 hover:text-white"
                }`}
              >
                <ArrowLeft className="h-5 w-5 flex-shrink-0" />
                <span className="truncate text-base font-medium">
                  {contentMode === "quiz" && activeQuizModuleId
                    ? "Retour au cours"
                    : course.title}
                </span>
              </button>

              {!(contentMode === "quiz" && activeQuizModuleId) && (
                <div className="hidden items-center gap-3 sm:flex">
                  <div className="h-1.5 w-28 rounded-full bg-[#4A4E62]">
                    <div
                      className="h-full rounded-full bg-[#A435F0]"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-sm text-[#C0C4FC]">Votre progression</span>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded border border-[#D1D7DC] px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#2A2B34]"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Partager</span>
                  </button>
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded border border-[#D1D7DC] text-white transition-colors duration-200 hover:bg-[#2A2B34]"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </header>

          <main>
            {contentMode === "quiz" && activeQuizModuleId ? (
              <section className="min-h-[calc(100vh-56px)] bg-[#F7F9FA] py-6">
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
              </section>
            ) : (
              <>
                <section className="w-full border-b border-[#D1D7DC] bg-white">
                  <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="flex flex-col bg-black">
                      {hasVideo && hasVideoContent ? (
                        <div className="relative aspect-video xl:h-[36vh] xl:max-h-[400px] xl:aspect-auto">
                          {selectedLesson?.videoUrl ? (
                            (() => {
                              const videoId = getYouTubeVideoId(selectedLesson.videoUrl);
                              return videoId ? (
                                <VideoWithLoading
                                  lessonId={selectedLesson.id}
                                  videoId={videoId}
                                  title={selectedLesson.title || course.title}
                                  onTrackProgress={handleVideoTrackingProgress}
                                  onEnded={handleVideoEnd}
                                />
                              ) : (
                                <SecureVideoPlayer
                                  url={selectedLesson.videoUrl}
                                  key={selectedLesson?.id}
                                  lessonId={selectedLesson.id}
                                  durationHintSeconds={(selectedLesson.duration || 0) * 60}
                                  title={selectedLesson.title || course.title}
                                  onProgressWindow={(fromTime, toTime, duration) =>
                                    handleVideoTrackingProgress({
                                      lessonId: selectedLesson.id,
                                      fromTime,
                                      toTime,
                                      duration,
                                    })
                                  }
                                  onEnded={handleVideoEnd}
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
                              onProgressWindow={(fromTime, toTime, duration) =>
                                handleVideoTrackingProgress({
                                  lessonId: selectedLesson.id,
                                  fromTime,
                                  toTime,
                                  duration,
                                })
                              }
                              onEnded={handleVideoEnd}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="flex aspect-video items-center justify-center text-sm text-gray-400 xl:h-[36vh] xl:max-h-[400px] xl:aspect-auto">
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

                    {!isMobile && hasVideoContent && (
                      <div className="border-l border-[#D1D7DC] bg-white xl:h-[calc(36vh+56px)] xl:max-h-[456px]">
                        <LessonsSidebar />
                      </div>
                    )}
                  </div>
                </section>

                <section className="border-b border-[#D1D7DC] bg-white">
                  <div className="mx-auto max-w-[1020px] overflow-x-auto px-4">
                    <div className="flex min-w-max items-center">
                      <Search className="mr-3 h-4 w-4 text-[#6A6F73]" />
                      <button
                        onClick={() => setActiveTab("videos")}
                        className={`border-b-2 px-3 py-4 text-[15px] font-semibold transition-colors duration-200 ${
                          activeTab === "videos"
                            ? "border-[#1C1D1F] text-[#1C1D1F]"
                            : "border-transparent text-[#6A6F73] hover:text-[#1C1D1F]"
                        }`}
                      >
                        Aperçu
                      </button>
                      <button
                        onClick={() => setActiveTab("resources")}
                        className={`border-b-2 px-3 py-4 text-[15px] font-semibold transition-colors duration-200 ${
                          activeTab === "resources"
                            ? "border-[#1C1D1F] text-[#1C1D1F]"
                            : "border-transparent text-[#6A6F73] hover:text-[#1C1D1F]"
                        }`}
                      >
                        Notes
                      </button>
                      <button
                        onClick={() => setActiveTab("support")}
                        className={`border-b-2 px-3 py-4 text-[15px] font-semibold transition-colors duration-200 ${
                          activeTab === "support"
                            ? "border-[#1C1D1F] text-[#1C1D1F]"
                            : "border-transparent text-[#6A6F73] hover:text-[#1C1D1F]"
                        }`}
                      >
                        Annonces
                      </button>
                      <button
                        onClick={() => setActiveTab("support")}
                        className="border-b-2 border-transparent px-3 py-4 text-[15px] font-semibold text-[#6A6F73] transition-colors duration-200 hover:text-[#1C1D1F]"
                      >
                        Avis
                      </button>
                      <button
                        onClick={() => setActiveTab("support")}
                        className="border-b-2 border-transparent px-3 py-4 text-[15px] font-semibold text-[#6A6F73] transition-colors duration-200 hover:text-[#1C1D1F]"
                      >
                        Outils d&apos;apprentissage
                      </button>
                    </div>
                  </div>
                </section>

                {isMobile && hasVideoContent && (
                  <section className="border-b border-[#D1D7DC] bg-white">
                    <LessonsSidebar />
                  </section>
                )}

                {activeTab === "videos" && (
                  <section className="mx-auto max-w-[1020px] px-4 py-8">
                    <h2 className="max-w-4xl text-4xl leading-tight text-[#2D2F31]">
                      By the end of this course you will have practical hands-on
                      knowledge on programming in Python
                    </h2>

                    <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-[#B4690E]">4.5</span>
                        <Star className="h-3.5 w-3.5 fill-[#E59819] text-[#E59819]" />
                        <Star className="h-3.5 w-3.5 fill-[#E59819] text-[#E59819]" />
                        <Star className="h-3.5 w-3.5 fill-[#E59819] text-[#E59819]" />
                        <Star className="h-3.5 w-3.5 fill-[#E59819] text-[#E59819]" />
                        <Star className="h-3.5 w-3.5 text-[#E59819]" />
                      </div>
                      <span className="text-[#5624D0] underline">1 356 évaluations</span>
                      <span className="text-[#6A6F73]">25 987 étudiants</span>
                      <span className="text-[#6A6F73]">{formatDuration(totalCourseDuration)}</span>
                    </div>

                    <div className="mt-7 border border-[#D1D7DC] bg-white p-6">
                      <h3 className="mb-6 text-2xl font-bold text-[#1C1D1F]">
                        Ce que vous apprendrez
                      </h3>
                      <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
                        {learningPoints.map((point, index) => (
                          <div key={`${point}-${index}`} className="flex items-start gap-3">
                            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#5624D0]" />
                            <span className="text-sm leading-6 text-[#2D2F31]">
                              {point}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}

                {activeTab === "resources" && (
                  <section className="mx-auto max-w-[1020px] px-4 py-8">
                    <div className="border border-[#D1D7DC] bg-white p-6">
                      {course.attachment && course.attachment !== "undefined" ? (
                        <a
                          href={course.attachment}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 text-[#1C1D1F] transition-colors duration-200 hover:text-[#5624D0]"
                        >
                          <FileText className="h-5 w-5" />
                          <span className="text-sm font-semibold">
                            Télécharger le document du cours
                          </span>
                        </a>
                      ) : (
                        <p className="text-sm text-[#6A6F73]">
                          Aucune ressource disponible pour ce cours.
                        </p>
                      )}
                    </div>
                  </section>
                )}

                {activeTab === "support" && (
                  <section className="mx-auto max-w-[1020px] px-4 py-8">
                    <div className="border border-[#D1D7DC] bg-white p-6">
                      <p className="text-sm text-[#6A6F73]">
                        Besoin d&apos;aide ? Contactez{" "}
                        <a
                          href="mailto:support@bibocomdigital.com"
                          className="font-semibold text-[#5624D0] hover:underline"
                        >
                          support@bibocomdigital.com
                        </a>
                        .
                      </p>
                    </div>
                  </section>
                )}
              </>
            )}
          </main>
        </>
      ) : (
        <>
          <header className="sticky top-0 z-40 border-b border-[#D1D7DC] bg-white">
            <div className="mx-auto flex h-14 max-w-[1200px] items-center px-4 sm:px-6">
              <button
                onClick={() =>
                  router.push(isAdmin ? "/admin-dashboard?focus=courses" : "/")
                }
                className="flex items-center gap-2 text-sm font-medium text-[#2D2F31] transition-colors duration-200 hover:text-[#5624D0]"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Retour aux cours</span>
              </button>
            </div>
          </header>

          <main className="bg-[#F7F9FA]">
            <section className="bg-[#0F2A4A] text-white">
              <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:py-14">
                <div className="max-w-3xl">
                  <div className="mb-3 flex items-center gap-2 text-xs text-[#C0C4FC] sm:text-sm">
                    <span>Informatique et logiciels</span>
                    <span>&gt;</span>
                    <span>Informatique et logiciels - Divers</span>
                    <span>&gt;</span>
                    <span className="truncate">{course.title}</span>
                  </div>
                  <h1 className="mb-4 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                    {course.title}
                  </h1>
                  <p className="text-base text-[#D1D7DC] sm:text-lg">
                    {course.description ||
                      "De zéro à des workflows intelligents : bots, webhooks, intégrations, déploiement et cas pratiques"}
                  </p>
                </div>
              </div>
            </section>

            <section className="mx-auto max-w-[1200px] px-4 pb-12 sm:px-6">
              <div className="-mt-20 grid grid-cols-1 gap-8 lg:grid-cols-12">
                <div className="order-2 space-y-7 lg:order-1 lg:col-span-8 lg:pt-20">
                  <div className="rounded border border-[#D1D7DC] bg-white p-6 lg:p-8">
                    <h2 className="mb-6 text-2xl font-bold text-[#1C1D1F]">
                      Ce que vous apprendrez
                    </h2>
                    <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
                      {learningPoints.map((point, index) => (
                        <div key={`${point}-${index}`} className="flex items-start gap-3">
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#1C1D1F]" />
                          <span className="text-sm leading-6 text-[#2D2F31]">
                            {point}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-4 text-2xl font-bold text-[#1C1D1F]">
                      Découvrir les sujets associés
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      <span className="rounded-full border border-[#D1D7DC] bg-white px-4 py-2 text-sm text-[#2D2F31]">
                        {firstCourseWord}
                      </span>
                      <span className="rounded-full border border-[#D1D7DC] bg-white px-4 py-2 text-sm text-[#2D2F31]">
                        Automatisation
                      </span>
                      <span className="rounded-full border border-[#D1D7DC] bg-white px-4 py-2 text-sm text-[#2D2F31]">
                        Informatique et logiciels - Divers
                      </span>
                      <span className="rounded-full border border-[#D1D7DC] bg-white px-4 py-2 text-sm text-[#2D2F31]">
                        Informatique et logiciels
                      </span>
                    </div>
                  </div>
                </div>

                <div className="order-1 lg:order-2 lg:col-span-4">
                  <div className="overflow-hidden rounded border border-[#D1D7DC] bg-white shadow-md lg:sticky lg:top-24">
                    <div className="h-48 w-full bg-[#0D1F3A]">
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
                    </div>

                    <div className="p-6">
                      <p className="mb-4 text-5xl font-bold text-[#1C1D1F]">
                        {course.price ? `${course.price} FCFA` : "Gratuit"}
                      </p>

                      <button
                        onClick={handleEnrollClick}
                        disabled={enrolling}
                        className="mb-6 w-full rounded bg-[#DC2626] px-4 py-3 text-sm font-bold text-white transition-colors duration-200 hover:bg-[#B91C1C] disabled:opacity-50"
                      >
                        {enrolling
                          ? "Inscription..."
                          : isFree
                            ? "Suivre le cours"
                            : "Acheter maintenant"}
                      </button>

                      <h4 className="mb-3 text-lg font-bold text-[#1C1D1F]">
                        Ce cours comprend :
                      </h4>
                      <ul className="space-y-2 text-sm text-[#2D2F31]">
                        <li className="flex items-center gap-2">
                          <Play className="h-4 w-4 text-[#6A6F73]" />
                          <span>Vidéo à la demande de {formatDuration(totalCourseDuration)}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-[#6A6F73]" />
                          <span>Accès illimité</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-[#6A6F73]" />
                          <span>Mises à jour régulières</span>
                        </li>
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
