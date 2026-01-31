"use client";

import { useState } from "react";
import { OptimizedImage } from "@/components/optimized-image";
import { useRouter } from "next/navigation";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import type { Course } from "@/domain/entities/course";
import { BackendCourse } from "@/infrastructure/api/courses-api";

interface CourseCardProps {
  course: BackendCourse;
  onEnrollClick?: (course: BackendCourse) => void;
  onVideoClick?: (course: BackendCourse) => void;
  isEnrolled?: boolean;
  progress?: number;
}

/**
 * ✅ UTILITAIRE D’AFFICHAGE
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

  const rawCategory = course.categoryName || "Non catégorisé";

  const category = isValidDisplayValue(rawCategory)
    ? rawCategory
    : "Non catégorisé";

  const [thumbnailSrc, setThumbnailSrc] = useState(
    course.thumbnailUrl || "/Fallback.png",
  );

  const handleThumbnailError = () => {
    setThumbnailSrc("/placeholder.jpg");
  };

  const isFree = Number(course.price) == 0;
  const isPremium = Number(course.price) > 0;
  const price = course.price;

  const instructor = course.instructorName || "Instructeur";

  const enrolledStudents =
    Number(course.enrollmentCount) > 0 ? course.enrollmentCount : null;

  const rating = null;

  const duration = null;

  const handleClick = () => {
    if (!isAuthenticated) {
      setRedirectAfterLogin(`/course-details/${course.id}`);
      router.push("/login");
      return;
    }
    router.push(`/course-details/${course.id}`);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("fr-FR").format(price);

  return (
    <div
      onClick={handleClick}
      className="
        group cursor-pointer w-full rounded-xl overflow-hidden bg-white
        border border-gray-200 shadow-sm hover:shadow-xl
        transition-all duration-300 hover:-translate-y-1
        flex flex-col h-full
      "
    >
      {/* Image */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-gray-100">
        <OptimizedImage
          src={thumbnailSrc}
          alt={title}
          width={640}
          height={360}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={handleThumbnailError}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20" />

        {/* Badges top */}
        <div className="absolute top-3 left-3 right-3 flex justify-between gap-2">
          <div className="flex gap-2">
            {isEnrolled && (
              <span className="bg-green-500 text-white text-xs px-2.5 py-1 rounded-md">
                Inscrit
              </span>
            )}
            {isPremium && !isEnrolled && (
              <span className="bg-purple-600 text-white text-xs px-2.5 py-1 rounded-md">
                ✨ Premium
              </span>
            )}
          </div>

          {isFree && (
            <span className="bg-green-500 text-white text-xs px-2.5 py-1 rounded-md">
              Gratuit
            </span>
          )}
        </div>

        {/* Badges bottom */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between gap-2">
          {duration && (
            <span className="bg-blue-600/90 text-white text-xs px-2.5 py-1 rounded-md">
              {duration}
            </span>
          )}

          <div className="flex gap-2">
            {rating && (
              <span className="bg-yellow-500/90 text-white text-xs px-2.5 py-1 rounded-md">
                {rating}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        <span className="text-xs font-semibold text-blue-600 uppercase">
          {category}
        </span>

        <h3 className="font-bold text-gray-900 line-clamp-2">{title}</h3>

        {instructor && (
          <span className="text-sm text-gray-600">{instructor}</span>
        )}

        <div className="flex-1" />

        <div className="border-t pt-3">
          {isEnrolled ? (
            // progress && progress > 0 && (
            //   <div>
            //     <div className="flex justify-between text-xs mb-1">
            //       <span>Progression</span>
            //       <span>{progress}%</span>
            //     </div>
            //     <div className="h-2 bg-gray-200 rounded">
            //       <div
            //         className="h-full bg-blue-600 rounded"
            //         style={{ width: `${progress}%` }}
            //       />
            //     </div>
            //   </div>
            // )
            <></>
          ) : (
            <div className="flex justify-between">
              <span className="text-gray-500">Prix</span>
              {isFree ? (
                <span className="text-green-600 font-bold">Gratuit</span>
              ) : (
                <span className="font-bold">{formatPrice(price)} FCFA</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
