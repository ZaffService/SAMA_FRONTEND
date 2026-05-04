"use client";

import { Check } from "lucide-react";

interface Step {
  id: number;
  title: string;
  description: string;
}

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: Step[];
  onStepClick: (step: number) => void;
}

export const defaultCourseSteps: Step[] = [
  {
    id: 1,
    title: "Informations de base",
    description: "Titre, description, catégorie",
  },
  {
    id: 2,
    title: "Modules et leçons",
    description: "Structure et contenu du cours",
  },
  { id: 3, title: "Quiz", description: "Évaluations" },
  { id: 4, title: "Ressources", description: "Fichiers supplémentaires" },
  { id: 5, title: "Aperçu", description: "Validation finale" },
];

export function StepIndicator({
  currentStep,
  totalSteps: _totalSteps,
  steps,
  onStepClick,
}: StepIndicatorProps) {
  void _totalSteps;
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isClickable = step.id <= currentStep;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => isClickable && onStepClick(step.id)}
                  disabled={!isClickable}
                  className={`
                    h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200
                    ${
                      isCompleted
                        ? "bg-[#34D399] text-[#181721]"
                        : isCurrent
                          ? "bg-[#3B82F6] text-[#FFFFFF] shadow-[0_0_0_4px_rgba(59,130,246,0.2)]"
                          : "border border-[#3B3754] bg-transparent text-[#FFFFFF]"
                    }
                    ${isClickable ? "cursor-pointer hover:scale-105" : "cursor-not-allowed opacity-70"}
                  `}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : step.id}
                </button>

                {/* Step Title */}
                <div className="mt-2 text-center">
                  <p
                    className={`text-sm font-medium ${
                      isCurrent
                        ? "text-[#3B82F6]"
                        : isCompleted
                          ? "text-[#A9F5E5]"
                          : "text-[#FFFFFF]"
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    step.id < currentStep ? "bg-[#34D399]" : "bg-[#3B3754]"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
