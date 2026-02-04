"use client";

import { useState, useCallback, useEffect } from "react";
import {
  UserApi,
  UserProfileData,
  CompleteProfileData,
} from "@/infrastructure/api/user-api";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";

const PROFILE_CACHE_KEY = "user_profile_cache";
const PROFILE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface ProfileCache {
  data: UserProfileData;
  timestamp: number;
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setProfileComplete } = useLocalAuth();

  // Load cached profile on mount
  useEffect(() => {
    const cached = localStorage.getItem(PROFILE_CACHE_KEY);
    if (cached) {
      try {
        const cache: ProfileCache = JSON.parse(cached);
        const now = Date.now();
        if (now - cache.timestamp < PROFILE_CACHE_DURATION) {
          setProfile(cache.data);
          setIsComplete(cache.data.isProfileComplete ?? false);
          setProfileComplete(cache.data.isProfileComplete ?? false);
        } else {
          localStorage.removeItem(PROFILE_CACHE_KEY);
        }
      } catch (error) {
        localStorage.removeItem(PROFILE_CACHE_KEY);
      }
    }
  }, [setProfileComplete]);

  const saveToCache = useCallback((data: UserProfileData) => {
    const cache: ProfileCache = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cache));
  }, []);

  const checkProfile =
    useCallback(async (): Promise<UserProfileData | null> => {
      try {
        setIsLoading(true);
        const response = await UserApi.getUserProfile();
        if (response) {
          setProfile(response);
          const isNowComplete = response.isProfileComplete === true;
          setIsComplete(isNowComplete);
          // Also update the global auth state
          setProfileComplete(isNowComplete);
          // Cache the result
          saveToCache(response);
          
          console.log("📋 Profil vérifié:", {
            isProfileComplete: response.isProfileComplete,
            isNowComplete,
          });
          
          return response;
        }
        return null;
      } catch (error) {
        console.error("Erreur vérification profil:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    }, [setProfileComplete, saveToCache]);

  const completeProfile = useCallback(
    async (
      profileData: CompleteProfileData,
    ): Promise<UserProfileData | null> => {
      try {
        setIsLoading(true);
        const response = await UserApi.completeProfile(profileData);
        if (response) {
          // Mettre à jour l'état local immédiatement
          setProfile(response);
          const isNowComplete = response.isProfileComplete === true;
          setIsComplete(isNowComplete);
          // Mettre à jour l'état global d'auth
          setProfileComplete(isNowComplete);
          // Mettre à jour le cache
          saveToCache(response);
          
          console.log("✅ Profil complété:", {
            isProfileComplete: response.isProfileComplete,
            isNowComplete,
          });
          
          return response;
        }
        return null;
      } catch (error) {
        console.error("Erreur complétion profil:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [setProfileComplete, saveToCache],
  );

  return {
    profile,
    isComplete,
    isLoading,
    checkProfile,
    completeProfile,
  };
}
