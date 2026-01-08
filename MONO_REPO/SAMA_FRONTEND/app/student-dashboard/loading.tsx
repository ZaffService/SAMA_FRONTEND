"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Dashboard Skeleton with Cool Spinner */}
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-300px)]">
          {/* Main spinner container - BIBOCOM colors */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            {/* Outer rotating ring - Blue */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-600 animate-spin"></div>

            {/* Middle rotating ring - Red */}
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-red-500 border-l-red-500 animate-spin-reverse"></div>

            {/* Inner pulsing circle */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-100 to-red-100 animate-pulse"></div>

            {/* Center dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-blue-600 rounded-full shadow-lg shadow-blue-600/50 animate-ping"></div>
              <div className="absolute w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
            </div>
          </div>

          {/* Loading text */}
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-xl font-semibold text-foreground">
              Chargement du tableau de bord
            </h2>

            {/* Animated dots - BIBOCOM colors */}
            <div className="flex items-center justify-center gap-1.5">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce delay-150"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-300"></div>
            </div>

            <p className="text-muted-foreground text-sm">
              Préparation de vos données...
            </p>
          </div>

          {/* Dashboard skeleton preview */}
          <div className="w-full max-w-5xl space-y-6">
            {/* Stats cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-card rounded-lg border p-6 animate-pulse shadow-sm"
                >
                  <div className="h-4 bg-muted rounded w-1/2 mb-3"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </div>
              ))}
            </div>

            {/* Main content skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-lg border p-6 animate-pulse shadow-sm">
                <div className="h-5 bg-muted rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                  <div className="h-4 bg-muted rounded w-4/6"></div>
                </div>
              </div>
              <div className="bg-card rounded-lg border p-6 animate-pulse shadow-sm">
                <div className="h-5 bg-muted rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                  <div className="h-4 bg-muted rounded w-4/6"></div>
                </div>
              </div>
            </div>

            {/* Additional content row */}
            <div className="bg-card rounded-lg border p-6 animate-pulse shadow-sm">
              <div className="h-5 bg-muted rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-11/12"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
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
            .animate-spin-reverse {
              animation: spin-reverse 1.5s linear infinite;
            }
            .delay-150 {
              animation-delay: 150ms;
            }
            .delay-300 {
              animation-delay: 300ms;
            }
          `}</style>
        </div>
      </main>
      <Footer />
    </div>
  );
}
