"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BackendCourse, CoursesApi } from "@/infrastructure/api/courses-api";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { Course } from "@/domain/entities/course";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { getErrorMapping } from "@/shared/helpers/error-mapping";
import {
  MoreVertical,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Archive,
  Loader2,
  Trash2,
  Edit3,
  Video,
  Eye,
  UserPlus,
} from "lucide-react";
import { CourseEditor } from "./CourseEditor";
import { CourseBasicInfoEditor } from "./editors/CourseBasicInfoEditor";
import logger from "@/shared/helpers/logger";
import { EnrollStudentsDialog } from "@/components/EnrollStudentsDialog";

interface CourseManagementProps {
  onCourseUpdated?: () => void;
  onEditCourse?: (courseId: string) => void;
  onViewVideoStatus?: (courseId: string) => void;
}

export function CourseManagement({
  onCourseUpdated,
  onEditCourse,
  onViewVideoStatus,
}: CourseManagementProps) {
  const { user } = useLocalAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<BackendCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [courseToArchive, setCourseToArchive] = useState<BackendCourse | null>(
    null,
  );
  const [courseToEditBasic, setCourseToEditBasic] =
    useState<BackendCourse | null>(null);
  const [courseToEnroll, setCourseToEnroll] = useState<BackendCourse | null>(
    null,
  );

  const handleConfirmDelete = async (course: BackendCourse) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Confirmer la suppression",
      text: `Êtes-vous sûr de vouloir supprimer le cours "${course.title}" ? Cette action est irréversible.`,
      showCancelButton: true,
      confirmButtonColor: "#d32f2f",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Supprimer",
      cancelButtonText: "Annuler",
    });

    if (result.isConfirmed) {
      try {
        await CoursesApi.deleteCourse(course.id);
        await Swal.fire({
          icon: "success",
          title: "Cours supprimé",
          text: "Le cours a été supprimé avec succès",
          timer: 2000,
          showConfirmButton: false,
        });
        fetchCourses();
        onCourseUpdated?.();
      } catch (error: any) {
        logger.error("Erreur lors de la suppression:", error);

        // Vérifier si c'est une erreur COURSE_ALREADY_ENROLLED
        if (error.code === "COURSE_ALREADY_ENROLLED") {
          await Swal.fire({
            icon: "error",
            title: "Suppression impossible",
            text: "Vous ne pouvez pas supprimer un cours qui a des étudiants inscrits",
            confirmButtonColor: "#d32f2f",
          });
        } else {
          // Utiliser le mapping d'erreur pour afficher un message approprié
          const errorMapping = getErrorMapping(error);
          await Swal.fire({
            icon: "error",
            title: errorMapping.title,
            text: errorMapping.message,
            confirmButtonColor: "#d32f2f",
          });
        }
      }
    }
  };

  const handleEditCourse = (course: BackendCourse) => {
    router.push(`/admin/edit-course/${course.id}`);
  };

  const resolveEnrollmentCount = (course: BackendCourse): number => {
    const raw = course as BackendCourse & {
      enrollment_count?: number;
      studentsCount?: number;
      students_count?: number;
    };
    if (typeof course.enrollmentCount === "number" && Number.isFinite(course.enrollmentCount)) {
      return course.enrollmentCount;
    }
    if (typeof raw.enrollment_count === "number" && Number.isFinite(raw.enrollment_count)) {
      return raw.enrollment_count;
    }
    if (typeof raw.studentsCount === "number" && Number.isFinite(raw.studentsCount)) {
      return raw.studentsCount;
    }
    if (typeof raw.students_count === "number" && Number.isFinite(raw.students_count)) {
      return raw.students_count;
    }
    return 0;
  };

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const searchOptions: any = {
        query: searchQuery || undefined,
      };

      if (user?.role === "ADMIN") {
        searchOptions.userRole = "ADMIN";
      }
      if (statusFilter !== "all") {
        searchOptions.status = statusFilter;
      }

      const result = await CoursesApi.getCourses(1, 100, searchOptions);

      const normalizedCourses = result.courses.map((course) => ({
        ...course,
        enrollmentCount: resolveEnrollmentCount(course),
      }));
      setCourses(normalizedCourses);
    } catch (error) {
      logger.error("Erreur lors de la récupération des cours:", error);
      toast.error("Erreur lors de la récupération des cours");
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les cours au montage et quand les filtres changent
  useEffect(() => {
    fetchCourses();
  }, [user?.role, searchQuery, statusFilter]);

  const handleStatusChange = async (
    courseId: string,
    newStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED",
  ) => {
    try {
      await CoursesApi.updateCourseStatus(courseId, newStatus);
      toast.success("Statut mis à jour avec succès");
      fetchCourses();
      onCourseUpdated?.();
    } catch (error) {
      logger.error("Erreur lors de la mise à jour du statut:", error);
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  const handleArchiveCourse = async () => {
    if (!courseToArchive) return;

    try {
      await CoursesApi.updateCourseStatus(courseToArchive.id, "ARCHIVED");
      toast.success("Cours archivé avec succès");
      setCourseToArchive(null);
      fetchCourses();
      onCourseUpdated?.();
    } catch (error) {
      logger.error("Erreur lors de l'archivage:", error);
      toast.error("Erreur lors de l'archivage du cours");
      setCourseToArchive(null);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "PUBLISHED":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Publié
          </Badge>
        );
      case "DRAFT":
        return (
          <Badge variant="secondary">
            <XCircle className="w-3 h-3 mr-1" />
            Brouillon
          </Badge>
        );
      case "ARCHIVED":
        return (
          <Badge className="bg-gray-500">
            <Archive className="w-3 h-3 mr-1" />
            Archivé
          </Badge>
        );
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const filteredCourses = courses.filter((course) => {
    // Masquer les cours archivés pour les utilisateurs non-admin
    if (course.status === "ARCHIVED" && user?.role !== "ADMIN") {
      return false;
    }
    const matchesSearch =
      (course.title?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (course.description?.toLowerCase() || "").includes(
        searchQuery.toLowerCase(),
      );
    const matchesStatus =
      statusFilter === "all" || course.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* En-tête avec recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-1 gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher un cours..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="DRAFT">Brouillon</SelectItem>
              <SelectItem value="PUBLISHED">Publié</SelectItem>
              {user?.role === "ADMIN" && (
                <SelectItem value="ARCHIVED">Archivé</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          onClick={fetchCourses}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Rafraîchir
        </Button>
      </div>

      {/* Tableau des cours */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des cours ({filteredCourses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Chargement des cours...</span>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Aucun cours trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Étudiants</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>
                        <img
                          src={course.thumbnailUrl || "/placeholder.svg"}
                          alt={course.title}
                          className="w-16 h-10 object-cover rounded-md"
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{course.title}</p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">
                            {course.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {String(course.categoryName || "Non catégorisé")}
                      </TableCell>
                      <TableCell>
                        {course.price === 0 ? (
                          <span className="text-green-600 font-medium">
                            Gratuit
                          </span>
                        ) : (
                          <span>{course.price.toLocaleString()} XOF</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(course.status)}</TableCell>
                      <TableCell>{course.enrollmentCount || 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user?.role === "ADMIN" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCourseToEnroll(course)}
                              className="flex items-center gap-2"
                            >
                              <UserPlus className="h-4 w-4" />
                              Enrôler
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {course.status !== "PUBLISHED" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(course.id, "PUBLISHED")
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                  Publier
                                </DropdownMenuItem>
                              )}
                              {course.status !== "DRAFT" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(course.id, "DRAFT")
                                  }
                                >
                                  <XCircle className="h-4 w-4 mr-2 text-orange-600" />
                                  Mettre en brouillon
                                </DropdownMenuItem>
                              )}
                              {(user?.role === "ADMIN" ||
                                user?.role === "INSTRUCTOR") &&
                                (course.status === "PUBLISHED" ||
                                  course.status === "DRAFT") && (
                                  <DropdownMenuItem
                                    onClick={() => setCourseToArchive(course)}
                                  >
                                    <Archive className="h-4 w-4 mr-2 text-gray-600" />
                                    Archiver
                                  </DropdownMenuItem>
                                )}

                              {/* Option Modifier le cours - Visible pour ADMIN et INSTRUCTOR */}
                              {(user?.role === "ADMIN" ||
                                user?.role === "INSTRUCTOR") && (
                                  <DropdownMenuItem
                                    onClick={() => handleEditCourse(course)}
                                  >
                                    <Edit3 className="h-4 w-4 mr-2 text-blue-600" />
                                    Modifier le cours
                                  </DropdownMenuItem>
                                )}

                              {/* Option Voir statut vidéos - Visible pour ADMIN et INSTRUCTOR */}
                              {(user?.role === "ADMIN" ||
                                user?.role === "INSTRUCTOR") &&
                                onViewVideoStatus && (
                                  <DropdownMenuItem
                                    onClick={() => onViewVideoStatus(course.id)}
                                  >
                                    <Video className="h-4 w-4 mr-2 text-purple-600" />
                                    Voir statut vidéos
                                  </DropdownMenuItem>
                                )}

                              {/* Option Aperçu - Visible pour ADMIN et INSTRUCTOR */}
                              {(user?.role === "ADMIN" ||
                                user?.role === "INSTRUCTOR") && (
                                <DropdownMenuItem
                                  onClick={() => router.push(`/course-details/${course.id}`)}
                                >
                                  <Eye className="h-4 w-4 mr-2 text-indigo-600" />
                                  Aperçu
                                </DropdownMenuItem>
                              )}

                              {/* Option Supprimer - Visible pour ADMIN */}
                              {user?.role === "ADMIN" && (
                                <DropdownMenuItem
                                  onClick={() => handleConfirmDelete(course)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogue de confirmation d'archivage */}
      <AlertDialog
        open={!!courseToArchive}
        onOpenChange={() => setCourseToArchive(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'archivage</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir archiver le cours "
              {courseToArchive?.title}" ? Le cours sera masqué de la liste
              principale mais pourra être consulté par les administrateurs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveCourse}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Archiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <EnrollStudentsDialog
        open={!!courseToEnroll}
        course={courseToEnroll}
        onOpenChange={(open) => {
          if (!open) setCourseToEnroll(null);
        }}
        onEnrollmentComplete={() => {
          fetchCourses();
          onCourseUpdated?.();
        }}
      />

    </div>
  );
}
