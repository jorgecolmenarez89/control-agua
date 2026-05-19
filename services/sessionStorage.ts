import { AuthUser } from '@/types/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Claves para el almacenamiento
const SESSION_KEYS = {
  ACCESS_TOKEN: '@control_agua:access_token',
  REFRESH_TOKEN: '@control_agua:refresh_token',
  LEGACY_USER_TOKEN: '@control_agua:user_token',
  USER_ID: '@control_agua:user_id',
  USER_DATA: '@control_agua:user_data',
  IS_LOGGED_IN: '@control_agua:is_logged_in',
} as const;

export interface UserSession {
  accessToken?: string;
  refreshToken?: string;
  // Compatibilidad temporal con la estructura anterior.
  token?: string;
  userId?: string;
  userData?: AuthUser;
}

/**
 * Guarda el access token del usuario.
 */
export const saveAccessToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(SESSION_KEYS.ACCESS_TOKEN, token);
    await AsyncStorage.setItem(SESSION_KEYS.LEGACY_USER_TOKEN, token);
  } catch (error) {
    console.error('Error al guardar el access token:', error);
    throw error;
  }
};

/**
 * Obtiene el access token del usuario.
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    const accessToken = await AsyncStorage.getItem(SESSION_KEYS.ACCESS_TOKEN);

    if (accessToken) {
      return accessToken;
    }

    return await AsyncStorage.getItem(SESSION_KEYS.LEGACY_USER_TOKEN);
  } catch (error) {
    console.error('Error al obtener el access token:', error);
    return null;
  }
};

/**
 * Guarda el refresh token del usuario.
 */
export const saveRefreshToken = async (refreshToken: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(SESSION_KEYS.REFRESH_TOKEN, refreshToken);
  } catch (error) {
    console.error('Error al guardar el refresh token:', error);
    throw error;
  }
};

/**
 * Obtiene el refresh token del usuario.
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(SESSION_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error('Error al obtener el refresh token:', error);
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
    const accessToken = session.accessToken || session.token;

    if (accessToken) {
      await saveAccessToken(accessToken);
    }

    if (session.refreshToken) {
      await saveRefreshToken(session.refreshToken);
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
    const [accessToken, refreshToken, userId, userData] = await Promise.all([
      getAccessToken(),
      getRefreshToken(),
      getUserId(),
      getUserData(),
    ]);

    if (!accessToken && !refreshToken && !userId && !userData) {
      return null;
    }

    return {
      accessToken: accessToken || undefined,
      refreshToken: refreshToken || undefined,
      token: accessToken || undefined,
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
    const [value, accessToken, refreshToken] = await Promise.all([
      AsyncStorage.getItem(SESSION_KEYS.IS_LOGGED_IN),
      getAccessToken(),
      getRefreshToken(),
    ]);

    return value === 'true' && Boolean(accessToken || refreshToken);
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
      AsyncStorage.removeItem(SESSION_KEYS.ACCESS_TOKEN),
      AsyncStorage.removeItem(SESSION_KEYS.REFRESH_TOKEN),
      AsyncStorage.removeItem(SESSION_KEYS.LEGACY_USER_TOKEN),
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

