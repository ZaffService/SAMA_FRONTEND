import {
  ERROR_UI_MAPPING,
  getErrorMapping,
  parseApiError,
} from "@/shared/helpers/error-mapping";

/** Codes d'erreur backend liés au téléphone lors de la complétion du profil */
export const PROFILE_PHONE_ERROR_CODES = [
  "TELEPHONE_ALREADY_EXIST",
  "TELEPHONE_INVALID",
  "TELEPHONE_FORMAT_INVALID",
  "INDICATEUR_INVALIDE",
] as const;

export type ProfilePhoneErrorCode = (typeof PROFILE_PHONE_ERROR_CODES)[number];

/** Codes métier renvoyés en HTTP 401 — ne doivent pas déclencher une déconnexion */
export const BUSINESS_401_ERROR_CODES = new Set<string>([
  ...PROFILE_PHONE_ERROR_CODES,
  "TELEPHONE_ALREADY_VERIFIED",
  "EMAIL_ALREADY_EXIST",
  "USER_ALREADY_EXISTS",
]);

export function isProfilePhoneErrorCode(code: string): boolean {
  return PROFILE_PHONE_ERROR_CODES.includes(code as ProfilePhoneErrorCode);
}

export function getProfileErrorMessage(error: unknown): string {
  const parsed = parseApiError(error);
  const mapping = getErrorMapping(error);
  return mapping.message || parsed.message;
}

export function resolveProfilePhoneError(error: unknown): {
  code: string;
  message: string;
} | null {
  const parsed = parseApiError(error);
  if (isProfilePhoneErrorCode(parsed.code)) {
    return {
      code: parsed.code,
      message: ERROR_UI_MAPPING[parsed.code]?.message || parsed.message,
    };
  }

  const message = parsed.message.toLowerCase();
  if (
    message.includes("téléphone") ||
    message.includes("telephone") ||
    parsed.code.toLowerCase().includes("telephone")
  ) {
    return {
      code: parsed.code === "UNKNOWN_ERROR" ? "TELEPHONE_INVALID" : parsed.code,
      message: getProfileErrorMessage(error),
    };
  }

  return null;
}
