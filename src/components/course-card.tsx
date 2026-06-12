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
  variant?: "default" | "compact";
  resumeLessonId?: string | number | null;
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
  variant = "default",
  resumeLessonId = null,
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
  const progressValue =
    typeof progress === "number" && Number.isFinite(progress)
      ? Math.max(0, Math.min(100, Math.round(progress)))
      : null;

  const handleClick = () => {
    if (!isAuthenticated) {
      setRedirectAfterLogin(`/course-details/${course.id}`);
      router.push("/login");
      return;
    }
    if (isEnrolled && resumeLessonId) {
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "last_activity",
            JSON.stringify({
              courseId: course.id,
              lessonId: resumeLessonId.toString(),
            }),
          );
        }
      } catch {
        // ignore
      }
      router.push(`/course-details/${course.id}`);
      return;
    }

    router.push(`/course-details/${course.id}`);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(price);

  return (
    <div
      onClick={handleClick}
      className={
        variant === "compact"
          ? "group cursor-pointer w-full rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-full"
          : "group cursor-pointer w-full rounded-2xl overflow-hidden bg-white shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 flex flex-col h-full"
      }
    >
      {/* Image */}
      <div
        className={
          variant === "compact"
            ? "relative w-full aspect-video overflow-hidden bg-gray-50"
            : "relative w-full aspect-4/3 overflow-hidden bg-gray-50"
        }
      >
        <OptimizedImage
          src={thumbnailSrc}
          alt={title}
          width={640}
          height={480}
          className={
            variant === "compact"
              ? "w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
              : "w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          }
          onError={handleThumbnailError}
        />

        {/* Badge Premium en haut-gauche */}
        {isPremium && !isEnrolled && (
          <div className={variant === "compact" ? "absolute top-2 left-2" : "absolute top-3 left-3"}>
            <span
              className={
                variant === "compact"
                  ? "bg-[#4169E1] text-white text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-sm"
                  : "bg-[#4169E1] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1"
              }
            >
              ✨ Premium
            </span>
          </div>
        )}

        {/* Badge Gratuit en haut-droite */}
        {isFree && !isEnrolled && (
          <div className={variant === "compact" ? "absolute top-2 right-2" : "absolute top-3 right-3"}>
            <span
              className={
                variant === "compact"
                  ? "bg-[#10B981] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm"
                  : "bg-[#10B981] text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg"
              }
            >
              Gratuit
            </span>
          </div>
        )}

        {/* Badge Inscrit */}
        {isEnrolled && (
          <div className={variant === "compact" ? "absolute top-2 right-2" : "absolute top-3 right-3"}>
            <span
              className={
                variant === "compact"
                  ? "bg-[#3B82F6] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm"
                  : "bg-[#3B82F6] text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg"
              }
            >
              Inscrit
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className={
          variant === "compact"
            ? "p-4 flex flex-col flex-1 gap-3"
            : "p-6 flex flex-col flex-1 gap-4 bg-linear-to-b from-white to-gray-50"
        }
      >
        <h3
          className={
            variant === "compact"
              ? "font-semibold text-slate-900 text-sm sm:text-base line-clamp-2 leading-snug"
              : "font-bold text-[#2B3E91] text-lg line-clamp-2 text-center leading-snug min-h-14"
          }
        >
          {title}
        </h3>

        {variant === "compact" && progressValue !== null && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Progression</span>
              <span className="font-semibold text-slate-800">{progressValue}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: `${progressValue}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex-1" />

        {/* Prix / Gratuit */}
        <div className="mt-auto">
          {isEnrolled ? (
            <div
              className={
                variant === "compact"
                  ? "bg-blue-600 text-white text-center py-2.5 px-3 rounded-lg font-semibold text-sm"
                  : "bg-[#3B82F6] text-white text-center py-3 px-4 rounded-lg font-bold text-base shadow-lg"
              }
            >
              Reprendre
            </div>
          ) : isFree ? (
            <div
              className={
                variant === "compact"
                  ? "bg-blue-600 text-white text-center py-2.5 px-3 rounded-lg font-semibold text-sm"
                  : "bg-[#3B82F6] text-white text-center py-3 px-4 rounded-lg font-bold text-base shadow-lg"
              }
            >
              Aperçu
            </div>
          ) : (
            <div
              className={
                variant === "compact"
                  ? "bg-red-600 text-white text-center py-2.5 px-3 rounded-lg font-semibold text-sm"
                  : "bg-linear-to-r from-[#EF4444] to-[#DC2626] text-white text-center py-3 px-4 rounded-lg font-bold text-base shadow-lg hover:shadow-xl transition-shadow"
              }
            >
              {formatPrice(price)} FCFA
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
