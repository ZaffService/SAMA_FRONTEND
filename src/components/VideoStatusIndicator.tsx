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
}

export function VideoStatusIndicator({
  courseId,
  onStatusChange,
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
      <Card>
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
      <Card>
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
            className="mt-4"
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Statut des vidéos - {course.title}
          </CardTitle>
          <Button
            onClick={loadCourseStatus}
            variant="outline"
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Actualiser
          </Button>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Total: {stats.total} leçons</span>
          <span className="text-green-600">• {stats.uploaded} uploadées</span>
          <span className="text-yellow-600">• {stats.pending} en attente</span>
          <span className="text-blue-600">• {stats.ready} prêtes</span>
        </div>
      </CardHeader>
      <CardContent>
        {!course.isComplete && (
          <Alert className="mb-4">
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
              <h4 className="font-medium text-gray-900 mb-2">{module.title}</h4>
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
