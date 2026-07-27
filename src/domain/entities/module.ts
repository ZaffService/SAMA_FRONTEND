import type { LessonVideoSourceMode } from "@/lib/youtube";

export interface Lesson {
  id?: string;
  tempId?: string;
  title: string;
  content: string;
  orderIndex?: number; // Optionnel - calculé automatiquement par le backend
  duration: number;
  /** URL YouTube (ou externe) — exclusif avec videoFile */
  videoUrl?: string;
  videoFile?: File;
  /** Mode UI : fichier (Bunny) ou lien YouTube */
  videoSource?: LessonVideoSourceMode;
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
