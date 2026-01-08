"use client";

import React from "react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 overflow-hidden opacity-5">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-600 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-red-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 text-center px-8 max-w-2xl mx-auto">
        {/* BIBOCOM Logo */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl font-bold text-blue-600">BIBOCOM</span>
            <span className="text-xs font-semibold text-red-500 bg-red-100 px-2 py-1 rounded">
              DIGITAL
            </span>
          </div>
        </div>

        {/* 404 Animation */}
        <div className="mb-8">
          <div className="relative inline-block">
            {/* Big 404 with gradient */}
            <h1 className="text-9xl font-bold bg-gradient-to-r from-blue-600 to-red-500 bg-clip-text text-transparent animate-pulse">
              404
            </h1>

            {/* Decorative elements */}
            <div className="absolute -top-4 -left-4 w-8 h-8 border-4 border-blue-600 rounded-full animate-bounce"></div>
            <div className="absolute -top-4 -right-4 w-6 h-6 border-4 border-red-500 rounded-full animate-bounce delay-300"></div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-7 h-7 border-4 border-blue-600 rounded-full animate-bounce delay-150"></div>
          </div>
        </div>

        {/* Error message */}
        <div className="space-y-4 mb-10">
          <h2 className="text-3xl font-bold text-gray-800">
            Oups ! Page non trouvée
          </h2>
          <p className="text-gray-600 text-lg max-w-md mx-auto">
            La page que vous recherchez semble avoir disparu ou n'existe pas.
          </p>
        </div>

        {/* Illustration - Sad mascot */}
        <div className="mb-10 flex justify-center">
          <div className="relative">
            {/* Sad mascot body */}
            <div className="w-20 h-24 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full relative shadow-lg mx-auto">
              {/* Sad eyes */}
              <div className="absolute top-8 left-3 w-3 h-3 bg-white rounded-full"></div>
              <div className="absolute top-8 right-3 w-3 h-3 bg-white rounded-full"></div>
              {/* Tear drop */}
              <div className="absolute top-11 left-5 w-2 h-3 bg-blue-300 rounded-full animate-drip"></div>
              {/* Sad mouth */}
              <div className="absolute top-14 left-1/2 transform -translate-x-1/2 w-8 h-4 border-t-2 border-white rounded-full"></div>
            </div>

            {/* Question marks floating */}
            <div className="absolute -top-2 -left-8 text-4xl text-blue-600 animate-float">
              ?
            </div>
            <div className="absolute -top-4 -right-8 text-3xl text-red-500 animate-float delay-300">
              ?
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="/"
            className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Retour à l'accueil
          </a>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-all duration-300"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Page précédente
          </button>
        </div>

        {/* Help text */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            Besoin d'aide ?{" "}
            <a
              href="/contact"
              className="text-blue-600 hover:underline font-semibold"
            >
              Contactez notre support
            </a>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes drip {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(15px);
            opacity: 0;
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translateY(-15px) rotate(10deg);
            opacity: 0.7;
          }
        }

        .animate-drip {
          animation: drip 2s ease-in-out infinite;
        }

        .animate-float {
          animation: float 2s ease-in-out infinite;
        }

        .delay-150 {
          animation-delay: 150ms;
        }

        .delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </div>
  );
}
