"use client";

import React from "react";
import { useState, useEffect } from "react";
import { X, CheckCircle, XCircle, Clock, Award, ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";
import { QuizApi } from "@/infrastructure/api/quiz-api";
import logger from "@/shared/helpers/logger";

interface QuizData {
  quiz: {
    id: string;
    title: string;
    description?: string;
    passingScore: number;
  };
  questions: Array<{
    id: string;
    question: string;
    type: string;
    options?: string[];
    points: number;
  }>;
}

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizId: string | null;
  lessonId: string;
  onQuizCompleted: (passed: boolean, score: number) => void;
  variant?: "modal" | "inline" | "page";
}

export function QuizModal({
  isOpen,
  onClose,
  quizId,
  lessonId,
  onQuizCompleted,
  variant = "modal",
}: QuizModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    passed: boolean;
  } | null>(null);

  useEffect(() => {
    if (isOpen && quizId) {
      fetchQuizData();
    } else if (!isOpen) {
      setQuizData(null);
      setError(null);
      setLoading(false);
    }
  }, [isOpen, quizId]);

  const fetchQuizData = async () => {
    if (!quizId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await QuizApi.getQuizQuestions(quizId);
      setQuizData(data);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setShowResults(false);
      setIsSubmitting(false);
      setStartTime(new Date());
      setTimeLeft(null);
    } catch (error) {
      logger.error("Erreur lors du chargement du quiz:", error);
      setError("Aucun quiz disponible pour ce module.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleSubmitQuiz();
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerChange = (questionId: string, answer: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < (quizData?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quizData) return;

    setIsSubmitting(true);
    try {
      const result = await QuizApi.submitQuiz(quizData.quiz.id, answers);
      setQuizResult({ score: result.score, passed: result.passed });

      if (result.passed) {
        await Swal.fire({
          title: "🎉 Bravo !",
          text: `Quiz réussi avec ${result.score}%`,
          icon: "success",
          confirmButtonText: "Fermer",
          confirmButtonColor: "#6366f1",
          showConfirmButton: true,
          allowOutsideClick: true,
          allowEscapeKey: true,
        });
      } else {
        await Swal.fire({
          title: "❌ Quiz échoué",
          text: `Score obtenu : ${result.score}%`,
          icon: "error",
          confirmButtonText: "Fermer", // ✅ CORRECTION: Changé de "Réessayer" à "Fermer"
          confirmButtonColor: "#6366f1",
          showConfirmButton: true,
          allowOutsideClick: true,
          allowEscapeKey: true,
        });
      }

      setShowResults(true);
      onQuizCompleted(result.passed, result.score);
    } catch (error) {
      logger.error("Error submitting quiz:", error);
      await Swal.fire({
        title: "Erreur",
        text: "Une erreur est survenue lors de la soumission du quiz",
        icon: "error",
        confirmButtonText: "Fermer",
        confirmButtonColor: "#6366f1",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowResults(false);
    setIsSubmitting(false);
    setQuizResult(null);
    setStartTime(new Date());
    setTimeLeft(null);
  };

  const currentQuestion = quizData?.questions[currentQuestionIndex];
  const isLastQuestion =
    currentQuestionIndex === (quizData?.questions.length || 0) - 1;
  const allQuestionsAnswered = quizData?.questions.every(
    (q) => answers[q.id] !== undefined,
  );
  const isInline = variant === "inline";
  const isPage = variant === "page";

  if (!isOpen) return null;

  if (error) {
    const errorContent = (
      <div
        className={`bg-white overflow-hidden ${
          isInline || isPage
            ? "w-full rounded-xl border border-[#D1D7DC] shadow-sm"
            : "w-full max-w-md mx-4 rounded-2xl shadow-2xl"
        }`}
      >
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Erreur de chargement
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    );

    if (isInline || isPage) {
      return errorContent;
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        {errorContent}
      </div>
    );
  }

  if (!quizData) return null;

  const quizContent = (
    <div
      className={`bg-white overflow-hidden flex flex-col ${
        isInline || isPage
          ? "w-full rounded-xl border border-[#D1D7DC] shadow-sm"
          : "w-full max-w-sm sm:max-w-md lg:max-w-3xl mx-auto rounded-2xl shadow-2xl max-h-[95vh]"
      }`}
    >
      {/* Header */}
      {isPage ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D1D7DC] bg-[#F5F5F5] px-4 py-3">
          <div className="flex items-start gap-3">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded border border-[#D1D7DC] bg-white px-3 py-2 text-sm font-semibold text-[#0056D2] hover:bg-[#F7F9FA]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour</span>
            </button>
            <div>
              <h2 className="text-base font-semibold text-[#1F2937] sm:text-lg">
                Quiz noté : {quizData.quiz.title}
              </h2>
              <p className="text-xs text-[#6B7280]">Devoir noté • 30 min</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#374151]">
            <Clock className="h-4 w-4" />
            <span>Date 7 févr. 23:59 PST</span>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between border-b border-gray-100 p-4 sm:p-6">
          <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 sm:h-12 sm:w-12">
              <Award className="h-5 w-5 text-blue-600 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight">
                Quiz - {quizData.quiz.title}
              </h2>
              {quizData.quiz.description && (
                <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">
                  {quizData.quiz.description}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-2 flex-shrink-0 rounded-full p-1.5 transition-colors hover:bg-gray-100 sm:p-1"
          >
            <X className="h-4 w-4 text-gray-500 sm:h-5 sm:w-5" />
          </button>
        </div>
      )}

      {/* Content */}
      <div className={`${isInline ? "" : "flex-1"} overflow-y-auto`}>
        <div
          className={`${isPage ? "mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8" : "p-4 sm:p-6 lg:p-8"}`}
        >
            {showResults ? (
              quizResult ? (
                <QuizResults
                  quizData={quizData}
                  answers={answers}
                  onClose={onClose}
                  quizResult={quizResult}
                  onRestart={handleRestart}
                />
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="mt-4 text-sm sm:text-base text-gray-600">
                    Chargement des résultats...
                  </p>
                </div>
              )
            ) : (
              <>
                {/* Progress Bar */}
                <div className="mb-6 sm:mb-8">
                  <div className="flex items-center justify-between text-xs sm:text-sm mb-3">
                    <span className="text-gray-600">
                      Question {currentQuestionIndex + 1} sur{" "}
                      {quizData.questions.length}
                    </span>
                    <span className="text-blue-600 font-medium">
                      {Math.round(
                        ((currentQuestionIndex + 1) /
                          quizData.questions.length) *
                          100,
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${((currentQuestionIndex + 1) / quizData.questions.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Question */}
                {currentQuestion && (
                  <QuestionCard
                    question={currentQuestion}
                    answer={
                      answers[currentQuestion.id] !== undefined
                        ? answers[currentQuestion.id]
                        : -1
                    }
                    onAnswerChange={(answer) =>
                      handleAnswerChange(currentQuestion.id, answer)
                    }
                    variant={isPage ? "page" : "modal"}
                  />
                )}
              </>
            )}
        </div>
      </div>

      {/* Footer */}
      {!showResults && (
        <div className="border-t border-gray-100 bg-white">
          {/* Progress counter - Mobile */}
          <div className="px-4 py-2 sm:hidden">
            <div className="text-xs text-gray-500 text-center">
              {Object.keys(answers).length} / {quizData.questions.length}{" "}
              répondues
            </div>
          </div>

          {/* Footer buttons */}
          <div
            className={`flex items-center justify-between px-4 py-4 sm:px-6 sm:py-6 ${
              isPage ? "mx-auto w-full max-w-4xl lg:px-8" : ""
            }`}
          >
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base ${
                isPage ? "rounded border border-[#D1D7DC] bg-white hover:bg-[#F7F9FA]" : ""
              }`}
            >
              ← Précédent
            </button>

              {/* Progress counter - Desktop */}
              <div className="hidden sm:block text-xs sm:text-sm text-gray-500">
                {Object.keys(answers).length} / {quizData.questions.length}{" "}
                répondues
              </div>

              {isLastQuestion ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={!allQuestionsAnswered || isSubmitting}
                  className={`px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base ${
                    isPage ? "min-w-[140px] justify-center" : ""
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="hidden sm:inline">Soumission...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Voir résultats</span>
                      <span className="sm:hidden">Résultats</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className={`px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-sm sm:text-base ${
                    isPage ? "min-w-[140px]" : ""
                  }`}
                >
                  <span className="hidden sm:inline">Suivant</span>
                  <span className="sm:hidden">→</span>
                </button>
              )}
            </div>
          </div>
        )}
    </div>
  );

  if (isInline || isPage) {
    return quizContent;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
      {quizContent}
    </div>
  );
}

function QuestionCard({
  question,
  answer,
  onAnswerChange,
  variant = "modal",
}: {
  question: {
    id: string;
    question: string;
    type: string;
    options?: string[];
    points: number;
  };
  answer: number;
  onAnswerChange: (answer: number) => void;
  variant?: "modal" | "page";
}) {
  const isPage = variant === "page";

  return (
    <div className="space-y-4 sm:space-y-6">
      <h3
        className={`font-semibold text-gray-900 leading-relaxed ${
          isPage ? "text-lg sm:text-xl" : "text-base sm:text-lg lg:text-xl"
        }`}
      >
        {question.question}
      </h3>

      {question.type === "MULTIPLE_CHOICE" && question.options && (
        <div className={isPage ? "space-y-3" : "space-y-2 sm:space-y-3"}>
          {question.options.map((option: string, index: number) => {
            const isSelected = answer === index;
            return (
              <label
                key={index}
                htmlFor={`option-${question.id}-${index}`}
                className={`flex items-center gap-3 cursor-pointer transition-all group ${
                  isPage
                    ? "p-1"
                    : `p-3 sm:p-4 border-2 rounded-xl ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30"
                      }`
                }`}
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center flex-shrink-0 rounded-full border text-xs font-medium transition-colors ${
                    isPage
                      ? isSelected
                        ? "border-[#0056D2] bg-[#E8F1FF] text-[#0056D2]"
                        : "border-[#9CA3AF] bg-white text-[#6B7280]"
                      : isSelected
                        ? "border-transparent bg-blue-200 text-blue-700"
                        : "border-transparent bg-gray-200 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                  }`}
                >
                  {isPage ? "" : String.fromCharCode(65 + index)}
                </div>
                <input
                  type="radio"
                  id={`option-${question.id}-${index}`}
                  name={`question-${question.id}`}
                  value={index}
                  checked={isSelected}
                  onChange={() => onAnswerChange(index)}
                  className="sr-only"
                />
                <span
                  className={`flex-1 text-gray-800 leading-relaxed ${
                    isPage ? "text-[15px]" : "text-sm sm:text-base"
                  }`}
                >
                  {option}
                </span>
                {!isPage && isSelected && (
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                )}
              </label>
            );
          })}
        </div>
      )}

      {question.type === "TRUE_FALSE" && (
        <div className={isPage ? "space-y-3" : "space-y-2 sm:space-y-3"}>
          {["Vrai", "Faux"].map((option, index) => {
            const isSelected = answer === index;
            return (
              <label
                key={option}
                htmlFor={`option-${question.id}-${index}`}
                className={`flex items-center gap-3 cursor-pointer transition-all group ${
                  isPage
                    ? "p-1"
                    : `p-3 sm:p-4 border-2 rounded-xl ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30"
                      }`
                }`}
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center flex-shrink-0 rounded-full border text-xs font-medium transition-colors ${
                    isPage
                      ? isSelected
                        ? "border-[#0056D2] bg-[#E8F1FF] text-[#0056D2]"
                        : "border-[#9CA3AF] bg-white text-[#6B7280]"
                      : isSelected
                        ? "border-transparent bg-blue-200 text-blue-700"
                        : "border-transparent bg-gray-200 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                  }`}
                >
                  {isPage ? "" : String.fromCharCode(65 + index)}
                </div>
                <input
                  type="radio"
                  id={`option-${question.id}-${index}`}
                  name={`question-${question.id}`}
                  value={index}
                  checked={isSelected}
                  onChange={() => onAnswerChange(index)}
                  className="sr-only"
                />
                <span
                  className={`flex-1 text-gray-800 ${
                    isPage ? "text-[15px]" : "text-sm sm:text-base"
                  }`}
                >
                  {option}
                </span>
                {!isPage && isSelected && (
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                )}
              </label>
            );
          })}
        </div>
      )}

      {question.type === "SHORT_ANSWER" && (
        <textarea
          value={answer}
          onChange={(e) => onAnswerChange(Number(e.target.value))}
          placeholder="Votre réponse..."
          className="w-full p-3 sm:p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
          rows={4}
        />
      )}
    </div>
  );
}

function QuizResults({
  quizData,
  answers,
  onClose,
  quizResult,
  onRestart,
}: {
  quizData: QuizData;
  answers: Record<string, number>;
  onClose: () => void;
  quizResult: { score: number; passed: boolean } | null;
  onRestart: () => void;
}) {
  const percentage = quizResult?.score || 0;
  const passed = quizResult?.passed || false;

  return (
    <div className="text-center space-y-6 sm:space-y-8 py-6 sm:py-8">
      <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 mx-auto rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-lg">
        <span className="text-2xl sm:text-3xl lg:text-5xl font-bold text-blue-600">
          {percentage}%
        </span>
      </div>

      <div>
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
          {percentage >= 71
            ? "Excellent travail!"
            : percentage >= 41
              ? "Bon effort!"
              : "Continuez à apprendre!"}
        </h3>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600">
          Vous avez répondu correctement à{" "}
          <span className="font-semibold text-gray-900">
            {Math.round((percentage / 100) * quizData.questions.length)}
          </span>{" "}
          questions sur{" "}
          <span className="font-semibold text-gray-900">
            {quizData.questions.length}
          </span>
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4">
        <button
          onClick={onRestart}
          className="px-6 sm:px-8 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Recommencer
        </button>
        <button
          onClick={onClose}
          className="px-6 sm:px-8 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-sm sm:text-base"
        >
          Terminer
        </button>
      </div>
    </div>
  );
}
