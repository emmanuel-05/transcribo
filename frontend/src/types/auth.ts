/**
 * Types et interfaces relatifs à l'authentification et aux utilisateurs.
 */

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_admin: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface CheckAdminResponse {
  is_admin: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  full_name: string;
}
