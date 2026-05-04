"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PlayCircle,
  FileText,
  HelpCircle,
  Clock,
  Users,
  Star,
} from "lucide-react";
import { Module } from "@/domain/entities/module";

interface CourseFormData {
  title: string;
  description: string;
  categoryId: string;
  category?: { id: string; name: string };
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  price: string;
  modules: Module[];
  thumbnailUrl?: string;
}

interface CoursePreviewProps {
  courseData: CourseFormData;
  thumbnailUrl?: string;
  instructorName?: string;
}

const levelLabels: Record<string, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
};

const levelColors: Record<string, string> = {
  BEGINNER: "bg-emerald-500/20 text-emerald-200 border border-emerald-400/35",
  INTERMEDIATE: "bg-amber-500/20 text-amber-200 border border-amber-400/35",
  ADVANCED: "bg-red-500/20 text-red-200 border border-red-400/35",
};

export function CoursePreview({
  courseData,
  thumbnailUrl,
  instructorName = "Votre nom",
}: CoursePreviewProps) {
  const parsedPrice = Number.parseInt(courseData.price || "0", 10) || 0;
  const totalLessons = courseData.modules.reduce(
    (acc, module) => acc + module.lessons.length,
    0,
  );

  const totalQuizzes = courseData.modules.reduce(
    (acc, module) => acc + (module.quizzes?.length || 0),
    0,
  );

  const totalQuestions = courseData.modules.reduce(
    (acc, module) =>
      acc +
      (module.quizzes?.reduce(
        (qAcc, quiz) => qAcc + quiz.questions.length,
        0,
      ) || 0),
    0,
  );

  const totalDuration = courseData.modules.reduce((acc, module) => {
    return (
      acc +
      module.lessons.reduce((lessonAcc, lesson) => {
        return lessonAcc + (lesson.duration || 0);
      }, 0)
    );
  }, 0);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="mb-2 text-2xl font-bold text-white">
          Aperçu de votre cours
        </h2>
        <p className="text-white/70">
          Voici comment votre cours apparaîtra aux étudiants
        </p>
      </div>

      {/* Course Card Preview */}
      <Card className="overflow-hidden border-[#302D47] bg-[#1F1D2B] text-white">
        {/* Thumbnail */}
        <div className="relative h-48 md:h-64 bg-[#181721]">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={courseData.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Site Logo"
                className="w-24 h-24 object-contain"
              />
            </div>
          )}
          <div className="absolute top-4 left-4">
            <Badge className={levelColors[courseData.level]}>
              {levelLabels[courseData.level]}
            </Badge>
          </div>
          {parsedPrice === 0 && (
            <div className="absolute top-4 right-4">
              <Badge className="border border-emerald-400/35 bg-emerald-500/20 text-emerald-200">
                Gratuit
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="pt-6">
          {/* Title & Category */}
          <div className="mb-4">
            <h1 className="mb-2 text-2xl font-bold text-white">
              {courseData.title || "Titre du cours"}
            </h1>
            <p className="text-sm text-white/60">
              Catégorie: {courseData.category?.name || "Non catégorisé"}
            </p>
          </div>

          {/* Instructor */}
          <div className="mb-4 flex items-center border-b border-[#302D47] pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1E335F]">
              <span className="font-medium text-[#93C5FD]">
                {instructorName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">
                {instructorName}
              </p>
              <p className="text-xs text-white/60">Instructeur</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-white/55" />
              <div>
                <p className="text-lg font-bold text-white">{totalLessons}</p>
                <p className="text-xs text-white/60">Leçons</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-white/55" />
              <div>
                <p className="text-lg font-bold text-white">{totalQuizzes}</p>
                <p className="text-xs text-white/60">Quiz</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-white/55" />
              <div>
                <p className="text-lg font-bold text-white">
                  {formatDuration(totalDuration)}
                </p>
                <p className="text-xs text-white/60">Durée</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-white/55" />
              <div>
                <p className="text-lg font-bold text-white">{totalQuestions}</p>
                <p className="text-xs text-white/60">Questions</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="mb-2 text-lg font-semibold text-white">Description</h3>
            <p className="text-sm whitespace-pre-wrap text-white/75">
              {courseData.description || "Aucune description"}
            </p>
          </div>

          {/* Price */}
          <div className="rounded-lg border border-[#302D47] bg-[#181721] p-4">
            <div className="flex items-center justify-between">
              <span className="text-white/70">Prix du cours</span>
              <span className="text-2xl font-bold text-white">
                {parsedPrice === 0
                  ? "Gratuit"
                  : `${parsedPrice.toLocaleString()} XOF`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modules & Lessons Preview */}
      <Card className="border-[#302D47] bg-[#1F1D2B] text-white">
        <CardHeader className="border-b border-[#302D47]">
          <CardTitle className="flex items-center space-x-2">
            <span>Structure du cours</span>
            <Badge className="border border-[#3B3754] bg-[#181721] text-white/80">
              {courseData.modules.length} module
              {courseData.modules.length !== 1 ? "s" : ""}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {courseData.modules.map((module, moduleIndex) => (
              <div
                key={module.id || module.tempId || `module-${moduleIndex}`}
                className="overflow-hidden rounded-lg border border-[#302D47] bg-[#181721]"
              >
                {/* Module Header */}
                <div className="border-b border-[#302D47] bg-[#1A1828] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1E335F] text-sm font-semibold text-[#93C5FD]">
                        {moduleIndex + 1}
                      </span>
                      <div>
                        <h4 className="font-medium text-white">{module.title}</h4>
                        <p className="text-sm text-white/60">
                          {module.lessons.length} leçon(s)
                          {module.quizzes && module.quizzes.length > 0
                            ? ` + ${module.quizzes.length} quiz`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lessons */}
                {module.lessons.length > 0 && (
                  <div className="divide-y divide-[#302D47]">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div
                        key={
                          lesson.id || lesson.tempId || `lesson-${lessonIndex}`
                        }
                        className="flex items-center justify-between p-4 hover:bg-[#2A263F]"
                      >
                        <div className="flex items-center space-x-3">
                          {lesson.videoUrl ? (
                            <PlayCircle className="w-5 h-5 text-[#93C5FD]" />
                          ) : (
                            <FileText className="w-5 h-5 text-white/50" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-white">
                              {lessonIndex + 1}. {lesson.title}
                            </p>
                            {lesson.duration && (
                              <p className="text-xs text-white/60">
                                {lesson.duration} minutes
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quiz */}
                {module.quizzes && module.quizzes.length > 0 && (
                  <div className="border-t border-[#302D47] bg-[#201A33] p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <HelpCircle className="w-5 h-5 text-violet-300" />
                        <div>
                          <p className="font-medium text-violet-200">
                            {module.quizzes[0].title}
                          </p>
                          <p className="text-sm text-violet-200/80">
                            {module.quizzes[0].questions.length} questions •
                            Score de passage: {module.quizzes[0].passingScore}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="rounded-lg border border-[#3B3754] bg-[#181721] p-6">
        <h3 className="mb-4 font-semibold text-white">Récapitulatif</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-[#93C5FD]">
              {courseData.modules.length}
            </p>
            <p className="text-sm text-white/70">Modules</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-[#93C5FD]">{totalLessons}</p>
            <p className="text-sm text-white/70">Leçons</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-[#93C5FD]">{totalQuizzes}</p>
            <p className="text-sm text-white/70">Quiz</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-[#93C5FD]">{totalDuration}</p>
            <p className="text-sm text-white/70">Minutes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
