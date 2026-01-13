"use client";

import { useState } from "react";
import { OptimizedImage } from "@/components/optimized-image";
import { useRouter } from "next/navigation";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import type { Course } from "@/domain/entities/course";

interface CourseCardProps {
  course: Course;
  onEnrollClick?: (course: Course) => void;
  onVideoClick?: (course: Course) => void;
  isEnrolled?: boolean;
  progress?: number;
}

export function CourseCard({ course, isEnrolled = false, progress }: CourseCardProps) {
  const router = useRouter();
  const { isAuthenticated, setRedirectAfterLogin } = useLocalAuth();

  const title = course.title;

  const category =
    typeof course.category === "string"
      ? course.category
      : course.category?.name || "Non catégorisé";

  const [thumbnailSrc, setThumbnailSrc] = useState(
    course.thumbnailUrl ||
    course._thumbnailUrl ||
    course.thumbnail ||
    "/placeholder.jpg"
  );

  const handleThumbnailError = () => {
    setThumbnailSrc("/placeholder.jpg");
  };

  const isFree = course.price === 0;
  const isPremium = course.price > 0;
  const price = course.price;

  const instructor =
    course.instructor?.name ||
    (course.instructor?.firstName && course.instructor?.lastName
      ? `${course.instructor.firstName} ${course.instructor.lastName}`
      : "Habib Ndiaye");

  const duration = course.duration;
  const enrolledStudents = course.studentsCount;
  const rating = course.rating;

  const handleClick = () => {
    if (!isAuthenticated) {
      setRedirectAfterLogin(`/course-details/${course.id}`);
      router.push("/login");
      return;
    }
    router.push(`/course-details/${course.id}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price);
  };

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
      {/* Image Container - Aspect ratio fixe 16:9 */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-gray-100">
        <OptimizedImage
          src={thumbnailSrc}
          alt={title}
          width={640}
          height={360}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={handleThumbnailError}
        />

        {/* Overlay gradient pour meilleure lisibilité des badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20"></div>

        {/* Badges en haut */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          {/* Badges gauche */}
          <div className="flex flex-wrap gap-2">
            {isEnrolled && (
              <span className="inline-flex items-center gap-1 bg-green-500 text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-lg">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Inscrit
              </span>
            )}
            {isPremium && !isEnrolled && (
              <span className="inline-flex items-center gap-1 bg-purple-600 text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-lg">
                ✨ Premium
              </span>
            )}
          </div>

          {/* Badge gratuit à droite */}
          {isFree && (
            <span className="inline-flex bg-green-500 text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-lg">
              Gratuit
            </span>
          )}
        </div>

        {/* Badges en bas */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
          {/* Durée à gauche */}
          {duration && (
            <span className="inline-flex items-center gap-1 bg-blue-600/90 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-md shadow-lg">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              {duration}
            </span>
          )}

          {/* Rating et étudiants à droite */}
          <div className="flex items-center gap-2">
            {rating && rating > 0 && (
              <span className="inline-flex items-center gap-1 bg-yellow-500/90 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-md shadow-lg">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {rating.toFixed(1)}
              </span>
            )}
            {enrolledStudents && enrolledStudents > 0 && (
              <span className="inline-flex items-center gap-1 bg-blue-500/90 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-md shadow-lg">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                {enrolledStudents}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contenu de la card */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 gap-3">
        {/* Catégorie */}
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide truncate">
            {category}
          </span>
        </div>

        {/* Titre - 2 lignes max */}
        <h3 className="font-bold text-gray-900 line-clamp-2 text-base sm:text-lg leading-snug group-hover:text-blue-600 transition-colors min-h-[2.5rem]">
          {title}
        </h3>

        {/* Instructeur */}
        {instructor && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-xs font-semibold text-white">
                {instructor.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-gray-600 truncate">{instructor}</span>
          </div>
        )}

        {/* Spacer pour pousser le footer vers le bas */}
        <div className="flex-1"></div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100">
          {isEnrolled ? (
            <div className="space-y-3">
              {/* Barre de progression */}
              {progress !== undefined && progress > 0 && (
                <div>
                  <div className="flex justify-between items-center text-xs text-gray-600 mb-1.5">
                    <span className="font-medium">Progression</span>
                    <span className="font-semibold text-blue-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
              {/* Bouton Continuer */}
              <button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                Continuer l'apprentissage
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          ) : (
            /* Prix */
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Prix</span>
              {isFree ? (
                <span className="text-xl font-bold text-green-600">Gratuit</span>
              ) : (
                <span className="text-xl font-bold text-gray-900">
                  {formatPrice(price)} <span className="text-sm font-normal text-gray-500">FCFA</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}