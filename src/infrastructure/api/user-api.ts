import logger from "@/shared/helpers/logger";
import { buildApiUrl, API_ENDPOINTS } from "./baseConfig";

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
  userProfile?: {
    id?: number;
    userId: number;
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
  firstName?: string;
  lastName?: string;
  email?: string;
  telephone?: string;
  indicatif?: string;
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
  sexe: SexeType | "";
  region: RegionType | "";
  residenceType: ResidenceType | "";
  disability: boolean;
  disabilityType: DisabilityType | "";
  disabilityDetails: string;
  consentGiven: boolean;
}

// Convert backend data to form data
export function toProfileFormData(data: UserProfileData): ProfileFormData {
  // Extract telephone from various possible fields
  const telephone = extractTelephone(data);
  
  const formData: ProfileFormData = {
    firstName: data.firstName || "",
    lastName: data.lastName || "",
    email: data.email || "",
    telephone: extractLocalNumber(telephone, "+221"),
    indicatif: extractIndicatif(telephone, "+221"),
    sexe: "",
    region: "",
    residenceType: "",
    disability: false,
    disabilityType: "",
    disabilityDetails: "",
    consentGiven: false,
  };

  if (data.userProfile?.sexe) {
    formData.sexe = data.userProfile.sexe as SexeType;
  }
  if (data.userProfile?.region) {
    formData.region = data.userProfile.region as RegionType;
  }
  if (data.userProfile?.residenceType) {
    formData.residenceType = data.userProfile.residenceType as ResidenceType;
  }
  if (data.userProfile?.disability !== undefined) {
    formData.disability = data.userProfile.disability;
  }
  if (data.userProfile?.disabilityType) {
    formData.disabilityType = data.userProfile.disabilityType as DisabilityType;
  }
  if (data.userProfile?.disabilityDetails) {
    formData.disabilityDetails = data.userProfile.disabilityDetails;
  }
  if (data.userProfile?.consentGiven !== undefined) {
    formData.consentGiven = data.userProfile.consentGiven;
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
          headers: { "Content-Type": "application/json" },
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
   * Récupérer le profil complet de l'utilisateur
   */
  static async getUserProfile(): Promise<UserProfileData | null> {
    try {
      logger.log("📡 API: Récupération du profil utilisateur");

      const response = await fetch(buildApiUrl(API_ENDPOINTS.USER.PROFILE), {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
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
          headers: { "Content-Type": "application/json" },
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
