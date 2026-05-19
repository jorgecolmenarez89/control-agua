import api, { rawApi } from '@/services/api';
import { LoginResponse, RefreshResponse, TokenStatusResponse } from '@/types/auth';

export interface LoginCredentials {
  correo: string;
  contrasena: string;
}

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const { correo, contrasena } = credentials;

  const response = await api.post<LoginResponse>('/auth/login', {
    correo: correo.trim(),
    contrasena: contrasena.trim(),
  });

  return response.data;
};

export const validateToken = async (token: string): Promise<boolean> => {
  if (!token?.trim()) {
    return false;
  }

  try {
    const response = await rawApi.post<TokenStatusResponse>('/auth/token-status', {
      token,
    });

    const data = response.data || {};

    if (typeof data.valido === 'boolean') return data.valido;
    if (typeof data.valid === 'boolean') return data.valid;
    if (typeof data.activo === 'boolean') return data.activo;
    if (typeof data.active === 'boolean') return data.active;
    if (typeof data.expiro === 'boolean') return !data.expiro;
    if (typeof data.expired === 'boolean') return !data.expired;

    // Si el backend no devuelve una bandera explícita, HTTP 2xx se considera válido.
    return true;
  } catch {
    return false;
  }
};

export const refreshAccessToken = async (
  refreshToken: string
): Promise<RefreshResponse | null> => {
  if (!refreshToken?.trim()) {
    return null;
  }

  try {
    const response = await rawApi.post<RefreshResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });

    if (!response.data?.access_token) {
      return null;
    }

    return response.data;
  } catch {
    return null;
  }
};

