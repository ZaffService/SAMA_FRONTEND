"use client";

import React from "react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 overflow-hidden opacity-5">
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-600 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-red-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 text-center w-full max-w-2xl px-8">
        {/* BIBOCOM Logo */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-3xl font-bold text-blue-600">BIBOCOM</span>
            <span className="text-xs font-semibold text-red-500 bg-red-100 px-2 py-1 rounded">
              DIGITAL
            </span>
          </div>
        </div>

        {/* Main spinner container - BIBOCOM colors */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          {/* Outer rotating ring - Blue */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-600 animate-spin"></div>

          {/* Middle rotating ring - Red */}
          <div className="absolute inset-3 rounded-full border-4 border-transparent border-b-red-500 border-l-red-500 animate-spin-reverse"></div>

          {/* Inner pulsing circle */}
          <div className="absolute inset-6 rounded-full bg-gradient-to-br from-blue-100 to-red-100 animate-pulse"></div>

          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-blue-600 rounded-full shadow-lg shadow-blue-600/50 animate-ping"></div>
            <div className="absolute w-3 h-3 bg-blue-600 rounded-full"></div>
          </div>
        </div>

        {/* Loading text */}
        <div className="space-y-3 mb-12">
          <h2 className="text-2xl font-bold text-gray-800">
            Inscription en cours
          </h2>

          {/* Animated dots - BIBOCOM colors */}
          <div className="flex items-center justify-center gap-1.5">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce delay-150"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-300"></div>
          </div>

          <p className="text-gray-500 text-sm mt-4">
            Veuillez patienter un instant...
          </p>
        </div>

        {/* Bottom progress bar */}
        <div className="mt-8 w-full max-w-md mx-auto h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-600 to-red-500 rounded-full animate-progress"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }

        .animate-spin-reverse {
          animation: spin-reverse 1.5s linear infinite;
        }

        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
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
