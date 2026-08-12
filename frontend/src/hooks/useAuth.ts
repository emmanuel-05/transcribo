/**
 * Custom Hook encapsulant l'accès au store d'authentification.
 */
import { useAuthStore } from "@/store/authStore";

export function useAuth() {
  const {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    fetchMe,
    refreshToken,
    recordActivity,
    stayConnected,
  } = useAuthStore();

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin: Boolean(user?.is_admin),
    login,
    logout,
    fetchMe,
    refreshToken,
    recordActivity,
    stayConnected,
  };
}
