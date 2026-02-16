"use client";

import logger from "@/shared/helpers/logger";
import { useEffect } from "react";

export function ServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // Enregistrer le service worker en développement et production pour optimisation
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          logger.log(
            "Service Worker enregistré avec succès:",
            registration.scope,
          );

          // Gestion des mises à jour - plus rapide
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // Nouvelle version disponible - activation automatique pour rapidité
                  logger.log(
                    "Nouvelle version détectée, activation automatique...",
                  );
                  newWorker.postMessage({ type: "SKIP_WAITING" });
                  // Recharger immédiatement sans confirmation pour fluidité
                  setTimeout(() => window.location.reload(), 100);
                }
              });
            }
          });

          // Optimisation du cache
          if ("caches" in window) {
            // Précharger les ressources critiques
            caches.open("bibo-cache-v1").then((cache) => {
              // Cache des images et ressources statiques
              cache
                .addAll([
                  "/logo.ico",
                  "/images/Orange_money.png",
                  "/images/wave.jpg",
                  "/images/carte_bancaire.jpg",
                ])
                .catch(() => {
                  // Ignore les erreurs de cache
                });
            });
          }
        })
        .catch((error) => {
          logger.error(
            "Erreur lors de l'enregistrement du Service Worker:",
            error,
          );
        });
    }
  }, []);

  return null;
}
