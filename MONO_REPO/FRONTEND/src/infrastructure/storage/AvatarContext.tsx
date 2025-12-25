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
      const loadAvatarData = async () => {
        try {
          const avatarFromUser =
            (user as any)?.avatar_url ||
            (user as any)?.avatar ||
            (user as any)?.avatarUrl;
          if (avatarFromUser) setAvatarUrl(avatarFromUser);

          const firstNameValue =
            (user as any)?.firstName || (user as any)?.first_name;
          const lastNameValue =
            (user as any)?.lastName || (user as any)?.last_name;

          if (firstNameValue) setFirstName(firstNameValue);
          if (lastNameValue) setLastName(lastNameValue);

          if (!firstNameValue && user?.display_name) {
            const names = user.display_name.split(" ");
            setFirstName(names[0] || null);
            setLastName(names.slice(1).join(" ") || null);
          }
        } catch {
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
