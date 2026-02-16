"use client";

import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { GraduationCap, Globe, Users, Briefcase } from "lucide-react";

interface FeatureItem {
  icon: React.ReactNode;
  label: string;
}

const features: FeatureItem[] = [
  {
    icon: <GraduationCap className="w-12 h-12 md:w-16 md:h-16 text-[var(--bibocom-blue)]" />,
    label: "Formations 100% Pratiques en Langue Locale",
  },
  {
    icon: <Globe className="w-12 h-12 md:w-16 md:h-16 text-[var(--bibocom-blue)]" />,
    label: "Accès en ligne et présentiel",
  },
  {
    icon: <Users className="w-12 h-12 md:w-16 md:h-16 text-[var(--bibocom-orange)]" />,
    label: "Formateurs Experts",
  },
  {
    icon: <Briefcase className="w-12 h-12 md:w-16 md:h-16 text-[var(--bibocom-blue)]" />,
    label: "Compétences pour l'emploi / entrepreneuriat",
  },
];

const WhyChooseBibocom = () => {
  const { isAuthenticated } = useLocalAuth();

  // Ne pas afficher si l'utilisateur est connecté
  if (isAuthenticated) {
    return null;
  }

  return (
    <section className="bg-[var(--bibocom-gray-bg)] py-12 md:py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Title with decorative lines */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 md:gap-8 mb-10 md:mb-14">
          <div className="hidden sm:block h-[2px] bg-[var(--bibocom-blue)]/30 flex-1 max-w-[120px] lg:max-w-[200px]" />
          <h2 className="text-center">
            <style jsx>{`
              h2 strong {
                font-size: 1.25rem !important;
                line-height: 1.3 !important;
              }
              @media (min-width: 640px) {
                h2 strong {
                  font-size: 1.5rem !important;
                }
              }
              @media (min-width: 768px) {
                h2 strong {
                  font-size: 2rem !important;
                }
              }
              @media (min-width: 1024px) {
                h2 strong {
                  font-size: 2.5rem !important;
                }
              }
            `}</style>
            <strong className="text-[var(--bibocom-blue)] font-bold">
              Pourquoi choisir{" "}
            </strong>
            <strong className="text-[var(--bibocom-red)] font-bold">
              BIBOCOM
            </strong>
            <strong className="text-[var(--bibocom-blue)] font-bold">
              {" "}Digital ?
            </strong>
          </h2>
          <div className="hidden sm:block h-[2px] bg-[var(--bibocom-blue)]/30 flex-1 max-w-[120px] lg:max-w-[200px]" />
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 md:p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="mb-4">{feature.icon}</div>
              <p className="text-sm md:text-base font-medium text-foreground">
                {feature.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseBibocom;