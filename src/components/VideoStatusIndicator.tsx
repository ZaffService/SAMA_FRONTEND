"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  CheckCircle,
  Clock,
  FileText,
  RefreshCw,
  Eye,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { CoursesApi, LessonStatus } from "@/infrastructure/api/courses-api";
import { VideoStatusItem } from "./VideoStatusItem";
import logger from "@/shared/helpers/logger";

interface Lesson {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  orderIndex: number;
  duration: number;
  status: LessonStatus;
}

interface Module {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  isComplete: boolean;
  modules: Module[];
}

interface VideoStatusIndicatorProps {
  courseId: string;
  onStatusChange?: (isComplete: boolean) => void;
  onBack?: () => void;
}

export function VideoStatusIndicator({
  courseId,
  onStatusChange,
  onBack,
}: VideoStatusIndicatorProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(
    null,
  );

  const loadCourseStatus = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const details = await CoursesApi.getCourseDetails(courseId);

      const courseData: Course = {
        id: details.course.id,
        title: details.course.title,
        isComplete: details.course.isComplete ?? true,
        modules: details.modules.map((module) => ({
          ...module,
          lessons: module.lessons.map((lesson) => ({
            ...lesson,
            status: lesson.status as LessonStatus,
          })),
        })),
      };

      setCourse(courseData);
      onStatusChange?.(courseData.isComplete);
    } catch (err) {
      logger.error("Erreur lors du chargement du statut des vidéos:", err);
      setError("Impossible de charger le statut des vidéos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCourseStatus();
  }, [courseId]);

  // Polling automatique toutes les 30 secondes si le cours n'est pas complet
  useEffect(() => {
    if (course && !course.isComplete) {
      const interval = setInterval(() => {
        loadCourseStatus();
      }, 30000); // 30 secondes

      return () => clearInterval(interval);
    }
  }, [course?.isComplete]);

  const getLessonStats = () => {
    if (!course) return { total: 0, uploaded: 0, pending: 0, ready: 0 };

    let total = 0;
    let uploaded = 0;
    let pending = 0;
    let ready = 0;

    course.modules.forEach((module) => {
      module.lessons.forEach((lesson) => {
        total++;
        switch (lesson.status) {
          case LessonStatus.VIDEO_UPLOADED:
            uploaded++;
            break;
          case LessonStatus.PENDING_VIDEO:
            pending++;
            break;
          case LessonStatus.READY:
            ready++;
            break;
        }
      });
    });

    return { total, uploaded, pending, ready };
  };

  if (loading) {
    return (
      <Card className="border-[#2A2938] bg-[#1F1E2B] text-white shadow-xl">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Chargement du statut des vidéos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !course) {
    return (
      <Card className="border-[#2A2938] bg-[#1F1E2B] text-white shadow-xl">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || "Impossible de charger les informations du cours"}
            </AlertDescription>
          </Alert>
          <Button
            onClick={loadCourseStatus}
            variant="outline"
            className="mt-4 border-[#3A3950] bg-transparent text-white hover:bg-white/10"
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  const stats = getLessonStats();

  return (
    <Card className="border-[#2A2938] bg-[#1F1E2B] text-white shadow-xl">
      <CardHeader className="border-b border-[#2A2938]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            {onBack && (
              <Button
                type="button"
                onClick={onBack}
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full border-[#3A3950] bg-transparent text-white hover:bg-white/10"
                aria-label="Retour"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="min-w-0">
              <CardTitle className="text-lg sm:text-xl text-white">
                Statut des vidéos
              </CardTitle>
              <p className="mt-1 text-sm text-white/70 line-clamp-1">
                {course.title}
              </p>
            </div>
          </div>

          <Button
            onClick={loadCourseStatus}
            variant="outline"
            size="sm"
            className="border-[#3A3950] bg-transparent text-white hover:bg-white/10"
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Actualiser
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/70">
          <span>Total: {stats.total} leçons</span>
          <span className="text-emerald-300">• {stats.uploaded} uploadées</span>
          <span className="text-amber-300">• {stats.pending} en attente</span>
          <span className="text-sky-300">• {stats.ready} prêtes</span>
        </div>
      </CardHeader>
      <CardContent>
        {!course.isComplete && (
          <Alert className="mb-4 border-[#2A2938] bg-[#141320] text-white">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Certaines vidéos sont encore en cours d'upload. Le cours sera
              automatiquement marqué comme complet une fois tous les uploads
              terminés.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {course.modules.map((module) => (
            <div key={module.id}>
              <h4 className="font-semibold text-white mb-2">{module.title}</h4>
              <div className="space-y-2 ml-4">
                {module.lessons.map((lesson) => (
                  <VideoStatusItem
                    key={lesson.id}
                    lesson={lesson}
                    onUploadSuccess={loadCourseStatus}
                    isUploading={uploadingLessonId === lesson.id}
                    onUploadStart={() => setUploadingLessonId(lesson.id)}
                    onUploadEnd={() => setUploadingLessonId(null)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
