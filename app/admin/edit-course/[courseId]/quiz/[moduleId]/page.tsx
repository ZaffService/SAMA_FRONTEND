"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import { QuizService } from "@/infrastructure/api/quizService";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import logger from "@/shared/helpers/logger";
import type { Quiz, QuizQuestion } from "@/types/quiz";

interface QuizPageParams {
  params: Promise<{ courseId: string; moduleId: string }>;
}

type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";

type Notice = {
  type: "success" | "error";
  message: string;
};

type QuestionDraft = {
  id?: string;
  question: string;
  questionType: QuestionType;
  options: string[];
  correctAnswer: string;
  correctOptionIndex: number;
  points: number;
};

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: "Choix multiple",
  TRUE_FALSE: "Vrai / Faux",
  SHORT_ANSWER: "Réponse courte",
};

const TRUE_FALSE_OPTIONS = ["Vrai", "Faux"];

const normalizeText = (value: string) => value.trim().toLowerCase();

const findOptionIndex = (options: string[], answer: string) => {
  const normalized = normalizeText(answer || "");
  if (!normalized) return -1;
  return options.findIndex(
    (option) => normalizeText(option || "") === normalized,
  );
};

const createQuestionDraft = (question?: QuizQuestion): QuestionDraft => {
  const questionType = (question?.questionType ??
    "MULTIPLE_CHOICE") as QuestionType;
  const baseOptions = Array.isArray(question?.options)
    ? question?.options
    : [];

  if (questionType === "TRUE_FALSE") {
    return {
      id: question?.id,
      question: question?.question ?? "",
      questionType,
      options: TRUE_FALSE_OPTIONS,
      correctAnswer: question?.correctAnswer ?? TRUE_FALSE_OPTIONS[0],
      correctOptionIndex: 0,
      points: question?.points ?? 1,
    };
  }

  if (questionType === "SHORT_ANSWER") {
    return {
      id: question?.id,
      question: question?.question ?? "",
      questionType,
      options: [],
      correctAnswer: question?.correctAnswer ?? "",
      correctOptionIndex: 0,
      points: question?.points ?? 1,
    };
  }

  const options = baseOptions.length >= 2 ? baseOptions : ["", ""];
  const foundIndex = question
    ? findOptionIndex(options, question.correctAnswer ?? "")
    : -1;
  const correctIndex = Math.max(0, foundIndex);
  const resolvedAnswer =
    options[correctIndex] ?? question?.correctAnswer ?? "";

  return {
    id: question?.id,
    question: question?.question ?? "",
    questionType: "MULTIPLE_CHOICE",
    options,
    correctAnswer: resolvedAnswer,
    correctOptionIndex: correctIndex,
    points: question?.points ?? 1,
  };
};

export default function QuizManagementPage({ params }: QuizPageParams) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useLocalAuth();

  const [courseId, setCourseId] = useState<string | null>(null);
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [moduleTitle, setModuleTitle] = useState<string>("");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const [quizForm, setQuizForm] = useState({
    title: "",
    description: "",
    passingScore: 70,
  });
  const [isEditingQuiz, setIsEditingQuiz] = useState(false);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);
  const [isDeletingQuiz, setIsDeletingQuiz] = useState(false);
  const [quizDeleteConfirm, setQuizDeleteConfirm] = useState(false);

  const [questionDraft, setQuestionDraft] = useState<QuestionDraft | null>(null);
  const [questionMode, setQuestionMode] = useState<"create" | "edit" | null>(null);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [questionDeleteId, setQuestionDeleteId] = useState<string | null>(null);
  const [questionDeleteLoading, setQuestionDeleteLoading] = useState<string | null>(null);
  const [pendingQuestions, setPendingQuestions] = useState<QuestionDraft[]>([]);
  const [editingPendingIndex, setEditingPendingIndex] = useState<number | null>(
    null,
  );

  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params;
      setCourseId(resolved.courseId);
      setModuleId(resolved.moduleId);
    };

    resolveParams();
  }, [params]);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user?.role !== "ADMIN" && user?.role !== "INSTRUCTOR") {
      if (user?.role === "INSTRUCTOR") {
        router.push("/instructor-dashboard");
      } else if (user?.role === "STUDENT") {
        router.push("/student-dashboard");
      } else {
        router.push("/");
      }
    }
  }, [authLoading, isAuthenticated, router, user]);

  useEffect(() => {
    if (!courseId || !moduleId) return;

    const loadData = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [courseDetails, quizData] = await Promise.all([
          CoursesApi.getCourseDetails(courseId),
          QuizService.getQuizByModule(moduleId),
        ]);

        const moduleInfo = courseDetails.modules?.find(
          (module: any) => module.id === moduleId,
        );
        setModuleTitle(moduleInfo?.title || "Module");
        setQuiz(quizData);

        const instructorId =
          (courseDetails.course as any)?.instructorId ||
          (courseDetails.course as any)?.instructor_id ||
          (courseDetails.course as any)?.instructor?.id;

        if (
          user?.role === "INSTRUCTOR" &&
          instructorId &&
          String(instructorId) !== String(user.id)
        ) {
          setAccessDenied(true);
        }
      } catch (error: any) {
        logger.error("Erreur chargement quiz admin:", error);
        const { getErrorMapping } = await import(
          "@/shared/helpers/error-mapping"
        );
        const mapped = getErrorMapping(error);
        setLoadError(mapped.message || "Erreur lors du chargement");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [courseId, moduleId, user]);

  useEffect(() => {
    if (!accessDenied) return;
    router.push("/instructor-dashboard");
  }, [accessDenied, router]);

  useEffect(() => {
    if (!quiz) {
      setQuizForm({ title: "", description: "", passingScore: 70 });
      return;
    }

    setQuizForm({
      title: quiz.title || "",
      description: quiz.description || "",
      passingScore: quiz.passingScore ?? 70,
    });
  }, [quiz]);

  const questionCount = useMemo(
    () =>
      quiz?.questions
        ? quiz.questions.length
        : pendingQuestions.length,
    [pendingQuestions.length, quiz?.questions],
  );

  const refreshQuiz = async () => {
    if (!moduleId) return;
    const quizData = await QuizService.getQuizByModule(moduleId);
    setQuiz(quizData);
  };

  const resetQuestionEditor = () => {
    setQuestionDraft(null);
    setQuestionMode(null);
    setQuestionError(null);
    setEditingPendingIndex(null);
  };

  const startCreateQuestion = () => {
    setQuestionDraft(createQuestionDraft());
    setQuestionMode("create");
    setQuestionError(null);
    setEditingPendingIndex(null);
  };

  const startEditQuestion = (question: QuizQuestion) => {
    setQuestionDraft(createQuestionDraft(question));
    setQuestionMode("edit");
    setQuestionError(null);
    setEditingPendingIndex(null);
  };

  const startEditPendingQuestion = (index: number) => {
    const draft = pendingQuestions[index];
    if (!draft) return;
    setQuestionDraft(draft);
    setQuestionMode("edit");
    setQuestionError(null);
    setEditingPendingIndex(index);
  };

  const handleDeletePendingQuestion = (index: number) => {
    setPendingQuestions((prev) => prev.filter((_, idx) => idx !== index));
    if (editingPendingIndex !== null) {
      resetQuestionEditor();
    }
  };

  const handleQuestionTypeChange = (value: QuestionType) => {
    setQuestionDraft((prev) => {
      if (!prev) return prev;

      if (value === "TRUE_FALSE") {
        return {
          ...prev,
          questionType: value,
          options: TRUE_FALSE_OPTIONS,
          correctAnswer: TRUE_FALSE_OPTIONS[0],
          correctOptionIndex: 0,
        };
      }

      if (value === "SHORT_ANSWER") {
        return {
          ...prev,
          questionType: value,
          options: [],
          correctAnswer: "",
          correctOptionIndex: 0,
        };
      }

      const options = prev.options.length >= 2 ? prev.options : ["", ""];
      const foundIndex = findOptionIndex(options, prev.correctAnswer);
      const nextIndex =
        foundIndex >= 0
          ? foundIndex
          : Math.min(prev.correctOptionIndex, options.length - 1);
      const resolvedAnswer = options[Math.max(0, nextIndex)] ?? "";

      return {
        ...prev,
        questionType: value,
        options,
        correctOptionIndex: Math.max(0, nextIndex),
        correctAnswer: resolvedAnswer,
      };
    });
    setQuestionError(null);
  };

  const updateOptionValue = (index: number, value: string) => {
    setQuestionDraft((prev) => {
      if (!prev) return prev;
      const nextOptions = [...prev.options];
      nextOptions[index] = value;
      if (prev.questionType === "MULTIPLE_CHOICE" && prev.correctOptionIndex === index) {
        return { ...prev, options: nextOptions, correctAnswer: value };
      }
      return { ...prev, options: nextOptions };
    });
  };

  const addOption = () => {
    setQuestionDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, options: [...prev.options, ""] };
    });
  };

  const removeOption = (index: number) => {
    setQuestionDraft((prev) => {
      if (!prev) return prev;
      const filtered = prev.options.filter((_, idx) => idx !== index);
      let nextOptions = filtered;
      if (nextOptions.length === 0) {
        nextOptions = ["", ""];
      } else if (nextOptions.length === 1) {
        nextOptions = [...nextOptions, ""];
      }
      let nextCorrect = prev.correctOptionIndex;

      if (index === prev.correctOptionIndex) {
        nextCorrect = 0;
      } else if (index < prev.correctOptionIndex) {
        nextCorrect = Math.max(0, prev.correctOptionIndex - 1);
      }

      if (nextCorrect >= nextOptions.length) {
        nextCorrect = Math.max(0, nextOptions.length - 1);
      }

      return {
        ...prev,
        options: nextOptions,
        correctOptionIndex: nextCorrect,
        correctAnswer: nextOptions[nextCorrect] ?? "",
      };
    });
  };

  const validateQuizForm = () => {
    if (!quizForm.title.trim()) {
      return "Le titre du quiz est requis.";
    }

    const score = Number(quizForm.passingScore);
    if (Number.isNaN(score)) {
      return "Le score de passage est invalide.";
    }

    if (score < 0 || score > 100) {
      return "Le score de passage doit être entre 0 et 100.";
    }

    return null;
  };

  const handleSaveQuiz = async () => {
    if (!moduleId) return;

    setNotice(null);
    const error = validateQuizForm();
    if (error) {
      setNotice({ type: "error", message: error });
      return;
    }

    if (!quiz) {
      if (questionDraft) {
        setNotice({
          type: "error",
          message: "Enregistrez ou annulez la question avant de créer le quiz.",
        });
        return;
      }

      if (pendingQuestions.length === 0) {
        setNotice({
          type: "error",
          message: "Ajoutez au moins une question avant de créer le quiz.",
        });
        return;
      }
    }

    setIsSavingQuiz(true);

    try {
      if (quiz) {
        await QuizService.updateQuiz(quiz.id, {
          title: quizForm.title.trim(),
          description: quizForm.description.trim() || undefined,
          passingScore: Number(quizForm.passingScore),
        });
        setNotice({ type: "success", message: "Quiz mis à jour." });
      } else {
        await QuizService.createQuiz({
          moduleId,
          title: quizForm.title.trim(),
          description: quizForm.description.trim() || undefined,
          passingScore: Number(quizForm.passingScore),
          questions: pendingQuestions.map(buildQuestionPayload),
        });
        setNotice({ type: "success", message: "Quiz créé." });
        setPendingQuestions([]);
        resetQuestionEditor();
      }

      await refreshQuiz();
      setIsEditingQuiz(false);
    } catch (error: any) {
      logger.error("Erreur sauvegarde quiz:", error);
      const { getErrorMapping } = await import(
        "@/shared/helpers/error-mapping"
      );
      const mapped = getErrorMapping(error);
      setNotice({
        type: "error",
        message: mapped.message || "Erreur lors de la sauvegarde du quiz",
      });
    } finally {
      setIsSavingQuiz(false);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!quiz) return;

    setIsDeletingQuiz(true);
    setNotice(null);

    try {
      await QuizService.deleteQuiz(quiz.id);
      setNotice({ type: "success", message: "Quiz supprimé." });
      setQuiz(null);
      setQuizDeleteConfirm(false);
      resetQuestionEditor();
    } catch (error: any) {
      logger.error("Erreur suppression quiz:", error);
      const { getErrorMapping } = await import(
        "@/shared/helpers/error-mapping"
      );
      const mapped = getErrorMapping(error);
      setNotice({
        type: "error",
        message: mapped.message || "Erreur lors de la suppression du quiz",
      });
    } finally {
      setIsDeletingQuiz(false);
    }
  };

  const validateQuestionDraft = (draft: QuestionDraft) => {
    if (!draft.question.trim()) {
      return "La question est obligatoire.";
    }

    if (!draft.points || draft.points <= 0) {
      return "Les points doivent être supérieurs à 0.";
    }

    if (draft.questionType === "MULTIPLE_CHOICE") {
      const cleaned = draft.options.map((opt) => opt.trim());
      if (cleaned.length < 2) {
        return "Ajoutez au moins deux réponses.";
      }
      if (cleaned.some((opt) => !opt)) {
        return "Toutes les réponses doivent être renseignées.";
      }
      if (draft.correctOptionIndex < 0 || draft.correctOptionIndex >= cleaned.length) {
        return "Sélectionnez une réponse correcte.";
      }
    }

    if (draft.questionType === "TRUE_FALSE") {
      if (!TRUE_FALSE_OPTIONS.includes(draft.correctAnswer)) {
        return "Sélectionnez la bonne réponse.";
      }
    }

    if (draft.questionType === "SHORT_ANSWER") {
      if (!draft.correctAnswer.trim()) {
        return "La réponse correcte est requise.";
      }
    }

    return null;
  };

  const buildQuestionPayload = (draft: QuestionDraft) => {
    const base = {
      question: draft.question.trim(),
      questionType: draft.questionType,
      points: Number(draft.points) || 1,
    };

    if (draft.questionType === "MULTIPLE_CHOICE") {
      const options = draft.options.map((opt) => opt.trim());
      const matchedIndex = findOptionIndex(options, draft.correctAnswer);
      const boundedIndex =
        matchedIndex >= 0
          ? matchedIndex
          : Math.min(
              Math.max(draft.correctOptionIndex, 0),
              Math.max(options.length - 1, 0),
            );
      return {
        ...base,
        options,
        correctAnswer: options[boundedIndex] || options[0] || "",
      };
    }

    if (draft.questionType === "TRUE_FALSE") {
      return {
        ...base,
        options: TRUE_FALSE_OPTIONS,
        correctAnswer: draft.correctAnswer,
      };
    }

    return {
      ...base,
      correctAnswer: draft.correctAnswer.trim(),
    };
  };

  const handleSaveQuestion = async () => {
    if (!questionDraft) return;

    setQuestionError(null);
    const error = validateQuestionDraft(questionDraft);
    if (error) {
      setQuestionError(error);
      return;
    }

    setIsSavingQuestion(true);

    try {
      const payload = buildQuestionPayload(questionDraft);

      if (quiz) {
        if (questionMode === "edit" && questionDraft.id) {
          await QuizService.updateQuestion(quiz.id, questionDraft.id, payload);
          setNotice({ type: "success", message: "Question mise à jour." });
        } else {
          await QuizService.addQuestion(quiz.id, payload);
          setNotice({ type: "success", message: "Question ajoutée." });
        }

        await refreshQuiz();
        resetQuestionEditor();
      } else {
        setPendingQuestions((prev) => {
          if (editingPendingIndex !== null) {
            const next = [...prev];
            next[editingPendingIndex] = questionDraft;
            return next;
          }
          return [...prev, questionDraft];
        });
        setNotice({
          type: "success",
          message:
            editingPendingIndex !== null
              ? "Question mise à jour (brouillon)."
              : "Question ajoutée (brouillon).",
        });
        resetQuestionEditor();
      }
    } catch (error: any) {
      logger.error("Erreur sauvegarde question:", error);
      const { getErrorMapping } = await import(
        "@/shared/helpers/error-mapping"
      );
      const mapped = getErrorMapping(error);
      setQuestionError(
        mapped.message || "Erreur lors de la sauvegarde de la question",
      );
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!quiz) return;

    setQuestionDeleteLoading(questionId);
    setNotice(null);

    try {
      await QuizService.deleteQuestion(quiz.id, questionId);
      setNotice({ type: "success", message: "Question supprimée." });
      await refreshQuiz();
      setQuestionDeleteId(null);
    } catch (error: any) {
      logger.error("Erreur suppression question:", error);
      const { getErrorMapping } = await import(
        "@/shared/helpers/error-mapping"
      );
      const mapped = getErrorMapping(error);
      setNotice({
        type: "error",
        message: mapped.message || "Erreur lors de la suppression de la question",
      });
    } finally {
      setQuestionDeleteLoading(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (user?.role !== "ADMIN" && user?.role !== "INSTRUCTOR") {
    return null;
  }

  if (accessDenied) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6 sm:p-8 space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => courseId && router.push(`/admin/edit-course/${courseId}`)}
              className="text-gray-700"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Retour au cours
            </Button>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Gestion du Quiz</p>
            <h1 className="text-2xl font-bold text-gray-900">
              {moduleTitle || "Module"}
            </h1>
          </div>
        </div>

        {notice && (
          <Alert
            variant={notice.type === "error" ? "destructive" : "default"}
            className="bg-white"
          >
            {notice.type === "error" ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <AlertTitle>
              {notice.type === "error" ? "Erreur" : "Succès"}
            </AlertTitle>
            <AlertDescription>{notice.message}</AlertDescription>
          </Alert>
        )}

        {loadError && (
          <Alert variant="destructive" className="bg-white">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur de chargement</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Chargement du quiz...</span>
          </div>
        ) : (
          <>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-xl">Quiz du module</CardTitle>
                  <p className="text-sm text-gray-500">
                    Gérez le titre, la description et le score de passage.
                  </p>
                </div>
                {quiz && !isEditingQuiz && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingQuiz(true)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuizDeleteConfirm(true)}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {quizDeleteConfirm && quiz && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-red-700">
                        Confirmer la suppression du quiz "{quiz.title}" ?
                      </p>
                      <p className="text-sm text-red-600">
                        Cette action supprimera toutes les questions associées.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuizDeleteConfirm(false)}
                        disabled={isDeletingQuiz}
                      >
                        Annuler
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleDeleteQuiz}
                        disabled={isDeletingQuiz}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isDeletingQuiz && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Confirmer
                      </Button>
                    </div>
                  </div>
                )}

                {quiz && !isEditingQuiz ? (
                  <div className="space-y-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-gray-500">Titre</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {quiz.title}
                      </span>
                    </div>
                    {quiz.description && (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-gray-500">Description</span>
                        <span className="text-gray-700">{quiz.description}</span>
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-gray-500">Score de passage</span>
                      <span className="text-gray-700">{quiz.passingScore}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Titre du quiz
                      </label>
                      <Input
                        value={quizForm.title}
                        onChange={(event) =>
                          setQuizForm((prev) => ({
                            ...prev,
                            title: event.target.value,
                          }))
                        }
                        placeholder="Ex: Quiz - Module 1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description (optionnel)
                      </label>
                      <Textarea
                        value={quizForm.description}
                        onChange={(event) =>
                          setQuizForm((prev) => ({
                            ...prev,
                            description: event.target.value,
                          }))
                        }
                        placeholder="Décrivez l'objectif du quiz"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Score de passage (%)
                      </label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={quizForm.passingScore}
                        onChange={(event) =>
                          setQuizForm((prev) => ({
                            ...prev,
                            passingScore: (() => {
                              const digits = event.target.value.replace(/[^\d]/g, "");
                              const next = digits ? parseInt(digits, 10) : 0;
                              return Math.max(0, Math.min(100, next));
                            })(),
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      {quiz && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditingQuiz(false);
                            setQuizForm({
                              title: quiz.title || "",
                              description: quiz.description || "",
                              passingScore: quiz.passingScore ?? 70,
                            });
                          }}
                        >
                          Annuler
                        </Button>
                      )}
                      <Button
                        onClick={handleSaveQuiz}
                        disabled={isSavingQuiz}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isSavingQuiz && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        {quiz ? "Enregistrer" : "Créer le quiz"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Questions</CardTitle>
                  <p className="text-sm text-gray-500">
                    {questionCount} question{questionCount > 1 ? "s" : ""}
                  </p>
                </div>
                <Button
                  onClick={startCreateQuestion}
                  disabled={isSavingQuiz}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une question
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {!quiz && (
                  <Alert className="bg-white">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Quiz requis</AlertTitle>
                    <AlertDescription>
                      Ajoutez vos questions puis créez le quiz.
                    </AlertDescription>
                  </Alert>
                )}

                {questionDraft && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {questionMode === "edit"
                          ? "Modifier la question"
                          : "Nouvelle question"}
                      </h3>
                      <Button variant="ghost" onClick={resetQuestionEditor}>
                        Annuler
                      </Button>
                    </div>

                    {questionError && (
                      <Alert variant="destructive" className="bg-white">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erreur</AlertTitle>
                        <AlertDescription>{questionError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Question
                        </label>
                        <Input
                          value={questionDraft.question}
                          onChange={(event) =>
                            setQuestionDraft((prev) =>
                              prev
                                ? { ...prev, question: event.target.value }
                                : prev,
                            )
                          }
                          placeholder="Entrez la question"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Type de question
                        </label>
                        <RadioGroup
                          value={questionDraft.questionType}
                          onValueChange={(value) =>
                            handleQuestionTypeChange(value as QuestionType)
                          }
                          className="grid grid-cols-1 gap-2 sm:grid-cols-3"
                        >
                          {Object.entries(QUESTION_TYPE_LABELS).map(
                            ([type, label]) => (
                              <label
                                key={type}
                                className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                              >
                                <RadioGroupItem value={type} />
                                <span>{label}</span>
                              </label>
                            ),
                          )}
                        </RadioGroup>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Points
                        </label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={questionDraft.points}
                          onChange={(event) =>
                            setQuestionDraft((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    points:
                                      parseInt(
                                        event.target.value.replace(/[^\d]/g, ""),
                                        10,
                                      ) || 1,
                                  }
                                : prev,
                            )
                          }
                        />
                      </div>

                      {questionDraft.questionType === "MULTIPLE_CHOICE" && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">
                              Réponses
                            </label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={addOption}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Ajouter une réponse
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {questionDraft.options.map((option, index) => (
                              <div
                                key={`option-${index}`}
                                className="flex flex-col gap-2 sm:flex-row sm:items-center"
                              >
                                <div className="flex flex-1 min-w-0 items-center gap-2">
                                  <Input
                                    className="flex-1"
                                    value={option}
                                    onChange={(event) =>
                                      updateOptionValue(index, event.target.value)
                                    }
                                    placeholder={`Option ${index + 1}`}
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeOption(index)}
                                    className="shrink-0 min-w-[110px] whitespace-nowrap"
                                  >
                                    Supprimer
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Réponse correcte
                            </label>
                            <select
                              value={questionDraft.correctAnswer}
                              onChange={(event) =>
                                setQuestionDraft((prev) => {
                                  if (!prev) return prev;
                                  const selected = event.target.value;
                                  const nextIndex = findOptionIndex(
                                    prev.options,
                                    selected,
                                  );
                                  return {
                                    ...prev,
                                    correctAnswer: selected,
                                    correctOptionIndex:
                                      nextIndex >= 0 ? nextIndex : 0,
                                  };
                                })
                              }
                              className="w-full p-2 border rounded"
                            >
                              <option value="">
                                Sélectionnez la réponse correcte
                              </option>
                              {questionDraft.options.map((option, index) => (
                                <option key={`correct-${index}`} value={option}>
                                  {option || `Option ${index + 1}`}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {questionDraft.questionType === "TRUE_FALSE" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Réponse correcte
                          </label>
                          <select
                            value={questionDraft.correctAnswer}
                            onChange={(event) =>
                              setQuestionDraft((prev) =>
                                prev
                                  ? { ...prev, correctAnswer: event.target.value }
                                  : prev,
                              )
                            }
                            className="w-full p-2 border rounded"
                          >
                            <option value="">
                              Sélectionnez la réponse correcte
                            </option>
                            {TRUE_FALSE_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {questionDraft.questionType === "SHORT_ANSWER" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Réponse correcte
                          </label>
                          <Input
                            value={questionDraft.correctAnswer}
                            onChange={(event) =>
                              setQuestionDraft((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      correctAnswer: event.target.value,
                                    }
                                  : prev,
                              )
                            }
                            placeholder="Réponse attendue"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" onClick={resetQuestionEditor}>
                          Annuler
                        </Button>
                        <Button
                          onClick={handleSaveQuestion}
                          disabled={isSavingQuestion}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {isSavingQuestion && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Enregistrer
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {questionCount === 0 && !questionDraft && (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
                    <p className="text-gray-600">
                      Aucune question pour le moment. Ajoutez votre première
                      question pour démarrer.
                    </p>
                  </div>
                )}

                {questionCount > 0 && (
                  <div className="space-y-3">
                    {quiz
                      ? quiz.questions.map((question, index) => (
                          <div
                            key={question.id || `question-${index}`}
                            className="w-full rounded-lg border border-gray-200 bg-white p-4"
                          >
                            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900">
                                  Q{index + 1}: {question.question}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  Type: {QUESTION_TYPE_LABELS[question.questionType]} •
                                  Points: {question.points}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startEditQuestion(question)}
                                >
                                  <Pencil className="h-4 w-4 mr-1" />
                                  Modifier
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    question.id && setQuestionDeleteId(question.id)
                                  }
                                  disabled={!question.id}
                                  className="border-red-200 text-red-600 hover:bg-red-50 shrink-0 min-w-[110px] whitespace-nowrap"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Supprimer
                                </Button>
                              </div>
                            </div>

                            {question.id && questionDeleteId === question.id && (
                              <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-red-700">
                                  Confirmer la suppression de cette question ?
                                </p>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setQuestionDeleteId(null)}
                                    disabled={questionDeleteLoading === question.id}
                                  >
                                    Annuler
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      question.id && handleDeleteQuestion(question.id)
                                    }
                                    disabled={questionDeleteLoading === question.id}
                                    className="bg-red-600 hover:bg-red-700 shrink-0 min-w-[110px] whitespace-nowrap"
                                  >
                                    {questionDeleteLoading === question.id && (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    )}
                                    Supprimer
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      : pendingQuestions.map((question, index) => (
                          <div
                            key={`pending-${index}`}
                            className="w-full rounded-lg border border-gray-200 bg-white p-4"
                          >
                            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900">
                                  Q{index + 1}: {question.question}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  Type: {QUESTION_TYPE_LABELS[question.questionType]} •
                                  Points: {question.points}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startEditPendingQuestion(index)}
                                >
                                  <Pencil className="h-4 w-4 mr-1" />
                                  Modifier
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeletePendingQuestion(index)}
                                  className="border-red-200 text-red-600 hover:bg-red-50 shrink-0 min-w-[110px] whitespace-nowrap"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Supprimer
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
