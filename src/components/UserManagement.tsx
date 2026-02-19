import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Cake,
  CheckCircle2,
  Eye,
  FileText,
  Mail,
  Megaphone,
  MapPin,
  Home,
  Phone,
  User as UserIcon,
  Users,
  ShieldCheck,
  Accessibility,
  XCircle,
} from "lucide-react";
import { userService } from "@/services/userService";
import type { User, UsersResponse } from "@/types/user";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import logger from "@/shared/helpers/logger";
import {
  UserApi,
  AGE_RANGE_LABELS,
  CURRENT_STATUS_LABELS,
  DISABILITY_TYPE_LABELS,
  REFERRAL_SOURCE_LABELS,
  REGION_LABELS,
  RESIDENCE_LABELS,
  SEXE_LABELS,
  type ProfileMetadataItem,
  type ProfileMetadataResponse,
} from "@/infrastructure/api/user-api";
import { BulkUserImportDialog } from "@/components/BulkUserImportDialog";

const getLabel = (
  map: Record<string, string>,
  value?: string | null,
  fallback: string = "Non renseigné",
) => {
  if (!value) return fallback;
  return map[value] || value;
};

const normalizeMetadataValue = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const candidate = value as { id?: string; code?: string; label?: string };
    return candidate.id || candidate.code || candidate.label;
  }
  return undefined;
};

const getMetadataLabel = (
  value: unknown,
  items?: ProfileMetadataItem[],
  fallbackMap?: Record<string, string>,
  fallback: string = "Non renseigné",
) => {
  const normalized = normalizeMetadataValue(value);
  if (!normalized) return fallback;

  const match = items?.find(
    (item) =>
      item.id === normalized ||
      item.code === normalized ||
      item.label === normalized,
  );
  if (match) return match.label;

  return fallbackMap?.[normalized] ?? normalized;
};

const SEXE_LABELS_EXTENDED: Record<string, string> = {
  ...SEXE_LABELS,
  MASCULIN: "Masculin",
  FEMININ: "Féminin",
};

const RESIDENCE_LABELS_EXTENDED: Record<string, string> = {
  ...RESIDENCE_LABELS,
  URBAIN: "Urbain",
};

const DISABILITY_TYPE_LABELS_EXTENDED: Record<string, string> = {
  ...DISABILITY_TYPE_LABELS,
  VISUEL: "Visuel",
  AUDITIF: "Auditif",
  MOTEUR: "Moteur",
  MENTAL: "Mental",
  AUTRE: "Autre",
};

type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN";

const UserManagement: React.FC = () => {
  const { user: currentUser } = useLocalAuth();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | "ALL">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    instructors: 0,
    admins: 0,
  });
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [usersReloadToken, setUsersReloadToken] = useState(0);
  const [profileMetadata, setProfileMetadata] =
    useState<ProfileMetadataResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadMetadata = async () => {
      try {
        const metadata = await UserApi.getProfileMetadata();
        if (!cancelled) {
          setProfileMetadata(metadata);
        }
      } catch (error) {
        logger.warn("Erreur chargement métadonnées profil:", error);
      }
    };

    loadMetadata();

    return () => {
      cancelled = true;
    };
  }, []);

  // Charger les statistiques au montage (après que currentUser soit disponible)
  useEffect(() => {
    if (currentUser) {
      loadStats();
    }
  }, [currentUser]);

  // Debounce recherche
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Charger tous les utilisateurs (toutes pages) quand le rôle change
  useEffect(() => {
    let cancelled = false;

    const loadAllUsers = async () => {
      setLoading(true);
      try {
        const batchLimit = 100;
        const baseParams = {
          ...(selectedRole !== "ALL" && { role: selectedRole }),
        };

        const firstResponse: UsersResponse =
          await userService.getUsersByRole({
            page: 1,
            limit: batchLimit,
            ...baseParams,
          });

        const effectiveLimit = Math.min(
          firstResponse.limit && firstResponse.limit > 0
            ? firstResponse.limit
            : batchLimit,
          batchLimit,
        );
        const total =
          typeof firstResponse.total === "number"
            ? firstResponse.total
            : firstResponse.users.length;
        const totalPages = Math.max(1, Math.ceil(total / effectiveLimit));

        let all: User[] = [...firstResponse.users];

        for (let page = 2; page <= totalPages; page += 1) {
          const response: UsersResponse = await userService.getUsersByRole({
            page,
            limit: effectiveLimit,
            ...baseParams,
          });
          all = all.concat(response.users);
        }

        if (!cancelled) {
          setAllUsers(all);
        }
      } catch (error) {
        logger.error("Erreur chargement utilisateurs:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadAllUsers();

    return () => {
      cancelled = true;
    };
  }, [selectedRole, usersReloadToken]);

  const loadStats = async () => {
    try {
      const stats = await userService.getUserStats();
      setStats({
        total: stats.total - 1,
        students:
          currentUser?.role === "STUDENT" ? stats.students - 1 : stats.students,
        instructors:
          currentUser?.role === "INSTRUCTOR"
            ? stats.instructors - 1
            : stats.instructors,
        admins: currentUser?.role === "ADMIN" ? stats.admins - 1 : stats.admins,
      });
    } catch (error) {
      logger.error("Erreur chargement stats:", error);
    }
  };

  const handleRoleChange = (role: Role | "ALL") => {
    setSelectedRole(role);
    setCurrentPage(1); // Reset à la première page
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1); // Reset à la première page
  };

  const filteredUsers = useMemo(() => {
    if (!debouncedSearch) return allUsers;

    const query = debouncedSearch.toLowerCase();
    return allUsers.filter((user) => {
      const searchable = [
        user.firstName,
        user.lastName,
        `${user.firstName} ${user.lastName}`,
        user.email,
        user.telephone,
        user.userProfile?.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [allUsers, debouncedSearch]);

  const totalUsers = filteredUsers.length;
  const totalPages = totalUsers > 0 ? Math.ceil(totalUsers / limit) : 0;
  const startItem = totalUsers === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalUsers);

  const pageUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * limit;
    return filteredUsers.slice(startIndex, startIndex + limit);
  }, [filteredUsers, currentPage, limit]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const getPaginationItems = (
    page: number,
    total: number,
  ): Array<number | "ellipsis"> => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const items: Array<number | "ellipsis"> = [];
    items.push(1);

    let start = Math.max(2, page - 1);
    let end = Math.min(total - 1, page + 1);

    if (page <= 3) {
      start = 2;
      end = 4;
    } else if (page >= total - 2) {
      start = total - 3;
      end = total - 1;
    }

    if (start > 2) {
      items.push("ellipsis");
    }

    for (let i = start; i <= end; i += 1) {
      items.push(i);
    }

    if (end < total - 1) {
      items.push("ellipsis");
    }

    items.push(total);
    return items;
  };

  if (selectedUser) {
    const profile = selectedUser.userProfile;
    const hasProfileData =
      Boolean(profile?.ageRange) ||
      Boolean(profile?.currentStatus) ||
      Boolean(profile?.referralSource) ||
      Boolean(profile?.sexe) ||
      Boolean(profile?.region) ||
      Boolean(profile?.residenceType) ||
      profile?.consentGiven === true ||
      Boolean(selectedUser.telephone) ||
      Boolean(profile?.phone);
    const telephoneValue =
      selectedUser.telephone || selectedUser.userProfile?.phone;

    const completionChecks = [
      Boolean(telephoneValue),
      Boolean(profile?.ageRange),
      Boolean(profile?.currentStatus),
      Boolean(profile?.referralSource),
      Boolean(profile?.sexe),
      Boolean(profile?.region),
      Boolean(profile?.residenceType),
      profile?.consentGiven === true,
    ];

    const totalCompletionFields = completionChecks.length;
    const computedCompletedFields = completionChecks.filter(Boolean).length;
    const completedFields =
      !hasProfileData && selectedUser.isProfileComplete === true
        ? totalCompletionFields
        : computedCompletedFields;
    const completionPercent = Math.round(
      (completedFields / totalCompletionFields) * 100,
    );
    const isProfileComplete =
      selectedUser.isProfileComplete ?? completedFields === totalCompletionFields;

    const detailItems = [
      {
        label: "Tranche d'âge",
        icon: Cake,
        value: getMetadataLabel(
          profile?.ageRange,
          profileMetadata?.ageRanges,
          AGE_RANGE_LABELS as Record<string, string>,
        ),
      },
      {
        label: "Statut actuel",
        icon: Briefcase,
        value: getMetadataLabel(
          profile?.currentStatus,
          profileMetadata?.currentStatuses,
          CURRENT_STATUS_LABELS as Record<string, string>,
        ),
      },
      {
        label: "Source",
        icon: Megaphone,
        value: getMetadataLabel(
          profile?.referralSource,
          profileMetadata?.referralSources,
          REFERRAL_SOURCE_LABELS as Record<string, string>,
        ),
      },
      {
        label: "Genre",
        icon: Users,
        value: getLabel(SEXE_LABELS_EXTENDED, profile?.sexe),
      },
      {
        label: "Région",
        icon: MapPin,
        value: getLabel(
          REGION_LABELS as Record<string, string>,
          profile?.region,
        ),
      },
      {
        label: "Type de résidence",
        icon: Home,
        value: getLabel(RESIDENCE_LABELS_EXTENDED, profile?.residenceType),
      },
      {
        label: "Handicapé",
        icon: Accessibility,
        value:
          profile?.disability === undefined
            ? "Non renseigné"
            : profile.disability
              ? "Oui"
              : "Non",
      },
      {
        label: "Type de handicap",
        icon: Accessibility,
        value: getLabel(
          DISABILITY_TYPE_LABELS_EXTENDED,
          profile?.disabilityType,
        ),
      },
      {
        label: "Détails handicap",
        icon: FileText,
        value: profile?.disabilityDetails || "Non renseigné",
      },
      {
        label: "Consentement",
        icon: ShieldCheck,
        value:
          profile?.consentGiven === undefined
            ? "Non renseigné"
            : profile.consentGiven
              ? "Oui"
              : "Non",
      },
    ];

    return (
      <div className="p-6 space-y-6">
        <button
          type="button"
          onClick={() => setSelectedUser(null)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#002c75] hover:text-[#001f54]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-[#EEF4FF] flex items-center justify-center text-[#002c75] text-xl font-bold">
                {selectedUser.firstName?.[0]}
                {selectedUser.lastName?.[0]}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedUser.firstName} {selectedUser.lastName}
                </h2>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  {selectedUser.email}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                  isProfileComplete
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {isProfileComplete ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                {isProfileComplete ? "Profil complet" : "Profil incomplet"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-700 px-3 py-1 text-xs font-semibold">
                <UserIcon className="h-3.5 w-3.5" />
                {selectedUser.role === "STUDENT"
                  ? "Étudiant"
                  : selectedUser.role === "INSTRUCTOR"
                    ? "Instructeur"
                    : "Admin"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-700 px-3 py-1 text-xs font-semibold">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(selectedUser.createdAt).toLocaleDateString("fr-FR")}
              </span>
            </div>
          </div>
        </div>

        <div
          className={`rounded-2xl border px-6 py-5 ${
            isProfileComplete
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            {isProfileComplete ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            {isProfileComplete ? "Profil complété" : "Profil incomplet"}
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-white/80">
            <div
              className={`h-2 rounded-full ${
                isProfileComplete ? "bg-green-600" : "bg-red-500"
              }`}
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-600">
            {completedFields}/{totalCompletionFields} champs remplis (
            {completionPercent}%)
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="border-b px-6 py-4">
              <h3 className="text-sm font-semibold text-gray-800">
                Informations de base
              </h3>
            </div>
            <div className="px-6 py-4 space-y-4 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{selectedUser.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{telephoneValue || "Non renseigné"}</span>
              </div>
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-gray-400" />
                <span>
                  {selectedUser.role === "STUDENT"
                    ? "Étudiant"
                    : selectedUser.role === "INSTRUCTOR"
                      ? "Instructeur"
                      : "Admin"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>
                  Inscrit le{" "}
                  {new Date(selectedUser.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="border-b px-6 py-4">
              <h3 className="text-sm font-semibold text-gray-800">
                Informations du profil
              </h3>
            </div>
            <div className="divide-y">
              {detailItems.map((item) => {
                const isFilled = item.value !== "Non renseigné";
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between px-6 py-4 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-gray-500">{item.label}</p>
                        <p className="text-gray-900 font-medium">
                          {item.value}
                        </p>
                      </div>
                    </div>
                    {isFilled ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-300" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Gestion des Utilisateurs</h1>
        <button
          type="button"
          onClick={() => setIsImportDialogOpen(true)}
          className="inline-flex items-center justify-center rounded-lg bg-[#002c75] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#001f54]"
        >
          Ajout en masse
        </button>
      </div>

      <BulkUserImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportSuccess={(result) => {
          if (result.imported > 0) {
            setUsersReloadToken((prev) => prev + 1);
            loadStats();
          }
        }}
      />

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#EAF1FF] p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-[#002c75]">Total</h3>
          <p className="text-2xl font-bold text-[#002c75]">{stats.total}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800">Étudiants</h3>
          <p className="text-2xl font-bold text-green-600">{stats.students}</p>
        </div>
      </div>

      {/* Filtres et limite */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select
          value={selectedRole}
          onChange={(e) => handleRoleChange(e.target.value as Role | "ALL")}
          className="px-3 py-2 border rounded-md"
        >
          <option value="ALL">Tous les rôles</option>
          <option value="STUDENT">Étudiants</option>
          <option value="INSTRUCTOR">Instructeurs</option>
          <option value="ADMIN">Administrateurs</option>
        </select>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={limit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            className="px-3 py-2 border rounded-md"
          >
            <option value={5}>5 par page</option>
            <option value={10}>10 par page</option>
            <option value={20}>20 par page</option>
            <option value={50}>50 par page</option>
          </select>

          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Rechercher un utilisateur..."
            className="w-full sm:w-72 px-3 py-2 border rounded-md"
            autoComplete="off"
          />
        </div>
      </div>

      {/* Table des utilisateurs */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Chargement...</div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Téléphone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date d'inscription
                  </th>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Détails
                  </th> */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pageUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-sm text-gray-500"
                    >
                      Aucun utilisateur trouvé.
                    </td>
                  </tr>
                ) : (
                  pageUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {user.firstName[0]}
                                {user.lastName[0]}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            {user.userProfile?.phone && (
                              <div className="text-sm text-gray-500">
                                {user.userProfile.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.telephone || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === "ADMIN"
                              ? "bg-red-100 text-red-800"
                              : user.role === "INSTRUCTOR"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-green-100 text-green-800"
                          }`}
                        >
                          {user.role === "STUDENT"
                            ? "Étudiant"
                            : user.role === "INSTRUCTOR"
                              ? "Instructeur"
                              : "Admin"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.emailVerified
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {user.emailVerified ? "Vérifié" : "Non vérifié"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedUser(user)}
                          className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-[#002c75] hover:bg-[#EEF4FF]"
                          aria-label={`Voir les détails de ${user.firstName} ${user.lastName}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td> */}
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Suivant
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Affichage de{" "}
                      <span className="font-medium">{startItem}</span> à{" "}
                      <span className="font-medium">{endItem}</span> sur{" "}
                      <span className="font-medium">{totalUsers}</span>{" "}
                      résultats
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Précédent
                      </button>
                      {getPaginationItems(currentPage, totalPages).map((item, index) => {
                        if (item === "ellipsis") {
                          return (
                            <span
                              key={`ellipsis-${index}`}
                              className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500"
                            >
                              ...
                            </span>
                          );
                        }
                        return (
                          <button
                            key={item}
                            onClick={() => setCurrentPage(item)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === item
                                ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {item}
                          </button>
                        );
                      })}
                      <button
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Suivant
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
