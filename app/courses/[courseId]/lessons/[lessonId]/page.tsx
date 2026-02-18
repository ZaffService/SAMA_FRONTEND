import { redirect } from "next/navigation";

interface CourseLessonRedirectPageProps {
  params: {
    courseId: string;
    lessonId: string;
  };
}

export default function CourseLessonRedirectPage({
  params,
}: CourseLessonRedirectPageProps) {
  const { courseId, lessonId } = params;

  redirect(
    `/course-details/${encodeURIComponent(courseId)}?lessonId=${encodeURIComponent(lessonId)}`,
  );
}
