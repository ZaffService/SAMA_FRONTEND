// Types for course details page

export interface Lesson {
  id: string;
  title: string;
  content?: string;
  videoUrl?: string;
  orderIndex: number;
  duration?: number;
  status: string;
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  orderIndex: number;
  lessons: Lesson[];
}

export interface CourseInstructor {
  firstName: string;
  lastName: string;
  email?: string;
}

export interface CourseCategory {
  name: string;
  description?: string;
}

export interface CourseData {
  id: string;
  title: string;
  description: string;
  content: string;
  thumbnail: string;
  price: number;
  level: string;
  category: string;
  instructor: {
    firstName: string;
    lastName: string;
    name: string;
  };
  modules: Module[];
  moduleCount: number;
}

export interface CourseDetailsResponse {
  course: {
    id: string;
    title: string;
    description: string;
    category?: CourseCategory;
    instructor?: CourseInstructor;
    modules: Module[];
  };
  moduleCount: number;
}

// Quiz types
export interface QuizQuestion {
  id: string;
  question: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  lessonId?: string;
  moduleId?: string;
  passingScore: number;
  questions: QuizQuestion[];
  timeLimit?: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  answers: Record<string, string>;
  score?: number;
  passed: boolean;
  submittedAt?: string;
}

// Lesson progress tracking
export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  quizPassed?: boolean;
  completedAt?: string;
}
