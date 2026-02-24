export interface ResponseQuiz {
  id: string;
  response: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
  options?: string[];
  correctAnswer: string;
  points: number;
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
