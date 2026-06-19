"use client";

import type React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lock } from "lucide-react";
import { ProfileCompletionSuccess } from "@/components/profile-completion/profile-completion-success";

const STEPPER_LABELS = ["Profil", "Localisation", "Finalisation"] as const;

const STEP_SIDEBAR = [
  {
    title: "Vos informations",
    description:
      "Quelques informations pour personnaliser votre parcours et déverrouiller la plateforme.",
  },
  {
    title: "Localisation & contact",
    description:
      "Indiquez votre zone géographique et votre numéro de contact.",
  },
  {
    title: "Dernière étape",
    description: "Accessibilité et consentement avant de démarrer.",
  },
] as const;

type ProfileCompletionShellProps = {
  children: React.ReactNode;
  actions?: React.ReactNode;
  currentStep: number;
  totalSteps?: number;
  firstName?: string;
  isLoading?: boolean;
  loadingMessage?: string;
  showSuccess?: boolean;
};

function Stepper({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <div className="mb-6 flex w-full items-center justify-center px-2 sm:mb-8">
      <div className="flex w-full max-w-lg items-center">
        {STEPPER_LABELS.slice(0, totalSteps).map((label, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isLast = index === totalSteps - 1;

          return (
            <div
              key={label}
              className={["flex items-center", isLast ? "" : "flex-1"].join(
                " ",
              )}
            >
              <div className="flex flex-col items-center gap-1.5">
                <motion.div
                  layout
                  className={[
                    "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all sm:h-10 sm:w-10",
                    isCompleted
                      ? "bg-white text-[oklch(0.46_0.24_268)] shadow-md"
                      : isActive
                        ? "bg-white text-[oklch(0.46_0.24_268)] shadow-[0_0_0_4px_rgba(255,255,255,0.25)] ring-2 ring-white/40"
                        : "bg-white/15 text-white/50",
                  ].join(" ")}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : (
                    index + 1
                  )}
                </motion.div>
                <span
                  className={[
                    "hidden text-[10px] font-semibold uppercase tracking-wide sm:block sm:text-xs",
                    isActive || isCompleted ? "text-white" : "text-white/45",
                  ].join(" ")}
                >
                  {label}
                </span>
              </div>
              {!isLast && (
                <div className="mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-white/15 sm:mx-3">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#DA1712] to-white"
                    initial={{ width: "0%" }}
                    animate={{
                      width: isCompleted ? "100%" : isActive ? "50%" : "0%",
                    }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ProfileCompletionShell({
  children,
  actions,
  currentStep,
  totalSteps = 3,
  firstName,
  isLoading,
  loadingMessage = "Chargement…",
  showSuccess = false,
}: ProfileCompletionShellProps) {
  const progress = Math.round(((currentStep + 1) / totalSteps) * 100);
  const sidebar = STEP_SIDEBAR[currentStep] ?? STEP_SIDEBAR[0];
  const greetingName = firstName?.trim() || "Apprenant";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b1a]">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-[oklch(0.40_0.22_268)]/40 blur-3xl"
          animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-20 -right-16 h-96 w-96 rounded-full bg-[#DA1712]/20 blur-3xl"
          animate={{ scale: [1.08, 1, 1.08], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1535] via-[#0f1f4d] to-[#070b1a]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="px-4 py-4 sm:px-6 lg:px-10">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-xs font-black text-white ring-1 ring-white/15">
                B
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50 sm:text-xs">
                  Bibocom · E-learning
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-medium text-white/80 ring-1 ring-white/10 sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#DA1712]" />
              Étape obligatoire
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col px-4 pb-6 sm:px-6 lg:px-10 lg:pb-10">
          <div className="mx-auto w-full max-w-5xl flex-1">
            {!isLoading && !showSuccess && (
              <Stepper currentStep={currentStep} totalSteps={totalSteps} />
            )}

            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex min-h-[50vh] flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur-sm"
                >
                  <motion.div
                    className="h-11 w-11 rounded-full border-2 border-white/20 border-t-white"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  <p className="mt-5 text-sm text-white/75">{loadingMessage}</p>
                </motion.div>
              ) : (
                <motion.div
                  key={showSuccess ? "success" : `step-${currentStep}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl shadow-black/30"
                >
                  <div className="grid lg:grid-cols-[minmax(0,340px)_1fr]">
                    {/* Left panel */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-[#0f2d6e] via-[#1a3a8a] to-[#6b21a8] p-6 text-white sm:p-8 lg:min-h-[520px]">
                      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                      <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-[#DA1712]/20 blur-2xl" />

                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55 sm:text-xs">
                        Bibocom · E-learning
                      </p>

                      <h1 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl">
                        Bienvenue,{" "}
                        <span className="bg-gradient-to-r from-white to-[#fda4af] bg-clip-text text-transparent">
                          {greetingName}
                        </span>
                      </h1>

                      <p className="mt-3 text-sm leading-relaxed text-white/70">
                        {showSuccess
                          ? "Votre profil est maintenant complet. Préparez-vous à apprendre !"
                          : sidebar.description}
                      </p>

                      {!showSuccess && (
                        <motion.div
                          layout
                          className="mt-8 rounded-2xl border border-white/15 bg-black/20 p-4 backdrop-blur-sm"
                        >
                          <div className="mb-2 flex items-center justify-between text-xs text-white/60">
                            <span>
                              Étape {currentStep + 1} sur {totalSteps}
                            </span>
                            <span className="font-semibold text-white">
                              {progress}%
                            </span>
                          </div>
                          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/15">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-[#DA1712] to-white"
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                          </div>
                          <p className="text-sm font-bold">{sidebar.title}</p>
                          <p className="mt-1 text-xs text-white/60">
                            {sidebar.description}
                          </p>
                        </motion.div>
                      )}

                      <div className="mt-8 flex items-center gap-2 text-xs text-white/50 lg:absolute lg:bottom-8 lg:left-8 lg:right-8">
                        <Lock className="h-3.5 w-3.5 shrink-0" />
                        <span>Vos données sont chiffrées et protégées</span>
                      </div>
                    </div>

                    {/* Right panel */}
                    <div className="flex min-h-[380px] flex-col bg-[#f4f6fb] p-5 sm:p-8 lg:min-h-[520px]">
                      <div className="flex-1">
                        {showSuccess ? (
                          <ProfileCompletionSuccess />
                        ) : (
                          children
                        )}
                      </div>
                      {!showSuccess && actions && (
                        <div className="mt-8 border-t border-slate-200/80 pt-6">
                          {actions}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        <footer className="px-4 py-4 text-center text-[11px] text-white/40 sm:text-xs">
          Vous devez compléter votre profil pour accéder à la plateforme.
        </footer>
      </div>
    </div>
  );
}
