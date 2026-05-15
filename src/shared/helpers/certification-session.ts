/**
 * État de certification côté client uniquement (localStorage).
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
    window.localStorage.setItem(certificationPassedEverStorageKey(courseId), "1");
    // Migration douce: on nettoie l'ancien stockage session.
    window.sessionStorage.removeItem(certificationPassedEverStorageKey(courseId));
  } catch {
    /* quota / navigation privée */
  }
}

export function hasCertificationPassedEver(courseId: string | undefined): boolean {
  if (!courseId || typeof window === "undefined") return false;
  try {
    const key = certificationPassedEverStorageKey(courseId);
    const localValue = window.localStorage.getItem(key);
    if (localValue === "1") return true;

    // Migration: on récupère l'ancienne valeur session si elle existe.
    const legacySessionValue = window.sessionStorage.getItem(key);
    if (legacySessionValue === "1") {
      window.localStorage.setItem(key, "1");
      window.sessionStorage.removeItem(key);
      return true;
    }

    return false;
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
    const key = certificationLastSuccessKey(courseId);
    const payload = JSON.stringify(snapshot);
    window.localStorage.setItem(
      key,
      payload,
    );
    // Migration douce: suppression de l'ancienne donnée session.
    window.sessionStorage.removeItem(
      certificationLastSuccessKey(courseId),
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
    const key = certificationLastSuccessKey(courseId);
    let raw = window.localStorage.getItem(key);

    // Migration: fallback sessionStorage puis sauvegarde durable.
    if (!raw) {
      const legacySessionRaw = window.sessionStorage.getItem(key);
      if (legacySessionRaw) {
        raw = legacySessionRaw;
        window.localStorage.setItem(key, legacySessionRaw);
        window.sessionStorage.removeItem(key);
      }
    }

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
