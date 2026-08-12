/**
 * Service d'authentification et gestion des comptes utilisateurs.
 */
import api from "./api";
import {
  User,
  TokenResponse,
  CheckAdminResponse,
  LoginCredentials,
  RegisterCredentials,
} from "@/types/auth";

export const authService = {
  /**
   * Authentifie un utilisateur et retourne les tokens JWT.
   */
  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>("/auth/login", credentials);
    return response.data;
  },

  /**
   * Crée un nouveau compte utilisateur (Réservé à l'administrateur).
   */
  async register(credentials: RegisterCredentials): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>("/auth/register", credentials);
    return response.data;
  },

  /**
   * Récupère le profil de l'utilisateur actuellement connecté.
   */
  async getMe(): Promise<User> {
    const response = await api.get<User>("/auth/me");
    return response.data;
  },

  /**
   * Renouvelle l'Access Token à partir d'un Refresh Token valide.
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>("/auth/refresh", {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  /**
   * Vérifie si une adresse email correspond à un administrateur.
   */
  async checkAdmin(email: string): Promise<CheckAdminResponse> {
    const response = await api.get<CheckAdminResponse>(`/auth/check-admin?email=${encodeURIComponent(email)}`);
    return response.data;
  },

  /**
   * Endpoint de keep-alive pour maintenir la session active.
   */
  async ping(): Promise<{ status: string; user: string }> {
    const response = await api.get<{ status: string; user: string }>("/auth/ping");
    return response.data;
  },
};
