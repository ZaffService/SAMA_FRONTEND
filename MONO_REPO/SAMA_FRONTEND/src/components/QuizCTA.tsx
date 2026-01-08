"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Award, Play, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

interface QuizCTAProps {
  moduleId: string;
  quizId?: string;
  isModuleCompleted: boolean;
  hasPassedQuiz?: boolean;
  onQuizStart?: () => void;
}

export function QuizCTA({
  moduleId,
  quizId,
  isModuleCompleted,
  hasPassedQuiz = false,
  onQuizStart,
}: QuizCTAProps) {
  const [isStarting, setIsStarting] = useState(false);

  const handleStartQuiz = async () => {
    if (!quizId) return;

    setIsStarting(true);
    try {
      onQuizStart?.();
      // TODO: Navigation vers la page du quiz
      // router.push(`/quiz/${quizId}`);
    } finally {
      setIsStarting(false);
    }
  };

  if (hasPassedQuiz) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-green-900">Quiz réussi !</h3>
            <p className="text-sm text-green-700">
              Félicitations ! Vous avez validé ce module.
            </p>
          </div>
          <Award className="w-6 h-6 text-green-600" />
        </div>
      </div>
    );
  }

  if (!isModuleCompleted) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">Quiz verrouillé</h3>
            <p className="text-sm text-gray-600">
              Terminez toutes les leçons du module pour accéder au quiz.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!quizId) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-blue-900">Module terminé !</h3>
            <p className="text-sm text-blue-700">
              Ce module ne contient pas de quiz. Vous pouvez passer au suivant.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Award className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-blue-900">Quiz disponible</h3>
            <p className="text-sm text-blue-700">
              Testez vos connaissances et validez ce module !
            </p>
          </div>
        </div>

        <Button
          onClick={handleStartQuiz}
          disabled={isStarting}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isStarting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Chargement...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Commencer le quiz
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
