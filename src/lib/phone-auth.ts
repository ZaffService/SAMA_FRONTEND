import { COUNTRIES } from "@/lib/countries";
import type { MobileRegisterPayload, WebRegisterPayload, AuthPlatform, RegisterPayload } from "@/types/auth";

export const MIN_PASSWORD_LENGTH = 6;

export const getPhonePlaceholder = (indicatif: string): string => {
  const country = COUNTRIES.find((c) => c.indicatif === indicatif);
  if (!country) return "77XXXXXXX";

  const prefix = country.localLength >= 2 ? "77" : "7";
  const xCount = Math.max(country.localLength - prefix.length, 1);
  return `${prefix}${"X".repeat(xCount)}`;
};

export const sanitizePhoneInput = (raw: string, indicatif: string): string => {
  const country = COUNTRIES.find((c) => c.indicatif === indicatif);
  const maxLength = country?.localLength || 15;
  return raw.replace(/\D/g, "").slice(0, maxLength);
};

export const validatePhone = (
  telephone: string,
  indicatif: string,
): string | null => {
  if (!telephone.trim() || !indicatif) {
    return "Numéro de téléphone requis";
  }

  const country = COUNTRIES.find((c) => c.indicatif === indicatif);
  if (!country) {
    return "Indicatif invalide";
  }

  if (!/^\d+$/.test(telephone)) {
    return "Le numéro doit contenir uniquement des chiffres";
  }

  if (telephone.length !== country.localLength) {
    return `Le numéro doit contenir ${country.localLength} chiffres pour ${country.name}`;
  }

  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return "Mot de passe requis";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères`;
  }
  return null;
};

export const formatFullPhone = (indicatif: string, telephone: string) =>
  `${indicatif} ${telephone}`;

/** Flux Trello : create-account → verify-phone → login */
export const AUTH_PHONE_FLOW = {
  verifyIntro:
    "Entrez le code à 6 chiffres envoyé par SMS au numéro ci-dessous.",
  otpResendSuccess: "Un nouveau code a été envoyé.",
  otpResendUnavailable:
    "L'envoi SMS est temporairement indisponible. Réessayez dans quelques instants ou saisissez le code déjà reçu.",
  missingPhone:
    "Numéro de téléphone manquant. Reprenez l'inscription pour recevoir un code.",
  accountCreated: "Création du compte terminée.",
  autoLogin: "Connexion automatique en cours...",
  redirectDashboard: "Redirection vers votre tableau de bord...",
  verifiedLoginFallback:
    "Votre numéro est vérifié. Connectez-vous avec votre mot de passe.",
  unverifiedLoginMessage:
    "Votre numéro de téléphone n'a pas encore été vérifié.",
  otpSentOnLogin:
    "Un code de vérification vient d'être envoyé par SMS. Saisissez-le ci-dessous pour activer votre compte.",
  otpExpiredMessage: "Votre code de vérification a expiré.",
  passwordResetLogin:
    "Mot de passe réinitialisé. Connexion en cours…",
  passwordResetPrefill:
    "Mot de passe réinitialisé. Connectez-vous avec votre nouveau mot de passe.",
} as const;

const PENDING_PHONE_AUTH_KEY = "bibocom_pending_phone_auth";

export interface PendingPhoneAuth {
  indicatif: string;
  telephone: string;
  password: string;
}

export function storePendingPhoneAuth(data: PendingPhoneAuth): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_PHONE_AUTH_KEY, JSON.stringify(data));
}

export function getPendingPhoneAuth(): PendingPhoneAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_PHONE_AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingPhoneAuth;
  } catch {
    return null;
  }
}

export function clearPendingPhoneAuth(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_PHONE_AUTH_KEY);
}

export function matchesPendingPhoneAuth(
  pending: PendingPhoneAuth | null,
  indicatif: string,
  telephone: string,
): boolean {
  return (
    !!pending &&
    pending.indicatif === indicatif &&
    pending.telephone === telephone &&
    !!pending.password
  );
}

export function getVerifyPhoneUrl(
  indicatif: string,
  telephone: string,
  options?: { fromLogin?: boolean },
): string {
  const params = new URLSearchParams({ indicatif, telephone });
  if (options?.fromLogin) {
    params.set("from", "login");
  }
  return `/verify-phone?${params.toString()}`;
}

/** Plateforme client pour le site web Next.js */
export const WEB_REGISTRATION_PLATFORM = "web" as const;

/** Plateforme client pour l'app Flutter / mobile native */
export const MOBILE_REGISTRATION_PLATFORM = "mobile" as const;

/** Payload web — POST /user/create-account */
export function buildWebRegisterPayload(data: {
  indicatif: string;
  telephone: string;
  firstName: string;
  lastName: string;
  password: string;
}): WebRegisterPayload {
  return {
    platform: WEB_REGISTRATION_PLATFORM,
    indicatif: data.indicatif,
    telephone: data.telephone,
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    password: data.password,
  };
}

/** Payload mobile — POST /user/create-account (app Flutter, sans prénom/nom) */
export function buildMobileRegisterPayload(data: {
  indicatif: string;
  telephone: string;
  password: string;
}): MobileRegisterPayload {
  return {
    platform: MOBILE_REGISTRATION_PLATFORM,
    indicatif: data.indicatif,
    telephone: data.telephone,
    password: data.password,
  };
}

type WebRegisterInput = {
  indicatif: string;
  telephone: string;
  firstName: string;
  lastName: string;
  password: string;
};

type MobileRegisterInput = {
  indicatif: string;
  telephone: string;
  password: string;
};

/** Construit le payload selon la plateforme (web ou mobile) */
export function buildRegisterPayload(
  platform: typeof WEB_REGISTRATION_PLATFORM,
  data: WebRegisterInput,
): WebRegisterPayload;
export function buildRegisterPayload(
  platform: typeof MOBILE_REGISTRATION_PLATFORM,
  data: MobileRegisterInput,
): MobileRegisterPayload;
export function buildRegisterPayload(
  platform: AuthPlatform,
  data: WebRegisterInput | MobileRegisterInput,
): RegisterPayload {
  if (platform === MOBILE_REGISTRATION_PLATFORM) {
    return buildMobileRegisterPayload(data as MobileRegisterInput);
  }
  return buildWebRegisterPayload(data as WebRegisterInput);
}

export type RegisterField =
  | "firstName"
  | "lastName"
  | "phone"
  | "password"
  | "general";

export function getRegisterFieldError(err: unknown): {
  field: RegisterField;
  message: string;
} {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "Une erreur est survenue";

  const lower = message.toLowerCase();

  if (lower.includes("prénom") || lower.includes("prenom")) {
    return { field: "firstName", message };
  }
  if (
    lower.includes("nom") &&
    !lower.includes("téléphone") &&
    !lower.includes("telephone") &&
    !lower.includes("numéro")
  ) {
    return { field: "lastName", message };
  }
  if (
    lower.includes("téléphone") ||
    lower.includes("telephone") ||
    lower.includes("indicatif") ||
    lower.includes("numéro")
  ) {
    return { field: "phone", message };
  }
  if (lower.includes("mot de passe") || lower.includes("password")) {
    return { field: "password", message };
  }

  return { field: "general", message };
}
