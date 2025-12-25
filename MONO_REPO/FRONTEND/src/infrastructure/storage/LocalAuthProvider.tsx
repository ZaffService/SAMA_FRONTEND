"use client";

import { AuthContext } from "./AuthContext";
import { useProvideAuth } from "./useAuth";
import type { ReactNode } from "react";

export function LocalAuthProvider({ children }: { children: ReactNode }) {
  const auth = useProvideAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
