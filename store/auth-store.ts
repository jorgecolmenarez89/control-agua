import {
    LoginCredentials,
    login as loginRequest,
    refreshAccessToken,
    validateToken,
} from '@/services/auth';
import {
    clearSession,
    getSession,
    saveAccessToken,
    saveRefreshToken,
    saveSession,
} from '@/services/sessionStorage';
import { AuthUser } from '@/types/auth';
import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  initializeAuth: () => Promise<void>;
  loginWithCredentials: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const unauthenticatedState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...unauthenticatedState,
  isLoading: true,

  initializeAuth: async () => {
    set({ isLoading: true });

    try {
      const session = await getSession();

      if (!session) {
        set({ ...unauthenticatedState, isLoading: false });
        return;
      }

      const accessToken = session.accessToken || session.token || null;
      const refreshToken = session.refreshToken || null;
      const user = session.userData || null;

      if (!accessToken && !refreshToken) {
        await clearSession();
        set({ ...unauthenticatedState, isLoading: false });
        return;
      }

      if (accessToken && (await validateToken(accessToken))) {
        set({
          isAuthenticated: true,
          isLoading: false,
          user,
          accessToken,
          refreshToken,
        });
        return;
      }

      if (refreshToken) {
        const refreshed = await refreshAccessToken(refreshToken);

        if (refreshed?.access_token) {
          await saveAccessToken(refreshed.access_token);
          const finalRefreshToken = refreshed.refresh_token || refreshToken;

          if (refreshed.refresh_token) {
            await saveRefreshToken(refreshed.refresh_token);
          }

          set({
            isAuthenticated: true,
            isLoading: false,
            user,
            accessToken: refreshed.access_token,
            refreshToken: finalRefreshToken,
          });
          return;
        }

        const refreshStillValid = await validateToken(refreshToken);

        if (refreshStillValid) {
          await saveAccessToken(refreshToken);
          set({
            isAuthenticated: true,
            isLoading: false,
            user,
            accessToken: refreshToken,
            refreshToken,
          });
          return;
        }
      }

      await clearSession();
      set({ ...unauthenticatedState, isLoading: false });
    } catch (error) {
      await clearSession();
      set({ ...unauthenticatedState, isLoading: false });
    }
  },

  loginWithCredentials: async (credentials) => {
    const { correo, contrasena } = credentials;

    if (!correo.trim() || !contrasena.trim()) {
      throw new Error('Por favor completa todos los campos');
    }

    set({ isLoading: true });

    try {
      const response = await loginRequest({
        correo: correo.trim(),
        contrasena: contrasena.trim(),
      });

      const session = {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        userId: response.usuario.id.toString(),
        userData: response.usuario,
      };

      await saveSession(session);

      set({
        isAuthenticated: true,
        isLoading: false,
        user: response.usuario,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await clearSession();
    set({ ...unauthenticatedState, isLoading: false });
  },

  checkAuth: async () => {
    await get().initializeAuth();
  },
}));
