"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  GoogleLogin,
  useGoogleOAuth,
  type CredentialResponse,
} from "@react-oauth/google";

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
  const { clientId, scriptLoadedSuccessfully } = useGoogleOAuth();
  const gsiMaxWidth = 400;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [buttonWidth, setButtonWidth] = useState<number>(0);
  const canUseGsi = Boolean(clientId) && scriptLoadedSuccessfully;
  const effectiveGsiWidth =
    buttonWidth > 0 ? Math.min(buttonWidth, gsiMaxWidth) : gsiMaxWidth;
  const scaleX =
    buttonWidth > 0 && effectiveGsiWidth > 0
      ? buttonWidth / effectiveGsiWidth
      : 1;

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateWidth = () => {
      const nextWidth = Math.floor(element.getBoundingClientRect().width);
      if (nextWidth > 0) {
        setButtonWidth(nextWidth);
      }
    };

    updateWidth();

    if (typeof window === "undefined") return;

    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(() => updateWidth());
      observer.observe(element);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", updateWidth);
    return () => {
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  const handleSuccess = (credentialResponse: CredentialResponse) => {
    const idToken = credentialResponse.credential;
    if (!idToken || !idToken.trim()) {
      onError?.();
      return;
    }

    onSuccess(idToken);
  };

  const handleUnavailableClick = () => {
    if (isLoading) return;
    onError?.();
  };

  return (
    <div className="w-full">
      <div className="w-full">
        <div
          ref={containerRef}
          className="relative w-full"
        >
          <div
            className={`w-full ${isLoading ? "pointer-events-none opacity-70" : ""}`}
          >
            {canUseGsi ? (
              <div className="w-full">
                <div
                  className="origin-left"
                  style={{ transform: scaleX !== 1 ? `scaleX(${scaleX})` : undefined }}
                >
                  <GoogleLogin
                    onSuccess={handleSuccess}
                    onError={onError}
                    shape="rectangular"
                    text="continue_with"
                    theme="outline"
                    size="large"
                    logo_alignment="center"
                    width={effectiveGsiWidth}
                    useOneTap={false}
                    containerProps={{
                      className: "w-full",
                      style: { width: `${effectiveGsiWidth}px`, minHeight: "44px" },
                    }}
                  />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleUnavailableClick}
                className="h-11 w-full rounded-md border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500 transition-colors hover:bg-slate-100"
              >
                Continuer avec Google
              </button>
            )}
          </div>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-md bg-white/70 backdrop-blur-[1px]">
              <Loader2 className="h-5 w-5 animate-spin text-[#002c75]" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
