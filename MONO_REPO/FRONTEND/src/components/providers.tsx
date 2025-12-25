"use client";

import { ToastProvider } from "@/infrastructure/storage/ToastContext";
import { LocalAuthProvider } from "@/infrastructure/storage/LocalAuthProvider";
import { AvatarProvider } from "@/infrastructure/storage/AvatarContext";
import { LoadingProvider } from "@/components/loading-provider";
import { QueryProvider } from "@/shared/helpers/query-client";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <ToastProvider>
        <LocalAuthProvider>
          <AvatarProvider>
            <LoadingProvider>{children}</LoadingProvider>
          </AvatarProvider>
        </LocalAuthProvider>
      </ToastProvider>
    </QueryProvider>
  );
}
