// Types for course details page

export interface Lesson {
  id: string;
  title: string;
  content?: string;
  hasVideo: boolean;
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
  quiz?: Quiz[];
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

// Signed video URL types
export interface SignedVideoUrl {
  url: string;
  expiresAt: string;
  lessonId: string;
}

// Video URL cache
export interface VideoUrlCache {
  [lessonId: string]: {
    url: string;
    expiresAt: Date;
  };
}

// Course details data structure
export interface CourseDetailsData {
  course: {
    id: string;
    title: string;
    description: string;
    categoryId: string;
    level: string;
    price: number;
    thumbnailUrl?: string;
    studentsCount?: number;
    enrollmentCount?: number;
    duration?: number;
    attachment?: string | null;  // ← URL du fichier PDF attaché (Cloudinary)
    isFree?: boolean;
    isEnrolled?: boolean;  // ← Statut d'inscription de l'utilisateur
    isCertifying?: boolean;
    quizId?: string | null;
    quizStatus?: string | null;
  };
  modules: Array<{
    id: string;
    title: string;
    description: string;
    orderIndex: number;
    lessons: Array<{
      id: string;
      title: string;
      content: string;
      hasVideo?: boolean;
      videoUrl?: string;  // ← URL directe de la vidéo (YouTube, Bunny CDN)
      videoAssetId?: string;  // ← Asset ID Bunny pour construire l'URL
      videoProvider?: string;  // ← 'BUNNY' ou autre
      orderIndex: number;
      duration: number;
      status: string;
    }>;
    quiz?: Quiz[];
  }>;
  moduleCount: number;
}
