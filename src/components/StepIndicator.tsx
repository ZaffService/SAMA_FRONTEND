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
  { id: 1, title: "Informations de base", description: "Titre, description, catégorie" },
  { id: 2, title: "Modules et leçons", description: "Structure et contenu du cours" },
  { id: 3, title: "Quiz", description: "Évaluations" },
  { id: 4, title: "Ressources", description: "Fichiers supplémentaires" },
  { id: 5, title: "Aperçu", description: "Validation finale" },
];

export function StepIndicator({ currentStep, totalSteps, steps, onStepClick }: StepIndicatorProps) {
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
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
                    ${isCompleted
                      ? 'bg-green-600 text-white'
                      : isCurrent
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }
                    ${isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'}
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </button>

                {/* Step Title */}
                <div className="mt-2 text-center">
                  <p className={`text-sm font-medium ${
                    isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 max-w-24">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  step.id < currentStep ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
