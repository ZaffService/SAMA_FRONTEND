import logger from "@/shared/helpers/logger";
import Cookies from "js-cookie";

const COOKIE_KEY = "bibocom_course_draft";
const COOKIE_EXPIRY_DAYS = 7; // 7 jours d'expiration

export interface CourseCookieDraft {
  title: string;
  description: string;
  categoryId: string;
  level: string;
  price: string | number;
  modules: any[];
  quizzes?: any[];
  lastSaved: string; // Timestamp
}

export const CourseCookieStorage = {
  // Sauvegarder les données du cours dans un cookie
  saveDraft: (draftData: Partial<CourseCookieDraft>): boolean => {
    try {
      const existingDraft = CourseCookieStorage.getDraft();
      const updatedDraft = {
        ...existingDraft,
        ...draftData,
        lastSaved: new Date().toISOString(),
      };

      // Sauvegarder dans un cookie (expires après 7 jours)
      Cookies.set(COOKIE_KEY, JSON.stringify(updatedDraft), {
        expires: COOKIE_EXPIRY_DAYS,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production", // HTTPS en production
      });

      logger.log(
        "🍪 [Cookies] Brouillon sauvegardé:",
        new Date().toISOString(),
      );
      return true;
    } catch (err) {
      logger.error("❌ [Cookies] Erreur sauvegarde:", err);
      return false;
    }
  },

  // Récupérer les données du cours depuis le cookie
  getDraft: (): Partial<CourseCookieDraft> | null => {
    try {
      const draft = Cookies.get(COOKIE_KEY);
      if (!draft) return null;

      const parsed = JSON.parse(draft);
      logger.log("📂 [Cookies] Brouillon récupéré:", parsed.lastSaved);
      return parsed;
    } catch (err) {
      logger.error("❌ [Cookies] Erreur récupération:", err);
      return null;
    }
  },

  // Supprimer le brouillon après publication réussie
  clearDraft: (): boolean => {
    try {
      Cookies.remove(COOKIE_KEY);
      logger.log("🗑️ [Cookies] Brouillon supprimé");
      return true;
    } catch (err) {
      logger.error("❌ [Cookies] Erreur suppression:", err);
      return false;
    }
  },

  // Vérifier si un brouillon existe
  hasDraft: (): boolean => {
    return Cookies.get(COOKIE_KEY) !== undefined;
  },
};
