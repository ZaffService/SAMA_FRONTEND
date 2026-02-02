import type { CourseDetailsData } from "@/types/course";

export function transformCourseDetails(data: any): CourseDetailsData {
  return {
    course: {
      id: data.course.id,
      title: data.course.title,
      description: data.course.description,
      categoryId: data.course.categoryId,
      level: data.course.level,
      price: data.course.price,
    },
    modules: data.modules.map((module: any) => ({
      id: module.id,
      title: module.title,
      description: module.description,
      orderIndex: module.orderIndex,
      lessons: module.lessons.map((lesson: any) => ({
        id: lesson.id,
        title: lesson.title,
        content: lesson.content,
        hasVideo: lesson.hasVideo,
        videoUrl: lesson.videoUrl,
        orderIndex: lesson.orderIndex,
        duration: lesson.duration,
        status: lesson.status,
      })),
      // Transformer les quiz (underscore → camelCase)
      quiz:
        module.quiz?.map((q: any) => ({
          id: q._id,
          title: q._title,
          description: q._description,
          passingScore: q._passingScore,
          questions: q._questions.map((question: any) => ({
            id: question.id,
            question: question.question,
            type: question.questionType,
            options: question.options,
            correctAnswer: question.correctAnswer,
            points: question.points,
          })),
        })) || [],
    })),
    moduleCount: data.moduleCount,
  };
}
