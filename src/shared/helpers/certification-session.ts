/**
 * État de certification côté client uniquement (sessionStorage).
 * Ne remplace pas le backend ; sert à l’UX (réaffichage succès, certificat).
 */

export const certificationPassedEverStorageKey = (courseId: string) =>
  `certificationPassedEver:${courseId}`;

const certificationLastSuccessKey = (courseId: string) =>
  `certificationLastSuccess:${courseId}`;

export type CertificationSuccessSnapshot = {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  eligibleForCertificate?: boolean;
  isPaidEnrollment?: boolean;
  isCourseFree?: boolean;
};

export function markCertificationPassedEver(courseId: string | undefined): void {
  if (!courseId || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(certificationPassedEverStorageKey(courseId), "1");
  } catch {
    /* quota / navigation privée */
  }
}

export function hasCertificationPassedEver(courseId: string | undefined): boolean {
  if (!courseId || typeof window === "undefined") return false;
  try {
    return (
      window.sessionStorage.getItem(certificationPassedEverStorageKey(courseId)) ===
      "1"
    );
  } catch {
    return false;
  }
}

export function persistCertificationSuccessSnapshot(
  courseId: string | undefined,
  snapshot: CertificationSuccessSnapshot,
): void {
  if (!courseId || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      certificationLastSuccessKey(courseId),
      JSON.stringify(snapshot),
    );
  } catch {
    /* ignore */
  }
}

export function readCertificationSuccessSnapshot(
  courseId: string | undefined,
): CertificationSuccessSnapshot | null {
  if (!courseId || typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(certificationLastSuccessKey(courseId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return null;
    const o = parsed as Record<string, unknown>;
    const score = Number(o.score);
    const correctAnswers = Number(o.correctAnswers);
    const totalQuestions = Number(o.totalQuestions);
    if (
      !Number.isFinite(score) ||
      !Number.isFinite(correctAnswers) ||
      !Number.isFinite(totalQuestions)
    ) {
      return null;
    }
    return {
      score,
      correctAnswers,
      totalQuestions,
      eligibleForCertificate:
        typeof o.eligibleForCertificate === "boolean"
          ? o.eligibleForCertificate
          : undefined,
      isPaidEnrollment:
        typeof o.isPaidEnrollment === "boolean" ? o.isPaidEnrollment : undefined,
      isCourseFree: typeof o.isCourseFree === "boolean" ? o.isCourseFree : undefined,
    };
  } catch {
    return null;
  }
}
