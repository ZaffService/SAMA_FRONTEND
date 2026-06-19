"use client";

import Link from "next/link";
import { ArrowLeft, Shield, Settings2 } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ChangePasswordCard } from "@/components/account/change-password-card";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";

export default function ParametresPage() {
  const { user } = useLocalAuth();

  const dashboardHref =
    user?.role === "ADMIN"
      ? "/admin-dashboard"
      : user?.role === "INSTRUCTOR"
        ? "/instructor-dashboard"
        : "/student-dashboard";

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email || "Mon compte";

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-[#e9eff4] via-[#f4f7fa] to-white">
      <Header />

      <main className="flex-1 flex items-start justify-center px-4 py-10 sm:px-6 sm:py-12 pt-24 sm:pt-28 lg:pt-32">
        <div className="w-full max-w-lg sm:max-w-xl">
          <Link
            href={dashboardHref}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-[#002c75]"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au tableau de bord
          </Link>

          <div className="overflow-hidden rounded-2xl border border-white/60 bg-linear-to-br from-[#002c75] via-[#003d99] to-[#0052cc] p-8 text-center text-white shadow-[0_20px_50px_-20px_rgba(0,44,117,0.55)]">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
              <Settings2 className="h-8 w-8" strokeWidth={1.75} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Paramètres
            </h1>
            <p className="mt-2 text-sm text-blue-100/90 sm:text-base">
              Gérez la sécurité de votre compte
            </p>
            <p className="mt-4 inline-flex items-center rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-blue-50 ring-1 ring-white/20 sm:text-sm">
              {displayName}
            </p>
          </div>

          <div className="mt-6">
            <ChangePasswordCard variant="standalone" />
          </div>

          <div className="mt-6 rounded-2xl border border-blue-100/80 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                <Shield className="h-5 w-5 text-[#002c75]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Conseils de sécurité
                </h2>
                <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-gray-600 sm:text-sm">
                  <li>Utilisez au moins 6 caractères avec lettres et chiffres.</li>
                  <li>Ne réutilisez pas un mot de passe d&apos;un autre service.</li>
                  <li>Ne partagez jamais votre mot de passe avec personne.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
