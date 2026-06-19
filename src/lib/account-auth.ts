const PENDING_EMAIL_AUTH_KEY = "bibocom_pending_email_auth";

export interface PendingEmailAuth {
  email: string;
  password: string;
}

export const ACCOUNT_VERIFICATION_FLOW = {
  unverifiedEmailMessage:
    "Votre adresse email n'a pas encore été vérifiée.",
  emailLinkSentOnLogin:
    "Un lien de vérification vient d'être envoyé à votre adresse email. Consultez votre boîte de réception (et vos spams).",
  emailResendSuccess: "Un nouveau lien de vérification a été envoyé.",
  emailVerifiedLogin: "Email vérifié. Connexion en cours…",
} as const;

export function storePendingEmailAuth(data: PendingEmailAuth): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_EMAIL_AUTH_KEY, JSON.stringify(data));
}

export function getPendingEmailAuth(): PendingEmailAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_EMAIL_AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingEmailAuth;
  } catch {
    return null;
  }
}

export function clearPendingEmailAuth(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_EMAIL_AUTH_KEY);
}

export function matchesPendingEmailAuth(
  pending: PendingEmailAuth | null,
  email: string,
): boolean {
  return (
    !!pending &&
    pending.email.toLowerCase() === email.trim().toLowerCase() &&
    !!pending.password
  );
}
