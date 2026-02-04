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
import { Button } from "@/components/ui/button";
import {
  Play,
  ArrowLeft,
  ChevronDown,
  X,
  CheckCircle,
  Lock,
  Star,
  Users,
  Clock,
  BookOpen,
  Target,
  Award,
  User,
  Check,
  PlayCircle,
  FileText,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Cookies from "js-cookie";

function CourseDetailsPageComponent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useLocalAuth();
  const { verifyPayment } = usePayment();
  const courseId = params?.id as string;

  // ✅ Check if user is admin - they should have access to all courses
  const isAdmin = user?.role === "ADMIN";

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
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null);
  const [currentQuizData, setCurrentQuizData] = useState<Quiz | null>(null);
  const [moduleQuizzes, setModuleQuizzes] = useState<Record<string, boolean>>(
    {},
  );
  const [checkingQuizzes, setCheckingQuizzes] = useState<Set<string>>(
    new Set(),
  );

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
        console.log("💳 Redirection vers le paiement:", result.payment_url);
        Cookies.set("pendingCourseId", courseId, { expires: 1 });
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

  // ✅ Handler quiz complété
  const handleQuizCompleted = useCallback((passed: boolean, score: number) => {
    setShowQuizModal(false);
    setCurrentQuizId(null);
    setCurrentQuizData(null);

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

    setCurrentQuizId(quiz.id);
    setCurrentQuizData(quiz);
    setShowQuizModal(true);
  };

  // Gestion du clic sur un module
  const handleModuleClick = (moduleId: string) => {
    // Pour tous les utilisateurs, permettre l'expansion du module (aperçu)
    console.log("Ouverture du module:", moduleId);
    toggleModule(moduleId);
  };

  const totalLessons = lessonsWithVideos.length;

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

  const hasVideo = !!selectedLesson?.hasVideo;
  const hasVideoContent = lessonsWithVideos.length > 0;

  const isLessonCompleted = (lessonId: string) => {
    return lessonProgress[lessonId] || false;
  };

  const handleToggleLessonCompletion = async (
    lessonId: string,
    completed: boolean,
  ) => {
    // Vérifier si le module parent est terminé
    const parentModule = modules.find((m) =>
      m.lessons.some((l) => l.id === lessonId),
    );
    const isModuleCompleted = parentModule
      ? completedModules.has(parentModule.id)
      : false;

    if (isModuleCompleted && !completed) {
      // Empêcher le décochage si le module est terminé
      Swal.fire({
        title: "Modification impossible",
        text: "Impossible de modifier le statut d'une leçon appartenant à un module terminé",
        icon: "warning",
        confirmButtonText: "Compris",
        confirmButtonColor: "#6366f1",
      });
      return;
    }

    console.log("🔄 Changement de statut pour la leçon:", lessonId);
    console.log("📊 État actuel:", lessonProgress[lessonId]);
    console.log("📊 Nouvel état:", completed);

    try {
      if (completed) {
        console.log("✅ Marquage de la leçon comme terminée...");
        const response = await fetch(
          buildApiUrl(API_ENDPOINTS.LESSONS.COMPLETE(lessonId)),
          {
            method: "POST",
            credentials: "include",
          },
        );

        if (response.ok) {
          console.log("✅ API: Leçon marquée comme terminée avec succès");
        } else {
          console.error("❌ API: Erreur lors du marquage", response.status);
        }
      } else {
        console.log("🔄 Démarquage de la leçon...");
        const response = await fetch(
          buildApiUrl(API_ENDPOINTS.LESSONS.UNCOMPLETE(lessonId)),
          {
            method: "POST",
            credentials: "include",
          },
        );

        if (response.ok) {
          console.log("✅ API: Leçon démarquée avec succès");
        } else {
          console.error("❌ API: Erreur lors du démarquage", response.status);
        }
      }

      setLessonProgress((prev) => ({
        ...prev,
        [lessonId]: completed,
      }));

      console.log("💾 État local mis à jour");
      console.log("📊 Nouvelle progression:", {
        ...lessonProgress,
        [lessonId]: completed,
      });
    } catch (error) {
      console.error("💥 Erreur lors du changement de statut:", error);
    }
  };

  // ✅ Composant Sidebar réutilisable
  const LessonsSidebar = () => (
    <div className="bg-white rounded-lg lg:rounded-xl border border-gray-200 shadow-sm">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("videos")}
          className={`flex-1 py-2.5 lg:py-3 px-3 lg:px-4 text-xs lg:text-sm font-medium transition-colors relative ${
            activeTab === "videos"
              ? "text-indigo-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Vidéos
          {activeTab === "videos" && (
            <div className="absolute bottom-0 left-3 right-3 lg:left-4 lg:right-4 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("resources")}
          className={`flex-1 py-2.5 lg:py-3 px-3 lg:px-4 text-xs lg:text-sm font-medium transition-colors relative ${
            activeTab === "resources"
              ? "text-indigo-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Ressources
          {activeTab === "resources" && (
            <div className="absolute bottom-0 left-3 right-3 lg:left-4 lg:right-4 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("support")}
          className={`flex-1 py-2.5 lg:py-3 px-3 lg:px-4 text-xs lg:text-sm font-medium transition-colors relative ${
            activeTab === "support"
              ? "text-indigo-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Support
          {activeTab === "support" && (
            <div className="absolute bottom-0 left-3 right-3 lg:left-4 lg:right-4 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="max-h-[400px] lg:max-h-[calc(100vh-250px)] overflow-y-auto">
        {activeTab === "videos" && (
          <div className="p-2">
            {modules.map((module, moduleIndex) => {
              const isExpanded = expandedModules.has(module.id);
              const isModuleCompleted = completedModules.has(module.id);
              const moduleQuiz = getModuleQuiz(module.id);
              const totalModuleDuration = module.lessons
                .filter((l) => l.hasVideo)
                .reduce((sum, l) => sum + l.duration, 0);

              return (
                <div key={module.id} className="mb-2">
                  <button
                    onClick={() => {
                      toggleModule(module.id);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 lg:p-3 rounded-lg transition-all duration-300 text-left group ${
                      isModuleCompleted
                        ? "bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200"
                        : "hover:bg-indigo-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 lg:gap-3 flex-1 min-w-0">
                      <div
                        className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isModuleCompleted
                            ? "bg-gradient-to-r from-emerald-500 to-green-600"
                            : "bg-gradient-to-r from-indigo-100 to-purple-100"
                        }`}
                      >
                        {isModuleCompleted ? (
                          <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                        ) : (
                          <span className="text-xs lg:text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            {moduleIndex + 1}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`font-medium text-xs lg:text-sm truncate ${
                            isModuleCompleted
                              ? "text-emerald-900"
                              : "text-gray-900"
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="truncate">{module.title}</span>
                            {isModuleCompleted && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium whitespace-nowrap">
                                Terminé
                              </span>
                            )}
                            {!isEnrolled && !isFree && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium whitespace-nowrap">
                                Aperçu
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {module.lessons.filter((l) => l.hasVideo).length}{" "}
                          leçons
                          {moduleQuiz && " • 1 quiz"}
                          {totalModuleDuration > 0 && (
                            <> · {formatDuration(totalModuleDuration)}</>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronDown
                        className={`w-4 h-4 lg:w-5 lg:h-5 transition-transform duration-300 flex-shrink-0 ${
                          isModuleCompleted
                            ? "text-emerald-600"
                            : "text-gray-400"
                        } ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="ml-3 lg:ml-4 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-300">
                      {module.lessons
                        .filter((lesson) => lesson.hasVideo)
                        .map((lesson) => {
                          const completed = isLessonCompleted(lesson.id);
                          return (
                            <div
                              key={lesson.id}
                              className={`w-full rounded-lg transition-colors ${
                                selectedLessonId === lesson.id
                                  ? "bg-gradient-to-r from-indigo-50 to-purple-50"
                                  : "hover:bg-gray-50"
                              }`}
                            >
                              {/* Bouton pour sélectionner la leçon */}
                              <button
                                onClick={() => {
                                  const lessonIndex =
                                    lessonsWithVideos.findIndex(
                                      (l) => l.id === lesson.id,
                                    );
                                  if (lessonIndex !== -1) {
                                    setCurrentLessonIndex(lessonIndex);
                                  }
                                  if (isMobile) {
                                    window.scrollTo({
                                      top: 0,
                                      behavior: "smooth",
                                    });
                                  }
                                }}
                                className="flex items-start gap-2 lg:gap-3 w-full p-2.5 lg:p-3 pl-3 lg:pl-4 text-left"
                              >
                                <div
                                  className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    completed
                                      ? "bg-green-500"
                                      : selectedLessonId === lesson.id &&
                                          isEnrolled
                                        ? "bg-gradient-to-r from-indigo-600 to-purple-600"
                                        : isEnrolled
                                          ? "bg-gradient-to-r from-indigo-100 to-purple-100"
                                          : "bg-gray-200"
                                  }`}
                                >
                                  {completed ? (
                                    <CheckCircle className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-white fill-current" />
                                  ) : isEnrolled ? (
                                    <PlayCircle
                                      className={`w-3 h-3 lg:w-3.5 lg:h-3.5 ${
                                        selectedLessonId === lesson.id
                                          ? "text-white"
                                          : "text-indigo-600"
                                      }`}
                                    />
                                  ) : (
                                    <Lock className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-amber-500" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div
                                    className={`font-medium text-xs lg:text-sm leading-snug truncate ${
                                      selectedLessonId === lesson.id
                                        ? "text-gray-900"
                                        : completed
                                          ? "text-green-700"
                                          : "text-gray-700"
                                    }`}
                                  >
                                    {lesson.title}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                                    {lesson.duration > 0 && (
                                      <span className="whitespace-nowrap">
                                        {formatDuration(lesson.duration)}
                                      </span>
                                    )}
                                    {completed && (
                                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 whitespace-nowrap">
                                        Terminée
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>

                              {/* Checkbox pour marquer comme terminé */}
                              {(isEnrolled === true || isAdmin) &&
                                !completed && (
                                  <div className="px-3 lg:px-4 pb-2.5 lg:pb-3">
                                    <label
                                      className="flex items-center gap-2 cursor-pointer group/checkbox"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <input
                                        type="checkbox"
                                        name={`lesson-${lesson.id}`}
                                        checked={completed}
                                        onChange={async (e) => {
                                          e.stopPropagation();
                                          const newCompleted = e.target.checked;

                                          const parentModule = modules.find(
                                            (m) =>
                                              m.lessons.some(
                                                (l) => l.id === lesson.id,
                                              ),
                                          );
                                          const isModuleCompleted = parentModule
                                            ? completedModules.has(
                                                parentModule.id,
                                              )
                                            : false;

                                          if (
                                            isModuleCompleted &&
                                            !newCompleted
                                          ) {
                                            Swal.fire({
                                              title: "Modification impossible",
                                              text: "Impossible de modifier le statut d'une leçon appartenant à un module terminé",
                                              icon: "warning",
                                              confirmButtonText: "Compris",
                                              confirmButtonColor: "#6366f1",
                                            });
                                            return;
                                          }

                                          console.log(
                                            "🔄 Changement de statut pour la leçon:",
                                            lesson.id,
                                          );

                                          try {
                                            if (newCompleted) {
                                              const response = await fetch(
                                                buildApiUrl(
                                                  API_ENDPOINTS.LESSONS.COMPLETE(
                                                    lesson.id,
                                                  ),
                                                ),
                                                {
                                                  method: "POST",
                                                  credentials: "include",
                                                },
                                              );

                                              if (response.ok) {
                                                console.log(
                                                  "✅ API: Leçon marquée comme terminée",
                                                );
                                              }
                                            } else {
                                              const response = await fetch(
                                                buildApiUrl(
                                                  API_ENDPOINTS.LESSONS.UNCOMPLETE(
                                                    lesson.id,
                                                  ),
                                                ),
                                                {
                                                  method: "POST",
                                                  credentials: "include",
                                                },
                                              );

                                              if (response.ok) {
                                                console.log(
                                                  "✅ API: Leçon démarquée",
                                                );
                                              }
                                            }

                                            setLessonProgress((prev) => ({
                                              ...prev,
                                              [lesson.id]: newCompleted,
                                            }));
                                          } catch (error) {
                                            console.error("💥 Erreur:", error);
                                          }
                                        }}
                                        className="sr-only"
                                      />
                                      <div className="relative w-5 h-5 flex-shrink-0">
                                        <div
                                          className={`w-5 h-5 rounded-full border-2 transition-all ${
                                            completed
                                              ? "border-green-500 bg-green-500"
                                              : "border-gray-300 bg-white group-hover/checkbox:border-indigo-400"
                                          }`}
                                        >
                                          {completed && (
                                            <CheckCircle className="w-5 h-5 text-white fill-current -m-[2px]" />
                                          )}
                                        </div>
                                      </div>
                                      <span className="text-xs text-gray-600 group-hover/checkbox:text-gray-900">
                                        {completed
                                          ? "Leçon terminée"
                                          : "Marquer comme terminée"}
                                      </span>
                                    </label>
                                  </div>
                                )}
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* Bouton Quiz du Module */}
                  {moduleQuiz && isModuleCompleted && (
                    <button
                      onClick={() => handleStartQuiz(module.id)}
                      className="w-full flex items-center gap-2 p-2 mt-2 rounded text-left transition-colors text-xs lg:text-sm bg-yellow-50 hover:bg-yellow-100 text-yellow-900 font-semibold border border-yellow-200"
                    >
                      <BookOpen className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate flex-1">
                        Quiz: {moduleQuiz.title}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "resources" && (
          <div className="p-4 lg:p-6 text-center">
            <p className="text-gray-600 text-xs lg:text-sm">
              Les ressources pour ce cours seront bientôt disponibles.
            </p>
          </div>
        )}

        {activeTab === "support" && (
          <div className="p-4 lg:p-6">
            <p className="text-gray-600 text-xs lg:text-sm">
              Besoin d'aide ? Contactez notre équipe de support à{" "}
              <a
                href="mailto:support@bibocomdigital.com"
                className="text-indigo-600 hover:underline break-all"
              >
                support@bibocomdigital.com
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fullscreen Video Modal - Mobile */}
      {isFullscreen && isMobile && (
        <div className="fixed inset-0 z-50 bg-black">
          <div className="relative w-full h-full flex flex-col">
            <button
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex-1 flex items-center justify-center bg-black">
              {selectedLesson?.hasVideo ? (
                <SecureVideoPlayer
                  url={selectedLesson.videoUrl}
                  key={selectedLesson?.id}
                  lessonId={selectedLesson.id}
                  title={selectedLesson.title || course.title}
                  className="w-full h-full"
                />
              ) : (
                <div className="text-center text-white px-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                    <PlayCircle className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-400 text-sm sm:text-base">
                    Aucune vidéo disponible
                  </p>
                </div>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
              <h3 className="text-white font-semibold text-base sm:text-lg mb-1 truncate">
                {selectedLesson?.title || course.title}
              </h3>
              <p className="text-white/70 text-xs sm:text-sm">
                {selectedLesson?.duration && selectedLesson.duration > 0
                  ? formatDuration(selectedLesson.duration)
                  : ""}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">Cours</span>
            <span className="text-gray-400 mx-1 hidden sm:inline">-</span>
            <span className="text-sm text-gray-900 font-medium truncate max-w-[150px] sm:max-w-md hidden sm:inline">
              {course.title}
            </span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Mobile: Sidebar AVANT la vidéo */}
            {isMobile && hasVideoContent && isEnrolled && <LessonsSidebar />}

            {/* Video Player */}
            {hasVideo && hasVideoContent && (
              <div className="relative rounded-lg lg:rounded-xl overflow-hidden bg-gray-900 shadow-lg">
                <div className="aspect-video relative">
                  {isEnrolled === true || isAdmin ? (
                    /* ✅ Utilisateur inscrit ou admin - Vérifier si videoUrl existe */
                    selectedLesson?.videoUrl ? (
                      /* Afficher directement la vidéo YouTube */
                      (() => {
                        const videoId = getYouTubeVideoId(
                          selectedLesson.videoUrl,
                        );
                        return videoId ? (
                          <div className="absolute inset-0 w-full h-full">
                            <iframe
                              src={`https://www.youtube.com/embed/${videoId}?controls=1&modestbranding=1&rel=0&autoplay=0`}
                              title={selectedLesson.title || course.title}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full h-full"
                            />
                          </div>
                        ) : (
                          <SecureVideoPlayer
                            url={selectedLesson.videoUrl}
                            key={selectedLesson?.id}
                            lessonId={selectedLesson.id}
                            title={selectedLesson.title || course.title}
                          />
                        );
                      })()
                    ) : (
                      /* ✅ SecureVideoPlayer - utiliser l'URL directe si disponible */
                      <SecureVideoPlayer
                        url={selectedLesson.videoUrl}
                        key={selectedLesson?.id}
                        lessonId={selectedLesson.id}
                        title={selectedLesson.title || course.title}
                      />
                    )
                  ) : (
                    /*  Utilisateur NON inscrit - Overlay d'aperçu RESPONSIVE */
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4 sm:p-6">
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 sm:mb-3 text-center px-2">
                        Aperçu de la leçon
                      </h3>
                      <p className="text-white/80 text-xs sm:text-sm lg:text-base text-center max-w-md mb-4 sm:mb-6 px-4 leading-relaxed">
                        Découvrez le contenu de ce cours. Inscrivez-vous pour
                        accéder aux vidéos complètes.
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEnrollClick();
                        }}
                        disabled={enrolling}
                        className="px-6 sm:px-8 py-2.5 sm:py-3 bg-indigo-600 text-white text-sm sm:text-base font-semibold rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg"
                      >
                        {enrolling ? (
                          <>
                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs sm:text-base">
                              Inscription...
                            </span>
                          </>
                        ) : (
                          <span className="text-xs sm:text-base">
                            {isFree
                              ? "Commencer maintenant"
                              : "S'inscrire au cours"}
                          </span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            {hasVideo && hasVideoContent && (
              <div className="flex items-center justify-between w-full px-3 sm:px-4 py-2 sm:py-3 bg-muted rounded-lg">
                {/* Bouton Précédent */}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentLessonIndex === 0}
                  onClick={() => setCurrentLessonIndex(currentLessonIndex - 1)}
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Précédent</span>
                  <span className="inline sm:hidden">Préc</span>
                </Button>

                {/* Indicateur */}
                <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                  {currentLessonIndex + 1} / {lessonsWithVideos.length}
                </div>

                {/* Bouton Suivant */}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentLessonIndex === lessonsWithVideos.length - 1}
                  onClick={() => setCurrentLessonIndex(currentLessonIndex + 1)}
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
                >
                  <span className="hidden sm:inline">Suivant</span>
                  <span className="inline sm:hidden">Suiv</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Course Info Tags */}
            <div className="flex flex-wrap items-center gap-2 lg:gap-3">
              <span className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs lg:text-sm font-medium rounded-full">
                {getLevelLabel(course.level)}
              </span>
              <span className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs lg:text-sm font-medium rounded-full">
                Cours en Direct
              </span>
              <span className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs lg:text-sm font-medium rounded-full">
                {totalLessons} Leçons
              </span>
            </div>

            {/* Course Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 sm:gap-6">
                <div className="flex-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 leading-tight mb-3 sm:mb-4">
                    {course.title}
                  </h1>

                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed mb-4 sm:mb-6 max-w-3xl">
                    {course.description ||
                      "Découvrez ce cours complet et apprenez à votre rythme avec des vidéos de qualité professionnelle."}
                  </p>

                  {/* Course Tags - Responsive */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-100 text-indigo-800 text-xs sm:text-sm font-medium rounded-full">
                      {getLevelLabel(course.level)}
                    </span>
                    <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-100 text-green-800 text-xs sm:text-sm font-medium rounded-full">
                      Cours en Direct
                    </span>
                    <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-100 text-purple-800 text-xs sm:text-sm font-medium rounded-full">
                      {totalLessons} Leçons
                    </span>
                    <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-100 text-blue-800 text-xs sm:text-sm font-medium rounded-full">
                      Français
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* What You Will Learn */}
            <div className="w-full">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 flex-shrink-0" />
                  <span>Ce que vous allez apprendre</span>
                </h2>

                {/* Course Title and Description */}
                <div className="mb-6 sm:mb-8">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                    {course.title}
                  </h3>
                  <div className="prose prose-sm sm:prose-base prose-gray max-w-none">
                    <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-3 sm:mb-4">
                      {course.description ||
                        "Découvrez ce cours complet qui vous guidera pas à pas dans l'acquisition des compétences essentielles pour maîtriser ce domaine. À travers des leçons structurées et des exercices pratiques, vous développerez une compréhension approfondie des concepts fondamentaux et apprendrez à les appliquer dans des situations réelles."}
                    </p>
                    <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                      Ce programme pédagogique a été conçu pour s'adapter à
                      votre rythme d'apprentissage, que vous soyez débutant ou
                      que vous souhaitiez perfectionner vos connaissances.
                      Chaque module aborde des thèmes spécifiques avec des
                      exemples concrets et des démonstrations pratiques.
                    </p>
                  </div>
                </div>

                {/* Learning Objectives */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {modules
                    .flatMap((module) =>
                      module.lessons
                        .filter((lesson) => lesson.hasVideo)
                        .slice(0, 6)
                        .map((lesson, index) => (
                          <div
                            key={`${module.id}-${lesson.id}`}
                            className="flex items-start gap-2 sm:gap-3"
                          >
                            <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 text-sm sm:text-base leading-relaxed">
                              {lesson.content ||
                                `Comprendre et maîtriser : ${lesson.title.toLowerCase()}`}
                            </span>
                          </div>
                        )),
                    )
                    .slice(0, 8)}
                </div>
              </div>
            </div>

            {/* Prerequisites */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 flex-shrink-0" />
                <span>Prérequis</span>
              </h2>

              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base">
                    Aucune connaissance préalable requise
                  </span>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base">
                    Un ordinateur ou smartphone avec connexion internet
                  </span>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base">
                    Motivation et envie d'apprendre
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: Sidebar sur le côté */}
          {!isMobile && hasVideoContent && isEnrolled && (
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24">
                <LessonsSidebar />
              </div>
            </div>
          )}
        </div>
      </main>

      <QuizModal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        quizId={currentQuizId}
        lessonId={selectedLessonId}
        onQuizCompleted={handleQuizCompleted}
      />
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