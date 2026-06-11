import { create } from "zustand";
import { User } from "./types";
import { api } from "./api";

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    initialize: () => Promise<void>;
    login: (username: string, password: string) => Promise<string | null>;
    register: (username: string, email: string, password: string) => Promise<string | null>;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,

    initialize: async () => {
        const token = typeof window !== "undefined"
            ? localStorage.getItem("auth_token")
            : null;
        if (!token) {
            set({ isLoading: false });
            return;
        }
        const result = await api.getMe();
        if (api.isError(result)) {
            localStorage.removeItem("auth_token");
            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        } else {
            set({ user: result, token, isAuthenticated: true, isLoading: false });
        }
    },

    login: async (username, password) => {
        const result = await api.login(username, password);
        if (api.isError(result)) return result.message;
        localStorage.setItem("auth_token", result.token);
        set({ user: result.user, token: result.token, isAuthenticated: true });
        return null;
    },

    register: async (username, email, password) => {
        const result = await api.register(username, email, password);
        if (api.isError(result)) return result.message;
        localStorage.setItem("auth_token", result.token);
        set({ user: result.user, token: result.token, isAuthenticated: true });
        return null;
    },

    logout: () => {
        localStorage.removeItem("auth_token");
        set({ user: null, token: null, isAuthenticated: false });
    },
}));
