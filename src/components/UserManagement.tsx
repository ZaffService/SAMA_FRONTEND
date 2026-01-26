import React, { useState, useEffect } from 'react';
import { userService } from '@/services/userService';
import type { User, UsersResponse } from '@/types/user';
import { useLocalAuth } from '@/infrastructure/storage/useAuth';

type Role = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

const UserManagement: React.FC = () => {
  const { user: currentUser } = useLocalAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    instructors: 0,
    admins: 0,
  });

  const limit = 10;

  // Charger les statistiques au montage (après que currentUser soit disponible)
  useEffect(() => {
    if (currentUser) {
      loadStats();
    }
  }, [currentUser]);

  // Recharger les utilisateurs quand le filtre change
  useEffect(() => {
    loadUsers();
  }, [selectedRole, currentPage]);

  const loadStats = async () => {
    try {
      const stats = await userService.getUserStats();
      setStats({
        total: stats.total - 1,
        students: currentUser?.role === 'STUDENT' ? stats.students - 1 : stats.students,
        instructors: currentUser?.role === 'INSTRUCTOR' ? stats.instructors - 1 : stats.instructors,
        admins: currentUser?.role === 'ADMIN' ? stats.admins - 1 : stats.admins,
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit,
        ...(selectedRole !== 'ALL' && { role: selectedRole }),
      };

      const response: UsersResponse = await userService.getUsersByRole(params);
      
      // Get current admin ID as string for comparison
      const currentAdminId = currentUser?.id?.toString();
      
      // Filter out the current admin user from the list
      const filteredUsers = response.users.filter(
        (user) => user.id.toString() !== currentAdminId
      );
      
      setUsers(filteredUsers);
      setTotalUsers(response.total - 1); // Adjust total since we removed one user
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role: Role | 'ALL') => {
    setSelectedRole(role);
    setCurrentPage(1); // Reset à la première page
  };

  const totalPages = Math.ceil(totalUsers / limit);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gestion des Utilisateurs</h1>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800">Total</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800">Étudiants</h3>
          <p className="text-2xl font-bold text-green-600">{stats.students}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800">Instructeurs</h3>
          <p className="text-2xl font-bold text-purple-600">{stats.instructors}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800">Admins</h3>
        </div>
      </div>

      {/* Filtres */}
      <div className="mb-4 flex gap-4">
        <select
          value={selectedRole}
          onChange={(e) => handleRoleChange(e.target.value as Role | 'ALL')}
          className="px-3 py-2 border rounded-md"
        >
          <option value="ALL">Tous les rôles</option>
          <option value="STUDENT">Étudiants</option>
          <option value="INSTRUCTOR">Instructeurs</option>
          <option value="ADMIN">Administrateurs</option>
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
                              {user.firstName[0]}{user.lastName[0]}
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                        user.role === 'INSTRUCTOR' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role === 'STUDENT' ? 'Étudiant' :
                         user.role === 'INSTRUCTOR' ? 'Instructeur' : 'Admin'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.emailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.emailVerified ? 'Vérifié' : 'Non vérifié'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('fr-FR')}
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
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Suivant
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Affichage de{' '}
                      <span className="font-medium">
                        {(currentPage - 1) * limit + 1}
                      </span>{' '}
                      à{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * limit, totalUsers)}
                      </span>{' '}
                      sur{' '}
                      <span className="font-medium">{totalUsers}</span>{' '}
                      résultats
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      {/* Boutons de pagination simplifiés */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNum
                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
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
