"use client";

import { useCourseProgress } from "@/hooks/useCourseProgress";
import { Trophy, Target, TrendingUp, CheckCircle } from "lucide-react";

interface ModuleProgress {
  id: string;
  progress: number;
  completed: boolean;
}

interface CourseProgressProps {
  modules: ModuleProgress[];
  courseTitle: string;
}

export function CourseProgress({ modules, courseTitle }: CourseProgressProps) {
  const { overallProgress, isCompleted, stats } = useCourseProgress({
    modules,
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Target className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Progression du cours
            </h2>
            <p className="text-sm text-gray-600">{courseTitle}</p>
          </div>
        </div>

        {isCompleted && (
          <div className="flex items-center gap-2 text-green-600">
            <Trophy className="w-6 h-6" />
            <span className="text-sm font-medium">Cours terminé !</span>
          </div>
        )}
      </div>

      {/* Overall Progress */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">
            Progression globale
          </span>
          <span className="text-lg font-bold text-gray-900">
            {stats.overallProgress}%
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-1000 ${
              isCompleted ? "bg-green-500" : "bg-blue-600"
            }`}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {stats.totalModules}
          </div>
          <div className="text-xs text-blue-600 font-medium">Modules total</div>
        </div>

        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {stats.completedModules}
          </div>
          <div className="text-xs text-green-600 font-medium">Terminés</div>
        </div>

        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {stats.inProgressModules}
          </div>
          <div className="text-xs text-yellow-600 font-medium">En cours</div>
        </div>

        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">
            {stats.notStartedModules}
          </div>
          <div className="text-xs text-gray-600 font-medium">À commencer</div>
        </div>
      </div>

      {/* Modules Progress */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Progression par module
        </h3>
        <div className="space-y-2">
          {modules.map((module) => (
            <div key={module.id} className="flex items-center gap-3">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    module.completed ? "bg-green-500" : "bg-blue-600"
                  }`}
                  style={{ width: `${module.progress}%` }}
                />
              </div>
              <div className="flex items-center gap-2 min-w-0">
                {module.completed && (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                )}
                <span className="text-xs text-gray-600 truncate">
                  {Math.round(module.progress)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Encouragement Message */}
      {!isCompleted && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">
                Continuez votre apprentissage !
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                Vous avez terminé {stats.completedModules} module
                {stats.completedModules > 1 ? "s" : ""}. Plus que{" "}
                {stats.totalModules - stats.completedModules} à finir !
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
