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
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { CoursesApi } from "@/infrastructure/api/courses-api";
import { QuizService } from "@/infrastructure/api/quizService";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import logger from "@/shared/helpers/logger";
import type { Quiz, QuizQuestion, ResponseQuiz } from "@/types/quiz";

interface QuizPageParams {
  params: Promise<{ courseId: string; moduleId: string }>;
}

type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";

type Notice = {
  type: "success" | "error";
  message: string;
};

type OptionDraft = {
  itemId: string;
  responseId?: string;
  text: string;
  optionAudio: Blob | null;
  existingAudioUrl?: string | null;
  isTouched: boolean;
};

type QuestionDraft = {
  id?: string;
  question: string;
  questionType: QuestionType;
  options: OptionDraft[];
  correctAnswer: string;
  correctOptionIndex: number;
  points: number;
  questionAudio: Blob | null;
  questionAudioUrl?: string | null;
};

type ResponsePayloadDraft = {
  responseId?: string;
  itemId: string;
  response: string;
  isCorrect: boolean;
  orderIndex: number;
  optionAudio: Blob | null;
  isTouched: boolean;
};

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: "Choix multiple",
  TRUE_FALSE: "Vrai / Faux",
  SHORT_ANSWER: "Réponse courte",
};

const TRUE_FALSE_OPTIONS = ["Vrai", "Faux"];

const normalizeText = (value: string) => value.trim().toLowerCase();
const sortResponsesByOrder = (responses?: ResponseQuiz[]) =>
  Array.isArray(responses)
    ? [...responses].sort((left, right) => {
        const leftOrder = Number(left?.orderIndex ?? 0);
        const rightOrder = Number(right?.orderIndex ?? 0);
        return leftOrder - rightOrder;
      })
    : [];

const createItemId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const findOptionIndex = (options: OptionDraft[], answer: string) => {
  const normalized = normalizeText(answer || "");
  if (!normalized) return -1;
  return options.findIndex(
    (option) => normalizeText(option?.text || "") === normalized,
  );
};

const ensureMultipleChoiceDraft = (draft: QuestionDraft): QuestionDraft => {
  if (draft.questionType === "MULTIPLE_CHOICE") return draft;

  const options =
    draft.options.length >= 2
      ? draft.options
      : [
          {
            itemId: createItemId(),
            text: "",
            optionAudio: null,
            existingAudioUrl: null,
            isTouched: true,
          },
          {
            itemId: createItemId(),
            text: "",
            optionAudio: null,
            existingAudioUrl: null,
            isTouched: true,
          },
        ];
  const matchedIndex = findOptionIndex(options, draft.correctAnswer);
  const correctIndex = matchedIndex >= 0 ? matchedIndex : 0;

  return {
    ...draft,
    questionType: "MULTIPLE_CHOICE",
    options,
    correctOptionIndex: correctIndex,
    correctAnswer: options[correctIndex]?.text ?? "",
  };
};

const createQuestionDraft = (question?: QuizQuestion): QuestionDraft => {
  const questionType = (question?.questionType ??
    "MULTIPLE_CHOICE") as QuestionType;
  const baseOptions = Array.isArray(question?.options)
    ? question?.options
    : [];
  const responsesByOrder = Array.isArray(question?.responses)
    ? [...question.responses].sort((a, b) => {
        const left = Number(a?.orderIndex ?? 0);
        const right = Number(b?.orderIndex ?? 0);
        return left - right;
      })
    : [];
  const toOptionDraft = (value: string, index: number): OptionDraft => ({
    itemId: String(
      responsesByOrder[index]?.itemId ?? responsesByOrder[index]?.id ?? createItemId(),
    ),
    responseId: responsesByOrder[index]?.id
      ? String(responsesByOrder[index]?.id)
      : undefined,
    text: value,
    optionAudio: null,
    existingAudioUrl:
      typeof responsesByOrder[index]?.audioUrl === "string"
        ? responsesByOrder[index]?.audioUrl
        : null,
    isTouched: false,
  });

  if (questionType === "TRUE_FALSE") {
    return {
      id: question?.id,
      question: question?.question ?? "",
      questionType,
      options: TRUE_FALSE_OPTIONS.map((option, index) =>
        toOptionDraft(option, index),
      ),
      correctAnswer: question?.correctAnswer ?? TRUE_FALSE_OPTIONS[0],
      correctOptionIndex: 0,
      points: question?.points ?? 1,
      questionAudio: null,
      questionAudioUrl: question?.questionAudioUrl ?? null,
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
      questionAudio: null,
      questionAudioUrl: question?.questionAudioUrl ?? null,
    };
  }

  const options = baseOptions.length >= 2 ? baseOptions : ["", ""];
  const optionDrafts = options.map((value, index) => toOptionDraft(value, index));
  const foundIndex = question
    ? findOptionIndex(optionDrafts, question.correctAnswer ?? "")
    : -1;
  const correctIndex = Math.max(0, foundIndex);
  const resolvedAnswer =
    optionDrafts[correctIndex]?.text ?? question?.correctAnswer ?? "";

  return {
    id: question?.id,
    question: question?.question ?? "",
    questionType: "MULTIPLE_CHOICE",
    options: optionDrafts,
    correctAnswer: resolvedAnswer,
    correctOptionIndex: correctIndex,
    points: question?.points ?? 1,
    questionAudio: null,
    questionAudioUrl: question?.questionAudioUrl ?? null,
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
    setQuestionDraft(ensureMultipleChoiceDraft(createQuestionDraft()));
    setQuestionMode("create");
    setQuestionError(null);
    setEditingPendingIndex(null);
  };

  const startEditQuestion = (question: QuizQuestion) => {
    setQuestionDraft(ensureMultipleChoiceDraft(createQuestionDraft(question)));
    setQuestionMode("edit");
    setQuestionError(null);
    setEditingPendingIndex(null);
  };

  const startEditPendingQuestion = (index: number) => {
    const draft = pendingQuestions[index];
    if (!draft) return;
    setQuestionDraft(ensureMultipleChoiceDraft(draft));
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

  const updateOptionValue = (index: number, value: string) => {
    setQuestionDraft((prev) => {
      if (!prev) return prev;
      const nextOptions = [...prev.options];
      const current = nextOptions[index] ?? {
        itemId: createItemId(),
        text: "",
        optionAudio: null,
        existingAudioUrl: null,
        isTouched: true,
      };
      nextOptions[index] = {
        ...current,
        text: value,
        isTouched: current.isTouched || current.text !== value,
      };
      if (prev.questionType === "MULTIPLE_CHOICE" && prev.correctOptionIndex === index) {
        return { ...prev, options: nextOptions, correctAnswer: value };
      }
      return { ...prev, options: nextOptions };
    });
  };

  const addOption = () => {
    setQuestionDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        options: [
          ...prev.options,
          {
            itemId: createItemId(),
            text: "",
            optionAudio: null,
            existingAudioUrl: null,
            isTouched: true,
          },
        ],
      };
    });
  };

  const removeOption = (index: number) => {
    setQuestionDraft((prev) => {
      if (!prev) return prev;
      const filtered = prev.options.filter((_, idx) => idx !== index);
      let nextOptions = filtered;
      if (nextOptions.length === 0) {
        nextOptions = [
          {
            itemId: createItemId(),
            text: "",
            optionAudio: null,
            existingAudioUrl: null,
            isTouched: true,
          },
          {
            itemId: createItemId(),
            text: "",
            optionAudio: null,
            existingAudioUrl: null,
            isTouched: true,
          },
        ];
      } else if (nextOptions.length === 1) {
        nextOptions = [
          ...nextOptions,
          {
            itemId: createItemId(),
            text: "",
            optionAudio: null,
            existingAudioUrl: null,
            isTouched: true,
          },
        ];
      }
      // Les positions changent: marquer le reste comme modifié pour mettre à jour orderIndex/isCorrect côté API.
      nextOptions = nextOptions.map((option) => ({ ...option, isTouched: true }));
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
        correctAnswer: nextOptions[nextCorrect]?.text ?? "",
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
        const createdQuiz = await QuizService.createQuiz({
          moduleId,
          title: quizForm.title.trim(),
          description: quizForm.description.trim() || undefined,
          passingScore: Number(quizForm.passingScore),
          questions: pendingQuestions.map(buildQuestionPayload),
        });
        const quizWithQuestions =
          createdQuiz?.questions?.length > 0
            ? createdQuiz
            : await QuizService.getQuizByModule(moduleId);

        if (quizWithQuestions?.questions?.length) {
          for (let index = 0; index < pendingQuestions.length; index += 1) {
            const draft = pendingQuestions[index];
            const question = quizWithQuestions.questions[index];
            if (!draft || !question?.id) continue;
            const hasQuestionAudioUpdate = Boolean(draft.questionAudio);
            const hasResponseAudioUpdate = draft.options.some((option) =>
              Boolean(option.optionAudio),
            );
            if (!hasQuestionAudioUpdate && !hasResponseAudioUpdate) continue;
            await syncQuestionResponses(
              quizWithQuestions.id,
              question.id,
              draft,
              question,
              {
                includeQuestionAudio: hasQuestionAudioUpdate,
                includeResponses: hasResponseAudioUpdate,
              },
            );
          }
        }
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
      const cleaned = draft.options.map((opt) => opt.text.trim());
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

  const getOptionTexts = (draft: QuestionDraft): string[] => {
    if (draft.questionType === "TRUE_FALSE") {
      return TRUE_FALSE_OPTIONS;
    }
    if (draft.questionType === "MULTIPLE_CHOICE") {
      return draft.options.map((opt) => opt.text.trim());
    }
    return [];
  };

  const resolveCorrectIndex = (
    draft: QuestionDraft,
    optionTexts: string[],
  ): number => {
    if (optionTexts.length === 0) return -1;

    if (draft.questionType === "TRUE_FALSE") {
      const normalized = normalizeText(draft.correctAnswer);
      const idx = optionTexts.findIndex(
        (option) => normalizeText(option) === normalized,
      );
      return idx >= 0 ? idx : 0;
    }

    if (draft.questionType === "MULTIPLE_CHOICE") {
      const matchedIndex = findOptionIndex(draft.options, draft.correctAnswer);
      return matchedIndex >= 0
        ? matchedIndex
        : Math.min(
            Math.max(draft.correctOptionIndex, 0),
            Math.max(optionTexts.length - 1, 0),
          );
    }

    return -1;
  };

  const buildQuestionPayload = (draft: QuestionDraft) => {
    const optionTexts = getOptionTexts(draft);
    const correctIndex = resolveCorrectIndex(draft, optionTexts);
    const correctAnswerValue =
      draft.questionType === "SHORT_ANSWER"
        ? draft.correctAnswer.trim()
        : optionTexts[correctIndex] || optionTexts[0] || "";

    const base = {
      question: draft.question.trim(),
      questionType: draft.questionType,
      points: Number(draft.points) || 1,
    };

    if (draft.questionType === "TRUE_FALSE") {
      return {
        ...base,
        options: optionTexts,
        correctAnswer: correctAnswerValue,
      };
    }

    if (draft.questionType === "MULTIPLE_CHOICE") {
      return {
        ...base,
        options: optionTexts,
        correctAnswer: correctAnswerValue,
      };
    }

    return {
      ...base,
      correctAnswer: correctAnswerValue,
    };
  };

  const hasQuestionFieldChanges = (
    draft: QuestionDraft,
    existingQuestion?: QuizQuestion,
  ) => {
    if (!existingQuestion) {
      return true;
    }

    const nextQuestionText = draft.question.trim();
    const currentQuestionText = String(existingQuestion.question ?? "").trim();
    if (nextQuestionText !== currentQuestionText) {
      return true;
    }

    const nextPoints = Number(draft.points) || 1;
    const currentPoints = Number(existingQuestion.points ?? 1);
    if (nextPoints !== currentPoints) {
      return true;
    }

    if (draft.questionType !== existingQuestion.questionType) {
      return true;
    }

    const nextOptionTexts = getOptionTexts(draft);
    const currentOptionTexts = Array.isArray(existingQuestion.options)
      ? existingQuestion.options.map((option) => String(option).trim())
      : [];
    if (
      nextOptionTexts.length !== currentOptionTexts.length ||
      nextOptionTexts.some(
        (option, index) => option !== String(currentOptionTexts[index] ?? "").trim(),
      )
    ) {
      return true;
    }

    const nextCorrectIndex = resolveCorrectIndex(draft, nextOptionTexts);
    const nextCorrectAnswer =
      draft.questionType === "SHORT_ANSWER"
        ? draft.correctAnswer.trim()
        : nextOptionTexts[nextCorrectIndex] || nextOptionTexts[0] || "";
    const currentCorrectAnswer = String(existingQuestion.correctAnswer ?? "").trim();
    if (nextCorrectAnswer !== currentCorrectAnswer) {
      return true;
    }

    return false;
  };

  const buildQuestionFormData = (draft: QuestionDraft) => {
    const payload = buildQuestionPayload(draft) as Record<string, any>;
    const optionTexts = getOptionTexts(draft);
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === "options" && Array.isArray(value)) {
        formData.append("options", JSON.stringify(value));
        return;
      }
      formData.append(key, String(value));
    });

    if (optionTexts.length > 0 && !formData.has("options")) {
      formData.append("options", JSON.stringify(optionTexts));
    }

    if (draft.questionAudio) {
      formData.append("questionAudio", draft.questionAudio, "question-audio.webm");
    }

    return formData;
  };

  const buildResponsePayloads = (
    draft: QuestionDraft,
    existingQuestion?: QuizQuestion,
  ): ResponsePayloadDraft[] => {
    const optionTexts = getOptionTexts(draft);
    const correctIndex = resolveCorrectIndex(draft, optionTexts);
    const existingResponsesByOrder = sortResponsesByOrder(existingQuestion?.responses);
    const existingResponsesByItemId = new Map(
      existingResponsesByOrder
        .filter((response) => Boolean(response?.itemId))
        .map((response) => [String(response.itemId), response]),
    );

    return optionTexts.map((response, index) => {
      const draftOption = draft.options[index];
      const existingResponse =
        (draftOption?.itemId
          ? existingResponsesByItemId.get(String(draftOption.itemId))
          : undefined) ?? existingResponsesByOrder[index];
      const resolvedResponseId =
        (existingResponse?.id ? String(existingResponse.id) : undefined) ||
        draftOption?.responseId?.trim();
      const resolvedItemId =
        draftOption?.itemId ||
        existingResponse?.itemId ||
        (existingResponse?.id ? String(existingResponse.id) : createItemId());
      const hasResponseId = Boolean(resolvedResponseId?.trim());
      const isTouched = !hasResponseId ? true : Boolean(draftOption?.isTouched);

      return {
        responseId: resolvedResponseId,
        itemId: resolvedItemId,
        optionAudio: draftOption?.optionAudio ?? null,
        response,
        isCorrect: index === correctIndex,
        orderIndex: index,
        isTouched,
      };
    });
  };

  const reconcileResponseIdsWithLatest = (
    responses: ResponsePayloadDraft[],
    latestQuestion?: QuizQuestion,
  ): ResponsePayloadDraft[] => {
    const latestResponsesByOrder = sortResponsesByOrder(latestQuestion?.responses);
    if (latestResponsesByOrder.length === 0) {
      return responses;
    }

    const latestIds = new Set(
      latestResponsesByOrder
        .map((response) => String(response?.id ?? "").trim())
        .filter(Boolean),
    );
    const latestByItemId = new Map(
      latestResponsesByOrder
        .filter((response) => Boolean(response?.itemId))
        .map((response) => [String(response.itemId), response]),
    );
    const latestByOrder = new Map<number, ResponseQuiz>();
    latestResponsesByOrder.forEach((response, index) => {
      latestByOrder.set(Number(response?.orderIndex ?? index), response);
    });

    return responses.map((response) => {
      const currentResponseId = String(response.responseId ?? "").trim();
      if (currentResponseId && latestIds.has(currentResponseId)) {
        return response;
      }

      const byItemId = latestByItemId.get(String(response.itemId));
      if (byItemId?.id) {
        return { ...response, responseId: String(byItemId.id) };
      }

      const byOrder = latestByOrder.get(response.orderIndex);
      const sameTextByOrder =
        Boolean(byOrder) &&
        normalizeText(byOrder?.response ?? "") === normalizeText(response.response);
      if (sameTextByOrder && byOrder?.id) {
        return { ...response, responseId: String(byOrder.id) };
      }

      return { ...response, responseId: undefined };
    });
  };

  const buildResponsesFormData = (responses: ResponsePayloadDraft[]) => {
    const formData = new FormData();
    const serializedResponses = responses.reduce<Record<string, any>[]>(
      (acc, current) => {
        const base = {
          itemId: current.itemId,
          response: current.response,
          isCorrect: current.isCorrect,
          orderIndex: current.orderIndex,
        };

        const responseId = current.responseId?.trim();
        acc.push(responseId ? { responseId, ...base } : base);
        return acc;
      },
      [],
    );

    if (serializedResponses.length === 0) {
      return formData;
    }

    formData.append("responses", JSON.stringify(serializedResponses));

    const serializedItemIds = new Set(
      serializedResponses.map((item) => String(item.itemId)),
    );

    responses.forEach((response) => {
      if (!response.optionAudio) return;
      if (!serializedItemIds.has(response.itemId)) return;
      formData.append(
        `responsesAudios[${response.itemId}]`,
        response.optionAudio,
        `${response.itemId}.webm`,
      );
    });

    return formData;
  };

  const syncQuestionResponses = async (
    quizId: string,
    questionId: string,
    draft: QuestionDraft,
    existingQuestion?: QuizQuestion,
    options?: {
      includeQuestionFields?: boolean;
      includeQuestionAudio?: boolean;
      includeResponses?: boolean;
    },
  ) => {
    const includeQuestionFields = Boolean(options?.includeQuestionFields);
    const includeQuestionAudio = Boolean(options?.includeQuestionAudio);
    const includeResponses = options?.includeResponses !== false;

    const mergedFormData = new FormData();

    if (includeQuestionFields) {
      const questionPayload = buildQuestionPayload(draft) as Record<string, any>;
      Object.entries(questionPayload).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (key === "options" && Array.isArray(value)) {
          mergedFormData.append("options", JSON.stringify(value));
          return;
        }
        mergedFormData.append(key, String(value));
      });
    }

    if (includeQuestionAudio && draft.questionAudio) {
      mergedFormData.append("questionAudio", draft.questionAudio, "question-audio.webm");
    }

    if (!includeResponses) {
      if (Array.from(mergedFormData.keys()).length > 0) {
        await QuizService.updateQuestion(quizId, questionId, mergedFormData);
      }
      return;
    }

    const responses = buildResponsePayloads(draft, existingQuestion);
    let latestQuestion = existingQuestion;
    if (responses.length > 0) {
      const freshQuiz = await QuizService.getQuizById(quizId);
      latestQuestion = freshQuiz.questions.find(
        (question) => question.id === questionId,
      );
    }

    const responsesWithValidatedIds = reconcileResponseIdsWithLatest(
      responses,
      latestQuestion,
    );
    const latestIds = new Set(
      sortResponsesByOrder(latestQuestion?.responses)
        .map((response) => String(response?.id ?? "").trim())
        .filter(Boolean),
    );

    const responsesToSend = responsesWithValidatedIds.filter((response) => {
      const responseId = String(response.responseId ?? "").trim();
      if (responseId && latestIds.size > 0 && !latestIds.has(responseId)) {
        return false;
      }
      return response.isTouched || !responseId;
    });

    if (responsesToSend.length > 0) {
      const responsesFormData = buildResponsesFormData(responsesToSend);
      const serializedResponses = responsesFormData.get("responses");
      if (typeof serializedResponses === "string" && serializedResponses.length > 0) {
        mergedFormData.set("responses", serializedResponses);
      }

      responsesToSend.forEach((response) => {
        if (!response.optionAudio) return;
        mergedFormData.append(
          `responsesAudios[${response.itemId}]`,
          response.optionAudio,
          `${response.itemId}.webm`,
        );
      });
    }

    if (Array.from(mergedFormData.keys()).length === 0) {
      return;
    }

    await QuizService.updateQuestion(quizId, questionId, mergedFormData);
  };

  const hasResponseChanges = (
    draft: QuestionDraft,
    existingQuestion?: QuizQuestion,
  ) =>
    buildResponsePayloads(draft, existingQuestion).some((response) => {
      const responseId = String(response.responseId ?? "").trim();
      return response.isTouched || !responseId;
    });

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
      if (quiz) {
        const questionFormData = buildQuestionFormData(questionDraft);
        if (questionMode === "edit" && questionDraft.id) {
          const existingQuestion = quiz.questions.find(
            (question) => question.id === questionDraft.id,
          );
          const mustUpdateQuestionFields = hasQuestionFieldChanges(
            questionDraft,
            existingQuestion,
          );
          const mustUpdateQuestionAudio = Boolean(questionDraft.questionAudio);
          const mustUpdateResponses = hasResponseChanges(
            questionDraft,
            existingQuestion,
          );
          if (mustUpdateQuestionFields || mustUpdateQuestionAudio || mustUpdateResponses) {
            await syncQuestionResponses(
              quiz.id,
              questionDraft.id,
              questionDraft,
              existingQuestion,
              {
                includeQuestionFields: mustUpdateQuestionFields,
                includeQuestionAudio: mustUpdateQuestionAudio,
                includeResponses: mustUpdateResponses,
              },
            );
          }
          setNotice({ type: "success", message: "Question mise à jour." });
        } else {
          const createdQuestion = await QuizService.addQuestion(
            quiz.id,
            questionFormData,
          );
          if (createdQuestion?.id) {
            const hasResponseAudioUpdate = questionDraft.options.some((option) =>
              Boolean(option.optionAudio),
            );
            if (hasResponseAudioUpdate) {
              await syncQuestionResponses(
                quiz.id,
                createdQuestion.id,
                questionDraft,
                createdQuestion,
                {
                  includeResponses: true,
                },
              );
            }
          }
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
      <div className="min-h-screen flex items-center justify-center bg-[#090B13]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
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
    <div className="min-h-screen bg-[#090B13] text-white">
      <div className="max-w-5xl mx-auto p-6 sm:p-8 space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => courseId && router.push(`/admin/edit-course/${courseId}`)}
              className="rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Retour au cours
            </Button>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/55">Gestion du Quiz</p>
            <h1 className="text-2xl font-bold text-white">
              {moduleTitle || "Module"}
            </h1>
          </div>
        </div>

        {notice && (
          <Alert
            variant={notice.type === "error" ? "destructive" : "default"}
            className="border-white/10 bg-[#0F172A]"
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
          <Alert variant="destructive" className="border-red-400/35 bg-red-500/10 text-red-100">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur de chargement</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <span className="ml-3 text-white/65">Chargement du quiz...</span>
          </div>
        ) : (
          <>
            <Card className="border border-white/10 bg-[#0F172A]/95 shadow-sm">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-xl text-white">Quiz du module</CardTitle>
                  <p className="text-sm text-white/55">
                    Gérez le titre, la description et le score de passage.
                  </p>
                </div>
                {quiz && !isEditingQuiz && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingQuiz(true)}
                      className="border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuizDeleteConfirm(true)}
                      className="border-red-400/35 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {quizDeleteConfirm && quiz && (
                  <div className="rounded-lg border border-red-400/35 bg-red-500/10 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-red-200">
                        Confirmer la suppression du quiz "{quiz.title}" ?
                      </p>
                      <p className="text-sm text-red-300/90">
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
                      <span className="text-sm text-white/55">Titre</span>
                      <span className="text-lg font-semibold text-white">
                        {quiz.title}
                      </span>
                    </div>
                    {quiz.description && (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-white/55">Description</span>
                        <span className="text-white/80">{quiz.description}</span>
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-white/55">Score de passage</span>
                      <span className="text-white/80">{quiz.passingScore}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1">
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
                        className="border-white/10 bg-[#0B1220] text-white placeholder:text-white/40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1">
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
                        className="border-white/10 bg-[#0B1220] text-white placeholder:text-white/40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1">
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
                        className="border-white/10 bg-[#0B1220] text-white placeholder:text-white/40"
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

            <Card className="border border-white/10 bg-[#0F172A]/95 shadow-sm">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-white">Questions</CardTitle>
                  <p className="text-sm text-white/55">
                    {questionCount} question{questionCount > 1 ? "s" : ""}
                  </p>
                </div>
                <Button
                  onClick={startCreateQuestion}
                  disabled={isSavingQuiz}
                  className="bg-blue-600 text-white hover:bg-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une question
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {!quiz && (
                  <Alert className="border-white/10 bg-[#111827]">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Quiz requis</AlertTitle>
                    <AlertDescription>
                      Ajoutez vos questions puis créez le quiz.
                    </AlertDescription>
                  </Alert>
                )}

                {questionDraft && (
                  <div className="rounded-lg border border-white/10 bg-[#0B1220] p-5 space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-lg font-semibold text-white">
                        {questionMode === "edit"
                          ? "Modifier la question"
                          : "Nouvelle question"}
                      </h3>
                      <Button variant="ghost" onClick={resetQuestionEditor}>
                        Annuler
                      </Button>
                    </div>

                    {questionError && (
                      <Alert
                        variant="destructive"
                        className="border-red-400/35 bg-red-500/10 text-red-100"
                      >
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erreur</AlertTitle>
                        <AlertDescription>{questionError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">
                          Question
                        </label>
                        <div className="flex items-center gap-3">
                          <Input
                            className="flex-1 border-white/10 bg-[#0B1220] text-white placeholder:text-white/40"
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
                          <div className="shrink-0">
                            <VoiceRecorder
                              existingAudio={questionDraft.questionAudio}
                              existingAudioUrl={questionDraft.questionAudioUrl}
                              onAudioReady={(blob) =>
                                setQuestionDraft((prev) =>
                                  prev
                                    ? { ...prev, questionAudio: blob }
                                    : prev,
                                )
                              }
                              onRemoveExistingAudio={() =>
                                setQuestionDraft((prev) =>
                                  prev
                                    ? { ...prev, questionAudioUrl: null, questionAudio: null }
                                    : prev,
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                          Type de question
                        </label>
                        <div className="rounded-md border border-white/10 bg-[#0B1220] px-3 py-2 text-sm text-white/80">
                          {QUESTION_TYPE_LABELS.MULTIPLE_CHOICE}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">
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
                          className="border-white/10 bg-[#0B1220] text-white placeholder:text-white/40"
                        />
                      </div>

                      {questionDraft.questionType === "MULTIPLE_CHOICE" && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-white/70">
                              Réponses
                            </label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={addOption}
                              className="text-white/80 hover:text-white hover:bg-white/10"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Ajouter une réponse
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {questionDraft.options.map((option, index) => (
                              <div
                                key={option.itemId || `option-${index}`}
                                className="flex flex-col gap-2 sm:flex-row sm:items-center"
                              >
                                <div className="flex flex-1 min-w-0 items-center gap-2">
                                  <Input
                                    className="flex-1 border-white/10 bg-[#0B1220] text-white placeholder:text-white/40"
                                    value={option.text}
                                    onChange={(event) =>
                                      updateOptionValue(index, event.target.value)
                                    }
                                    placeholder={`Option ${index + 1}`}
                                  />
                                  <div className="shrink-0">
                                    <VoiceRecorder
                                      existingAudio={option.optionAudio}
                                      existingAudioUrl={option.existingAudioUrl}
                                      onAudioReady={(blob) =>
                                        setQuestionDraft((prev) => {
                                          if (!prev) return prev;
                                          const nextOptions = [...prev.options];
                                          const current =
                                            nextOptions[index] ?? {
                                              itemId: createItemId(),
                                              text: "",
                                              optionAudio: null,
                                              existingAudioUrl: null,
                                              isTouched: true,
                                            };
                                          nextOptions[index] = {
                                            ...current,
                                            optionAudio: blob,
                                            isTouched: true,
                                          };
                                          return { ...prev, options: nextOptions };
                                        })
                                      }
                                      onRemoveExistingAudio={() =>
                                        setQuestionDraft((prev) => {
                                          if (!prev) return prev;
                                          const nextOptions = [...prev.options];
                                          const current = nextOptions[index];
                                          if (!current) return prev;
                                          nextOptions[index] = {
                                            ...current,
                                            existingAudioUrl: null,
                                            optionAudio: null,
                                            isTouched: true,
                                          };
                                          return { ...prev, options: nextOptions };
                                        })
                                      }
                                    />
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeOption(index)}
                                    className="shrink-0 min-w-[110px] whitespace-nowrap border-white/10 bg-transparent text-white hover:bg-white/10"
                                  >
                                    Supprimer
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2">
                            <label className="block text-sm font-medium text-white/70 mb-1">
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
                                  const resolvedIndex = nextIndex >= 0 ? nextIndex : 0;
                                  const previousCorrectIndex = prev.correctOptionIndex;
                                  const nextOptions = prev.options.map((current, idx) =>
                                    idx === previousCorrectIndex || idx === resolvedIndex
                                      ? { ...current, isTouched: true }
                                      : current,
                                  );
                                  return {
                                    ...prev,
                                    options: nextOptions,
                                    correctAnswer: selected,
                                    correctOptionIndex: resolvedIndex,
                                  };
                                })
                              }
                              className="w-full p-2 rounded-md border border-white/10 bg-[#0B1220] text-white"
                            >
                              <option value="">
                                Sélectionnez la réponse correcte
                              </option>
                              {questionDraft.options.map((option, index) => (
                                <option
                                  key={`correct-${index}`}
                                  value={option.text}
                                >
                                  {option.text || `Option ${index + 1}`}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {questionDraft.questionType === "TRUE_FALSE" && (
                        <div>
                          <label className="block text-sm font-medium text-white/70 mb-2">
                            Réponse correcte
                          </label>
                          <select
                            value={questionDraft.correctAnswer}
                            onChange={(event) =>
                              setQuestionDraft((prev) => {
                                if (!prev) return prev;
                                const selected = event.target.value;
                                const currentIndex = findOptionIndex(
                                  prev.options,
                                  prev.correctAnswer,
                                );
                                const nextIndex = findOptionIndex(
                                  prev.options,
                                  selected,
                                );
                                const nextOptions = prev.options.map((current, idx) =>
                                  idx === currentIndex || idx === nextIndex
                                    ? { ...current, isTouched: true }
                                    : current,
                                );

                                return {
                                  ...prev,
                                  options: nextOptions,
                                  correctAnswer: selected,
                                };
                              })
                            }
                            className="w-full p-2 rounded-md border border-white/10 bg-[#0B1220] text-white"
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
                          <label className="block text-sm font-medium text-white/70 mb-1">
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
                            className="border-white/10 bg-[#0B1220] text-white placeholder:text-white/40"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={resetQuestionEditor}
                          className="border-white/10 bg-transparent text-white hover:bg-white/10"
                        >
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
                  <div className="rounded-lg border border-dashed border-white/20 bg-[#111827]/75 p-8 text-center">
                    <p className="text-white/65">
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
                            className="w-full rounded-lg border border-white/10 bg-[#0B1220] p-4"
                          >
                            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-white">
                                  Q{index + 1}: {question.question}
                                </h4>
                                <p className="text-sm text-white/60">
                                  Type: {QUESTION_TYPE_LABELS[question.questionType]} •
                                  Points: {question.points}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startEditQuestion(question)}
                                  className="border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors"
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
                                  className="border-red-400/35 bg-red-500/10 text-red-200 hover:bg-red-500/20 shrink-0 min-w-[110px] whitespace-nowrap"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Supprimer
                                </Button>
                              </div>
                            </div>

                            {question.id && questionDeleteId === question.id && (
                              <div className="mt-4 rounded-md border border-red-400/35 bg-red-500/10 p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-red-200">
                                  Confirmer la suppression de cette question ?
                                </p>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setQuestionDeleteId(null)}
                                    disabled={questionDeleteLoading === question.id}
                                    className="border-white/10 bg-transparent text-white hover:bg-white/10"
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
                            className="w-full rounded-lg border border-white/10 bg-[#0B1220] p-4"
                          >
                            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-white">
                                  Q{index + 1}: {question.question}
                                </h4>
                                <p className="text-sm text-white/60">
                                  Type: {QUESTION_TYPE_LABELS[question.questionType]} •
                                  Points: {question.points}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startEditPendingQuestion(index)}
                                  className="border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors"
                                >
                                  <Pencil className="h-4 w-4 mr-1" />
                                  Modifier
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeletePendingQuestion(index)}
                                  className="border-red-400/35 bg-red-500/10 text-red-200 hover:bg-red-500/20 shrink-0 min-w-[110px] whitespace-nowrap"
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
