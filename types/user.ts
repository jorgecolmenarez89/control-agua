/**
 * Interfaz para el usuario de la aplicación
 */
export interface UserRole {
  id: number;
  nombre: string;
}

export interface User {
  id: number;
  correo: string;
  id_rol: number;
  activo: boolean;
  rol?: UserRole;
}

/**
 * Interfaz para los datos del usuario en la sesión (sin password)
 */
export interface UserSessionData {
  id: number;
  correo: string;
  id_rol: number;
  activo: boolean;
  rol?: UserRole;
}

