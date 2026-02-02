"use client";

import { ChevronRight, ChevronDown } from "lucide-react";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";

const steps = [
  { number: 1, text: "Inscrivez-vous" },
  { number: 2, text: "Suivez les cours en ligne" },
  { number: 3, text: "Obtenez votre attestation" },
];

const HowItWorks = () => {
  const { isAuthenticated } = useLocalAuth();

  // Masquer si l'utilisateur est connecté
  if (isAuthenticated) {
    return null;
  }

  return (
    <section className="py-40 px-4 bg-[#e8f4fc]">
      {/* Title with dotted lines */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <div className="flex-1 max-w-[200px] border-t-2 border-dashed border-[#1a5fb4]/30"></div>
        <h2 className="text-2xl md:text-3xl font-bold text-[#1a5fb4] text-center whitespace-nowrap">
          Comment ça marche ?
        </h2>
        <div className="flex-1 max-w-[200px] border-t-2 border-dashed border-[#1a5fb4]/30"></div>
      </div>

      {/* Steps card - Pilule arrondie */}
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-full shadow-lg px-8 py-6">
          {/* Desktop: Horizontal layout */}
          <div className="hidden md:flex items-center justify-center">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                {/* Connector line before number */}
                {index > 0 && (
                  <div className="w-8 h-0.5 bg-gray-300"></div>
                )}
                
                {/* Number circle - Red */}
                <div className="w-10 h-10 rounded-full bg-[#d93030] flex-shrink-0 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {step.number}
                </div>
                
                {/* Step text */}
                <span className="text-[#1a3a5c] font-medium text-base ml-3 whitespace-nowrap">
                  {step.text}
                </span>

                {/* Chevron arrow (except for last item) */}
                {index < steps.length - 1 && (
                  <div className="flex items-center text-gray-400 mx-3">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile: Vertical layout */}
          <div className="md:hidden flex flex-col items-center gap-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center gap-3">
                {/* Number circle - Red */}
                <div className="w-10 h-10 rounded-full bg-[#d93030] flex-shrink-0 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {step.number}
                </div>
                
                {/* Step text */}
                <span className="text-[#1a3a5c] font-medium text-base whitespace-nowrap">
                  {step.text}
                </span>

                {/* Chevron down (except for last item) */}
                {index < steps.length - 1 && (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
