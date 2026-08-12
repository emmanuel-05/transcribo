import { create } from "zustand";
import api from "@/services/api";
import { User, TokenResponse } from "@/types/auth";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: (reason?: string) => void;
  fetchMe: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  recordActivity: () => void;
  stayConnected: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  recordActivity: () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("transcribo_last_activity", Date.now().toString());
    }
  },

  login: async (email, password) => {
    const response = await api.post<TokenResponse>("/auth/login", { email, password });
    const { access_token, refresh_token } = response.data;

    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", access_token);
      if (refresh_token) {
        localStorage.setItem("refresh_token", refresh_token);
      }
      const now = Date.now().toString();
      localStorage.setItem("transcribo_session_created_at", now);
      localStorage.setItem("transcribo_last_activity", now);
    }

    const me = await api.get<User>("/auth/me");
    set({ user: me.data, isAuthenticated: true, isLoading: false });
  },

  logout: (reason?: string) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("transcribo_session_created_at");
      localStorage.removeItem("transcribo_last_activity");

      set({ user: null, isAuthenticated: false, isLoading: false });

      if (reason) {
        window.location.href = `/login?reason=${encodeURIComponent(reason)}`;
      } else {
        window.location.href = "/login";
      }
    } else {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  refreshToken: async () => {
    if (typeof window === "undefined") return false;
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      return false;
    }

    try {
      const res = await api.post<TokenResponse>("/auth/refresh", {
        refresh_token: refreshToken,
      });
      const { access_token, refresh_token: newRefreshToken } = res.data;

      localStorage.setItem("access_token", access_token);
      if (newRefreshToken) {
        localStorage.setItem("refresh_token", newRefreshToken);
      }
      localStorage.setItem("transcribo_last_activity", Date.now().toString());
      return true;
    } catch (err: any) {
      if (err.response?.data?.detail === "SESSION_EXPIRED_ABSOLUTE") {
        get().logout("expired");
      } else {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("transcribo_session_created_at");
        localStorage.removeItem("transcribo_last_activity");
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
      return false;
    }
  },

  stayConnected: async () => {
    get().recordActivity();
    try {
      await api.get("/auth/ping");
    } catch {
      await get().refreshToken();
    }
  },

  fetchMe: async () => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      if (!token) {
        set({ isLoading: false, isAuthenticated: false, user: null });
        return;
      }
      const response = await api.get<User>("/auth/me");
      get().recordActivity();
      set({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch {
      // Tenter un rafraîchissement si le token d'accès a expiré
      const refreshed = await get().refreshToken();
      if (refreshed) {
        try {
          const response = await api.get<User>("/auth/me");
          set({ user: response.data, isAuthenticated: true, isLoading: false });
          return;
        } catch {
          get().logout();
        }
      } else {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("transcribo_session_created_at");
          localStorage.removeItem("transcribo_last_activity");
        }
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    }
  },
}));