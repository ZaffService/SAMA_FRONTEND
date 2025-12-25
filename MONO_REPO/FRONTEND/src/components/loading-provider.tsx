"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { PageLoader } from "./loading-spinner";

const LoadingContext = createContext<{
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}>({
  isLoading: true,
  setIsLoading: () => {},
});

export function useLoading() {
  return useContext(LoadingContext);
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // 📌 PAS de sessionStorage! Chargement normal
    const timer = setTimeout(() => {
      setIsLoading(false);
      setTimeout(() => setShowContent(true), 10);
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  if (!showContent) {
    return <PageLoader />;
  }

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}
