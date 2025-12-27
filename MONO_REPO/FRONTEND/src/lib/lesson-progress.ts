import { LessonProgress } from "@/types/course";

const PROGRESS_STORAGE_KEY = "lesson_progress";

export class LessonProgressManager {
  private static getStorageKey(courseId: string, userId: string): string {
    return `${PROGRESS_STORAGE_KEY}_${courseId}_${userId}`;
  }

  static getLessonProgress(
    courseId: string,
    userId: string,
    lessonId: string
  ): LessonProgress | null {
    try {
      const storageKey = this.getStorageKey(courseId, userId);
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;

      const progress: Record<string, LessonProgress> = JSON.parse(stored);
      return progress[lessonId] || null;
    } catch (error) {
      console.error("Error reading lesson progress:", error);
      return null;
    }
  }

  static getAllLessonProgress(
    courseId: string,
    userId: string
  ): Record<string, LessonProgress> {
    try {
      const storageKey = this.getStorageKey(courseId, userId);
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error("Error reading lesson progress:", error);
      return {};
    }
  }

  static saveLessonProgress(
    courseId: string,
    userId: string,
    lessonId: string,
    progress: Partial<LessonProgress>
  ): void {
    try {
      const storageKey = this.getStorageKey(courseId, userId);
      const existing = this.getAllLessonProgress(courseId, userId);

      const currentProgress = existing[lessonId] || {
        lessonId,
        completed: false,
        quizPassed: false,
        completedAt: undefined,
      };

      existing[lessonId] = {
        ...currentProgress,
        ...progress,
      };

      localStorage.setItem(storageKey, JSON.stringify(existing));
    } catch (error) {
      console.error("Error saving lesson progress:", error);
    }
  }

  static markLessonCompleted(
    courseId: string,
    userId: string,
    lessonId: string,
    quizPassed: boolean = false
  ): void {
    this.saveLessonProgress(courseId, userId, lessonId, {
      completed: true,
      quizPassed,
      completedAt: new Date().toISOString(),
    });
  }

  static isLessonCompleted(
    courseId: string,
    userId: string,
    lessonId: string
  ): boolean {
    const progress = this.getLessonProgress(courseId, userId, lessonId);
    return progress?.completed || false;
  }

  static hasQuizPassed(
    courseId: string,
    userId: string,
    lessonId: string
  ): boolean {
    const progress = this.getLessonProgress(courseId, userId, lessonId);
    return progress?.quizPassed || false;
  }

  static getCompletedLessonsCount(
    courseId: string,
    userId: string,
    lessonIds: string[]
  ): number {
    return lessonIds.filter(lessonId =>
      this.isLessonCompleted(courseId, userId, lessonId)
    ).length;
  }

  static clearProgress(courseId: string, userId: string): void {
    try {
      const storageKey = this.getStorageKey(courseId, userId);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error("Error clearing lesson progress:", error);
    }
  }
}