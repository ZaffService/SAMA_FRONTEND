import Cookies from "js-cookie";
import logger from "@/shared/helpers/logger";
import { buildApiUrl } from "./baseConfig";
import type { Quiz, QuizQuestion } from "@/types/quiz";

type QuizPayload = {
  moduleId: string;
  title: string;
  description?: string;
  passingScore?: number;
  questions?: QuestionPayload[];
};

type QuestionPayload = {
  question: string;
  questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
  options?: string[];
  correctAnswer: string;
  points?: number;
  [key: string]: any;
};

const getStoredAccessToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    Cookies.get("access_token") ||
    null
  );
};

const buildAuthHeaders = (): Record<string, string> => {
  const token = getStoredAccessToken();
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

const buildRequestError = async (response: Response): Promise<Error & { status?: number }> => {
  let message = `Erreur ${response.status}`;

  try {
    const errorData = await response.json();
    message =
      errorData?.error?.message ||
      errorData?.message ||
      errorData?.error ||
      message;
  } catch (parseError) {
    logger.error("❌ [QuizService] Impossible de parser l'erreur", parseError);
  }

  const error = new Error(message) as Error & { status?: number };
  error.status = response.status;
  return error;
};

const normalizeQuestionType = (value: string | undefined) => {
  const upper = (value || "").toUpperCase();
  if (upper === "TRUE_FALSE" || upper === "TRUE-FALSE") return "TRUE_FALSE";
  if (upper === "SHORT_ANSWER" || upper === "SHORT-ANSWER") return "SHORT_ANSWER";
  return "MULTIPLE_CHOICE";
};

const normalizeOptionLabel = (option: any): string => {
  if (typeof option === "string") return option;
  if (!option || typeof option !== "object") return "";
  return String(
    option.option ??
      option.label ??
      option.text ??
      option.response ??
      option.value ??
      "",
  ).trim();
};

const normalizeQuestion = (question: any): QuizQuestion => {
  const options = Array.isArray(question?.options)
    ? question.options
        .map((opt: any) => normalizeOptionLabel(opt))
        .filter((opt: string) => opt.length > 0)
    : undefined;

  return {
    id: String(question?.id ?? ""),
    question: String(question?.question ?? ""),
    questionType: normalizeQuestionType(
      question?.questionType ?? question?.type ?? question?.question_type,
    ),
    options,
    correctAnswer: String(
      question?.correctAnswer ?? question?.correct_answer ?? "",
    ),
    points: Number(question?.points ?? 1),
    questionAudioUrl:
      typeof question?.audioUrl === "string"
        ? question.audioUrl
        : typeof question?.questionAudioUrl === "string"
          ? question.questionAudioUrl
          : null,
    responses: Array.isArray(question?.responses)
      ? question.responses.map((response: any, index: number) => ({
          id: String(response?.id ?? response?.responseId ?? ""),
          itemId:
            typeof response?.itemId === "string" ? response.itemId : undefined,
          response: String(
            response?.response ??
              response?.label ??
              response?.option ??
              options?.[index] ??
              "",
          ),
          isCorrect: Boolean(response?.isCorrect),
          orderIndex:
            typeof response?.orderIndex === "number"
              ? response.orderIndex
              : index,
          audioUrl:
            typeof response?.audioUrl === "string" ? response.audioUrl : null,
        }))
      : undefined,
  };
};

const normalizeQuiz = (payload: any): Quiz => {
  const quiz = payload?.quiz ?? payload?.data?.quiz ?? payload?.data ?? payload;
  const rawQuestions = payload?.questions ?? quiz?.questions ?? [];
  const questions = Array.isArray(rawQuestions)
    ? rawQuestions.map(normalizeQuestion)
    : [];

  const questionsCount = Number(
    quiz?.questionsCount ??
      quiz?.questions_count ??
      payload?.questionsCount ??
      payload?.questions_count ??
      questions.length,
  );

  return {
    id: String(quiz?.id ?? ""),
    moduleId: String(quiz?.moduleId ?? quiz?.module_id ?? ""),
    title: String(quiz?.title ?? ""),
    description: quiz?.description ?? undefined,
    passingScore: Number(quiz?.passingScore ?? quiz?.passing_score ?? 70),
    questions,
    questionsCount: Number.isNaN(questionsCount) ? questions.length : questionsCount,
  };
};

export class QuizService {
  static async getQuizByModule(moduleId: string): Promise<Quiz | null> {
    logger.log(`📡 [QuizService] Chargement du quiz pour module ${moduleId}`);

    const response = await fetch(buildApiUrl(`/quiz/module/${moduleId}`), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...buildAuthHeaders(),
      },
      credentials: "include",
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      try {
        const errorData = await response.json();
        const code = errorData?.error?.code ?? errorData?.code;
        if (code === "QUIZ_NOT_FOUND") {
          return null;
        }
      } catch (parseError) {
        logger.error("❌ [QuizService] Impossible de parser l'erreur", parseError);
      }
      throw await buildRequestError(response);
    }

    const data = await response.json();
    if (data?.success === false) {
      const code = data?.error?.code ?? data?.code;
      if (code === "QUIZ_NOT_FOUND") {
        return null;
      }
    }
    return normalizeQuiz(data);
  }

  static async getQuizById(quizId: string): Promise<Quiz> {
    const response = await fetch(buildApiUrl(`/quiz/${quizId}`), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...buildAuthHeaders(),
      },
      cache: "no-store",
      credentials: "include",
    });

    if (!response.ok) {
      throw await buildRequestError(response);
    }

    const data = await response.json();
    return normalizeQuiz(data);
  }

  static async createQuiz(payload: QuizPayload | FormData): Promise<Quiz> {
    const isFormData = payload instanceof FormData;
    const response = await fetch(buildApiUrl("/quiz"), {
      method: "POST",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...buildAuthHeaders(),
      },
      credentials: "include",
      body: isFormData
        ? payload
        : JSON.stringify({
            ...payload,
            passingScore: payload.passingScore ?? 70,
            questions: payload.questions ?? [],
          }),
    });

    if (!response.ok) {
      throw await buildRequestError(response);
    }

    const data = await response.json();
    return normalizeQuiz(data);
  }

  static async updateQuiz(
    quizId: string,
    payload: Pick<QuizPayload, "title" | "description" | "passingScore">,
  ): Promise<Quiz> {
    const response = await fetch(buildApiUrl(`/quiz/${quizId}`), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...buildAuthHeaders(),
      },
      credentials: "include",
      body: JSON.stringify({
        ...payload,
        passingScore: payload.passingScore ?? 70,
      }),
    });

    if (!response.ok) {
      throw await buildRequestError(response);
    }

    const data = await response.json();
    return normalizeQuiz(data);
  }

  static async deleteQuiz(quizId: string): Promise<void> {
    const response = await fetch(buildApiUrl(`/quiz/${quizId}`), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...buildAuthHeaders(),
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw await buildRequestError(response);
    }
  }

  static async addQuestion(
    quizId: string,
    payload: QuestionPayload | FormData,
  ): Promise<QuizQuestion> {
    const isFormData = payload instanceof FormData;
    const response = await fetch(buildApiUrl(`/quiz/${quizId}/questions`), {
      method: "POST",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...buildAuthHeaders(),
      },
      credentials: "include",
      body: isFormData
        ? payload
        : JSON.stringify({
            ...(payload as QuestionPayload),
            points: (payload as QuestionPayload).points ?? 1,
          }),
    });

    if (!response.ok) {
      throw await buildRequestError(response);
    }

    const data = await response.json();
    const question = data?.question ?? data?.data?.question ?? data?.data ?? data;
    return normalizeQuestion(question);
  }

  static async updateQuestion(
    quizId: string,
    questionId: string,
    payload: QuestionPayload | FormData,
  ): Promise<QuizQuestion> {
    const isFormData = payload instanceof FormData;
    const response = await fetch(
      buildApiUrl(`/quiz/${quizId}/questions/${questionId}`),
      {
        method: "PUT",
        headers: {
          ...(isFormData ? {} : { "Content-Type": "application/json" }),
          ...buildAuthHeaders(),
        },
        credentials: "include",
        body: isFormData
          ? payload
          : JSON.stringify({
              ...(payload as QuestionPayload),
              points: (payload as QuestionPayload).points ?? 1,
            }),
      },
    );

    if (!response.ok) {
      throw await buildRequestError(response);
    }

    const data = await response.json();
    const question = data?.question ?? data?.data?.question ?? data?.data ?? data;
    return normalizeQuestion(question);
  }

  static async deleteQuestion(
    quizId: string,
    questionId: string,
  ): Promise<void> {
    const response = await fetch(
      buildApiUrl(`/quiz/${quizId}/questions/${questionId}`),
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(),
        },
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw await buildRequestError(response);
    }
  }
}
