"use client";

import { ToastProvider } from "@/infrastructure/storage/ToastContext";
import { LocalAuthProvider } from "@/infrastructure/storage/LocalAuthProvider";
import { AvatarProvider } from "@/infrastructure/storage/AvatarContext";
import { LoadingProvider } from "@/components/loading-provider";
import { QueryProvider } from "@/shared/helpers/query-client";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { ProfileCompletionGuard } from "@/components/profile-completion-guard";
import { DisableHtmlValidation } from "@/components/disable-html-validation";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryProvider>
        <ToastProvider>
          <LocalAuthProvider>
            <AvatarProvider>
              <LoadingProvider>
                <DisableHtmlValidation />
                <ProfileCompletionGuard>{children}</ProfileCompletionGuard>
              </LoadingProvider>
            </AvatarProvider>
          </LocalAuthProvider>
        </ToastProvider>
      </QueryProvider>
    </GoogleOAuthProvider>
  );
}
