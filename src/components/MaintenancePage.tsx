"use client";

import { useState, useEffect } from "react";
import {
  ServerCrash,
  RefreshCw,
  Mail,
  Activity,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MaintenancePageProps {
  onRetry: () => void;
}

export default function MaintenancePage({ onRetry }: MaintenancePageProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-reconnect timer
  useEffect(() => {
    if (countdown <= 0) {
      setIsRetrying(true);
      setTimeout(() => {
        onRetry();
        setIsRetrying(false);
        setCountdown(30);
      }, 2000);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, onRetry]);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      onRetry();
      setIsRetrying(false);
      setCountdown(30);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full space-y-12">
          
          {/* Hero Section */}
          <div className="text-center space-y-8">
            {/* Icon principale avec animation */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400 rounded-full blur-2xl opacity-20 animate-pulse" />
                <div className="relative bg-white p-8 rounded-full shadow-2xl border border-blue-100">
                  <ServerCrash className="w-16 h-16 sm:w-20 sm:h-20 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Titres */}
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
                Maintenance en cours
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                Nous améliorons votre expérience d&apos;apprentissage
              </p>
            </div>

            {/* Messages informatifs */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-lg max-w-2xl mx-auto">
              <p className="text-gray-700 leading-relaxed">
                Notre équipe technique travaille actuellement sur la plateforme pour vous offrir de nouvelles fonctionnalités. 
                Le service sera rétabli dans les plus brefs délais. Merci pour votre patience.
              </p>
            </div>
          </div>

          {/* Cards Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Card Support */}
            <Card className="bg-white/80 backdrop-blur-sm border-blue-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Besoin d&apos;aide ?
                    </h3>
                    <p className="text-sm text-gray-600">Contactez notre support</p>
                    <a
                      href="mailto:bibocomdigital.com"
                      className="inline-block text-blue-600 hover:text-blue-700 font-medium transition-colors text-sm"
                    >
                      bibocomdigital.com
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card Statut */}
            <Card className="bg-white/80 backdrop-blur-sm border-indigo-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Reconnexion auto
                    </h3>
                    <p className="text-sm text-gray-600">Vérification en cours...</p>
                    <p className="text-indigo-600 font-semibold text-sm">
                      Dans {countdown} secondes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Button */}
          <div className="flex flex-col items-center gap-6">
            <button
              onClick={handleRetry}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              disabled={isRetrying}
              className={`
                group relative flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-white text-lg
                transition-all duration-300 shadow-lg
                ${isRetrying 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-105 hover:shadow-2xl"
                }
              `}
            >
              <RefreshCw className={`w-5 h-5 ${isRetrying || isHovered ? "animate-spin" : ""}`} />
              <span>{isRetrying ? "Connexion en cours..." : "Réessayer maintenant"}</span>
            </button>

            {/* Progress Bar */}
            <div className="w-full max-w-md space-y-3">
              <div className="flex items-center justify-center gap-2 text-gray-600 text-sm">
                <Clock className="w-4 h-4" />
                <span>Reconnexion automatique dans {countdown}s</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${((30 - countdown) / 30) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center">
            {/* Copyright */}
            <p className="text-sm text-gray-600">
              © 2026 Bibocom Digital - Plateforme d&apos;e-learning
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}