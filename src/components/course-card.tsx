"use client";

import { useState } from "react";
import { OptimizedImage } from "@/components/optimized-image";
import { useRouter } from "next/navigation";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { BackendCourse } from "@/infrastructure/api/courses-api";

interface CourseCardProps {
  course: BackendCourse;
  onEnrollClick?: (course: BackendCourse) => void;
  onVideoClick?: (course: BackendCourse) => void;
  isEnrolled?: boolean;
  progress?: number;
}

/**
 * ✅ UTILITAIRE D'AFFICHAGE
 * Supprime : "00", "0", "00:00", "", null, undefined
 */
const isValidDisplayValue = (value?: string | number | null) => {
  if (value === null || value === undefined) return false;
  const v = String(value).trim();
  return v !== "" && v !== "0" && v !== "00" && v !== "00:00";
};

export function CourseCard({
  course,
  isEnrolled = false,
  progress,
}: CourseCardProps) {
  const router = useRouter();
  const { isAuthenticated, setRedirectAfterLogin } = useLocalAuth();

  const title = isValidDisplayValue(course.title)
    ? course.title
    : "Titre non disponible";

  const [thumbnailSrc, setThumbnailSrc] = useState(
    course.thumbnailUrl || "/Fallback.png",
  );

  const handleThumbnailError = () => {
    setThumbnailSrc("/placeholder.jpg");
  };

  const isFree = Number(course.price) == 0;
  const isPremium = Number(course.price) > 0;
  const price = course.price;

  const handleClick = () => {
    if (!isAuthenticated) {
      setRedirectAfterLogin(`/course-details/${course.id}`);
      router.push("/login");
      return;
    }
    router.push(`/course-details/${course.id}`);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(price);

  return (
    <div
      onClick={handleClick}
      className="
        group 
        cursor-pointer 
        w-full 
        rounded-2xl 
        overflow-hidden 
        bg-white 
        shadow-md 
        hover:shadow-2xl 
        transition-all 
        duration-300 
        hover:-translate-y-2 
        flex 
        flex-col 
        h-full
      "
    >
      {/* Image */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-50">
        <OptimizedImage
          src={thumbnailSrc}
          alt={title}
          width={640}
          height={480}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          onError={handleThumbnailError}
        />

        {/* Badge Premium en haut-gauche */}
        {isPremium && !isEnrolled && (
          <div className="absolute top-3 left-3">
            <span className="bg-[#4169E1] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1">
              ✨ Premium
            </span>
          </div>
        )}

        {/* Badge Gratuit en haut-droite */}
        {isFree && !isEnrolled && (
          <div className="absolute top-3 right-3">
            <span className="bg-[#10B981] text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
              Gratuit
            </span>
          </div>
        )}

        {/* Badge Inscrit */}
        {isEnrolled && (
          <div className="absolute top-3 right-3">
            <span className="bg-[#3B82F6] text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
              Inscrit
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1 gap-4 bg-gradient-to-b from-white to-gray-50">
        <h3 className="font-bold text-[#2B3E91] text-lg line-clamp-2 text-center leading-snug min-h-[3.5rem]">
          {title}
        </h3>

        <div className="flex-1" />

        {/* Prix / Gratuit */}
        <div className="mt-auto">
          {isEnrolled ? (
            <div className="bg-[#3B82F6] text-white text-center py-3 px-4 rounded-lg font-bold text-base shadow-lg">
              Reprendre
            </div>
          ) : isFree ? (
            <div className="text-center">
              <span
                className="text-[#10B981] font-bold text-3xl"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Gratuit
              </span>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white text-center py-3 px-4 rounded-lg font-bold text-base shadow-lg hover:shadow-xl transition-shadow">
              {formatPrice(price)} FCFA
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
