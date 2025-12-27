"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import { getYoutubeVideoId } from "@/lib/utils";
import { useYoutubePlayerSimple } from "@/hooks/useYoutubePlayerSimple";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import Swal from 'sweetalert2';
import { LockedVideoOverlay } from "@/components/LockedVideoOverlay";
import { PaymentModal } from "@/components/payment-modal";
import { OrangeMoneyOtpModal } from "@/components/OrangeMoneyOtpModal";
import { WaveQrModal } from "@/components/WaveQrModal";
import { PaymentSuccessModal } from "@/components/PaymentSuccessModal";
import { QuizModal } from "@/components/QuizModal";
import { ModuleLessonList } from "@/components/ModuleLessonList";
import {
  Play,
  Pause,
  ArrowLeft,
  Volume2,
  VolumeX,
  Cast,
  Captions,
  Settings,
  ChevronDown,
  X,
  Maximize,
  Lock,
  CheckCircle,
  Circle,
} from "lucide-react";

interface CourseDetailsData {
  course: {
    id: string;
    title: string;
    description: string;
    categoryId: string;
    level: string;
    price: number;
    thumbnailUrl?: string;
    isFree?: boolean;
  };
  modules: Array<{
    id: string;
    title: string;
    description: string;
    orderIndex: number;
    lessons: Array<{
      id: string;
      title: string;
      content: string;
      videoUrl?: string;
      orderIndex: number;
      duration: number;
      status: string;
    }>;
  }>;
  moduleCount: number;
}

function CourseDetailsPageComponent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useLocalAuth();
  const courseId = params?.id as string;

  const [courseData, setCourseData] = useState<CourseDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "videos" | "resources" | "support"
  >("videos");
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(),
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Course access states
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isFree, setIsFree] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showOrangeOtpModal, setShowOrangeOtpModal] = useState(false);
  const [showWaveQrModal, setShowWaveQrModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  // Lesson progress states
  const [lessonProgress, setLessonProgress] = useState<Record<string, boolean>>({});
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());

  // Quiz states
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  
// 🔧 CORRECTION : Modifier également le useEffect principal (lignes 109-169)
// Ajouter un appel à checkEnrollmentStatus PUIS fetchProgress

useEffect(() => {
  const fetchCourseDetails = async () => {
    if (!courseId) {
      console.log("❌ Pas d'ID de cours fourni");
      return;
    }

    console.log(`🔄 Composant: Chargement du cours ${courseId}`);

    try {
      setLoading(true);
      const data = await CoursesApi.getCourseDetails(courseId);
      console.log("✅ Composant: Données reçues:", data);

      setCourseData(data);

      const courseIsFree = data.course.price === 0 || data.course.isFree === true;
      setIsFree(courseIsFree);

      // ✅ IMPORTANT : Vérifier d'abord l'inscription
      await checkEnrollmentStatus();

      if (data.modules && data.modules.length > 0) {
        setExpandedModules(new Set([data.modules[0].id]));
        const firstLessonWithVideo = data.modules
          .flatMap(m => m.lessons)
          .find(lesson => lesson.videoUrl);
        if (firstLessonWithVideo) {
          setSelectedLessonId(firstLessonWithVideo.id);
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
}, [courseId]);

// 🔧 CORRECTION : Remplacer le useEffect de récupération de progression (lignes 158-179)

// ✅ VERSION CORRIGÉE - Charger la progression APRÈS vérification de l'inscription
useEffect(() => {
  const fetchProgress = async () => {
    // Ne pas bloquer si isEnrolled est false au démarrage
    if (!courseId) return;

    try {
      console.log('📥 Tentative de chargement de la progression...');
      
      const response = await fetch(
        `http://localhost:3006/course/progress/${courseId}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Progression récupérée depuis l\'API:', data);

        // Transformer les données en format { lessonId: completed }
        const progress: Record<string, boolean> = {};
        if (data.lessonsProgress) {
          data.lessonsProgress.forEach((moduleProgress: any) => {
            moduleProgress.lessons.forEach((lessonProgress: any) => {
              progress[lessonProgress.lessonId] = lessonProgress.status === 'COMPLETED';
            });
          });
        }

        console.log('💾 Progression transformée:', progress);
        setLessonProgress(progress);
        
      } else if (response.status === 404 || response.status === 403) {
        console.log('ℹ️ Aucune progression trouvée (normal si non inscrit)');
        setLessonProgress({});
      } else {
        console.error('❌ Erreur récupération progression:', response.status);
      }
    } catch (error) {
      console.error('💥 Erreur lors du chargement de la progression:', error);
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
      const moduleLessons = module.lessons.filter(l => l.videoUrl);
      const allLessonsCompleted = moduleLessons.every(lesson => lessonProgress[lesson.id]);

      if (allLessonsCompleted && moduleLessons.length > 0) {
        newCompletedModules.add(module.id);
      }
    });

    setCompletedModules(newCompletedModules);

    // Auto-collapse des modules terminés (sauf si l'utilisateur les a manuellement ouverts)
    setExpandedModules(prev => {
      const newExpanded = new Set(prev);
      newCompletedModules.forEach(moduleId => {
        if (!newExpanded.has(moduleId)) {
          // Le module est terminé et n'était pas ouvert, on le laisse fermé
          newExpanded.delete(moduleId);
        }
      });
      return newExpanded;
    });
  }, [lessonProgress, courseData?.modules]);

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

  // Gestion de l'inscription gratuite
  const handleFreeEnrollment = async () => {
    if (!user?.id || !courseId) return;

    try {
      setEnrolling(true);
      // Appeler l'API d'inscription
      const response = await fetch('http://localhost:3006/course/enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          courseId: courseId,
          userId: user.id.toString(),
        }),
      });

      if (response.ok) {
        setIsEnrolled(true);
        console.log('Inscription gratuite réussie');
      } else {
        console.error('Erreur lors de l\'inscription gratuite');
      }
    } catch (error) {
      console.error('Erreur lors de l\'inscription gratuite:', error);
    } finally {
      setEnrolling(false);
    }
  };

  // Gestion du clic sur le bouton d'inscription/paiement
  const handleEnrollClick = () => {
    if (isFree) {
      handleFreeEnrollment();
    } else {
      setShowPaymentModal(true);
    }
  };

  // Gestion des sélections de méthode de paiement
  const handleOrangeSelected = () => {
    setShowOrangeOtpModal(true);
  };

  const handleWaveSelected = () => {
    setShowWaveQrModal(true);
  };

  const handleCardSelected = () => {
    console.log("Paiement par carte sélectionné");
  };

  // Vérifier le statut d'inscription au chargement
  const checkEnrollmentStatus = async () => {
    if (!user?.id || !courseId) {
      console.log('ℹ️ Pas d\'utilisateur ou courseId, skip vérification inscription');
      return;
    }

    try {
      console.log('🔍 Vérification statut d\'inscription...');
      const response = await fetch(`http://localhost:3006/course/follow/${courseId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        console.log('✅ Utilisateur déjà inscrit au cours');
        setIsEnrolled(true);
        setIsPaid(true);
      } else {
        console.log('ℹ️ Utilisateur non inscrit ou accès refusé');
        setIsEnrolled(false);
        setIsPaid(false);
      }
    } catch (error) {
      console.log('ℹ️ Erreur vérification inscription:', error);
      setIsEnrolled(false);
      setIsPaid(false);
    }
  };

  // Gestion du succès de paiement
  const handlePaymentSuccess = async () => {
    if (!user?.id || !courseId) return;

    try {
      const response = await fetch('http://localhost:3006/course/enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          courseId: courseId,
          userId: user.id.toString(),
        }),
      });

      if (response.ok) {
        console.log('✅ Enrollment réussi après paiement');
        setIsEnrolled(true);
        setIsPaid(true);
        setShowSuccessModal(true);
      } else {
        console.error('Erreur lors de l\'inscription après paiement');
      }
    } catch (error) {
      console.error('Erreur lors de l\'inscription après paiement:', error);
    }
  };

  // Gestion de l'accès au cours après succès
  const handleAccessCourse = () => {
    console.log('🎉 Accès au cours activé !');
    setShowSuccessModal(false);
    setIsEnrolled(true);
    setIsPaid(true);
  };

  const modules = courseData?.modules || [];
  const course = courseData?.course;

  const allLessons = useMemo(() => {
    return modules.flatMap((m) => m.lessons);
  }, [modules]);

  const lessonsWithVideos = useMemo(() => {
    return allLessons.filter((l) => l.videoUrl);
  }, [allLessons]);

  const selectedLesson = useMemo(() => {
    return lessonsWithVideos.find((l) => l.id === selectedLessonId);
  }, [lessonsWithVideos, selectedLessonId]);

  const handleVideoEnd = useCallback(() => {
    const currentIndex = lessonsWithVideos.findIndex(l => l.id === selectedLessonId);
    if (currentIndex >= 0 && currentIndex < lessonsWithVideos.length - 1) {
      const nextLesson = lessonsWithVideos[currentIndex + 1];
      setSelectedLessonId(nextLesson.id);
      if (isMobile) {
        setTimeout(() => {
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        }, 100);
      }
    }
  }, [lessonsWithVideos, selectedLessonId, isMobile]);

  const handleQuizCompleted = useCallback((passed: boolean, score: number) => {
    setShowQuizModal(false);
    setCurrentQuizId(null);
    console.log(`Quiz terminé: ${passed ? 'Réussi' : 'Échoué'} avec ${score}%`);
  }, []);

  const handleStartQuiz = (quizId: string) => {
    setCurrentQuizId(quizId);
    setShowQuizModal(true);
  };

  const totalLessons = lessonsWithVideos.length;

  const currentVideoId = useMemo(() => {
    if (!selectedLesson?.videoUrl) return null;
    return getYoutubeVideoId(selectedLesson.videoUrl);
  }, [selectedLesson?.videoUrl]);

  const { youtubeUrl, isReady } = useYoutubePlayerSimple({
    videoId: currentVideoId || undefined,
  });

  const handlePlayPause = () => {
    console.log("Video should play/pause with YouTube native controls");
  };

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

  const hasVideo = !!currentVideoId;
  const hasVideoContent = lessonsWithVideos.length > 0;

  const isLessonCompleted = (lessonId: string) => {
    return lessonProgress[lessonId] || false;
  };

  const handleToggleLessonCompletion = async (lessonId: string, completed: boolean) => {
    // Vérifier si le module parent est terminé
    const parentModule = modules.find(m => m.lessons.some(l => l.id === lessonId));
    const isModuleCompleted = parentModule ? completedModules.has(parentModule.id) : false;

    if (isModuleCompleted && !completed) {
      // Empêcher le décochage si le module est terminé
      Swal.fire({
        title: 'Modification impossible',
        text: 'Impossible de modifier le statut d\'une leçon appartenant à un module terminé',
        icon: 'warning',
        confirmButtonText: 'Compris',
        confirmButtonColor: '#6366f1',
      });
      return;
    }

    console.log('🔄 Changement de statut pour la leçon:', lessonId);
    console.log('📊 État actuel:', lessonProgress[lessonId]);
    console.log('📊 Nouvel état:', completed);

    try {
      if (completed) {
        console.log('✅ Marquage de la leçon comme terminée...');
        const response = await fetch(
          `http://localhost:3006/course/lesson/${lessonId}/complete`,
          {
            method: 'POST',
            credentials: 'include',
          }
        );

        if (response.ok) {
          console.log('✅ API: Leçon marquée comme terminée avec succès');
        } else {
          console.error('❌ API: Erreur lors du marquage', response.status);
        }
      } else {
        console.log('🔄 Démarquage de la leçon...');
        const response = await fetch(
          `http://localhost:3006/course/lesson/${lessonId}/uncomplete`,
          {
            method: 'POST',
            credentials: 'include',
          }
        );

        if (response.ok) {
          console.log('✅ API: Leçon démarquée avec succès');
        } else {
          console.error('❌ API: Erreur lors du démarquage', response.status);
        }
      }

      setLessonProgress(prev => ({
        ...prev,
        [lessonId]: completed
      }));

      console.log('💾 État local mis à jour');
      console.log('📊 Nouvelle progression:', {
        ...lessonProgress,
        [lessonId]: completed
      });

    } catch (error) {
      console.error('💥 Erreur lors du changement de statut:', error);
    }
  };

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
              {hasVideo && isReady && youtubeUrl ? (
                <iframe
                  key={`fullscreen-${selectedLessonId}`}
                  src={youtubeUrl}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={selectedLesson?.title || course.title}
                />
              ) : (
                <div className="text-center text-white">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                    <Play className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-400">Aucune vidéo disponible</p>
                </div>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
              <h3 className="text-white font-semibold text-lg mb-1">
                {selectedLesson?.title || course.title}
              </h3>
              <p className="text-white/70 text-sm">
                {formatDuration(selectedLesson?.duration || 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Cours</span>
            <span className="text-gray-400 mx-1 hidden sm:inline">-</span>
            <span className="text-sm text-gray-900 font-medium truncate max-w-[200px] sm:max-w-md hidden sm:inline">
              {course.title}
            </span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className={`grid gap-4 lg:gap-8 ${hasVideoContent ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {/* Video Section */}
          <div className={`${hasVideoContent ? 'lg:col-span-2' : ''} space-y-4 lg:space-y-6`}>
            {hasVideo && hasVideoContent && (
              <div className="relative rounded-lg lg:rounded-xl overflow-hidden bg-gray-900 shadow-lg">
                <div className="aspect-video relative">
                  {isFree || isEnrolled ? (
                    isReady && youtubeUrl ? (
                      <iframe
                        key={selectedLessonId}
                        src={youtubeUrl}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={selectedLesson?.title || course.title}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                        <div className="text-center text-white">
                          <div className="w-16 h-16 lg:w-20 lg:h-20 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                            <Play className="w-8 h-8 lg:w-10 lg:h-10 text-gray-400" />
                          </div>
                          <p className="text-gray-400">
                            Chargement de la vidéo...
                          </p>
                        </div>
                      </div>
                    )
                  ) : (
                    <LockedVideoOverlay onUnlockClick={handleEnrollClick} />
                  )}
                </div>
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

              <div className="flex-1" />

              {!isEnrolled && hasVideoContent && (
                <button
                  onClick={handleEnrollClick}
                  disabled={enrolling}
                  className="px-4 lg:px-6 py-2 lg:py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm lg:text-base font-semibold rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enrolling ? "Inscription..." : (isFree ? "S'inscrire Gratuitement" : "S'inscrire")}
                </button>
              )}
            </div>

            {/* Course Description */}
            <div className="space-y-3 lg:space-y-4">
              <h1 className="text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 leading-tight">
                {course.title}
              </h1>

              <p className="text-sm lg:text-base text-gray-600 leading-relaxed">
                {course.description}
              </p>

              {modules.map((module) => (
                <div key={module.id} className="space-y-2">
                  <h3 className="text-sm lg:text-base font-bold text-gray-900">
                    {module.title}:
                  </h3>
                  <p className="text-sm lg:text-base text-gray-600">
                    {module.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar - Lessons List */}
          {hasVideoContent && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg lg:rounded-xl border border-gray-200 shadow-sm lg:sticky lg:top-24">
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
                      const totalModuleDuration = module.lessons
                        .filter(l => l.videoUrl)
                        .reduce((sum, l) => sum + l.duration, 0);

                      return (
                        <div key={module.id} className="mb-2">
                          <button
                            onClick={() => toggleModule(module.id)}
                            className={`w-full flex items-center justify-between p-2.5 lg:p-3 rounded-lg transition-all duration-300 text-left group ${
                              isModuleCompleted
                                ? "bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200"
                                : "hover:bg-indigo-50"
                            }`}
                          >
                            <div className="flex items-center gap-2 lg:gap-3 flex-1 min-w-0">
                              <div className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                isModuleCompleted
                                  ? "bg-gradient-to-r from-emerald-500 to-green-600"
                                  : "bg-gradient-to-r from-indigo-100 to-purple-100"
                              }`}>
                                {isModuleCompleted ? (
                                  <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                                ) : (
                                  <span className="text-xs lg:text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    {moduleIndex + 1}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`font-medium text-xs lg:text-sm truncate ${
                                  isModuleCompleted ? "text-emerald-900" : "text-gray-900"
                                }`}>
                                  {module.title}
                                  {isModuleCompleted && (
                                    <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                                      Terminé
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {module.lessons.filter(l => l.videoUrl).length} leçons ·{" "}
                                  {formatDuration(totalModuleDuration)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isModuleCompleted && !isExpanded && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleModule(module.id);
                                  }}
                                  className="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
                                >
                                  Revoir
                                </button>
                              )}
                              <ChevronDown
                                className={`w-4 h-4 lg:w-5 lg:h-5 transition-transform duration-300 flex-shrink-0 ${
                                  isModuleCompleted ? "text-emerald-600" : "text-gray-400"
                                } ${isExpanded ? "rotate-180" : ""}`}
                              />
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="ml-3 lg:ml-4 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-300">
                              {module.lessons
                                .filter(lesson => lesson.videoUrl)
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
                                          setSelectedLessonId(lesson.id);
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
                                              : selectedLessonId === lesson.id
                                              ? "bg-gradient-to-r from-indigo-600 to-purple-600"
                                              : "bg-gradient-to-r from-indigo-100 to-purple-100"
                                          }`}
                                        >
                                          {completed ? (
                                            <CheckCircle className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-white fill-current" />
                                          ) : (
                                            <Play
                                              className={`w-3 h-3 lg:w-3.5 lg:h-3.5 ${
                                                selectedLessonId === lesson.id
                                                  ? "text-white"
                                                  : "text-indigo-600"
                                              } fill-current ml-0.5`}
                                            />
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div
                                            className={`font-medium text-xs lg:text-sm leading-snug ${
                                              selectedLessonId === lesson.id
                                                ? "text-gray-900"
                                                : completed
                                                ? "text-green-700"
                                                : "text-gray-700"
                                            }`}
                                          >
                                            {lesson.title}
                                          </div>
                                          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                                            <span>{formatDuration(lesson.duration)}</span>
                                            {completed && (
                                              <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                                                Terminée
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </button>

                                      {/* Checkbox pour marquer comme terminé */}
                                      {isEnrolled && (
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

                                                // Vérifier si le module parent est terminé
                                                const parentModule = modules.find(m => m.lessons.some(l => l.id === lesson.id));
                                                const isModuleCompleted = parentModule ? completedModules.has(parentModule.id) : false;

                                                if (isModuleCompleted && !newCompleted) {
                                                  // Empêcher le décochage si le module est terminé
                                                  Swal.fire({
                                                    title: 'Modification impossible',
                                                    text: 'Impossible de modifier le statut d\'une leçon appartenant à un module terminé',
                                                    icon: 'warning',
                                                    confirmButtonText: 'Compris',
                                                    confirmButtonColor: '#6366f1',
                                                  });
                                                  return;
                                                }

                                                console.log('🔄 Changement de statut pour la leçon:', lesson.id);
                                                console.log('📊 État actuel:', completed);
                                                console.log('📊 Nouvel état:', newCompleted);

                                                try {
                                                  if (newCompleted) {
                                                    console.log('✅ Marquage de la leçon comme terminée...');
                                                    const response = await fetch(
                                                      `http://localhost:3006/course/lesson/${lesson.id}/complete`,
                                                      {
                                                        method: 'POST',
                                                        credentials: 'include',
                                                      }
                                                    );

                                                    if (response.ok) {
                                                      console.log('✅ API: Leçon marquée comme terminée avec succès');
                                                    } else {
                                                      console.error('❌ API: Erreur lors du marquage', response.status);
                                                    }
                                                  } else {
                                                    console.log('🔄 Démarquage de la leçon...');
                                                    const response = await fetch(
                                                      `http://localhost:3006/course/lesson/${lesson.id}/uncomplete`,
                                                      {
                                                        method: 'POST',
                                                        credentials: 'include',
                                                      }
                                                    );

                                                    if (response.ok) {
                                                      console.log('✅ API: Leçon démarquée avec succès');
                                                    } else {
                                                      console.error('❌ API: Erreur lors du démarquage', response.status);
                                                    }
                                                  }

                                                  setLessonProgress(prev => ({
                                                    ...prev,
                                                    [lesson.id]: newCompleted
                                                  }));

                                                  console.log('💾 État local mis à jour');
                                                  console.log('📊 Nouvelle progression:', {
                                                    ...lessonProgress,
                                                    [lesson.id]: newCompleted
                                                  });

                                                } catch (error) {
                                                  console.error('💥 Erreur lors du changement de statut:', error);
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
                                              {completed ? "Leçon terminée (cliquer pour décocher)" : "Marquer comme terminée"}
                                            </span>
                                          </label>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          )}

                          {/* 🎨 DESIGN AMÉLIORÉ - Module terminé + Quiz */}
                          {(() => {
                            const moduleLessons = module.lessons.filter(l => l.videoUrl);
                            const allLessonsCompleted = moduleLessons.every(lesson => isLessonCompleted(lesson.id));
                            
                            return isEnrolled && allLessonsCompleted ? (
                              <div className="mt-3 mx-2 p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 border-2 border-emerald-200 rounded-xl shadow-sm">
                                <div className="flex items-center gap-3">
                                  {/* Badge avec icône CheckCircle */}
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-md">
                                    <CheckCircle className="w-6 h-6 text-white" />
                                  </div>
                                  
                                  {/* Texte */}
                                  <div className="flex-1 min-w-0">
                                    <h6 className="font-bold text-emerald-900 text-sm mb-0.5">
                                      Module terminé
                                    </h6>
                                  
                                  </div>
                                  
                                  {/* Bouton Quiz avec gradient purple-indigo */}
                                  <button
                                    onClick={() => handleStartQuiz(module.id)}
                                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 active:scale-95 flex-shrink-0"
                                  >
                                    Passer le Quiz
                                  </button>
                                </div>
                              </div>
                            ) : null;
                          })()}
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
          </div>
          )}
        </div>
      </main>

      {/* Payment Modals */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        courseId={courseId}
        courseTitle={course?.title || ""}
        coursePrice={course?.price || 0}
        onOrangeSelected={handleOrangeSelected}
        onWaveSelected={handleWaveSelected}
        onCardSelected={handleCardSelected}
      />

      <OrangeMoneyOtpModal
        isOpen={showOrangeOtpModal}
        onClose={() => setShowOrangeOtpModal(false)}
        onSuccess={handlePaymentSuccess}
        courseTitle={course?.title || ""}
        coursePrice={course?.price || 0}
      />

      <WaveQrModal
        isOpen={showWaveQrModal}
        onClose={() => setShowWaveQrModal(false)}
        onSuccess={handlePaymentSuccess}
        courseTitle={course?.title || ""}
        coursePrice={course?.price || 0}
      />

      <PaymentSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        courseTitle={course?.title || ""}
        onAccessCourse={handleAccessCourse}
      />

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