export interface ResponseQuiz {
  id: string;
  itemId?: string;
  response: string;
  isCorrect: boolean;
  orderIndex: number;
  audioUrl?: string | null;
}

export interface QuizQuestion {
  id: string;
  question: string;
  questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
  options?: string[];
  correctAnswer: string;
  points: number;
  questionAudioUrl?: string | null;
  responses?: ResponseQuiz[];
}

export interface Quiz {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  passingScore: number;
  questions: QuizQuestion[];
  questionsCount?: number;
}
