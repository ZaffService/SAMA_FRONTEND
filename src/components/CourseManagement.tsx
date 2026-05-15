"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
      enrollments?: unknown[];
      _enrollments?: unknown[];
      students?: unknown[];
      enrolledStudents?: unknown[];
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
    if (Array.isArray(raw.enrollments)) {
      return raw.enrollments.length;
    }
    if (Array.isArray(raw._enrollments)) {
      return raw._enrollments.length;
    }
    if (Array.isArray(raw.students)) {
      return raw.students.length;
    }
    if (Array.isArray(raw.enrolledStudents)) {
      return raw.enrolledStudents.length;
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

      const result = await CoursesApi.getAllCourses(searchOptions);

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

  const handleConfirmDraft = async (course: BackendCourse) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Confirmer la mise en brouillon",
      text: `Êtes-vous sûr de vouloir mettre le cours "${course.title}" en brouillon ? Il ne sera plus visible comme cours publié.`,
      showCancelButton: true,
      confirmButtonColor: "#f59e0b",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Mettre en brouillon",
      cancelButtonText: "Annuler",
    });

    if (result.isConfirmed) {
      await handleStatusChange(course.id, "DRAFT");
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
    <div className="space-y-6 text-[#FFFFFF]">
      {/* En-tête avec recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-1 gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
            <Input
              placeholder="Rechercher un cours..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-[#3B3754] bg-[#1F1D2B] pl-10 text-white placeholder:text-white/40"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 border-[#3B3754] bg-[#1F1D2B] text-white">
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
          className="flex items-center gap-2 border-[#3B3754] bg-[#1F1D2B] text-white hover:bg-[#26233A]"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Rafraîchir
        </Button>
      </div>

      {/* Tableau des cours */}
      <Card className="border border-[#302D47] bg-[#1F1D2B] text-white">
        <CardHeader>
          <CardTitle className="text-white">Liste des cours ({filteredCourses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-white">Chargement des cours...</span>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="py-12 text-center text-white/60">
              <p>Aucun cours trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="text-white">
                <TableHeader>
                  <TableRow className="border-b border-[#302D47] hover:bg-transparent">
                    <TableHead className="text-white/80">Image</TableHead>
                    <TableHead className="text-white/80">Titre</TableHead>
                    <TableHead className="text-white/80">Catégorie</TableHead>
                    <TableHead className="text-white/80">Prix</TableHead>
                    <TableHead className="text-white/80">Statut</TableHead>
                    <TableHead className="text-white/80">Étudiants</TableHead>
                    <TableHead className="text-right text-white/80">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow key={course.id} className="border-b border-[#2A273D] hover:bg-[#26233A]/60">
                      <TableCell>
                        <img
                          src={course.thumbnailUrl || "/placeholder.svg"}
                          alt={course.title}
                          className="w-16 h-10 object-cover rounded-md"
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-white">{course.title}</p>
                          <p className="max-w-xs truncate text-sm text-white/55">
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
                          <span className="text-white">{course.price.toLocaleString()} XOF</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(course.status)}</TableCell>
                      <TableCell>{course.enrollmentCount || 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          <div className="inline-flex items-center justify-end gap-1.5 rounded-xl border border-[#302D47] bg-[#181721]/70 p-1.5 shadow-sm">
                          {user?.role === "ADMIN" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCourseToEnroll(course)}
                              className="h-9 gap-2 rounded-lg border-[#3B3754] bg-[#1F1D2B] text-white hover:bg-[#26233A]"
                            >
                              <UserPlus className="h-4 w-4" />
                              Enrôler
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 rounded-lg text-white/80 hover:bg-[#26233A] hover:text-white"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="min-w-56 border-[#302D47] bg-[#1F1D2B]/95 p-1 text-white shadow-xl backdrop-blur supports-backdrop-filter:bg-[#1F1D2B]/80 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                            >
                              <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold tracking-wide text-white/60">
                                Actions
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-[#302D47]" />
                              {(user?.role === "ADMIN" || user?.role === "INSTRUCTOR") &&
                                (course.enrollmentCount || 0) > 0 && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      router.push(
                                        `/admin-dashboard/courses/${course.id}/students`,
                                      )
                                    }
                                    className="cursor-pointer rounded-md px-2 py-2 text-sm text-white/85 outline-none transition-colors focus:bg-[#26233A] focus:text-white data-highlighted:bg-[#26233A] data-highlighted:text-white"
                                  >
                                    <Eye className="h-4 w-4 mr-2 text-[#A9F5E5]" />
                                    Voir etudiants inscrit
                                  </DropdownMenuItem>
                                )}
                              <DropdownMenuSeparator className="bg-[#302D47]" />
                              {course.status !== "PUBLISHED" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(course.id, "PUBLISHED")
                                  }
                                  className="cursor-pointer rounded-md px-2 py-2 text-sm text-white/85 outline-none transition-colors focus:bg-[#26233A] focus:text-white data-highlighted:bg-[#26233A] data-highlighted:text-white"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                  Publier
                                </DropdownMenuItem>
                              )}
                              {course.status !== "DRAFT" && (
                                <DropdownMenuItem
                                  onClick={() => handleConfirmDraft(course)}
                                  className="cursor-pointer rounded-md px-2 py-2 text-sm text-white/85 outline-none transition-colors focus:bg-[#26233A] focus:text-white data-highlighted:bg-[#26233A] data-highlighted:text-white"
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
                                    className="cursor-pointer rounded-md px-2 py-2 text-sm text-white/85 outline-none transition-colors focus:bg-[#26233A] focus:text-white data-highlighted:bg-[#26233A] data-highlighted:text-white"
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
                                    className="cursor-pointer rounded-md px-2 py-2 text-sm text-white/85 outline-none transition-colors focus:bg-[#26233A] focus:text-white data-highlighted:bg-[#26233A] data-highlighted:text-white"
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
                                    className="cursor-pointer rounded-md px-2 py-2 text-sm text-white/85 outline-none transition-colors focus:bg-[#26233A] focus:text-white data-highlighted:bg-[#26233A] data-highlighted:text-white"
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
                                  className="cursor-pointer rounded-md px-2 py-2 text-sm text-white/85 outline-none transition-colors focus:bg-[#26233A] focus:text-white data-highlighted:bg-[#26233A] data-highlighted:text-white"
                                >
                                  <Eye className="h-4 w-4 mr-2 text-indigo-600" />
                                  Aperçu
                                </DropdownMenuItem>
                              )}

                              {/* Option Supprimer - Visible pour ADMIN */}
                              {user?.role === "ADMIN" && (
                                <DropdownMenuItem
                                  onClick={() => handleConfirmDelete(course)}
                                  className="cursor-pointer rounded-md px-2 py-2 text-sm text-red-400 outline-none transition-colors focus:bg-red-500/10 focus:text-red-300 data-highlighted:bg-red-500/10 data-highlighted:text-red-300"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          </div>
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
