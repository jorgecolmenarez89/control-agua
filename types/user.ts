/**
 * Interfaz para el usuario de la aplicación
 */
export interface User {
  id: number;
  username: string;
  password: string;
  fullnames: string;
}

/**
 * Interfaz para los datos del usuario en la sesión (sin password)
 */
export interface UserSessionData {
  id: number;
  username: string;
  fullnames: string;
}

