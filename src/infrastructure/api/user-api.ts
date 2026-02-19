import logger from "@/shared/helpers/logger";
import { buildApiUrl, API_ENDPOINTS } from "./baseConfig";
import Cookies from "js-cookie";

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  firstName?: string;
  lastName?: string;
  // Add other fields as needed
}

export interface CreateUserData {
  email: string;
  name?: string;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
  // Add other fields as needed
}

export interface ImportUsersErrorItem {
  line: number;
  message: string;
}

export interface ImportUsersExistingUser {
  prenom: string;
  nom: string;
  email: string;
  emailVerified: boolean;
}

export interface ImportUsersResponse {
  success: boolean;
  message: string;
  totalProcessed: number;
  imported: number;
  alreadyExists: number;
  failed: number;
  errors: ImportUsersErrorItem[];
  existingUsers: ImportUsersExistingUser[];
}

const getStoredAccessToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    Cookies.get("access_token") ||
    null
  );
};

const buildAuthHeaders = (): Record<string, string> => {
  const token = getStoredAccessToken();
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

// Types for complete profile
export type SexeType = "M" | "F" | "O" | "NOT_SPECIFIED";

export const SEXE_LABELS: Record<SexeType, string> = {
  M: "Homme",
  F: "Femme",
  O: "Autre",
  NOT_SPECIFIED: "Non spécifié",
};

export type RegionType =
  | "DAKAR"
  | "THIES"
  | "SAINT_LOUIS"
  | "KAOLACK"
  | "ZIGUINCHOR"
  | "TAMBACOUNDA"
  | "KOLDA"
  | "MATAM"
  | "LOUGA"
  | "DIOURBEL"
  | "FATICK"
  | "KEDOUGOU"
  | "SEDHIOU";

export const REGION_LABELS: Record<RegionType, string> = {
  DAKAR: "Dakar",
  THIES: "Thiès",
  SAINT_LOUIS: "Saint-Louis",
  KAOLACK: "Kaolack",
  ZIGUINCHOR: "Ziguinchor",
  TAMBACOUNDA: "Tambacounda",
  KOLDA: "Kolda",
  MATAM: "Matam",
  LOUGA: "Louga",
  DIOURBEL: "Diourbel",
  FATICK: "Fatick",
  KEDOUGOU: "Kédougou",
  SEDHIOU: "Sédhiou",
};

export type ResidenceType = "URBAN" | "RURAL";

export const RESIDENCE_LABELS: Record<ResidenceType, string> = {
  URBAN: "Urbain",
  RURAL: "Rural",
};

export type DisabilityType =
  | "VISUAL"
  | "HEARING"
  | "MOTOR"
  | "COGNITIVE"
  | "OTHER";

export const DISABILITY_TYPE_LABELS: Record<DisabilityType, string> = {
  VISUAL: "Visuel",
  HEARING: "Auditif",
  MOTOR: "Moteur",
  COGNITIVE: "Cognitif",
  OTHER: "Autre",
};

export type AgeRangeType =
  | "AGE_15_19"
  | "AGE_20_24"
  | "AGE_25_29"
  | "AGE_30_34"
  | "AGE_35_39"
  | "AGE_40_44"
  | "AGE_45_49"
  | "AGE_50_54"
  | "AGE_55_59"
  | "AGE_60_PLUS";

export const AGE_RANGE_LABELS: Record<AgeRangeType, string> = {
  AGE_15_19: "15-19 ans",
  AGE_20_24: "20-24 ans",
  AGE_25_29: "25-29 ans",
  AGE_30_34: "30-34 ans",
  AGE_35_39: "35-39 ans",
  AGE_40_44: "40-44 ans",
  AGE_45_49: "45-49 ans",
  AGE_50_54: "50-54 ans",
  AGE_55_59: "55-59 ans",
  AGE_60_PLUS: "60 ans et +",
};

export type CurrentStatusType =
  | "ELEVE"
  | "ETUDIANT"
  | "STAGIAIRE"
  | "SALARIE"
  | "INDEPENDANT"
  | "CHOMEUR"
  | "RETRAITE"
  | "AUTRE";

export const CURRENT_STATUS_LABELS: Record<CurrentStatusType, string> = {
  ELEVE: "Élève",
  ETUDIANT: "Étudiant",
  STAGIAIRE: "Stagiaire",
  SALARIE: "Salarié",
  INDEPENDANT: "Indépendant",
  CHOMEUR: "Chômeur",
  RETRAITE: "Retraité",
  AUTRE: "Autre",
};

export type ReferralSourceType =
  | "RESEAUX_SOCIAUX"
  | "AMI"
  | "EVENEMENT"
  | "PANNEAU_PUBLICITAIRE"
  | "AUTRE";

export const REFERRAL_SOURCE_LABELS: Record<ReferralSourceType, string> = {
  RESEAUX_SOCIAUX: "Réseaux sociaux",
  AMI: "Ami / Famille",
  EVENEMENT: "Événement",
  PANNEAU_PUBLICITAIRE: "Panneau publicitaire",
  AUTRE: "Autre",
};

export interface ProfileMetadataItem {
  id: string;
  code: string;
  label: string;
  orderIndex?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfileMetadataResponse {
  ageRanges: ProfileMetadataItem[];
  currentStatuses: ProfileMetadataItem[];
  referralSources: ProfileMetadataItem[];
}

export type ProfileMetadataValue =
  | string
  | {
      id?: string;
      code?: string;
      label?: string;
    };

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

const resolveMetadataId = (
  value: ProfileMetadataValue | undefined,
  items?: ProfileMetadataItem[],
): string => {
  if (!value) return "";

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (isUuid(trimmed)) return trimmed;

    const byId = items?.find((item) => item.id === trimmed);
    if (byId) return byId.id;

    const byCode = items?.find((item) => item.code === trimmed);
    if (byCode) return byCode.id;

    const byLabel = items?.find((item) => item.label === trimmed);
    if (byLabel) return byLabel.id;

    return trimmed;
  }

  if (typeof value === "object") {
    if (value.id) return value.id;
    if (value.code) return resolveMetadataId(value.code, items);
    if (value.label) {
      const byLabel = items?.find((item) => item.label === value.label);
      if (byLabel) return byLabel.id;
    }
  }

  return "";
};

export const sortProfileMetadataItems = (
  items: ProfileMetadataItem[] = [],
): ProfileMetadataItem[] =>
  items
    .filter((item) => item.isActive !== false)
    .sort(
      (a, b) =>
        (a.orderIndex ?? Number.MAX_SAFE_INTEGER) -
        (b.orderIndex ?? Number.MAX_SAFE_INTEGER),
    );

const REFERRAL_SOURCE_ALIASES: Record<string, ReferralSourceType> = {
  RESEAUX_SOCIAUX: "RESEAUX_SOCIAUX",
  AMI: "AMI",
  AMIS: "AMI",
  AMI_FAMILLE: "AMI",
  AMIS_FAMILLE: "AMI",
  EVENEMENT: "EVENEMENT",
  EVENEMENTS: "EVENEMENT",
  PANNEAU_PUBLICITAIRE: "PANNEAU_PUBLICITAIRE",
  PANNEAU_PUBLICITE: "PANNEAU_PUBLICITAIRE",
  PUBLICITE: "PANNEAU_PUBLICITAIRE",
  MOTEUR_RECHERCHE: "AUTRE",
  MOTEUR_DE_RECHERCHE: "AUTRE",
  BLOG: "AUTRE",
  PRESSE: "AUTRE",
  AUTRE: "AUTRE",
};

const normalizeReferralSource = (
  value?: string | null,
): ReferralSourceType | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const normalized = trimmed
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  return REFERRAL_SOURCE_ALIASES[normalized];
};

// Helper to extract local number from full phone number
const extractLocalNumber = (fullPhone: string, indicatif: string): string => {
  if (!fullPhone) return "";
  // If the phone already starts with the dial code, remove it
  if (fullPhone.startsWith(indicatif)) {
    return fullPhone.slice(indicatif.length);
  }
  // If the phone starts with +, try to find matching dial code
  if (fullPhone.startsWith("+")) {
    // Simple dial code detection for common countries
    const dialCodes = [
      { code: "+221", length: 9 }, // Senegal
      { code: "+225", length: 8 }, // Ivory Coast
      { code: "+223", length: 8 }, // Mali
      { code: "+33", length: 9 }, // France
      { code: "+1", length: 10 }, // US/Canada
    ];
    for (const { code, length } of dialCodes) {
      if (fullPhone.startsWith(code)) {
        return fullPhone.slice(code.length);
      }
    }
  }
  // Otherwise, return as is (should be local number)
  return fullPhone.replace(/\D/g, "");
};

// Helper to extract dial code from full phone number
const extractIndicatif = (fullPhone: string, defaultIndicatif: string): string => {
  if (!fullPhone || !fullPhone.startsWith("+")) return defaultIndicatif;
  
  // Simple dial code detection for common countries
  const dialCodes = [
    { code: "+221" }, // Senegal
    { code: "+225" }, // Ivory Coast
    { code: "+223" }, // Mali
    { code: "+33" }, // France
    { code: "+1" }, // US/Canada
  ];
  for (const { code } of dialCodes) {
    if (fullPhone.startsWith(code)) {
      return code;
    }
  }
  return defaultIndicatif;
};

// Extract telephone from various possible field names
const extractTelephone = (data: any): string => {
  // Try various possible field names
  const possibleFields = [
    'telephone',
    'phone',
    'phoneNumber', 
    'tel',
    'phone_number',
    'mobile',
    'mobileNumber',
    'contactNumber',
  ];
  
  for (const field of possibleFields) {
    if (data[field]) {
      logger.log(`📡 API: Téléphone trouvé dans le champ "${field}":`, data[field]);
      return data[field];
    }
  }
  
  // Also check nested user object
  if (data.user?.telephone) {
    logger.log(`📡 API: Téléphone trouvé dans data.user.telephone:`, data.user.telephone);
    return data.user.telephone;
  }
  
  // Check if telephone is inside userProfile (shouldn't be but just in case)
  if (data.userProfile?.telephone) {
    logger.log(`📡 API: Téléphone trouvé dans data.userProfile.telephone:`, data.userProfile.telephone);
    return data.userProfile.telephone;
  }
  
  logger.log(`📡 API: Aucun téléphone trouvé dans les données`, data);
  return "";
};

// User Profile from backend
export interface UserProfileData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  telephone?: string;
  indicatif?: string;
  ageRangeId?: string;
  currentStatusId?: string;
  referralSourceId?: string;
  user?: {
    id?: number | string;
    firstName?: string;
    lastName?: string;
    email?: string;
    telephone?: string;
    indicatif?: string;
  };
  userProfile?: {
    id?: number;
    userId: number;
    ageRangeId?: string;
    currentStatusId?: string;
    referralSourceId?: string;
    ageRange?: ProfileMetadataValue;
    currentStatus?: ProfileMetadataValue;
    referralSource?: ProfileMetadataValue;
    sexe?: SexeType;
    region?: RegionType;
    residenceType?: ResidenceType;
    disability?: boolean;
    disabilityType?: DisabilityType;
    disabilityDetails?: string;
    consentGiven?: boolean;
  };
  isProfileComplete?: boolean;
}

// Form data for complete profile
export interface CompleteProfileData {
  userId?: string | number;
  firstName?: string;
  lastName?: string;
  email?: string;
  telephone?: string;
  indicatif?: string;
  ageRangeId?: string;
  currentStatusId?: string;
  referralSourceId?: string;
  ageRange?: string;
  currentStatus?: string;
  referralSource?: string;
  sexe?: SexeType;
  region?: RegionType;
  residenceType?: ResidenceType;
  disability?: boolean;
  disabilityType?: DisabilityType;
  disabilityDetails?: string;
  consentGiven?: boolean;
}

// Local form interface
export interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  indicatif: string;
  ageRange: string;
  currentStatus: string;
  referralSource: string;
  sexe: SexeType | "";
  region: RegionType | "";
  residenceType: ResidenceType | "";
  disability: boolean;
  disabilityType: DisabilityType | "";
  disabilityDetails: string;
  consentGiven: boolean;
}

// Convert backend data to form data
export function toProfileFormData(
  data: UserProfileData,
  metadata?: ProfileMetadataResponse | null,
): ProfileFormData {
  // Extract telephone from various possible fields
  const telephone = extractTelephone(data);

  const firstName = data.firstName || data.user?.firstName || "";
  const lastName = data.lastName || data.user?.lastName || "";
  const email = data.email || data.user?.email || "";
  const profile = data.userProfile;

  const formData: ProfileFormData = {
    firstName,
    lastName,
    email,
    telephone: extractLocalNumber(telephone, "+221"),
    indicatif: extractIndicatif(telephone, "+221"),
    ageRange: "",
    currentStatus: "",
    referralSource: "",
    sexe: "",
    region: "",
    residenceType: "",
    disability: false,
    disabilityType: "",
    disabilityDetails: "",
    consentGiven: false,
  };

  if (profile?.sexe) {
    formData.sexe = profile.sexe as SexeType;
  }
  const ageRangeValue =
    profile?.ageRangeId ?? data.ageRangeId ?? profile?.ageRange;
  formData.ageRange = resolveMetadataId(
    ageRangeValue,
    metadata?.ageRanges,
  );

  const currentStatusValue =
    profile?.currentStatusId ?? data.currentStatusId ?? profile?.currentStatus;
  formData.currentStatus = resolveMetadataId(
    currentStatusValue,
    metadata?.currentStatuses,
  );

  const referralSourceValue =
    profile?.referralSourceId ??
    data.referralSourceId ??
    profile?.referralSource;
  const normalizedReferral =
    typeof referralSourceValue === "string"
      ? normalizeReferralSource(referralSourceValue) ?? referralSourceValue
      : referralSourceValue;
  formData.referralSource = resolveMetadataId(
    normalizedReferral,
    metadata?.referralSources,
  );

  if (profile?.region) {
    formData.region = profile.region as RegionType;
  }
  if (profile?.residenceType) {
    formData.residenceType = profile.residenceType as ResidenceType;
  }
  if (profile?.disability !== undefined) {
    formData.disability = profile.disability;
  }
  if (profile?.disabilityType) {
    formData.disabilityType = profile.disabilityType as DisabilityType;
  }
  if (profile?.disabilityDetails) {
    formData.disabilityDetails = profile.disabilityDetails;
  }
  if (profile?.consentGiven !== undefined) {
    formData.consentGiven = profile.consentGiven;
  }

  return formData;
}

// Check if form data has changes compared to initial data
export function getChangedFields(
  initial: ProfileFormData,
  current: ProfileFormData,
): Partial<CompleteProfileData> {
  const changed: Partial<CompleteProfileData> = {};

  if (current.firstName !== initial.firstName && current.firstName.trim()) {
    changed.firstName = current.firstName;
  }
  if (current.lastName !== initial.lastName && current.lastName.trim()) {
    changed.lastName = current.lastName;
  }
  if (current.ageRange !== initial.ageRange && current.ageRange !== "") {
    changed.ageRangeId = current.ageRange;
  }
  if (
    current.currentStatus !== initial.currentStatus &&
    current.currentStatus !== ""
  ) {
    changed.currentStatusId = current.currentStatus;
  }
  if (
    current.referralSource !== initial.referralSource &&
    current.referralSource !== ""
  ) {
    changed.referralSourceId = current.referralSource;
  }
  if (current.sexe !== initial.sexe && current.sexe !== "") {
    changed.sexe = current.sexe;
  }
  if (current.region !== initial.region && current.region !== "") {
    changed.region = current.region;
  }
  if (
    current.residenceType !== initial.residenceType &&
    current.residenceType !== ""
  ) {
    changed.residenceType = current.residenceType;
  }
  if (current.disability !== initial.disability) {
    changed.disability = current.disability;
  }
  if (
    current.disabilityType !== initial.disabilityType &&
    current.disabilityType !== ""
  ) {
    changed.disabilityType = current.disabilityType;
  }
  if (current.disabilityDetails !== initial.disabilityDetails) {
    changed.disabilityDetails = current.disabilityDetails;
  }
  if (current.consentGiven !== initial.consentGiven) {
    changed.consentGiven = current.consentGiven;
  }

  return changed;
}

export class UserApi {
  /**
   * Créer un utilisateur en tant qu'admin
   */
  static async adminCreateUser(data: CreateUserData): Promise<User> {
    try {
      const payload = {
        ...data,
        name: `${data.firstName} ${data.lastName}`,
      };
      logger.log(`📡 API: Création d'utilisateur admin:`, payload);

      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.USER.ADMIN_CREATE),
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
          credentials: "include",
          body: JSON.stringify(payload),
        },
      );

      logger.log(`📡 API: Réponse reçue - Status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`❌ API: Erreur ${response.status}: ${errorText}`);
        throw new Error(
          `Erreur ${response.status}: Impossible de créer l'utilisateur`,
        );
      }

      const user = await response.json();
      logger.log(`✅ API: Utilisateur créé:`, user);
      return user;
    } catch (error) {
      logger.error(
        `❌ API: Erreur lors de la création de l'utilisateur:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Importer des utilisateurs via un fichier Excel/CSV
   */
  static async importUsers(file: File): Promise<ImportUsersResponse> {
    const endpoints = [
      API_ENDPOINTS.USER.IMPORT_USERS,
      API_ENDPOINTS.USER.IMPORT_USERS_LEGACY,
    ];

    let lastEndpointError: Error | null = null;

    for (const endpoint of endpoints) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(buildApiUrl(endpoint), {
          method: "POST",
          headers: { ...buildAuthHeaders() },
          credentials: "include",
          body: formData,
        });

        const payload = await response.json().catch(() => null);

        if (response.ok) {
          return payload as ImportUsersResponse;
        }

        const message =
          (payload as any)?.message ||
          (payload as any)?.error ||
          `Erreur ${response.status}`;

        if (response.status === 404 || response.status === 405) {
          lastEndpointError = new Error(message);
          continue;
        }

        const error = new Error(message);
        (error as any).status = response.status;
        (error as any).payload = payload;
        throw error;
      } catch (error) {
        logger.error("❌ API: Erreur import utilisateurs:", error);
        throw error;
      }
    }

    throw (
      lastEndpointError ??
      new Error("Endpoint d'importation introuvable sur le serveur.")
    );
  }

  /**
   * Récupérer les métadonnées pour la complétion de profil
   */
  static async getProfileMetadata(): Promise<ProfileMetadataResponse> {
    try {
      logger.log("📡 API: Récupération des métadonnées de profil");

      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.USER.PROFILE_METADATA),
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
        },
      );

      logger.log(`📡 API: Réponse reçue - Status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`❌ API: Erreur ${response.status}: ${errorText}`);
        throw new Error(
          `Erreur ${response.status}: Impossible de récupérer les métadonnées`,
        );
      }

      const data = await response.json();
      logger.log("📡 API: Métadonnées reçues:", data);
      return data;
    } catch (error) {
      logger.error(
        "❌ API: Erreur lors de la récupération des métadonnées:",
        error,
      );
      throw error;
    }
  }

  /**
   * Récupérer le profil complet de l'utilisateur
   */
  static async getUserProfile(): Promise<UserProfileData | null> {
    try {
      logger.log("📡 API: Récupération du profil utilisateur");

      const response = await fetch(buildApiUrl(API_ENDPOINTS.USER.PROFILE), {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
      });

      logger.log(`📡 API: Réponse reçue - Status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`❌ API: Erreur ${response.status}: ${errorText}`);
        return null;
      }

      const data = await response.json();
      logger.log("📡 API: Réponse brute du profil:", JSON.stringify(data, null, 2));
      logger.log("📡 API: Champs disponibles dans la réponse:", Object.keys(data));
      
      // Log telephone if present in different possible formats
      const possiblePhoneFields = ['telephone', 'phone', 'phoneNumber', 'tel', 'phone_number', 'mobile', 'contactNumber'];
      for (const field of possiblePhoneFields) {
        if (data[field]) {
          logger.log(`📡 API: Champ "${field}" =`, data[field]);
        }
      }
      if (data.user?.telephone) {
        logger.log("📡 API: user.telephone =", data.user.telephone);
      }
      
      return data;
    } catch (error) {
      logger.error(`❌ API: Erreur lors de la récupération du profil:`, error);
      return null;
    }
  }

  /**
   * Compléter/mettre à jour le profil utilisateur
   */
  static async completeProfile(
    data: CompleteProfileData,
  ): Promise<UserProfileData> {
    try {
      logger.log(`📡 API: Mise à jour du profil:`, data);

      // Filtrer les champs undefined/null pour n'envoyer que les champs modifiés
      const payload: Record<string, unknown> = {};

      if (data.firstName !== undefined) payload.firstName = data.firstName;
      if (data.lastName !== undefined) payload.lastName = data.lastName;
      if (data.telephone !== undefined) payload.telephone = data.telephone;
      if (data.indicatif !== undefined) payload.indicatif = data.indicatif;
      if (data.userId !== undefined) payload.userId = data.userId;
      const ageRangeId = data.ageRangeId ?? data.ageRange;
      if (ageRangeId) payload.ageRangeId = ageRangeId;

      const currentStatusId = data.currentStatusId ?? data.currentStatus;
      if (currentStatusId) payload.currentStatusId = currentStatusId;

      const referralSourceId = data.referralSourceId ?? data.referralSource;
      if (referralSourceId) payload.referralSourceId = referralSourceId;
      if (data.sexe !== undefined) payload.sexe = data.sexe;
      if (data.region !== undefined) payload.region = data.region;
      if (data.residenceType !== undefined)
        payload.residenceType = data.residenceType;
      if (data.disability !== undefined) payload.disability = data.disability;
      if (data.disabilityType !== undefined)
        payload.disabilityType = data.disabilityType;
      if (data.disabilityDetails !== undefined)
        payload.disabilityDetails = data.disabilityDetails;
      if (data.consentGiven !== undefined)
        payload.consentGiven = data.consentGiven;

      logger.log(`📡 API: Payload envoyé:`, payload);

      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.USER.COMPLETE_PROFILE),
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
          credentials: "include",
          body: JSON.stringify(payload),
        },
      );

      logger.log(`📡 API: Réponse reçue - Status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Erreur inconnue" }));
        logger.error(`❌ API: Erreur ${response.status}:`, errorData);
        
        // Propager l'erreur avec code pour permettre le mapping
        if (errorData?.error) {
          const errorObj = new Error(errorData.error.message || "Erreur de mise à jour du profil");
          (errorObj as any).code = errorData.error.code;
          (errorObj as any).timestamp = errorData.error.timestamp;
          (errorObj as any).path = errorData.error.path;
          throw errorObj;
        }
        
        throw new Error(
          errorData.message ||
            `Erreur ${response.status}: Impossible de mettre à jour le profil`,
        );
      }

      const result = await response.json();
      logger.log(`✅ API: Profil mis à jour:`, result);
      return result;
    } catch (error) {
      logger.error(`❌ API: Erreur lors de la mise à jour du profil:`, error);
      throw error;
    }
  }
}
