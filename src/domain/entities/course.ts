export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  order: number;
  videoUrl?: string;
  duration?: string;
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
}

export interface Instructor {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
}

export interface Category {
  id?: string;
  name: string;
  description?: string;
}

export interface BaseCourse {
  id: string;
  title: string;
  content?: string;
  category: string | Category;
  categoryId?: string;
  thumbnailUrl: string;
  thumbnail?: string;
  price: number;
  duration?: string;
  instructor: Instructor;
  studentsCount?: number;
  rating?: number;
  level: string;
  description?: string;
  tags?: string[];
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  attachment?: string;
  createdAt?: string;
  updatedAt?: string;
  _id?: string;
  _title?: string;
  _thumbnailUrl?: string;
  _price?: number;
  _level?: string;
  _description?: string;
}

export interface Course extends BaseCourse {
  lessons?: Lesson[];
  quizzes?: Quiz[];
  modules?: any[];
  enrollments?: any[];
  payments?: any[];
  certificates?: any[];
}

export interface CourseDetails extends BaseCourse {
  lessons: Lesson[];
  quizzes: Quiz[];
}

export interface CourseFilter {
  categories: string[]; // Now stores category IDs
  levels: string[];
  priceRange: string[];
  duration: string[];
  rating: string[];
}

export function transformApiCourse(apiCourse: any): Course {
  return {
    id: apiCourse._id || apiCourse.id,
    title: apiCourse._title || apiCourse.title,
    content: apiCourse._description || apiCourse.content || "",
    category:
      apiCourse._category?.name ||
      apiCourse._category?._name ||
      apiCourse.category ||
      "Non catégorisé",
    categoryId: apiCourse.categoryId || apiCourse._category?.id || apiCourse._category?._id,
    thumbnailUrl:
      apiCourse.thumbnailUrl || apiCourse._thumbnailUrl || "/placeholder.jpg",
    thumbnail:
      apiCourse.thumbnailUrl || apiCourse._thumbnailUrl || "/placeholder.jpg",
    price: apiCourse._price ?? apiCourse.price ?? 0,
    duration: apiCourse._duration || apiCourse.duration,
    instructor: {
      id: apiCourse._instructor?._id || apiCourse._instructor?.id,
      name: apiCourse._instructor
        ? `${apiCourse._instructor._firstName || apiCourse._instructor.firstName || ""} ${apiCourse._instructor._lastName || apiCourse._instructor.lastName || ""}`.trim()
        : "Instructeur",
      firstName:
        apiCourse._instructor?._firstName || apiCourse._instructor?.firstName,
      lastName:
        apiCourse._instructor?._lastName || apiCourse._instructor?.lastName,
      email: apiCourse._instructor?._email || apiCourse._instructor?.email,
      role: apiCourse._instructor?._role || apiCourse._instructor?.role,
    },
    studentsCount:
      apiCourse._enrollments?.length || apiCourse.enrollments?.length || 0,
    rating: apiCourse._rating || apiCourse.rating || 0,
    level: apiCourse._level || apiCourse.level || "BEGINNER",
    description: apiCourse._description || apiCourse.description,
    tags: apiCourse._tags || apiCourse.tags || [],
    status: apiCourse._status || apiCourse.status,
    attachment: apiCourse._attachment || apiCourse.attachment,
    createdAt: apiCourse._createdAt || apiCourse.createdAt,
    updatedAt: apiCourse._updatedAt || apiCourse.updatedAt,
    lessons: apiCourse._modules || apiCourse.modules || apiCourse.lessons || [],
    quizzes: apiCourse._quizzes || apiCourse.quizzes || [],
  };
}

export function transformApiCourses(apiCourses: any[]): Course[] {
  return apiCourses.map(transformApiCourse);
}
