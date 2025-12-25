"use client";

import { Lock } from "lucide-react";

interface LockedVideoOverlayProps {
  onUnlockClick: () => void;
}

export function LockedVideoOverlay({ onUnlockClick }: LockedVideoOverlayProps) {
  return (
    <div className="absolute inset-0 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
      {/* Background décoratif STATIQUE (pas de vidéo) */}
      <div className="absolute inset-0">
        <div className="w-full h-full bg-gradient-to-br from-blue-500/40 via-purple-500/40 to-pink-500/40 blur-3xl animate-pulse"></div>
      </div>

      {/* Contenu de verrouillage */}
      <div className="relative z-10 text-center text-white p-8 max-w-md">
        <div className="w-20 h-20 bg-white/15 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <Lock className="w-10 h-10 text-white" strokeWidth={2} />
        </div>

        <h2 className="text-3xl font-bold mb-4 drop-shadow-lg">Contenu Verrouillé</h2>

        <p className="text-white/90 mb-8 leading-relaxed text-lg drop-shadow-md">
          Inscrivez-vous à ce cours pour accéder à toutes les vidéos et ressources
        </p>

        <button
          onClick={onUnlockClick}
          className="inline-flex items-center gap-3 bg-pink-600 hover:bg-pink-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
        >
          <Lock className="w-5 h-5" />
          S'inscrire pour regarder
        </button>
      </div>
    </div>
  );
}