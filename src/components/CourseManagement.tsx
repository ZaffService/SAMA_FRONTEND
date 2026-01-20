"use client";

import { useState, useEffect } from "react";
import { CoursesApi } from "@/infrastructure/api/courses-api";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  MoreVertical,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Archive,
  Loader2,
} from "lucide-react";

interface CourseManagementProps {
  onCourseUpdated?: () => void;
  onEditCourse?: (courseId: string) => void;
}

export function CourseManagement({
  onCourseUpdated,
  onEditCourse,
}: CourseManagementProps) {
  const { user } = useLocalAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const searchOptions: any = {
        query: searchQuery || undefined,
      };

      // Pour les admins, forcer le rôle dans les paramètres pour s'assurer que le backend applique la logique admin
      if (user?.role === "ADMIN") {
        searchOptions.userRole = "ADMIN";
      } else {
        // Pour les autres rôles, appliquer le filtrage de statut côté client si nécessaire
        if (statusFilter !== "all") {
          searchOptions.status = statusFilter;
        }
      }

      const result = await CoursesApi.getCourses(1, 100, searchOptions);
      setCourses(result.courses);
    } catch (error) {
      console.error("Erreur lors de la récupération des cours:", error);
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
    newStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  ) => {
    try {
      await CoursesApi.updateCourseStatus(courseId, newStatus);
      toast.success("Statut mis à jour avec succès");
      fetchCourses();
      onCourseUpdated?.();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      toast.error("Erreur lors de la mise à jour du statut");
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
    const matchesSearch =
      (course.title?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (course.description?.toLowerCase() || "").includes(searchQuery.toLowerCase());
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
              <SelectItem value="ARCHIVED">Archivé</SelectItem>
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
                      <TableCell>{String(course.category || "Non catégorisé")}</TableCell>
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
                      <TableCell>{course.studentsCount || 0}</TableCell>
                      <TableCell className="text-right">
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
                            {course.status !== "ARCHIVED" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(course.id, "ARCHIVED")
                                }
                              >
                                <Archive className="h-4 w-4 mr-2 text-gray-600" />
                                Archiver
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}