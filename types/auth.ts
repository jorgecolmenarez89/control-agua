export interface AuthRole {
  id: number;
  nombre: string;
}

export interface AuthUser {
  id: number;
  correo: string;
  id_rol: number;
  activo: boolean;
  rol: AuthRole;
}

export interface LoginResponse {
  mensaje: string;
  access_token: string;
  refresh_token: string;
  usuario: AuthUser;
}

export interface TokenStatusResponse {
  valido?: boolean;
  valid?: boolean;
  activo?: boolean;
  active?: boolean;
  expiro?: boolean;
  expired?: boolean;
  [key: string]: unknown;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token?: string;
}
