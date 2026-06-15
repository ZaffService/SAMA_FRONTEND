"use client";

import { useState } from "react";
import { OptimizedImage } from "@/components/optimized-image";
import { useRouter } from "next/navigation";
import { BarChart2, ShoppingBag } from "lucide-react";
import Swal from "sweetalert2";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { BackendCourse } from "@/infrastructure/api/courses-api";
import { useEnrollment } from "@/hooks/useEnrollment";

interface CourseCardProps {
  course: BackendCourse;
  onEnrollClick?: (course: BackendCourse) => void;
  onVideoClick?: (course: BackendCourse) => void;
  onEnrolled?: () => void;
  isEnrolled?: boolean;
  progress?: number;
  variant?: "default" | "compact";
  resumeLessonId?: string | number | null;
}

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
  ALL_LEVELS: "Tous niveaux",
};

const isValidDisplayValue = (value?: string | number | null) => {
  if (value === null || value === undefined) return false;
  const v = String(value).trim();
  return v !== "" && v !== "0" && v !== "00" && v !== "00:00";
};

const formatLevel = (level?: string) => {
  if (!level) return null;
  const key = level.toUpperCase().replace(/\s+/g, "_");
  return LEVEL_LABELS[key] || level;
};

export function CourseCard({
  course,
  onEnrolled,
  isEnrolled = false,
  progress,
  variant = "default",
  resumeLessonId = null,
}: CourseCardProps) {
  const router = useRouter();
  const { isAuthenticated, setRedirectAfterLogin } = useLocalAuth();
  const { enroll, isLoading: enrolling } = useEnrollment();

  const title = isValidDisplayValue(course.title)
    ? course.title
    : "Titre non disponible";

  const [thumbnailSrc, setThumbnailSrc] = useState(
    course.thumbnailUrl || "/Fallback.png",
  );

  const handleThumbnailError = () => {
    setThumbnailSrc("/placeholder.jpg");
  };

  const isFree = Number(course.price) === 0;
  const isPremium = Number(course.price) > 0;
  const price = course.price;
  const levelLabel = formatLevel(course.level);
  const progressValue =
    typeof progress === "number" && Number.isFinite(progress)
      ? Math.max(0, Math.min(100, Math.round(progress)))
      : null;

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);

  const goToPreview = () => {
    router.push(`/course-details/${course.id}`);
  };

  const goToCourse = () => {
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
    }
    router.push(`/course-details/${course.id}`);
  };

  const requireAuth = (): boolean => {
    if (isAuthenticated) return true;
    setRedirectAfterLogin(`/course-details/${course.id}`);
    router.push("/login");
    return false;
  };

  const handleEnroll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requireAuth()) return;

    try {
      const result = await enroll(course.id);

      if (result.enrolled) {
        onEnrolled?.();
        goToCourse();
        return;
      }

      // Paid course: useEnrollment redirects to payment automatically
      if (result.paymentUrl) {
        onEnrolled?.();
      }
    } catch {
      Swal.fire({
        title: "Erreur",
        text: "Impossible de s'inscrire à ce cours. Veuillez réessayer.",
        icon: "error",
        confirmButtonText: "Fermer",
        confirmButtonColor: "#002c75",
      });
    }
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    goToPreview();
  };

  const handleResumeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    goToCourse();
  };

  if (variant === "compact") {
    return (
      <div className="group w-full rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
        <div className="relative w-full aspect-video overflow-hidden bg-gray-50">
          <OptimizedImage
            src={thumbnailSrc}
            alt={title}
            width={640}
            height={480}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            onError={handleThumbnailError}
          />
          {isEnrolled && (
            <div className="absolute top-2 right-2">
              <span className="bg-[#3B82F6] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                Inscrit
              </span>
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1 gap-3">
          <h3 className="font-semibold text-slate-900 text-sm sm:text-base line-clamp-2 leading-snug">
            {title}
          </h3>

          {progressValue !== null && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Progression</span>
                <span className="font-semibold text-slate-800">
                  {progressValue}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${progressValue}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-auto">
            <button
              type="button"
              onClick={handleResumeClick}
              className="w-full bg-blue-600 text-white text-center py-2.5 px-3 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              Reprendre
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group w-full rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      {/* Image */}
      <div className="relative w-full aspect-4/3 overflow-hidden bg-gray-50">
        <OptimizedImage
          src={thumbnailSrc}
          alt={title}
          width={640}
          height={480}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={handleThumbnailError}
        />

        {course.categoryName && (
          <div className="absolute top-3 left-3">
            <span className="bg-white/90 backdrop-blur-sm text-slate-800 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
              {course.categoryName}
            </span>
          </div>
        )}

        {isPremium && !isEnrolled && (
          <div className="absolute top-3 right-3">
            <span className="bg-[#7C3AED] text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
              ✨ Premium
            </span>
          </div>
        )}

        {isFree && !isEnrolled && (
          <div className="absolute top-3 right-3">
            <span className="bg-[#10B981] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
              Gratuit
            </span>
          </div>
        )}

        {isEnrolled && (
          <div className="absolute top-3 right-3">
            <span className="bg-[#3B82F6] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
              Inscrit
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1 min-h-0">
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900 text-base line-clamp-2 leading-snug">
            {title}
          </h3>

          {isValidDisplayValue(course.description) && (
            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
              {course.description}
            </p>
          )}
        </div>

        <div className="flex-1 min-h-3" />

        {levelLabel && (
          <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-3">
            <BarChart2 className="h-4 w-4 text-slate-400 shrink-0" />
            <span>{levelLabel}</span>
          </div>
        )}

        {/* Actions */}
        <div>
          {isEnrolled ? (
            <button
              type="button"
              onClick={handleResumeClick}
              className="w-full bg-[#101828] text-white text-center py-2.5 px-4 rounded-lg font-semibold text-sm hover:bg-[#1a2236] transition-colors"
            >
              Reprendre
            </button>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="shrink-0">
                {isFree ? (
                  <span className="text-sm font-semibold text-[#10B981]">
                    Accès libre
                  </span>
                ) : (
                  <span className="text-sm font-bold text-slate-900">
                    {formatPrice(price)} FCFA
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePreviewClick}
                  className="px-3 py-2 rounded-lg text-sm font-semibold bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors"
                >
                  Aperçu
                </button>

                {isFree ? (
                  <button
                    type="button"
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="px-3 py-2 rounded-lg text-sm font-semibold bg-[#101828] text-white hover:bg-[#1a2236] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {enrolling ? "..." : "Commencer"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-[#101828] text-white hover:bg-[#1a2236] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    {enrolling ? "..." : "Acheter"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
