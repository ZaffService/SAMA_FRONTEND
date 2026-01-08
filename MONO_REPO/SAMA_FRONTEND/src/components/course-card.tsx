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
}

export function CourseCard({ course }: CourseCardProps) {
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
      // Stocker la destination après connexion
      setRedirectAfterLogin(`/course-details/${course.id}`);
      // Rediriger vers la page de connexion
      router.push("/login");
      return;
    }

    // Redirection vers la page du cours
    router.push(`/course-details/${course.id}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price);
  };

  return (
    <div
      onClick={handleClick}
      className="
        group cursor-pointer w-full h-full rounded-2xl overflow-hidden bg-white
        border border-gray-100 shadow-sm hover:shadow-xl
        transition-all duration-300 hover:-translate-y-1
        flex flex-col
      "
    >
      <div className="aspect-video overflow-hidden relative">
        <OptimizedImage
          src={thumbnailSrc}
          alt={title}
          width={320}
          height={180}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={handleThumbnailError}
        />

        <div className="absolute top-3 left-3 flex gap-2">
          {isPremium && (
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              ✨ Premium
            </div>
          )}
          {duration && (
            <div className="bg-blue-600/90 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              {duration}
            </div>
          )}
        </div>

        {isFree && (
          <div className="absolute top-3 right-3">
            <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              Gratuit
            </div>
          </div>
        )}

        {rating && rating > 0 && (
          <div className="absolute bottom-3 left-3">
            <div className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
              ⭐ {rating.toFixed(1)}
            </div>
          </div>
        )}

        {enrolledStudents && enrolledStudents > 0 && (
          <div className="absolute bottom-3 right-3">
            <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
              {enrolledStudents}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3 flex-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            {category}
          </p>
        </div>

        <h6 className="font-bold leading-tight text-gray-900 line-clamp-2 text-sm group-hover:text-blue-600 transition-colors">
          {title}
        </h6>

        {instructor && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">
                {instructor.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-gray-600">{instructor}</p>
          </div>
        )}

        <div className="pt-2 border-t border-gray-100 mt-auto">
          {isFree ? (
            <div className="flex items-center justify-end">
              <span className="text-lg font-bold text-green-600">Gratuit</span>
            </div>
          ) : (
            <div className="flex items-center justify-end">
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(price)} FCFA
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
