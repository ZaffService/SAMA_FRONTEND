import { buildApiUrl, API_ENDPOINTS } from "./baseConfig";

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  // Add other fields as needed
}

export interface CreateUserData {
  email: string;
  name?: string;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
  // Add other fields as needed
}

export class UserApi {
  /**
   * Créer un utilisateur en tant qu'admin
   */
  static async adminCreateUser(data: CreateUserData): Promise<User> {
    try {
      const payload = {
        ...data,
        name: `${data.firstName} ${data.lastName}`,
      };
      console.log(`📡 API: Création d'utilisateur admin:`, payload);

      const response = await fetch(buildApiUrl(API_ENDPOINTS.USER.ADMIN_CREATE), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      console.log(`📡 API: Réponse reçue - Status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API: Erreur ${response.status}: ${errorText}`);
        throw new Error(`Erreur ${response.status}: Impossible de créer l'utilisateur`);
      }

      const user = await response.json();
      console.log(`✅ API: Utilisateur créé:`, user);
      return user;
    } catch (error) {
      console.error(`❌ API: Erreur lors de la création de l'utilisateur:`, error);
      throw error;
    }
  }
}