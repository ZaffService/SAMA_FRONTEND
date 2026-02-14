import React, { useState, useEffect } from "react";
import { userService } from "@/services/userService";
import type { User, UsersResponse } from "@/types/user";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";

type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN";

const UserManagement: React.FC = () => {
  const { user: currentUser } = useLocalAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | "ALL">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [limit, setLimit] = useState(10);
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    instructors: 0,
    admins: 0,
  });

  // Charger les statistiques au montage (après que currentUser soit disponible)
  useEffect(() => {
    if (currentUser) {
      loadStats();
    }
  }, [currentUser]);

  // Recharger les utilisateurs quand le filtre change
  useEffect(() => {
    loadUsers();
  }, [selectedRole, currentPage, limit]);

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
      console.error("Erreur chargement stats:", error);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit,
        ...(selectedRole !== "ALL" && { role: selectedRole }),
      };

      const response: UsersResponse = await userService.getUsersByRole(params);

      // Utiliser directement les utilisateurs du backend sans filtrage
      // La pagination est gérée uniquement par le backend
      setUsers(response.users);
      setTotalUsers(response.total);
    } catch (error) {
      console.error("Erreur chargement utilisateurs:", error);
    } finally {
      setLoading(false);
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

  const totalPages = Math.ceil(totalUsers / limit);

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

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Gestion des Utilisateurs</h1>
        <button
          type="button"
          onClick={() =>
            window.alert(
              "Cette fonctionnalité est en cours de développement.",
            )
          }
          className="inline-flex items-center justify-center rounded-lg bg-[#002c75] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#001f54]"
        >
          Ajout en masse
        </button>
      </div>

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
      <div className="mb-4 flex gap-4 items-center">
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
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
                  </tr>
                ))}
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
                      <span className="font-medium">
                        {(currentPage - 1) * limit + 1}
                      </span>{" "}
                      à{" "}
                      <span className="font-medium">
                        {Math.min(currentPage * limit, totalUsers)}
                      </span>{" "}
                      sur <span className="font-medium">{totalUsers}</span>{" "}
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
