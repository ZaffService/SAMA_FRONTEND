"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import { QuizService } from "@/infrastructure/api/quizService";
import { getCertificationState } from "@/shared/helpers/course-certification";
import logger from "@/shared/helpers/logger";
import type { Quiz } from "@/types/quiz";

type QuestionType = "TRUE_FALSE" | "MULTIPLE_CHOICE" | "SINGLE_CHOICE";

type Notice = {
  type: "success" | "error";
  message: string;
};

type QuestionDraft = {
  id: string;
  question: string;
  questionType: QuestionType;
  options: string[];
  correctAnswer: string;
  points: number;
};

const TRUE_FALSE_OPTIONS = ["Vrai", "Faux"];

const createQuestionId = () =>
  `q-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const createEmptyQuestion = (): QuestionDraft => ({
  id: createQuestionId(),
  question: "",
  questionType: "MULTIPLE_CHOICE",
  options: ["", ""],
  correctAnswer: "",
  points: 1,
});

const normalizeOption = (value: string) => value.trim();

const getValidOptions = (options: string[]) =>
  options.map(normalizeOption).filter(Boolean);

const resolveCorrectAnswer = (
  options: string[],
  currentAnswer: string,
) => {
  const normalizedOptions = getValidOptions(options);
  const normalizedAnswer = normalizeOption(currentAnswer);
  if (normalizedAnswer && normalizedOptions.includes(normalizedAnswer)) {
    return normalizedAnswer;
  }
  return normalizedOptions[0] || "";
};

interface CertificationEditorProps {
  courseId: string;
  onBack: () => void;
}

export function CertificationEditor({
  courseId,
  onBack,
}: CertificationEditorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [isCertifying, setIsCertifying] = useState(false);
  const [certificationQuizId, setCertificationQuizId] = useState<string | null>(
    null,
  );
  const [quizInfo, setQuizInfo] = useState<Quiz | null>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [targetModule, setTargetModule] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [quizForm, setQuizForm] = useState({
    title: "",
    description: "",
    passingScore: 70,
  });

  const [questions, setQuestions] = useState<QuestionDraft[]>([]);

  const loadCourse = async () => {
    setIsLoading(true);
    setLoadError(null);
    setNotice(null);

    try {
      const data = await CoursesApi.getCourseForEdit(courseId);
      const course = data.course as any;
      const { isCertifying: certifying, certificationQuizId } =
        getCertificationState(course);
      const quizId = certificationQuizId ?? null;
      const modulesList = Array.isArray(data?.modules)
        ? data.modules
        : Array.isArray(course?.modules)
          ? course.modules
          : [];
      setModules(modulesList);

      if (modulesList.length > 0) {
        const sorted = [...modulesList].sort((a, b) => {
          const aOrder = Number(a?.orderIndex ?? a?.order ?? 0);
          const bOrder = Number(b?.orderIndex ?? b?.order ?? 0);
          return aOrder - bOrder;
        });
        setTargetModule(sorted[sorted.length - 1] ?? null);
      } else {
        setTargetModule(null);
      }

      setCourseTitle(course?.title || "Cours");
      setIsCertifying(certifying);
      setCertificationQuizId(quizId);

      if (certifying && quizId) {
        const quiz = await QuizService.getQuizById(String(quizId));
        setQuizInfo(quiz);
        setShowForm(false);
      } else {
        setQuizInfo(null);
        setShowForm(certifying);
      }
    } catch (error) {
      logger.error("❌ [CertificationEditor] Erreur chargement:", error);
      setLoadError(
        error instanceof Error
          ? error.message
          : "Impossible de charger les informations du cours",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!courseId) return;
    loadCourse();
  }, [courseId]);

  useEffect(() => {
    if (showForm && questions.length === 0) {
      setQuestions([createEmptyQuestion()]);
    }
  }, [showForm, questions.length]);

  const addQuestion = () => {
    setQuestions((prev) => [...prev, createEmptyQuestion()]);
  };

  const updateQuestion = (
    id: string,
    updater: (question: QuestionDraft) => QuestionDraft,
  ) => {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === id ? updater(question) : question,
      ),
    );
  };

  const handleQuestionTypeChange = (id: string, value: QuestionType) => {
    updateQuestion(id, (question) => {
      if (value === "TRUE_FALSE") {
        return {
          ...question,
          questionType: value,
          options: TRUE_FALSE_OPTIONS,
          correctAnswer: TRUE_FALSE_OPTIONS[0],
        };
      }

      const baseOptions =
        question.questionType === "TRUE_FALSE"
          ? ["", ""]
          : question.options.length >= 2
            ? question.options
            : ["", ""];
      const correctedAnswer = resolveCorrectAnswer(
        baseOptions,
        question.correctAnswer,
      );
      return {
        ...question,
        questionType: value,
        options: baseOptions,
        correctAnswer: correctedAnswer,
      };
    });
  };

  const handleOptionChange = (id: string, index: number, value: string) => {
    updateQuestion(id, (question) => {
      const nextOptions = question.options.map((option, i) =>
        i === index ? value : option,
      );
      const correctedAnswer = resolveCorrectAnswer(
        nextOptions,
        question.correctAnswer,
      );
      return {
        ...question,
        options: nextOptions,
        correctAnswer: correctedAnswer,
      };
    });
  };

  const addOption = (id: string) => {
    updateQuestion(id, (question) => ({
      ...question,
      options: [...question.options, ""],
    }));
  };

  const removeOption = (id: string, index: number) => {
    updateQuestion(id, (question) => {
      if (question.options.length <= 2) {
        return question;
      }
      const nextOptions = question.options.filter((_, i) => i !== index);
      const correctedAnswer = resolveCorrectAnswer(
        nextOptions,
        question.correctAnswer,
      );
      return {
        ...question,
        options: nextOptions,
        correctAnswer: correctedAnswer,
      };
    });
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((question) => question.id !== id));
  };

  const moveQuestion = (fromIndex: number, toIndex: number) => {
    setQuestions((prev) => {
      if (toIndex < 0 || toIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  };

  const validateForm = (): string | null => {
    if (modules.length === 0) {
      return "Ajoutez au moins un module avant de créer le quiz de certification";
    }
    if (!quizForm.title.trim()) {
      return "Le titre du quiz est requis";
    }
    if (quizForm.passingScore < 0 || quizForm.passingScore > 100) {
      return "Le score de passage doit être compris entre 0 et 100";
    }
    if (questions.length === 0) {
      return "Ajoutez au moins une question";
    }

    for (let i = 0; i < questions.length; i += 1) {
      const question = questions[i];
      if (!question.question.trim()) {
        return `La question ${i + 1} est requise`;
      }

      if (question.questionType !== "TRUE_FALSE") {
        const validOptions = getValidOptions(question.options);
        if (validOptions.length < 2) {
          return `La question ${i + 1} doit avoir au moins 2 options`;
        }
        if (!question.correctAnswer.trim()) {
          return `La bonne réponse est requise pour la question ${i + 1}`;
        }
        if (!validOptions.includes(normalizeOption(question.correctAnswer))) {
          return `La bonne réponse doit correspondre à une option pour la question ${i + 1}`;
        }
      } else if (!TRUE_FALSE_OPTIONS.includes(question.correctAnswer)) {
        return `La bonne réponse est requise pour la question ${i + 1}`;
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    setNotice(null);
    const validationError = validateForm();
    if (validationError) {
      setNotice({ type: "error", message: validationError });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: quizForm.title.trim(),
        description: quizForm.description?.trim() || undefined,
        passingScore: quizForm.passingScore,
        questions: questions.map((question) => ({
          question: question.question.trim(),
          questionType: question.questionType,
          options:
            question.questionType === "TRUE_FALSE"
              ? TRUE_FALSE_OPTIONS
              : getValidOptions(question.options),
          correctAnswer: normalizeOption(question.correctAnswer),
          points: Number(question.points) || 1,
        })),
      };

      await CoursesApi.createCertificationQuiz(courseId, payload);

      setNotice({
        type: "success",
        message: "Quiz de certification créé avec succès.",
      });

      await loadCourse();
      setShowForm(false);
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de la création du quiz",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const quizSummary = useMemo(() => {
    if (!quizInfo) return null;
    const questionsCount =
      quizInfo.questionsCount ?? quizInfo.questions?.length ?? 0;
    return {
      title: quizInfo.title,
      passingScore: quizInfo.passingScore ?? 70,
      questionsCount,
    };
  }, [quizInfo]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-8">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <span className="ml-3 text-gray-600">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-8 space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={onBack} className="mr-4">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Retour
          </Button>
        </div>

        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-medium">
            <BadgeCheck className="h-4 w-4" />
            CERTIFICATION
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">
            Certification du cours
          </h1>
          <p className="text-gray-600 mt-2">
            Configurez le quiz de certification pour{" "}
            <span className="font-medium text-gray-900">{courseTitle}</span>.
          </p>
        </div>

        {loadError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        )}

        {!isCertifying && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Certification non activée</AlertTitle>
            <AlertDescription>
              Ce cours n&apos;est pas certifiant. Activez la certification lors
              de la création du cours pour accéder à cette section.
            </AlertDescription>
          </Alert>
        )}

        {isCertifying && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>État du quiz de certification</span>
                {quizSummary ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">
                    Configuré
                  </Badge>
                ) : (
                  <Badge variant="secondary">Non configuré</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {quizSummary ? (
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-sm text-gray-500">Titre</p>
                    <p className="font-semibold text-gray-900">
                      {quizSummary.title}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Score de passage</p>
                    <p className="font-semibold text-gray-900">
                      {quizSummary.passingScore}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Questions</p>
                    <p className="font-semibold text-gray-900">
                      {quizSummary.questionsCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Module cible</p>
                    <p className="font-semibold text-gray-900">
                      {targetModule?.title || "Dernier module"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-gray-700">
                      Aucun quiz de certification n&apos;est encore configuré
                      pour ce cours.
                    </p>
                    <p className="text-sm text-gray-500">
                      Créez le quiz pour permettre aux étudiants d&apos;obtenir
                      leur certificat.
                    </p>
                  </div>
                  {!showForm && (
                    <Button
                      onClick={() => setShowForm(true)}
                      disabled={modules.length === 0}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Créer le quiz
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {isCertifying && modules.length === 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Modules requis</AlertTitle>
            <AlertDescription>
              Ajoutez au moins un module au cours avant de créer un quiz de
              certification.
            </AlertDescription>
          </Alert>
        )}

        {notice && (
          <Alert
            variant={notice.type === "error" ? "destructive" : "default"}
            className={
              notice.type === "success"
                ? "border-emerald-200 text-emerald-800 bg-emerald-50"
                : undefined
            }
          >
            {notice.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {notice.type === "success" ? "Succès" : "Erreur"}
            </AlertTitle>
            <AlertDescription>{notice.message}</AlertDescription>
          </Alert>
        )}

        {isCertifying && showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Créer le quiz de certification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre du quiz *
                  </label>
                  <Input
                    value={quizForm.title}
                    onChange={(e) =>
                      setQuizForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Quiz de certification"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Score de passage (%) *
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={quizForm.passingScore}
                    onChange={(e) =>
                      setQuizForm((prev) => ({
                        ...prev,
                        passingScore: Number(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Textarea
                  value={quizForm.description}
                  onChange={(e) =>
                    setQuizForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Décrivez l'objectif du quiz..."
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Questions *
                  </h3>
                  <Button variant="outline" onClick={addQuestion}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une question
                  </Button>
                </div>

                {questions.map((question, index) => {
                  const isTrueFalse = question.questionType === "TRUE_FALSE";
                  const optionsList = isTrueFalse
                    ? TRUE_FALSE_OPTIONS
                    : question.options;
                  const selectableOptions = getValidOptions(optionsList);

                  return (
                    <Card key={question.id} className="border border-gray-200">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base">
                          Question {index + 1}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveQuestion(index, index - 1)}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveQuestion(index, index + 1)}
                            disabled={index === questions.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeQuestion(question.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Énoncé *
                          </label>
                          <Textarea
                            value={question.question}
                            onChange={(e) =>
                              updateQuestion(question.id, (current) => ({
                                ...current,
                                question: e.target.value,
                              }))
                            }
                            rows={3}
                            placeholder="Écrivez la question..."
                          />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Type de question *
                            </label>
                            <Select
                              value={question.questionType}
                              onValueChange={(value) =>
                                handleQuestionTypeChange(
                                  question.id,
                                  value as QuestionType,
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="TRUE_FALSE">
                                  Vrai / Faux
                                </SelectItem>
                                <SelectItem value="MULTIPLE_CHOICE">
                                  Choix multiple
                                </SelectItem>
                                <SelectItem value="SINGLE_CHOICE">
                                  Choix unique
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Points
                            </label>
                            <Input
                              type="number"
                              min={0}
                              value={question.points}
                              onChange={(e) =>
                                updateQuestion(question.id, (current) => ({
                                  ...current,
                                  points: Number(e.target.value) || 0,
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Options *
                          </label>
                          {isTrueFalse ? (
                            <div className="flex gap-2">
                              {TRUE_FALSE_OPTIONS.map((option) => (
                                <Badge key={option} variant="secondary">
                                  {option}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {optionsList.map((option, optionIndex) => (
                                <div
                                  key={`${question.id}-option-${optionIndex}`}
                                  className="flex items-center gap-2"
                                >
                                  <Input
                                    value={option}
                                    onChange={(e) =>
                                      handleOptionChange(
                                        question.id,
                                        optionIndex,
                                        e.target.value,
                                      )
                                    }
                                    placeholder={`Option ${optionIndex + 1}`}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      removeOption(question.id, optionIndex)
                                    }
                                    disabled={optionsList.length <= 2}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addOption(question.id)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Ajouter une option
                              </Button>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bonne réponse *
                          </label>
                          <Select
                            value={question.correctAnswer}
                            onValueChange={(value) =>
                              updateQuestion(question.id, (current) => ({
                                ...current,
                                correctAnswer: value,
                              }))
                            }
                            disabled={selectableOptions.length === 0}
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  selectableOptions.length === 0
                                    ? "Ajoutez des options"
                                    : "Sélectionnez la bonne réponse"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {selectableOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-between">
                <Button
                  variant="ghost"
                  onClick={onBack}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || modules.length === 0}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Enregistrement...
                    </>
                  ) : (
                    "Enregistrer"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
