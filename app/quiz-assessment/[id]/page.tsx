"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  Clock,
  Flag,
  CheckCircle2,
  XCircle,
  Award,
  Download,
  RefreshCw,
  BookOpen,
  ChevronRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { QuizApi } from "@/infrastructure/api/quiz-api";
import {
  showQuitConfirmation,
  showQuizFailureModal,
} from "@/shared/helpers/sweet-alert";

interface QuizQuestion {
  id: number;
  question: string;
  type: "single" | "multiple" | "text";
  points: number;
  order: number;
  options?: string[];
  correctAnswer?: number;
  correctAnswers?: number[];
  minWords?: number;
  explanation?: string;
}

export default function QuizAssessment() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const moduleId = params.id as string;

  const [courseId, setCourseId] = useState<string | null>(null);
  const [canAccess, setCanAccess] = useState(true); // Declare canAccess variable

  useEffect(() => {
    // Try to get courseId from query params first, then sessionStorage
    const queryCourseId = searchParams.get("courseId"); // Declare the variable here
    if (queryCourseId) {
      setCourseId(queryCourseId);
      // Save to sessionStorage for future use
      sessionStorage.setItem("lastCourseId", queryCourseId);
    } else {
      // Fallback to sessionStorage
      const storedCourseId = sessionStorage.getItem("lastCourseId");
      if (storedCourseId) {
        setCourseId(storedCourseId);
      }
    }
  }, [searchParams]);

  const returnUrl = courseId
    ? `/video-learning-module/${courseId}`
    : "/student-dashboard";

  const [quizData, setQuizData] = useState<QuizQuestion[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: any }>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(1800); // 30 minutes
  const [showResults, setShowResults] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

  // Charger les données du quiz - TOUJOURS exécuté !
  useEffect(() => {
    const loadQuizData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("🔍 Chargement du quiz pour le module ID:", moduleId);

        // Try to load from API first
        try {
          const quizResponse = await QuizApi.getQuizQuestions(moduleId);
          console.log("📡 Réponse API quiz:", quizResponse);

          if (quizResponse && quizResponse.quiz && quizResponse.questions && Array.isArray(quizResponse.questions) && quizResponse.questions.length > 0) {
            // Convertir les données API au format attendu par le frontend
            const formattedData = quizResponse.questions.map((q: any, idx: number) => ({
              id: q.id,
              question: q.question,
              type: q.type === 'multiple_choice' ? 'single' : q.type === 'true_false' ? 'single' : q.type === 'multiple_response' ? 'multiple' : 'text' as "single" | "multiple" | "text",
              points: q.points || 4,
              order: idx + 1,
              options: q.options || [],
              correctAnswer: q.correct_answer,
              correctAnswers: q.correct_answers,
              explanation: q.explanation,
              minWords: q.min_words,
            }));

            setQuizData(formattedData);
            console.log("✅ Quiz chargé avec succès depuis l'API:", formattedData.length, "questions");
            return;
          }
        } catch (quizErr) {
          console.error("❌ Erreur API quiz:", quizErr);
        }

        // Fallback: données mockées
        console.log("🔄 Utilisation des données mockées");
        const mockQuizData: QuizQuestion[] = [
          {
            id: 1,
            question: "Qu'est-ce qu'un algorithme ?",
            type: "single" as const,
            points: 4,
            order: 1,
            options: [
              "Un langage de programmation",
              "Une séquence d'instructions pour résoudre un problème",
              "Un type de donnée",
              "Un système d'exploitation",
            ],
            correctAnswer: 1,
            explanation:
              "Un algorithme est une séquence finie et non ambiguë d'instructions permettant de résoudre un problème ou d'effectuer un calcul.",
          },
          {
            id: 2,
            question:
              "Quelle est la caractéristique principale d'un algorithme ?",
            type: "single" as const,
            points: 4,
            order: 2,
            options: [
              "Il doit être écrit en langage machine",
              "Il doit être fini",
              "Il doit être ambigu",
              "Il doit être infini",
            ],
            correctAnswer: 1,
            explanation:
              "Un algorithme doit être fini, c'est-à-dire qu'il doit se terminer après un nombre fini d'étapes.",
          },
          {
            id: 3,
            question:
              "Si tu veux faire du café, ton algorithme commencerait par :",
            type: "single" as const,
            points: 4,
            order: 3,
            options: ["Boire le café", "Faire chauffer l'eau", "Aller dormir"],
            correctAnswer: 1,
            explanation:
              "Un algorithme doit commencer par les étapes de base nécessaires.",
          },
        ];

        setQuizData(mockQuizData);
      } catch (err) {
        console.error("Erreur chargement quiz:", err);
        setError("Erreur de chargement du quiz");
      } finally {
        setLoading(false);
      }
    };

    loadQuizData();
  }, [moduleId]); // Dépendance moduleId

  // Timer pour le quiz - CONDITION À L'INTÉRIEUR du useEffect
  useEffect(() => {
    // Condition DANS le useEffect, pas autour
    if (!quizStarted || quizCompleted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Note: handleSubmitQuiz n'est pas encore défini ici
          // On peut soit le définir avant, soit gérer différemment
          setQuizCompleted(true);
          setShowResults(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, quizCompleted]);

  // Rendu conditionnel APRÈS tous les hooks
  if (!canAccess) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement du quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Réessayer</Button>
        </div>
      </div>
    );
  }

  if (!quizData || quizData.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Aucune question trouvée pour ce quiz.
          </p>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerChange = (questionId: number, answer: any) => {
    setAnswers({ ...answers, [questionId]: answer });
    // 📌 Les réponses au quiz sont stockées en état React seulement
    // (Pas de localStorage - les résultats seront envoyés au serveur via l'API)
  };

  const toggleFlag = (questionId: number) => {
    setFlaggedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId],
    );
  };

  const calculateScore = () => {
    if (!quizData) return { correct: 0, total: 0, percentage: 0 };

    let correct = 0;
    const total = quizData.length;

    quizData.forEach((question) => {
      const userAnswer = answers[question.id];
      if (question.type === "single") {
        if (userAnswer === question.correctAnswer) correct++;
      } else if (question.type === "multiple") {
        const correctAnswers = question.correctAnswers || [];
        const userAnswers = userAnswer || [];
        if (
          correctAnswers.length === userAnswers.length &&
          correctAnswers.every((ans: number) => userAnswers.includes(ans))
        ) {
          correct++;
        }
      } else if (question.type === "text") {
        // Simple check for text answers - in real app, this would be manual grading
        if (
          userAnswer &&
          userAnswer.split(" ").length >= (question.minWords || 10)
        ) {
          correct++;
        }
      }
    });

    return { correct, total, percentage: Math.round((correct / total) * 100) };
  };

  const handleSubmitQuiz = async () => {
    setQuizCompleted(true);
    setShowResults(true);

    const score = calculateScore();
    const passed = score.percentage >= 70;

    if (!passed) {
      const result = await showQuizFailureModal();
      if (result.action === "retake") {
        // Reset quiz state for retake
        setQuizStarted(false);
        setQuizCompleted(false);
        setShowResults(false);
        setCurrentQuestion(0);
        setAnswers({});
        setTimeRemaining(1800);
      } else if (result.action === "view_answers") {
        // Show review mode with correct answers
        setReviewMode(true);
      }
      // If cancelled, stay on results page
    }
  };

  const score = calculateScore();

  // Quiz Introduction
  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Link href={returnUrl}>
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Retour au cours
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-card border rounded-xl p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Award className="h-8 w-8" />
                </div>
              </div>

              <h1 className="text-3xl font-bold text-center mb-4">Quiz</h1>
              <p className="text-center text-muted-foreground mb-8">
                Testez vos connaissances
              </p>

              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    Questions
                  </p>
                  <p className="text-2xl font-bold">{quizData.length}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Durée</p>
                  <p className="text-2xl font-bold">30 min</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    Score requis
                  </p>
                  <p className="text-2xl font-bold">70%</p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <AlertCircle className="h-5 w-5" />
                  Instructions
                </h3>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li>
                    • Vous disposez de 30 minutes pour répondre à toutes les
                    questions
                  </li>
                  <li>
                    • Certaines questions peuvent avoir plusieurs bonnes
                    réponses
                  </li>
                  <li>
                    • Vous pouvez marquer des questions pour y revenir plus tard
                  </li>
                  <li>• Vos réponses sont sauvegardées automatiquement</li>
                  <li>
                    • Un score minimum de 70% est requis pour valider ce quiz
                  </li>
                </ul>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => setQuizStarted(true)}
              >
                Commencer le quiz
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Results
  if (showResults) {
    const passed = score.percentage >= 70;

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
          <div className="max-w-2xl w-full">
            <div className="bg-card border rounded-xl p-8 text-center">
              <div className="flex items-center justify-center mb-6">
                {passed ? (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <XCircle className="h-10 w-10" />
                  </div>
                )}
              </div>

              <h1 className="text-3xl font-bold mb-2">
                {passed ? "Félicitations !" : "Continuez vos efforts"}
              </h1>
              <p className="text-muted-foreground mb-8">
                {passed
                  ? "Vous avez réussi le quiz avec succès"
                  : "Vous n'avez pas atteint le score minimum requis"}
              </p>

              <div className="bg-muted/50 rounded-lg p-8 mb-8">
                <div className="text-6xl font-bold mb-2 bg-gradient-to-r from-primary to-destructive bg-clip-text text-transparent">
                  {score.percentage}%
                </div>
                <p className="text-muted-foreground">
                  {score.correct} sur {score.total} réponses correctes
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">
                    Bonnes réponses
                  </p>
                  <p className="text-2xl font-bold text-green-500">
                    {score.correct}
                  </p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">
                    Mauvaises réponses
                  </p>
                  <p className="text-2xl font-bold text-destructive">
                    {score.total - score.correct}
                  </p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">
                    Temps écoulé
                  </p>
                  <p className="text-2xl font-bold">
                    {formatTime(1800 - timeRemaining)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {!passed && (
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => {
                      setQuizStarted(false);
                      setQuizCompleted(false);
                      setShowResults(false);
                      setCurrentQuestion(0);
                      setAnswers({});
                      setTimeRemaining(1800);
                    }}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retenter
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setReviewMode(true)}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Réviser les réponses
                </Button>
                {passed && (
                  <Button className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger le certificat
                  </Button>
                )}
                <Link href={returnUrl} className="flex-1">
                  <Button className="w-full">
                    Continuer le cours
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Review Mode
  if (reviewMode) {
    const currentQ = quizData[currentQuestion];
    const userAnswer = answers[currentQ.id];
    let isCorrect = false;

    if (currentQ.type === "single") {
      isCorrect = userAnswer === currentQ.correctAnswer;
    } else if (currentQ.type === "multiple") {
      const correctAnswers = currentQ.correctAnswers || [];
      const userAnswers = userAnswer || [];
      isCorrect =
        correctAnswers.length === userAnswers.length &&
        correctAnswers.every((ans: number) => userAnswers.includes(ans));
    }

    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReviewMode(false)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Retour aux résultats
              </Button>
              <div className="text-sm text-muted-foreground">
                Question {currentQuestion + 1} sur {quizData.length}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <Progress
                value={((currentQuestion + 1) / quizData.length) * 100}
                className="h-2"
              />
            </div>

            <div className="bg-card border rounded-xl p-8">
              <div className="flex items-start justify-between mb-6">
                <Badge
                  variant={isCorrect ? "default" : "destructive"}
                  className="mb-4"
                >
                  {isCorrect ? "Réponse correcte" : "Réponse incorrecte"}
                </Badge>
              </div>

              <h2 className="text-2xl font-bold mb-6">{currentQ.question}</h2>

              {currentQ.type !== "text" ? (
                <div className="space-y-3 mb-6">
                  {currentQ.options?.map((option, index) => {
                    const isUserAnswer =
                      currentQ.type === "single"
                        ? userAnswer === index
                        : userAnswer?.includes(index);
                    const isCorrectAnswer =
                      currentQ.type === "single"
                        ? currentQ.correctAnswer === index
                        : currentQ.correctAnswers?.includes(index);

                    return (
                      <div
                        key={index}
                        className={`p-4 border-2 rounded-lg ${
                          isCorrectAnswer
                            ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                            : isUserAnswer && !isCorrectAnswer
                              ? "border-destructive bg-destructive/5"
                              : "border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option}</span>
                          {isCorrectAnswer && (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          )}
                          {isUserAnswer && !isCorrectAnswer && (
                            <XCircle className="h-5 w-5 text-destructive" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mb-6">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-semibold mb-2">Votre réponse:</p>
                    <p className="text-sm">
                      {userAnswer || "Aucune réponse fournie"}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                  Explication
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {currentQ.explanation}
                </p>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentQuestion(Math.max(0, currentQuestion - 1))
                }
                disabled={currentQuestion === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>
              <Button
                onClick={() =>
                  setCurrentQuestion(
                    Math.min(quizData.length - 1, currentQuestion + 1),
                  )
                }
                disabled={currentQuestion === quizData.length - 1}
              >
                Suivant
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Taking Interface
  const currentQ = quizData[currentQuestion];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const result = await showQuitConfirmation(
                    "Êtes-vous sûr de vouloir quitter ? Votre progression sera sauvegardée.",
                  );
                  if (result.isConfirmed) {
                    router.push(returnUrl);
                  }
                }}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Quitter
              </Button>
              <div className="hidden md:block">
                <p className="text-sm font-semibold">
                  Quiz: Stratégie de Contenu
                </p>
                <p className="text-xs text-muted-foreground">
                  Question {currentQuestion + 1} sur {quizData.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span
                  className={`font-mono font-semibold ${timeRemaining < 300 ? "text-destructive" : ""}`}
                >
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Content */}
        <div className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Progress */}
            <div className="mb-8">
              <Progress
                value={((currentQuestion + 1) / quizData.length) * 100}
                className="h-2"
              />
            </div>

            {/* Question */}
            <div className="bg-card border rounded-xl p-8 mb-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    Question {currentQuestion + 1}
                  </Badge>
                  {currentQ.type === "multiple" && (
                    <Badge variant="outline">
                      Plusieurs réponses possibles
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleFlag(currentQ.id)}
                  className={
                    flaggedQuestions.includes(currentQ.id)
                      ? "text-destructive"
                      : ""
                  }
                >
                  <Flag className="h-4 w-4" />
                </Button>
              </div>

              <h2 className="text-2xl font-bold mb-8">{currentQ.question}</h2>

              {/* Answer Options */}
              {currentQ.type === "single" && (
                <div className="space-y-3">
                  {currentQ.options?.map((option, index) => (
                    <label
                      key={index}
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                        answers[currentQ.id] === index
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQ.id}`}
                        checked={answers[currentQ.id] === index}
                        onChange={() => handleAnswerChange(currentQ.id, index)}
                        className="h-4 w-4"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQ.type === "multiple" && (
                <div className="space-y-3">
                  {currentQ.options?.map((option, index) => (
                    <label
                      key={index}
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                        answers[currentQ.id]?.includes(index)
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={answers[currentQ.id]?.includes(index) || false}
                        onChange={(e) => {
                          const current = answers[currentQ.id] || [];
                          const newAnswer = e.target.checked
                            ? [...current, index]
                            : current.filter((i: number) => i !== index);
                          handleAnswerChange(currentQ.id, newAnswer);
                        }}
                        className="h-4 w-4 rounded"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQ.type === "text" && (
                <div>
                  <textarea
                    value={answers[currentQ.id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(currentQ.id, e.target.value)
                    }
                    placeholder="Saisissez votre réponse ici..."
                    className="w-full min-h-[200px] p-4 border-2 rounded-lg resize-none"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Minimum {currentQ.minWords || 10} mots • Actuel:{" "}
                    {
                      (answers[currentQ.id] || "").split(" ").filter(Boolean)
                        .length
                    }{" "}
                    mots
                  </p>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentQuestion(Math.max(0, currentQuestion - 1))
                }
                disabled={currentQuestion === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>

              {currentQuestion === quizData.length - 1 ? (
                <Button onClick={handleSubmitQuiz}>Terminer le quiz</Button>
              ) : (
                <Button onClick={() => setCurrentQuestion(currentQuestion + 1)}>
                  Suivant
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Question Overview */}
        <div className="hidden lg:block w-80 border-l p-6">
          <h3 className="font-semibold mb-4">Aperçu des questions</h3>
          <div className="grid grid-cols-5 gap-2">
            {quizData.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(index)}
                className={`aspect-square flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                  index === currentQuestion
                    ? "bg-primary text-primary-foreground"
                    : answers[q.id] !== undefined
                      ? "bg-green-500/10 text-green-500 border border-green-500/20"
                      : flaggedQuestions.includes(q.id)
                        ? "bg-destructive/10 text-destructive border border-destructive/20"
                        : "bg-muted hover:bg-muted/70"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded bg-primary" />
              <span className="text-muted-foreground">Question actuelle</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded bg-green-500/10 border border-green-500/20" />
              <span className="text-muted-foreground">Répondue</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded bg-destructive/10 border border-destructive/20" />
              <span className="text-muted-foreground">Marquée</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Répondues</span>
                <span className="font-semibold">
                  {Object.keys(answers).length} / {quizData.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Marquées</span>
                <span className="font-semibold">{flaggedQuestions.length}</span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full mt-6 bg-transparent"
            onClick={handleSubmitQuiz}
            disabled={Object.keys(answers).length < quizData.length}
          >
            Soumettre le quiz
          </Button>
        </div>
      </div>
    </div>
  );
}
