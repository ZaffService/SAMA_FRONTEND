"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log l'erreur pour debug (sans révéler à l'utilisateur)
    console.error("[Error Boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full space-y-6 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-destructive/20 rounded-full blur-xl" />
            <div className="relative bg-destructive/10 p-4 rounded-full">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Oops! Une erreur est survenue
          </h1>
          <p className="text-sm text-muted-foreground">
            Nous avons rencontré un problème inattendu. Veuillez réessayer ou
            nous contacter si le problème persiste.
          </p>
        </div>

        {/* Debug info (seulement en dev) */}
        {process.env.NODE_ENV === "development" && error?.message && (
          <div className="bg-muted/50 border border-muted-foreground/20 rounded-lg p-3 text-left">
            <p className="text-xs font-mono text-muted-foreground break-all">
              {error.message}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-4">
          <Button onClick={reset} className="w-full gap-2">
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="w-full"
          >
            Retour à l'accueil
          </Button>
        </div>

        {/* Support link */}
        <p className="text-xs text-muted-foreground">
          Besoin d'aide?{" "}
          <a
            href="/contact"
            className="text-primary hover:underline font-medium"
          >
            Contactez-nous
          </a>
        </p>
      </div>
    </div>
  );
}
