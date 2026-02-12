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
          variant="outline"
          disabled
          className="w-full h-10 lg:h-12 text-sm lg:text-base font-medium bg-[#0A2A66] text-white"
        >
          <Loader2 className="mr-2 h-4 w-4 lg:h-5 lg:w-5 animate-spin" />
          Connexion...
        </Button>
      ) : (
        <div className="w-full flex justify-center">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={onError}
            shape="rectangular"
            text="continue_with"
            theme="filled_blue"
            size="large"
            useOneTap={false}
          />
        </div>
      )}
    </div>
  );
}
