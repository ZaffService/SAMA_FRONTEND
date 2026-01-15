"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, FileText, HelpCircle, Clock, Users, Star } from "lucide-react";
import { Module } from "@/domain/entities/module";

interface CourseFormData {
  title: string;
  description: string;
  categoryId: string;
  category?: { id: string; name: string };
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  price: number;
  modules: Module[];
  thumbnailUrl?: string;
}

interface CoursePreviewProps {
  courseData: CourseFormData;
  thumbnailUrl?: string;
  instructorName?: string;
}

const levelLabels: Record<string, string> = {
  BEGINNER: 'Débutant',
  INTERMEDIATE: 'Intermédiaire',
  ADVANCED: 'Avancé',
};

const levelColors: Record<string, string> = {
  BEGINNER: 'bg-green-100 text-green-800',
  INTERMEDIATE: 'bg-yellow-100 text-yellow-800',
  ADVANCED: 'bg-red-100 text-red-800',
};

export function CoursePreview({
  courseData,
  thumbnailUrl,
  instructorName = 'Votre nom',
}: CoursePreviewProps) {
  const totalLessons = courseData.modules.reduce(
    (acc, module) => acc + module.lessons.length,
    0
  );
  
  const totalQuizzes = courseData.modules.reduce(
    (acc, module) => acc + (module.quizzes?.length || 0),
    0
  );

  const totalQuestions = courseData.modules.reduce(
    (acc, module) => acc + (module.quizzes?.reduce((qAcc, quiz) => qAcc + quiz.questions.length, 0) || 0),
    0
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Aperçu de votre cours
        </h2>
        <p className="text-gray-600">
          Voici comment votre cours apparaîtra aux étudiants
        </p>
      </div>

      {/* Course Card Preview */}
      <Card className="overflow-hidden">
        {/* Thumbnail */}
        <div className="relative h-48 md:h-64 bg-gradient-to-br from-blue-500 to-purple-600">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={courseData.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                  <PlayCircle className="w-10 h-10" />
                </div>
                <p className="text-lg font-medium">Pas de miniature</p>
              </div>
            </div>
          )}
          <div className="absolute top-4 left-4">
            <Badge className={levelColors[courseData.level]}>
              {levelLabels[courseData.level]}
            </Badge>
          </div>
          {courseData.price === 0 && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-green-500 text-white">Gratuit</Badge>
            </div>
          )}
        </div>

        <CardContent className="pt-6">
          {/* Title & Category */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {courseData.title || 'Titre du cours'}
            </h1>
            <p className="text-sm text-gray-500">
              Catégorie: {courseData.category?.name || 'Non catégorisé'}
            </p>
          </div>

          {/* Instructor */}
          <div className="flex items-center mb-4 pb-4 border-b">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-medium">
                {instructorName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {instructorName}
              </p>
              <p className="text-xs text-gray-500">Instructeur</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-lg font-bold">{totalLessons}</p>
                <p className="text-xs text-gray-500">Leçons</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-lg font-bold">{totalQuizzes}</p>
                <p className="text-xs text-gray-500">Quiz</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-lg font-bold">
                  {formatDuration(totalDuration)}
                </p>
                <p className="text-xs text-gray-500">Durée</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-lg font-bold">{totalQuestions}</p>
                <p className="text-xs text-gray-500">Questions</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-600 text-sm whitespace-pre-wrap">
              {courseData.description || 'Aucune description'}
            </p>
          </div>

          {/* Price */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Prix du cours</span>
              <span className="text-2xl font-bold text-gray-900">
                {courseData.price === 0
                  ? 'Gratuit'
                  : `${courseData.price.toLocaleString()} XOF`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modules & Lessons Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Structure du cours</span>
            <Badge variant="secondary">
              {courseData.modules.length} module
              {courseData.modules.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {courseData.modules.map((module, moduleIndex) => (
              <div
                key={module.id || module.tempId || `module-${moduleIndex}`}
                className="border rounded-lg overflow-hidden"
              >
                {/* Module Header */}
                <div className="bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                        {moduleIndex + 1}
                      </span>
                      <div>
                        <h4 className="font-medium">{module.title}</h4>
                        <p className="text-sm text-gray-500">
                          {module.lessons.length} leçon(s)
                          {module.quizzes && module.quizzes.length > 0 ? ` + ${module.quizzes.length} quiz` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lessons */}
                {module.lessons.length > 0 && (
                  <div className="divide-y">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div
                        key={lesson.id || lesson.tempId || `lesson-${lessonIndex}`}
                        className="flex items-center justify-between p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          {lesson.videoUrl ? (
                            <PlayCircle className="w-5 h-5 text-blue-500" />
                          ) : (
                            <FileText className="w-5 h-5 text-gray-400" />
                          )}
                          <div>
                            <p className="text-sm font-medium">
                              {lessonIndex + 1}. {lesson.title}
                            </p>
                            {lesson.duration && (
                              <p className="text-xs text-gray-500">
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
                  <div className="p-4 bg-purple-50 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <HelpCircle className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="font-medium text-purple-900">
                            {module.quizzes[0].title}
                          </p>
                          <p className="text-sm text-purple-700">
                            {module.quizzes[0].questions.length} questions • Score de passage: {module.quizzes[0].passingScore}%
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-4">Récapitulatif</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">
              {courseData.modules.length}
            </p>
            <p className="text-sm text-blue-700">Modules</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{totalLessons}</p>
            <p className="text-sm text-blue-700">Leçons</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{totalQuizzes}</p>
            <p className="text-sm text-blue-700">Quiz</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{totalDuration}</p>
            <p className="text-sm text-blue-700">Minutes</p>
          </div>
        </div>
      </div>
    </div>
  );
}

