"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Users, Loader2 } from "lucide-react";
import { userService } from "@/services/userService";
import type { User } from "@/types/user";
import type { BackendCourse } from "@/infrastructure/api/courses-api";
import {
  EnrollmentApi,
  type EnrollStudentsResponse,
} from "@/infrastructure/api/enrollment-api";
import { toast } from "sonner";
import Swal from "sweetalert2";
import logger from "@/shared/helpers/logger";

interface EnrollStudentsDialogProps {
  open: boolean;
  course: BackendCourse | null;
  onOpenChange: (open: boolean) => void;
  onEnrollmentComplete?: () => void;
}

const getInitials = (user: User) => {
  const first = user.firstName?.trim()?.[0] ?? "";
  const last = user.lastName?.trim()?.[0] ?? "";
  const fallback = user.email?.trim()?.[0] ?? "?";
  const initials = `${first}${last}`.trim();
  return (initials || fallback).toUpperCase();
};

export function EnrollStudentsDialog({
  open,
  course,
  onOpenChange,
  onEnrollmentComplete,
}: EnrollStudentsDialogProps) {
  const [students, setStudents] = useState<User[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(16);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<EnrollStudentsResponse | null>(
    null,
  );

  const resetState = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setCurrentPage(1);
    setStudents([]);
    setTotalStudents(0);
    setSelectedIds(new Set());
    setEnrolledIds(new Set());
    setLastResult(null);
  };

  useEffect(() => {
    if (!open) {
      resetState();
      return;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const timeout = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery, open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const loadStudents = async () => {
      setLoading(true);
      try {
        const response = await userService.getUsersByRole({
          role: "STUDENT",
          page: currentPage,
          limit,
          ...(debouncedSearch && { q: debouncedSearch }),
        });

        if (!cancelled) {
          setStudents(response.users);
          setTotalStudents(
            typeof response.total === "number"
              ? response.total
              : response.users.length,
          );
        }
      } catch (error) {
        logger.error("Erreur chargement étudiants:", error);
        if (!cancelled) {
          setStudents([]);
          setTotalStudents(0);
          toast.error("Impossible de charger la liste des étudiants");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadStudents();

    return () => {
      cancelled = true;
    };
  }, [open, currentPage, limit, debouncedSearch]);

  const selectedCount = selectedIds.size;
  const availableCount = totalStudents;
  const enrolledCount = enrolledIds.size;
  const totalPages = totalStudents > 0 ? Math.ceil(totalStudents / limit) : 0;

  const allFilteredSelected =
    students.length > 0 &&
    students.every((student) => selectedIds.has(String(student.id)));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        students.forEach((student) => next.delete(String(student.id)));
      } else {
        students.forEach((student) => next.add(String(student.id)));
      }
      return next;
    });
  };

  const toggleStudent = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleEnroll = async () => {
    if (!course?.id) {
      toast.error("Cours introuvable");
      return;
    }

    if (selectedIds.size === 0) {
      toast.error("Sélectionnez au moins un étudiant");
      return;
    }

    setSubmitting(true);
    try {
      const response = await EnrollmentApi.enrollStudentsInCourse({
        courseId: course.id,
        userIds: Array.from(selectedIds),
        isAdmin: true,
      });

      setLastResult(response);
      setSelectedIds(new Set());
      setEnrolledIds((prev) => {
        const next = new Set(prev);
        response.enrollments?.forEach((enrollment) => {
          next.add(String(enrollment.userId));
        });
        return next;
      });

      const swalTarget = document.getElementById("enroll-students-dialog");
      await Swal.fire({
        icon: "success",
        title: "Enrôlement réussi",
        html: `<div style="font-size:14px;line-height:1.5;color:rgba(255,255,255,.82);">${response.enrollments.length} étudiant(s) inscrit(s) avec succès</div>`,
        confirmButtonText: "OK",
        confirmButtonColor: "#002c75",
        showCloseButton: true,
        heightAuto: false,
        target: swalTarget ?? undefined,
      });
      onEnrollmentComplete?.();
    } catch (error) {
      logger.error("Erreur inscription multiple:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Erreur lors de l'inscription des étudiants";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        id="enroll-students-dialog"
        className="sm:max-w-[900px] overflow-hidden border border-[#302D47] bg-[#1F1D2B] p-0 text-white shadow-2xl"
      >
        <div className="border-b border-[#302D47] bg-[#181721]/60 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Enrôler des étudiants</h2>
              <p className="text-sm text-white/55">
                Cours :{" "}
                <span className="font-semibold text-white/90">
                  {course?.title ?? "-"}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="flex flex-wrap gap-4 text-sm text-white/60">
            <span>
              <strong className="text-white/90">{availableCount}</strong> étudiants disponibles
            </span>
            {enrolledCount > 0 && (
              <span>
                <strong className="text-green-400">{enrolledCount}</strong> enrôlés
              </span>
            )}
            <span>
              <strong className="text-[#A9F5E5]">{selectedCount}</strong>{" "}
              sélectionnés
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
              <Input
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Rechercher un étudiant..."
                className="border-[#3B3754] bg-[#181721] pl-9 text-white placeholder:text-white/35 focus-visible:ring-[#A9F5E5]/30"
              />
            </div>
            <Button
              variant="outline"
              onClick={toggleSelectAll}
              disabled={students.length === 0}
              className="flex items-center gap-2 border-[#3B3754] bg-[#181721] text-white hover:bg-[#26233A]"
            >
              <Users className="h-4 w-4" />
              {allFilteredSelected ? "Désélectionner" : "Tout sélectionner"}
            </Button>
          </div>
        </div>

        <div className="px-6">
          <div className="max-h-[420px] overflow-y-auto pr-1 pb-4">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-white/60">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="ml-2">Chargement des étudiants...</span>
              </div>
            ) : students.length === 0 ? (
              <div className="py-10 text-center text-sm text-white/60">
                Aucun étudiant trouvé.
              </div>
            ) : (
              <div className="space-y-3">
                {students.map((student) => {
                  const userId = String(student.id);
                  const isSelected = selectedIds.has(userId);
                  const isEnrolled = enrolledIds.has(userId);
                  const phone =
                    student.telephone || student.userProfile?.phone || "-";

                  return (
                    <div
                      key={userId}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                      onClick={() => toggleStudent(userId)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleStudent(userId);
                        }
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                        isSelected
                          ? "border-[#A9F5E5]/35 bg-[#26233A]/70"
                          : "border-[#302D47] bg-[#181721] hover:border-[#A9F5E5]/25 hover:bg-[#26233A]/50"
                      }`}
                    >
                      <div
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleStudent(userId);
                        }}
                        className="flex items-center"
                      >
                        <Checkbox checked={isSelected} />
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#3B3754] bg-[#1F1D2B] text-xs font-semibold text-white/85">
                        {getInitials(student)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white/90">
                            {student.firstName} {student.lastName}
                          </p>
                          {isEnrolled && (
                            <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-xs font-semibold text-green-300">
                              Enrôlé
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/55">{student.email}</p>
                      </div>
                      <div className="text-xs text-white/45">{phone}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between rounded-lg border border-[#302D47] bg-[#181721] px-4 py-3 text-sm text-white/60">
              <span>
                Page <strong className="text-white/90">{currentPage}</strong> sur{" "}
                <strong className="text-white/90">{totalPages}</strong>
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || loading}
                  className="border-[#3B3754] bg-[#1F1D2B] text-white hover:bg-[#26233A]"
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages || loading}
                  className="border-[#3B3754] bg-[#1F1D2B] text-white hover:bg-[#26233A]"
                >
                  Suivant
                </Button>
              </div>
            </div>
          </div>
        )}

        {lastResult && (
          <div className="mx-6 mb-4 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-200">
            <div>
              {lastResult.enrollments.length} étudiant(s) inscrit(s) • {" "}
              {lastResult.skippedUserIds.length} ignoré(s) • {" "}
              {lastResult.notifiedUserIds.length} notification(s) envoyée(s)
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-[#302D47] bg-[#181721]/40 px-6 py-4">
          <p className="text-sm text-white/60">
            {selectedCount > 0
              ? `${selectedCount} étudiant(s) seront enrôlé(s)`
              : "Sélectionnez des étudiants à enrôler"}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="border-[#3B3754] bg-[#1F1D2B] text-white hover:bg-[#26233A]"
            >
              Annuler
            </Button>
            <Button
              onClick={handleEnroll}
              disabled={submitting || selectedCount === 0}
              className="bg-[#002c75] text-white hover:bg-[#001f54] disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enrôlement...
                </>
              ) : (
                `Enrôler (${selectedCount})`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
