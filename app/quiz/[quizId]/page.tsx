"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { EnrollmentApi } from "@/infrastructure/api/enrollment-api";
import { buildApiUrl, API_ENDPOINTS } from "@/infrastructure/api/baseConfig";
import { ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react";
import Link from "next/link";
import { showQuizFailureModal } from "@/shared/helpers/sweet-alert";
import logger from "@/shared/helpers/logger";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

interface QuizData {
  id: string;
  title: string;
  description?: string;
  passingScore: number;
  questions: QuizQuestion[];
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Charger les questions du quiz
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        // TODO: Replace with actual quiz questions endpoint when backend is updated
        const response = await fetch(
          buildApiUrl(API_ENDPOINTS.QUIZ.QUESTIONS(quizId)),
          {
            credentials: "include",
          },
        );

        if (!response.ok) {
          throw new Error("Erreur lors du chargement du quiz");
        }

        const data = await response.json();
        setQuiz({
          id: data.quiz.id,
          title: data.quiz.title,
          description: data.quiz.description,
          passingScore: data.quiz.passingScore,
          questions: data.questions.map((q: any) => ({
            id: q.id,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
          })),
        });
      } catch (error) {
        logger.error("Erreur chargement quiz:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const currentQuestion = quiz?.questions[currentQuestionIndex];
  const isLastQuestion =
    currentQuestionIndex === (quiz?.questions.length || 0) - 1;
  const progress =
    ((currentQuestionIndex + 1) / (quiz?.questions.length || 1)) * 100;

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    setSubmitting(true);
    try {
      // Formater les réponses selon l'API
      const formattedAnswers = Object.entries(answers).map(
        ([questionId, selectedAnswer]) => ({
          questionId,
          selectedAnswer,
        }),
      );

      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.QUIZ.SUBMIT(quizId)),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ answers: formattedAnswers }),
        },
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la soumission du quiz");
      }

      const data = await response.json();
      setResult({
        score: data.score,
        passed: data.passed,
        correctAnswers: data.correctAnswers,
        totalQuestions: data.totalQuestions,
        feedback: data.passed
          ? "Félicitations ! Vous avez réussi le quiz."
          : "Pas réussi cette fois. Continuez vos efforts !",
      });
      localStorage.setItem(`quiz_attempted_${quizId}`, "true");
      if (!data.passed) {
        const modalResult = await showQuizFailureModal();
        if (modalResult.action === "retake") {
          setCurrentQuestionIndex(0);
          setAnswers({});
          setResult(null);
          setSubmitting(false);
          return;
        }
      }
      setShowResults(true);
    } catch (error) {
      logger.error("Erreur soumission quiz:", error);
      // TODO: Afficher une erreur à l'utilisateur
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Quiz non trouvé</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  if (showResults && result) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour aux cours
            </Link>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Résultats du quiz
            </h1>
            <p className="text-gray-600">{quiz.title}</p>
          </div>

          {/* Résultats */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center mb-8">
              <div
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-semibold mb-4 ${
                  result.passed
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {result.passed ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <XCircle className="w-6 h-6" />
                )}
                {result.passed ? "Réussi" : "Échec"}
              </div>

              <div className="text-4xl font-bold text-gray-900 mb-2">
                {result.score}%
              </div>
              <p className="text-gray-600 mb-2">
                {result.correctAnswers}/{result.totalQuestions} bonnes réponses
              </p>
              <p className="text-gray-600">
                Score minimum requis: {quiz.passingScore}%
              </p>
            </div>

            {/* Détails des réponses */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Détail des réponses
              </h3>

              {quiz.questions.map((question, index) => {
                const userAnswer = answers[question.id];
                const isCorrect = userAnswer === question.correctAnswer;

                return (
                  <div
                    key={question.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                          isCorrect
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-2">
                          {question.question}
                        </p>

                        <div className="space-y-1">
                          <p className="text-sm">
                            <span className="font-medium">Votre réponse:</span>{" "}
                            <span
                              className={
                                isCorrect ? "text-green-600" : "text-red-600"
                              }
                            >
                              {userAnswer || "Non répondu"}
                            </span>
                          </p>

                          {!isCorrect && (
                            <p className="text-sm">
                              <span className="font-medium">
                                Bonne réponse:
                              </span>{" "}
                              <span className="text-green-600">
                                {question.correctAnswer}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="mt-8 flex gap-4">
              <Link
                href="/mes-apprentissages"
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium text-center hover:bg-blue-700 transition-colors"
              >
                Retour à mes apprentissages
              </Link>

              {!result.passed && (
                <button
                  onClick={() => {
                    setShowResults(false);
                    setCurrentQuestionIndex(0);
                    setAnswers({});
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Retenter le quiz
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux cours
          </Link>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {quiz.title}
          </h1>
          {quiz.description && (
            <p className="text-gray-600 mb-4">{quiz.description}</p>
          )}

          {/* Progress */}
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm text-gray-600">
              {currentQuestionIndex + 1} / {quiz.questions.length}
            </span>
          </div>
        </div>

        {/* Question */}
        {currentQuestion && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {currentQuestion.question}
            </h2>

            {/* Options */}
            <div className="space-y-3 mb-8">
              {currentQuestion.options.map((option, index) => (
                <label
                  key={index}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors"
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option}
                    checked={answers[currentQuestion.id] === option}
                    onChange={() =>
                      handleAnswerSelect(currentQuestion.id, option)
                    }
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-900">{option}</span>
                </label>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Précédent
              </button>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                Temps restant: --:--
              </div>

              <button
                onClick={handleNext}
                disabled={!answers[currentQuestion.id]}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                {isLastQuestion
                  ? submitting
                    ? "Soumission..."
                    : "Terminer"
                  : "Suivant"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
