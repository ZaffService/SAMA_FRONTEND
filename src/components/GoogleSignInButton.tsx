"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";

interface GoogleSignInButtonProps {
  onSuccess: (idToken: string) => void;
  onError?: () => void;
  isLoading: boolean;
}

export function GoogleSignInButton({
  onSuccess,
  onError,
  isLoading,
}: GoogleSignInButtonProps) {
  const buttonStyleClass =
    "w-full h-10 lg:h-12 text-sm lg:text-base font-medium bg-[#002c75] hover:bg-[#001a4d] transition-colors text-white";

  const handleSuccess = (credentialResponse: CredentialResponse) => {
    const idToken = credentialResponse.credential;
    if (!idToken || !idToken.trim()) {
      onError?.();
      return;
    }

    onSuccess(idToken);
  };

  return (
    <div className="w-full">
      {isLoading ? (
        <Button
          type="button"
          disabled
          className={buttonStyleClass}
        >
          <Loader2 className="mr-2 h-4 w-4 lg:h-5 lg:w-5 animate-spin" />
          Connexion...
        </Button>
      ) : (
        <div className="relative w-full overflow-hidden rounded-md">
          <Button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className={`${buttonStyleClass} pointer-events-none`}
          >
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-sm bg-white">
              <svg
                aria-hidden="true"
                viewBox="0 0 48 48"
                className="h-4 w-4"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.73 1.22 9.24 3.6l6.9-6.9C35.94 2.3 30.41 0 24 0 14.61 0 6.51 5.38 2.56 13.22l8.04 6.24C12.48 13.88 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.5 24.5c0-1.67-.15-3.27-.42-4.8H24v9.1h12.7c-.55 2.92-2.2 5.4-4.7 7.08l7.3 5.67C43.82 37.37 46.5 31.52 46.5 24.5z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.6 28.54A14.5 14.5 0 0 1 9.5 24c0-1.57.27-3.09.75-4.54l-8.04-6.24A24 24 0 0 0 0 24c0 3.87.93 7.52 2.57 10.78l8.03-6.24z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.41 0 11.8-2.11 15.73-5.75l-7.3-5.67c-2.02 1.36-4.6 2.17-8.43 2.17-6.25 0-11.52-4.38-13.4-10.25l-8.03 6.24C6.52 42.62 14.61 48 24 48z"
                />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
            </span>
            Continuer avec Google
          </Button>

          <div className="absolute inset-0 z-10 h-full w-full opacity-0">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={onError}
              shape="rectangular"
              text="continue_with"
              theme="filled_blue"
              size="large"
              width={420}
              useOneTap={false}
              containerProps={{
                className: "h-full w-full",
                style: { width: "100%", height: "100%" },
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
