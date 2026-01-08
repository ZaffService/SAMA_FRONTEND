"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  showLoginSuccess,
  showRegisterSuccess,
  showLogoutSuccess,
  showLoginError,
  showLoadingToast,
  closeLoading,
} from "@/shared/helpers/sweet-alert";

interface ToastContextType {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  loginSuccess: (userName: string) => void;
  registerSuccess: (email: string) => void;
  logoutSuccess: () => void;
  loginError: (message: string) => void;
  loading: (title?: string) => void;
  closeLoading: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const value: ToastContextType = {
    success: showSuccessToast,
    error: showErrorToast,
    warning: showWarningToast,
    info: showInfoToast,
    loginSuccess: showLoginSuccess,
    registerSuccess: showRegisterSuccess,
    logoutSuccess: showLogoutSuccess,
    loginError: showLoginError,
    loading: showLoadingToast,
    closeLoading: closeLoading,
  };

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
