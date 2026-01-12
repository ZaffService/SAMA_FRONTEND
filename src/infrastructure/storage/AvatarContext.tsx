"use client";

import React, { createContext, useState, useContext, useEffect } from "react";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";

interface AvatarContextType {
  avatarUrl: string | null;
  firstName: string | null;
  lastName: string | null;
  setAvatarUrl: (url: string) => void;
  updateAvatar: (url: string, firstName?: string, lastName?: string) => void;
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

export function AvatarProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useLocalAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      const loadAvatarData = () => {
        try {
          // Avatar URL - vérifier toutes les variations possibles
          const avatarFromUser =
            (user as any)?.avatar_url ||
            (user as any)?.avatar ||
            (user as any)?.avatarUrl;
          setAvatarUrl(avatarFromUser || null);

          // Nom - logique robuste et prioritaire
          let firstNameValue = null;
          let lastNameValue = null;

          // Priorité 1: firstName/lastName (format standard)
          if ((user as any)?.firstName && (user as any)?.lastName) {
            firstNameValue = (user as any).firstName;
            lastNameValue = (user as any).lastName;
          }
          // Priorité 2: first_name/last_name (format API)
          else if ((user as any)?.first_name && (user as any)?.last_name) {
            firstNameValue = (user as any).first_name;
            lastNameValue = (user as any).last_name;
          }
          // Priorité 3: display_name (split automatique)
          else if (user?.display_name && user.display_name.trim()) {
            const names = user.display_name.trim().split(" ");
            firstNameValue = names[0] || null;
            lastNameValue = names.slice(1).join(" ") || null;
          }

          setFirstName(firstNameValue);
          setLastName(lastNameValue);
        } catch (error) {
          console.error("Erreur lors du chargement des données avatar:", error);
          setAvatarUrl(null);
          setFirstName(null);
          setLastName(null);
        }
      };

      loadAvatarData();
    } else {
      setAvatarUrl(null);
      setFirstName(null);
      setLastName(null);
    }
  }, [isAuthenticated, user]);

  const updateAvatar = (
    url: string,
    newFirstName?: string,
    newLastName?: string,
  ) => {
    setAvatarUrl(url);
    if (newFirstName) setFirstName(newFirstName);
    if (newLastName) setLastName(newLastName);
  };

  return (
    <AvatarContext.Provider
      value={{
        avatarUrl,
        firstName,
        lastName,
        setAvatarUrl,
        updateAvatar,
      }}
    >
      {children}
    </AvatarContext.Provider>
  );
}

export function useAvatar() {
  const context = useContext(AvatarContext);
  if (!context) {
    throw new Error("useAvatar must be used within AvatarProvider");
  }
  return context;
}
