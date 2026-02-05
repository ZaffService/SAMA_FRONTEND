export interface Lesson {
  id?: string;
  tempId?: string;
  title: string;
  content: string;
  orderIndex?: number; // Optionnel - calculé automatiquement par le backend
  duration: number;
  videoUrl?: string;
  videoFile?: File;
  quiz?: Quiz;
}

export interface Quiz {
  id?: string;
  title: string;
  description?: string;
  questions: Question[];
  passingScore?: number;
}

export interface Question {
  id?: string;
  question: string;
  questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
  options: string[];
  correctAnswer: string;
  points?: number;
}

export interface Module {
  id?: string;
  tempId?: string;
  title: string;
  description?: string;
  orderIndex: number;
  lessons: Lesson[];
  quizzes?: Quiz[];
}
