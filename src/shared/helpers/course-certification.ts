type CourseLike = {
  isCertifying?: boolean | string | number | null;
  is_certifying?: boolean | string | number | null;
  certificationStatus?: string | null;
  certification_status?: string | null;
  quizStatus?: string | null;
  quiz_status?: string | null;
  certificationQuizId?: string | null;
  certification_quiz_id?: string | null;
  quizId?: string | null;
  quiz_id?: string | null;
};

const parseBoolean = (
  value: boolean | string | number | null | undefined,
): boolean | undefined => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(normalized)) return true;
    if (["false", "0", "no", "n"].includes(normalized)) return false;
  }
  return undefined;
};

export const getCertificationState = (course?: CourseLike | null) => {
  const rawIsCertifying = course?.isCertifying ?? course?.is_certifying;
  const certificationStatus =
    course?.certificationStatus ??
    course?.certification_status ??
    course?.quizStatus ??
    course?.quiz_status ??
    null;
  const certificationQuizId =
    course?.certificationQuizId ??
    course?.certification_quiz_id ??
    course?.quizId ??
    course?.quiz_id ??
    null;

  const parsedIsCertifying = parseBoolean(rawIsCertifying);

  return {
    isCertifying: parsedIsCertifying ?? false,
    certificationStatus,
    certificationQuizId,
  };
};
