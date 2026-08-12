/**
 * Constantes des routes de l'application.
 */

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  ADMIN: "/admin",
  PROJECT_DETAILS: (id: string) => `/projects/${id}`,
} as const;
