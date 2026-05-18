import { UserSessionData } from '@/types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Claves para el almacenamiento
const SESSION_KEYS = {
  USER_TOKEN: '@control_agua:user_token',
  USER_ID: '@control_agua:user_id',
  USER_DATA: '@control_agua:user_data',
  IS_LOGGED_IN: '@control_agua:is_logged_in',
} as const;

export interface UserSession {
  token?: string;
  userId?: string;
  userData?: UserSessionData;
}

/**
 * Guarda el token de sesión del usuario
 */
export const saveUserToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(SESSION_KEYS.USER_TOKEN, token);
  } catch (error) {
    console.error('Error al guardar el token:', error);
    throw error;
  }
};

/**
 * Obtiene el token de sesión del usuario
 */
export const getUserToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(SESSION_KEYS.USER_TOKEN);
  } catch (error) {
    console.error('Error al obtener el token:', error);
    return null;
  }
};

/**
 * Guarda el ID del usuario
 */
export const saveUserId = async (userId: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(SESSION_KEYS.USER_ID, userId);
  } catch (error) {
    console.error('Error al guardar el ID de usuario:', error);
    throw error;
  }
};

/**
 * Obtiene el ID del usuario
 */
export const getUserId = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(SESSION_KEYS.USER_ID);
  } catch (error) {
    console.error('Error al obtener el ID de usuario:', error);
    return null;
  }
};

/**
 * Guarda los datos completos del usuario
 */
export const saveUserData = async (userData: UserSession['userData']): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(userData);
    await AsyncStorage.setItem(SESSION_KEYS.USER_DATA, jsonValue);
  } catch (error) {
    console.error('Error al guardar los datos del usuario:', error);
    throw error;
  }
};

/**
 * Obtiene los datos completos del usuario
 */
export const getUserData = async (): Promise<UserSession['userData'] | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(SESSION_KEYS.USER_DATA);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error al obtener los datos del usuario:', error);
    return null;
  }
};

/**
 * Guarda toda la sesión del usuario
 */
export const saveSession = async (session: UserSession): Promise<void> => {
  try {
    if (session.token) {
      await saveUserToken(session.token);
    }
    if (session.userId) {
      await saveUserId(session.userId);
    }
    if (session.userData) {
      await saveUserData(session.userData);
    }
    await AsyncStorage.setItem(SESSION_KEYS.IS_LOGGED_IN, 'true');
  } catch (error) {
    console.error('Error al guardar la sesión:', error);
    throw error;
  }
};

/**
 * Obtiene toda la sesión del usuario
 */
export const getSession = async (): Promise<UserSession | null> => {
  try {
    const [token, userId, userData] = await Promise.all([
      getUserToken(),
      getUserId(),
      getUserData(),
    ]);

    if (!token && !userId && !userData) {
      return null;
    }

    return {
      token: token || undefined,
      userId: userId || undefined,
      userData: userData || undefined,
    };
  } catch (error) {
    console.error('Error al obtener la sesión:', error);
    return null;
  }
};

/**
 * Verifica si el usuario está logueado
 */
export const isLoggedIn = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(SESSION_KEYS.IS_LOGGED_IN);
    return value === 'true';
  } catch (error) {
    console.error('Error al verificar el estado de login:', error);
    return false;
  }
};

/**
 * Limpia toda la sesión del usuario
 */
export const clearSession = async (): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(SESSION_KEYS.USER_TOKEN),
      AsyncStorage.removeItem(SESSION_KEYS.USER_ID),
      AsyncStorage.removeItem(SESSION_KEYS.USER_DATA),
      AsyncStorage.removeItem(SESSION_KEYS.IS_LOGGED_IN),
    ]);
  } catch (error) {
    console.error('Error al limpiar la sesión:', error);
    throw error;
  }
};

/**
 * Limpia todos los datos del almacenamiento (útil para desarrollo/debugging)
 */
export const clearAllStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error al limpiar todo el almacenamiento:', error);
    throw error;
  }
};

