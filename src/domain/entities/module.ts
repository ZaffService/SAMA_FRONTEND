export interface Lesson {
  id?: string;
  tempId?: string;
  title: string;
  content: string;
  orderIndex: number;
  duration: number;
  videoUrl?: string;
  videoFile?: File;
  quiz?: Quiz;
}

export interface Quiz {
  id?: string;
  title: string;
  questions: Question[];
  passingScore?: number;
}

export interface Question {
  id?: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface Module {
  id?: string;
  tempId?: string;
  title: string;
  description?: string;
  orderIndex: number;
  lessons: Lesson[];
  quiz?: Quiz;
}
