"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle, XCircle, Clock, Award } from "lucide-react";
import { QuizApi } from "@/infrastructure/api/quiz-api";

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
}

export function QuizModal({
  isOpen,
  onClose,
  quizId,
  lessonId,
  onQuizCompleted,
}: QuizModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && quizId) {
      fetchQuizData();
    } else if (!isOpen) {
      setQuizData(null);
    }
  }, [isOpen, quizId]);

  const fetchQuizData = async () => {
    if (!quizId) return;

    setLoading(true);
    try {
      const data = await QuizApi.getQuizQuestions(quizId);
      setQuizData(data);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setShowResults(false);
      setIsSubmitting(false);
      setStartTime(new Date());
      setTimeLeft(null); // Pas de limite de temps pour l'instant
    } catch (error) {
      console.error('Erreur lors du chargement du quiz:', error);
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

  const handleAnswerChange = (questionId: string, answer: string) => {
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
    if (!quizData || !quizId) return;

    setIsSubmitting(true);
    try {
      // Soumettre à l'API backend
      const result = await QuizApi.submitQuiz(quizId, answers);

      setShowResults(true);
      onQuizCompleted(result.passed, result.score);
    } catch (error) {
      console.error("Error submitting quiz:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = quizData?.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === (quizData?.questions.length || 0) - 1;
  const allQuestionsAnswered = quizData?.questions.every(q => answers[q.id]);

  if (!isOpen || !quizData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-indigo-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {quizData.quiz.title}
              </h2>
              {quizData.quiz.description && (
                <p className="text-sm text-gray-600">{quizData.quiz.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {timeLeft !== null && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span className={timeLeft < 300 ? "text-red-600 font-medium" : ""}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentQuestionIndex + 1} sur {quizData.questions.length}</span>
            <span>{Math.round(((currentQuestionIndex + 1) / quizData.questions.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentQuestionIndex + 1) / quizData.questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[400px]">
          {showResults ? (
            <QuizResults
              quizData={quizData}
              answers={answers}
              onClose={onClose}
            />
          ) : currentQuestion ? (
            <QuestionCard
              question={currentQuestion}
              answer={answers[currentQuestion.id] || ""}
              onAnswerChange={(answer) =>
                handleAnswerChange(currentQuestion.id, answer)
              }
            />
          ) : null}
        </div>

        {/* Footer */}
        {!showResults && (
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>

            <div className="text-sm text-gray-600">
              {Object.keys(answers).length} / {quizData.questions.length} répondues
            </div>

            {isLastQuestion ? (
              <button
                onClick={handleSubmitQuiz}
                disabled={!allQuestionsAnswered || isSubmitting}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Soumission...
                  </>
                ) : (
                  "Terminer le quiz"
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Suivant
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  answer,
  onAnswerChange,
}: {
  question: {
    id: string;
    question: string;
    type: string;
    options?: string[];
    points: number;
  };
  answer: string;
  onAnswerChange: (answer: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">
        {question.question}
      </h3>

      {question.type === "MULTIPLE_CHOICE" && question.options && (
        <div className="space-y-2">
          {question.options.map((option: string, index: number) => (
            <label
              key={index}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option}
                checked={answer === option}
                onChange={(e) => onAnswerChange(e.target.value)}
                className="w-4 h-4 text-indigo-600"
              />
              <span className="text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === "TRUE_FALSE" && (
        <div className="space-y-2">
          {["Vrai", "Faux"].map((option) => (
            <label
              key={option}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option}
                checked={answer === option}
                onChange={(e) => onAnswerChange(e.target.value)}
                className="w-4 h-4 text-indigo-600"
              />
              <span className="text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === "SHORT_ANSWER" && (
        <textarea
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Votre réponse..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
}: {
  quizData: QuizData;
  answers: Record<string, string>;
  onClose: () => void;
}) {
  let totalScore = 0;
  let maxScore = 0;

  quizData.questions.forEach((question) => {
    maxScore += question.points;
    // Note: Dans la vraie API, on ne reçoit pas les bonnes réponses
    // Le calcul du score se fait côté backend
  });

  // Pour l'instant, on utilise les données du backend
  const percentage = 0; // Sera calculé par le backend
  const passed = false; // Sera déterminé par le backend

  return (
    <div className="text-center space-y-6">
      <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
        passed ? "bg-green-100" : "bg-red-100"
      }`}>
        {passed ? (
          <CheckCircle className="w-8 h-8 text-green-600" />
        ) : (
          <XCircle className="w-8 h-8 text-red-600" />
        )}
      </div>

      <div>
        <h3 className={`text-2xl font-bold ${
          passed ? "text-green-600" : "text-red-600"
        }`}>
          {passed ? "Félicitations !" : "Échec du quiz"}
        </h3>
        <p className="text-gray-600 mt-2">
          {passed
            ? "Vous avez réussi le quiz !"
            : `Vous devez obtenir au moins ${quizData.quiz.passingScore}% pour réussir.`
          }
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {totalScore}/{maxScore}
            </div>
            <div className="text-sm text-gray-600">Points</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(percentage)}%
            </div>
            <div className="text-sm text-gray-600">Score</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-gray-600 text-center">
          Les détails des réponses sont disponibles auprès de votre instructeur.
        </p>
      </div>

      <button
        onClick={onClose}
        className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Fermer
      </button>
    </div>
  );
}