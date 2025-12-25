"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import { getYoutubeVideoId } from "@/lib/utils";
import { useYoutubePlayerSimple } from "@/hooks/useYoutubePlayerSimple";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  Play,
  Pause,
  ArrowLeft,
  Heart,
  Volume2,
  VolumeX,
  Cast,
  Captions,
  Settings,
  ChevronDown,
  X,
  Maximize,
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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
        console.log(
          "📚 Composant: Modules trouvés:",
          data.modules?.length || 0,
        );

        setCourseData(data);

        if (data.modules && data.modules.length > 0) {
          console.log("📖 Composant: Premier module:", data.modules[0].title);
          setExpandedModules(new Set([data.modules[0].id]));
          // Find first lesson with video
          const firstLessonWithVideo = data.modules
            .flatMap(m => m.lessons)
            .find(lesson => lesson.videoUrl);
          if (firstLessonWithVideo) {
            console.log(
              "🎬 Composant: Première leçon avec vidéo:",
              firstLessonWithVideo.title,
            );
            setSelectedLessonId(firstLessonWithVideo.id);
          }
        } else {
          console.warn("⚠️ Composant: AUCUN MODULE trouvé pour ce cours");
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

  const totalLessons = lessonsWithVideos.length;

  // ✅ FIX: Extraire correctement le videoId de la leçon sélectionnée
  const currentVideoId = useMemo(() => {
    if (!selectedLesson?.videoUrl) return null;
    return getYoutubeVideoId(selectedLesson.videoUrl);
  }, [selectedLesson?.videoUrl]);

  // YouTube Player Hook
  const { youtubeUrl, isReady } = useYoutubePlayerSimple({
    videoId: currentVideoId || undefined,
  });

  // Gestion simplifiée de la lecture (utilise les contrôles YouTube natifs)
  const handlePlayPause = () => {
    // Les contrôles YouTube natifs gèrent la lecture/pause automatiquement
    console.log("Video should play/pause with YouTube native controls");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-pink-600"></div>
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
            className="text-pink-600 hover:underline"
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

  // Les contrôles YouTube natifs gèrent la lecture/pause/mute automatiquement

  // ✅ Détermine si on a une vidéo à afficher
  const hasVideo = !!currentVideoId;


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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Video Section */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6">
            {/* Video Player - Only show if lesson has video */}
            {hasVideo && (
              <div className="relative rounded-lg lg:rounded-xl overflow-hidden bg-gray-900 shadow-lg">
                <div className="aspect-video relative">
                  {isReady && youtubeUrl ? (
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

              <button className="px-4 lg:px-6 py-2 lg:py-2.5 bg-pink-600 text-white text-sm lg:text-base font-semibold rounded-full hover:bg-pink-700 transition-colors shadow-sm">
                S'inscrire
              </button>
              <button className="flex items-center gap-2 p-2 lg:px-4 lg:py-2.5 border border-gray-300 text-gray-700 font-medium rounded-full hover:bg-gray-100 transition-colors">
                <Heart className="w-4 h-4" />
                <span className="hidden lg:inline text-sm lg:text-base">
                  Ajouter aux favoris
                </span>
              </button>
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
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg lg:rounded-xl border border-gray-200 shadow-sm lg:sticky lg:top-24">
              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab("videos")}
                  className={`flex-1 py-2.5 lg:py-3 px-3 lg:px-4 text-xs lg:text-sm font-medium transition-colors relative ${
                    activeTab === "videos"
                      ? "text-pink-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Vidéos
                  {activeTab === "videos" && (
                    <div className="absolute bottom-0 left-3 right-3 lg:left-4 lg:right-4 h-0.5 bg-pink-600 rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("resources")}
                  className={`flex-1 py-2.5 lg:py-3 px-3 lg:px-4 text-xs lg:text-sm font-medium transition-colors relative ${
                    activeTab === "resources"
                      ? "text-pink-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Ressources
                  {activeTab === "resources" && (
                    <div className="absolute bottom-0 left-3 right-3 lg:left-4 lg:right-4 h-0.5 bg-pink-600 rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("support")}
                  className={`flex-1 py-2.5 lg:py-3 px-3 lg:px-4 text-xs lg:text-sm font-medium transition-colors relative ${
                    activeTab === "support"
                      ? "text-pink-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Support
                  {activeTab === "support" && (
                    <div className="absolute bottom-0 left-3 right-3 lg:left-4 lg:right-4 h-0.5 bg-pink-600 rounded-full" />
                  )}
                </button>
              </div>

              {/* Content */}
              <div className="max-h-[400px] lg:max-h-[calc(100vh-250px)] overflow-y-auto">
                {activeTab === "videos" && (
                  <div className="p-2">
                    {modules.map((module, moduleIndex) => {
                      const isExpanded = expandedModules.has(module.id);
                      const totalModuleDuration = module.lessons
                        .filter(l => l.videoUrl)
                        .reduce((sum, l) => sum + l.duration, 0);

                      return (
                        <div key={module.id} className="mb-2">
                          <button
                            onClick={() => toggleModule(module.id)}
                            className="w-full flex items-center justify-between p-2.5 lg:p-3 rounded-lg hover:bg-gray-50 transition-colors text-left group"
                          >
                            <div className="flex items-center gap-2 lg:gap-3 flex-1 min-w-0">
                              <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs lg:text-sm font-bold text-pink-600">
                                  {moduleIndex + 1}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-xs lg:text-sm text-gray-900 truncate">
                                  {module.title}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {module.lessons.filter(l => l.videoUrl).length} leçons ·{" "}
                                  {formatDuration(totalModuleDuration)}
                                </div>
                              </div>
                            </div>
                            <ChevronDown
                              className={`w-4 h-4 lg:w-5 lg:h-5 text-gray-400 transition-transform flex-shrink-0 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {isExpanded && (
                            <div className="ml-3 lg:ml-4 mt-1 space-y-1">
                              {module.lessons
                                .filter(lesson => lesson.videoUrl)
                                .map((lesson) => (
                                <button
                                  key={lesson.id}
                                  onClick={() => {
                                    setSelectedLessonId(lesson.id);
                                    if (isMobile) {
                                      window.scrollTo({
                                        top: 0,
                                        behavior: "smooth",
                                      });
                                    }
                                  }}
                                  className={`w-full flex items-start gap-2 lg:gap-3 p-2.5 lg:p-3 pl-3 lg:pl-4 rounded-lg transition-colors text-left ${
                                    selectedLessonId === lesson.id
                                      ? "bg-pink-50"
                                      : "hover:bg-gray-50"
                                  }`}
                                >
                                  <div
                                    className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                      selectedLessonId === lesson.id
                                        ? "bg-pink-600"
                                        : "bg-pink-100"
                                    }`}
                                  >
                                    <Play
                                      className={`w-3 h-3 lg:w-3.5 lg:h-3.5 ${
                                        selectedLessonId === lesson.id
                                          ? "text-white"
                                          : "text-pink-600"
                                      } fill-current ml-0.5`}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div
                                      className={`font-medium text-xs lg:text-sm leading-snug ${
                                        selectedLessonId === lesson.id
                                          ? "text-gray-900"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      {lesson.title}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                      {formatDuration(lesson.duration)}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
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
                        className="text-pink-600 hover:underline break-all"
                      >
                        support@bibocomdigital.com
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
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
