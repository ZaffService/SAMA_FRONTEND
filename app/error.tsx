"use client";

import { useState, useEffect } from "react";
import {
  ServerCrash,
  RefreshCw,
  Settings,
  Wrench,
  Cpu,
  Mail,
  Headphones,
  Activity,
  Signal,
  Lightbulb,
  Info,
  Clock,
  Wifi,
  Globe,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import logger from "@/shared/helpers/logger";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Log l'erreur pour debug
    logger.error("[Error Boundary]", error);
  }, [error]);

  // Auto-reconnect timer
  useEffect(() => {
    if (countdown <= 0) {
      setIsRetrying(true);
      setTimeout(() => {
        reset();
        setIsRetrying(false);
        setCountdown(30);
      }, 2000);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, reset]);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      reset();
      setIsRetrying(false);
      setCountdown(30);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden">
        {/* Decorative blue accents */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-50 rounded-full opacity-50" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-50 rounded-full opacity-30" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-50 rounded-full opacity-20" />

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-20 md:py-32">
          {/* Central Illustration with Animated Icons */}
          <div className="flex flex-col items-center justify-center mb-10">
            {/* Main Icon - Server Crash */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-blue-100 rounded-full blur-3xl opacity-50 animate-pulse" />
              <div className="relative bg-blue-50 p-8 rounded-full border-2 border-blue-200">
                <ServerCrash className="w-20 h-20 md:w-24 md:h-24 text-blue-600 animate-bounce" />
              </div>
            </div>

            {/* Decorative Icons Around */}
            <div className="absolute -top-4 -right-8 bg-indigo-50 p-3 rounded-xl border border-indigo-200 animate-pulse">
              <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
            <div className="absolute top-0 -left-12 bg-purple-50 p-3 rounded-xl border border-purple-200 animate-bounce">
              <Wrench className="w-6 h-6 text-purple-600" />
            </div>
            <div className="absolute -bottom-2 -right-12 bg-green-50 p-3 rounded-xl border border-green-200 animate-pulse">
              <Settings className="w-6 h-6 text-green-600" />
            </div>
            <div className="absolute -bottom-4 -left-8 bg-orange-50 p-3 rounded-xl border border-orange-200 animate-bounce">
              <Cpu className="w-6 h-6 text-orange-600" />
            </div>
          </div>

          {/* Messages */}
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Maintenance en cours
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-6">
              Nous améliorons votre expérience d&apos;apprentissage
            </p>
            <div className="text-gray-500 space-y-2 max-w-2xl mx-auto">
              <p>
                Notre équipe technique travaille actuellement sur la plateforme
              </p>
              <p>Nous ajoutons de nouvelles fonctionnalités pour vous</p>
              <p>Le service sera rétabli dans les plus brefs délais</p>
              <p>Merci pour votre patience et votre compréhension</p>
            </div>
          </div>
        </div>
      </section>

      {/* Information Cards Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 - Support */}
          <Card className="bg-blue-50 border-2 border-blue-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Besoin d&apos;aide ?
                  </h3>
                </div>
              </div>
              <p className="text-gray-600 mb-3">Contactez notre support</p>
              <a
                href="mailto:support@bibocomdigital.com"
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                support@bibocomdigital.com
              </a>
            </CardContent>
          </Card>

          {/* Card 2 - Status */}
          <Card className="bg-indigo-50 border-2 border-indigo-200 hover:border-indigo-300 transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-indigo-100 p-3 rounded-xl">
                  <Activity className="w-6 h-6 text-indigo-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Statut du système
                  </h3>
                </div>
              </div>
              <p className="text-gray-600 mb-2">
                Vérification automatique en cours...
              </p>
              <p className="text-indigo-600 font-medium">
                Prochaine tentative dans {countdown}s
              </p>
            </CardContent>
          </Card>

          {/* Card 3 - Suggestions */}
          <Card className="bg-purple-50 border-2 border-purple-200 hover:border-purple-300 transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-purple-100 p-3 rounded-xl">
                  <Lightbulb className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    En attendant...
                  </h3>
                </div>
              </div>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-purple-500" />
                  Vérifiez votre connexion internet
                </li>
                <li className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-purple-500" />
                  Essayez de rafraîchir la page
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-500" />
                  Revenez dans quelques minutes
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Main Action Button */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-8">
        <div className="flex flex-col items-center justify-center">
          <button
            onClick={handleRetry}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            disabled={isRetrying}
            className={`
              group relative flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-white
              transition-all duration-300
              ${
                isRetrying
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 hover:scale-105 hover:shadow-xl"
              }
            `}
          >
            {isRetrying ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Connexion en cours...</span>
              </>
            ) : (
              <>
                <RefreshCw
                  className={`w-5 h-5 ${isHovered ? "animate-spin" : ""}`}
                />
                <span>Réessayer la connexion</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Auto-Reconnect Timer Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="w-5 h-5" />
            <span>Reconnexion automatique dans: {countdown}s</span>
          </div>
          <div className="w-full max-w-md h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-1000 ease-linear"
              style={{ width: `${((30 - countdown) / 30) * 100}%` }}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Globe className="w-6 h-6 text-blue-600" />
              <span className="text-gray-900 font-semibold">
                Bibocom Digital
              </span>
            </div>

            {/* Copyright */}
            <p className="text-sm text-gray-500">
              © 2026 Bibocom Digital - Plateforme d&apos;e-learning
            </p>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm">
              <a
                href="#"
                className="text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1"
              >
                <Signal className="w-4 h-4" />
                Statut
              </a>
              <a
                href="/contact"
                className="text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1"
              >
                <Headphones className="w-4 h-4" />
                Support
              </a>
              <a
                href="/faq"
                className="text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1"
              >
                <Info className="w-4 h-4" />
                FAQ
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
