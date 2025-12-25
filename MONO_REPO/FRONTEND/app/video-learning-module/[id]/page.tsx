"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  MessageCircle,
  CheckCircle2,
  Circle,
  Clock,
  Send,
  Lock,
  BookOpen,
  LayoutList,
  ThumbsUp,
  Share2,
  Bookmark,
  CheckCircle,
  PlayCircle,
} from "lucide-react";
import { useCourseDetails } from "@/application/use-cases/useCourseDetails";

import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { useProtectRoute } from "@/application/use-cases/useProtectRoute";
import { isValidResourceId } from "@/shared/helpers/safeFetch";

export const dynamic = "force-dynamic";

export default function VideoLearningModule() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { user, isLoading: authLoading } = useLocalAuth();
  const {
    canAccess,
    loading: protectLoading,
    showAuthModal,
  } = useProtectRoute({
    message: "Veuillez vous connecter pour accéder aux vidéos.",
  });

  const isIdValid = isValidResourceId(id);

  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "notes" | "resources"
  >("overview");
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(
    new Set(),
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const {
    course,
    contents,
    topics,
    allLessons,
    loading: courseLoading,
    error,
  } = useCourseDetails(id);

  // Restore state from sessionStorage
  useEffect(() => {
    if (isIdValid && allLessons.length > 0 && typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(`lesson_state_${id}`);
        if (saved) {
          const state = JSON.parse(saved);
          if (
            state.currentLessonIndex !== undefined &&
            state.currentLessonIndex < allLessons.length
          ) {
            setCurrentLessonIndex(state.currentLessonIndex);
          }
          if (state.currentTime !== undefined) {
            setCurrentTime(state.currentTime);
          }
          if (state.completedLessons) {
            setCompletedLessons(new Set(state.completedLessons));
          }
        }
      } catch (e) {
        console.warn("[VideoLearningModule] Failed to restore state:", e);
      }
    }
  }, [isIdValid, id, allLessons.length]);

  // Save state to sessionStorage
  useEffect(() => {
    if (isIdValid && typeof window !== "undefined") {
      const handleBeforeUnload = () => {
        try {
          sessionStorage.setItem(
            `lesson_state_${id}`,
            JSON.stringify({
              currentLessonIndex,
              currentTime,
              completedLessons: Array.from(completedLessons),
              timestamp: Date.now(),
            }),
          );
        } catch (e) {
          console.warn("[VideoLearningModule] Failed to save state:", e);
        }
      };

      window.addEventListener("beforeunload", handleBeforeUnload);
      return () =>
        window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, [isIdValid, id, currentLessonIndex, currentTime, completedLessons]);

  // Protection: Auth modal
  if (showAuthModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="animate-in zoom-in-50 duration-300 bg-background rounded-lg shadow-2xl p-8 max-w-md mx-4">
          <div className="text-center space-y-4">
            <div className="inline-flex h-16 w-16 rounded-full bg-primary/10 items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Authentification requise</h2>
            <p className="text-muted-foreground">
              Veuillez vous connecter pour accéder aux vidéos de ce cours.
            </p>
            <div className="flex justify-center gap-1 py-4">
              <div
                className="h-2 w-2 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="h-2 w-2 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="h-2 w-2 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Redirection vers la page de connexion...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid ID guard
  if (!isIdValid) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Link href="/student-dashboard">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Retour au tableau de bord
              </Button>
            </Link>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <Lock className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-2xl font-bold">Cours invalide</h2>
            <p className="text-muted-foreground">
              L'ID du cours n'est pas valide. Veuillez sélectionner un cours
              valide.
            </p>
            <Link href="/student-dashboard">
              <Button>Retour aux cours</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentLesson = allLessons?.[currentLessonIndex] || null;
  const isLessonsLoading = courseLoading || !course || allLessons.length === 0;

  const progressPercent =
    allLessons.length > 0
      ? Math.round((completedLessons.size / allLessons.length) * 100)
      : 0;

  const handlePreviousLesson = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex((i) => i - 1);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  const handleNextLesson = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    // Mark current lesson as completed when moving to next
    setCompletedLessons((prev) => new Set(prev).add(currentLessonIndex));
    if (currentLessonIndex < (allLessons?.length || 0) - 1) {
      setCurrentLessonIndex((i) => i + 1);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  const handleLessonSelect = (index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentLessonIndex(index);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const toggleLessonComplete = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletedLessons((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleSendComment = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (newComment.trim()) {
      const comment = {
        id: Date.now(),
        user: user?.display_name || "Étudiant",
        avatar: "/placeholder.svg",
        time: "À l'instant",
        comment: newComment.trim(),
        likes: 0,
        replies: 0,
      };
      setComments((c) => [comment, ...c]);
      setNewComment("");
    }
  };

  // YouTube helper
  const getYouTubeVideoId = (content?: string | null) => {
    if (!content || typeof content !== "string") return null;
    const iframeRegex =
      /<iframe[^>]*src=["'](?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/embed\/|youtu\.be\/)([^"']{11})[^"']*["'][^>]*>/gi;
    const iframeMatch = iframeRegex.exec(content);
    if (iframeMatch && iframeMatch[1]) return iframeMatch[1];
    const urlRegex =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/gi;
    const urlMatch = urlRegex.exec(content);
    if (urlMatch && urlMatch[1]) return urlMatch[1];
    const simpleRegex =
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/gi;
    const simpleMatch = simpleRegex.exec(content);
    if (simpleMatch && simpleMatch[1]) return simpleMatch[1];
    return null;
  };

  const resolveVideoSource = () => {
    const lesson = currentLesson;
    if (!lesson) return null;

    // Vérifier d'abord videoUrl (structure depuis mock data)
    if (lesson.videoUrl) {
      const id = getYouTubeVideoId(lesson.videoUrl);
      if (id) return { type: "youtube", id };
    }

    // Fallback vers la structure video object
    if (
      lesson.video &&
      typeof lesson.video === "object" &&
      !Array.isArray(lesson.video)
    ) {
      const video = lesson.video;
      if (video.source_youtube) {
        const id = getYouTubeVideoId(video.source_youtube);
        if (id) return { type: "youtube", id };
      }
      if (video.source_embedded) {
        const id = getYouTubeVideoId(video.source_embedded);
        if (id) return { type: "youtube", id };
      }
      if (video.source_mp4 && typeof video.source_mp4 === "string") {
        return { type: "mp4", src: video.source_mp4 };
      }
    }

    // Fallback vers post_content
    if (lesson.post_content) {
      const contentId = getYouTubeVideoId(lesson.post_content);
      if (contentId) return { type: "youtube", id: contentId };
    }
    if (course?.post_content) {
      const courseContentId = getYouTubeVideoId(course.post_content);
      if (courseContentId) return { type: "youtube", id: courseContentId };
    }

    // Vidéo par défaut si rien trouvé
    return { type: "youtube", id: "dQw4w9WgXcQ" };
  };

  if (authLoading || protectLoading || courseLoading) {
    return (
      <div className="h-screen flex flex-col bg-white">
        {/* Header skeleton */}
        <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 w-24 bg-gray-800 animate-pulse rounded" />
            <div className="hidden md:flex items-center gap-3">
              <div className="w-32 h-2 bg-gray-700 rounded-full" />
              <div className="h-4 w-20 bg-gray-800 animate-pulse rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-24 bg-gray-800 animate-pulse rounded hidden sm:block" />
            <div className="h-8 w-24 bg-gray-800 animate-pulse rounded hidden sm:block" />
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Video skeleton */}
          <div className="flex-1 flex flex-col">
            <div
              className="relative bg-gray-900 w-full"
              style={{ aspectRatio: "16/9", maxHeight: "70vh" }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="inline-flex h-16 w-16 rounded-full bg-gray-800 mb-4 items-center justify-center animate-pulse">
                    <PlayCircle className="h-8 w-8 text-gray-600" />
                  </div>
                  <p className="text-base text-gray-400">
                    Chargement du cours...
                  </p>
                </div>
              </div>
            </div>

            {/* Info skeleton */}
            <div className="bg-white border-b px-4 md:px-8 py-6">
              <div className="h-8 w-3/4 bg-gray-200 animate-pulse rounded mb-3" />
              <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded mb-4" />
              <div className="flex gap-4">
                <div className="h-10 w-32 bg-gray-200 animate-pulse rounded" />
                <div className="h-10 w-32 bg-gray-200 animate-pulse rounded" />
              </div>
            </div>
          </div>

          {/* Sidebar skeleton */}
          <div className="hidden lg:block w-96 border-l bg-white">
            <div className="p-4 border-b">
              <div className="h-6 w-48 bg-gray-200 animate-pulse rounded mb-2" />
              <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
            </div>
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                >
                  <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded mb-2" />
                    <div className="h-3 w-1/2 bg-gray-200 animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !isIdValid) {
    return (
      <div className="h-screen flex flex-col bg-white">
        <header className="bg-gray-900 text-white px-4 py-3 flex items-center">
          <Link href="/student-dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-gray-800 gap-2"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="text-base">Retour</span>
            </Button>
          </Link>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="inline-flex h-20 w-20 rounded-full bg-red-100 mb-6 items-center justify-center">
              <BookOpen className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Cours non trouvé
            </h2>
            <p className="text-base text-gray-600 mb-6">
              {error || "Ce cours n'existe pas ou n'est plus disponible."}
            </p>
            <Link href="/student-dashboard">
              <Button className="bg-primary hover:bg-primary/90 text-base">
                Retour au tableau de bord
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const videoSource = resolveVideoSource();

  return (
    <div
      className="min-h-screen bg-white flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Header Bar - Dark theme like Udemy */}
      <header className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/student-dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-gray-800 gap-2"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="hidden sm:inline text-base">Retour</span>
            </Button>
          </Link>

          {/* Progress indicator */}
          <div className="hidden md:flex items-center gap-3">
            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-sm text-gray-400">
              {progressPercent}% terminé
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-gray-800 hidden sm:flex gap-2"
          >
            <Share2 className="h-4 w-4" />
            <span className="text-base">Partager</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-gray-800 hidden sm:flex gap-2"
          >
            <Bookmark className="h-4 w-4" />
            <span className="text-base">Favoris</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-white hover:bg-gray-800"
            onClick={(e) => {
              e.stopPropagation();
              setSidebarOpen(!sidebarOpen);
            }}
          >
            <LayoutList className="h-5 w-5" />
            <span className="ml-1 text-sm">Leçons</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Video Player - Full width, responsive height */}
          <div
            className="relative bg-black w-full"
            style={{ aspectRatio: "16/9", maxHeight: "70vh" }}
          >
            {isLessonsLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                <div className="text-center text-white">
                  <div className="inline-flex h-16 w-16 rounded-full bg-gray-800 mb-4 items-center justify-center">
                    <PlayCircle className="h-8 w-8 text-gray-600 animate-pulse" />
                  </div>
                  <p className="text-base">Chargement de la vidéo...</p>
                </div>
              </div>
            ) : videoSource ? (
              <>
                {videoSource.type === "youtube" ? (
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${videoSource.id}?controls=1&modestbranding=1&rel=0&autoplay=0`}
                    title={currentLesson?.post_title || "Vidéo"}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    src={videoSource.src}
                    controls
                    className="absolute inset-0 w-full h-full"
                  />
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900 text-center p-4">
                <div>
                  <Play className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-white text-lg mb-2">
                    Aucune vidéo disponible
                  </p>
                  <p className="text-base text-gray-400">
                    Veuillez réessayer ou contacter le support
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Lesson Info & Navigation - Below video */}
          <div className="bg-white border-b">
            {/* Lesson Title & Navigation */}
            <div className="px-4 md:px-8 py-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {currentLesson?.post_title || "Chargement..."}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-base text-gray-600">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {course?.post_title}
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="flex items-center gap-1">
                      <LayoutList className="h-4 w-4" />
                      Leçon {currentLessonIndex + 1} sur {allLessons.length}
                    </span>
                    {currentLesson?.duration && (
                      <>
                        <span className="text-gray-300">|</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {currentLesson.duration}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={(e) => handlePreviousLesson(e)}
                    disabled={currentLessonIndex === 0}
                    className="gap-1 text-base"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>

                  {currentLessonIndex === allLessons.length - 1 ? (
                    <Link href={`/quiz-assessment/7562?courseId=${id}`}>
                      <Button className="bg-green-600 hover:bg-green-700 text-white gap-1 text-base">
                        Passer aux quiz
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      onClick={(e) => handleNextLesson(e)}
                      disabled={currentLessonIndex === allLessons.length - 1}
                      className="gap-1 text-base"
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                <button
                  onClick={(e) => toggleLessonComplete(currentLessonIndex, e)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-base ${
                    completedLessons.has(currentLessonIndex)
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {completedLessons.has(currentLessonIndex) ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                  {completedLessons.has(currentLessonIndex)
                    ? "Terminé"
                    : "Marquer comme terminé"}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-4 md:px-8 border-t">
              <div className="flex gap-6">
                {(["overview", "notes", "resources"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 text-base font-medium border-b-2 transition-colors ${
                      activeTab === tab
                        ? "border-primary text-primary"
                        : "border-transparent text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {tab === "overview" && "Aperçu"}
                    {tab === "notes" && "Notes"}
                    {tab === "resources" && "Ressources"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 px-4 md:px-8 py-6 overflow-y-auto bg-gray-50">
            {activeTab === "overview" && (
              <div className="max-w-3xl">
                <h3 className="text-xl font-semibold mb-4">
                  À propos de cette leçon
                </h3>
                <p className="text-gray-600 text-base leading-relaxed">
                  {currentLesson?.post_excerpt ||
                    "Dans cette leçon, vous allez découvrir les concepts fondamentaux et les meilleures pratiques pour maîtriser ce sujet. Suivez attentivement la vidéo et n'hésitez pas à prendre des notes."}
                </p>

                {/* Comments Section */}
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Questions et commentaires
                  </h3>

                  {/* Add Comment */}
                  <div className="flex gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {user?.display_name?.charAt(0) || "E"}
                    </div>
                    <div className="flex-1">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Posez une question ou laissez un commentaire..."
                        className="min-h-[100px] resize-none bg-white text-base"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex justify-end mt-2">
                        <Button
                          onClick={(e) => handleSendComment(e)}
                          disabled={!newComment.trim()}
                          className="gap-2 text-base"
                        >
                          <Send className="h-4 w-4" />
                          Envoyer
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-4">
                    {comments.length === 0 ? (
                      <div className="text-center py-8 bg-white rounded-lg border">
                        <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-base">
                          Aucun commentaire pour le moment
                        </p>
                        <p className="text-gray-400 text-base">
                          Soyez le premier à poser une question !
                        </p>
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="flex gap-3 bg-white p-4 rounded-lg border"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {comment.user.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-base">
                                {comment.user}
                              </span>
                              <span className="text-sm text-gray-500">
                                {comment.time}
                              </span>
                            </div>
                            <p className="text-gray-700 text-base">
                              {comment.comment}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary">
                                <ThumbsUp className="h-4 w-4" />
                                J'aime
                              </button>
                              <button className="text-sm text-gray-500 hover:text-primary">
                                Répondre
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notes" && (
              <div className="max-w-3xl">
                <h3 className="text-xl font-semibold mb-4">Vos notes</h3>
                <Textarea
                  placeholder="Prenez des notes pendant la leçon..."
                  className="min-h-[300px] bg-white text-base"
                />
              </div>
            )}

            {activeTab === "resources" && (
              <div className="max-w-3xl">
                <h3 className="text-xl font-semibold mb-4">
                  Ressources téléchargeables
                </h3>
                <div className="bg-white rounded-lg border p-6 text-center">
                  <p className="text-gray-500 text-base">
                    Aucune ressource disponible pour cette leçon
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Course Content */}
        <aside
          className={`bg-white border-l flex flex-col transition-all duration-300 ${
            sidebarOpen
              ? "fixed inset-0 z-40 lg:relative lg:z-auto w-full lg:w-96"
              : "hidden lg:flex lg:w-96"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sidebar Header */}
          <div className="bg-gray-50 border-b px-4 py-4 flex items-center justify-between sticky top-0">
            <div>
              <h3 className="font-bold text-lg">Contenu du cours</h3>
              <p className="text-sm text-gray-500">
                {completedLessons.size}/{allLessons.length} leçons terminées
              </p>
            </div>
            <button
              className="lg:hidden p-2 hover:bg-gray-200 rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                setSidebarOpen(false);
              }}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Sidebar Progress */}
          <div className="px-4 py-3 border-b bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progression
              </span>
              <span className="text-sm font-bold text-primary">
                {progressPercent}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Lessons List */}
          <div className="flex-1 overflow-y-auto">
            <div className="py-2">
              {courseLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-3 p-3 animate-pulse">
                      <div className="w-5 h-5 bg-gray-200 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : allLessons.length > 0 ? (
                allLessons.map((lesson: any, index: number) => {
                  const isCurrent = index === currentLessonIndex;
                  const isCompleted = completedLessons.has(index);

                  return (
                    <button
                      key={lesson.ID ?? index}
                      onClick={(e) => handleLessonSelect(index, e)}
                      className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-l-4 ${
                        isCurrent
                          ? "bg-primary/5 border-l-primary"
                          : "border-l-transparent"
                      }`}
                    >
                      {/* Completion indicator */}
                      <div className="mt-0.5 flex-shrink-0">
                        {isCompleted ? (
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                        ) : isCurrent ? (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Play className="h-3 w-3 text-white fill-white" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                        )}
                      </div>

                      {/* Lesson Info */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-base font-medium leading-snug ${
                            isCurrent
                              ? "text-primary"
                              : isCompleted
                                ? "text-gray-500"
                                : "text-gray-900"
                          }`}
                        >
                          {index + 1}. {lesson.post_title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{lesson.duration || "00:00"}</span>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-8 px-4">
                  <p className="text-gray-500 text-base">
                    Aucune leçon disponible
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
