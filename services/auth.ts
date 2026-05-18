import { executeQuery } from './database';
import { User } from '@/types/user';
import { UserSession } from './sessionStorage';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  password: string;
  fullnames: string;
}

export interface AuthResult {
  success: boolean;
  user?: UserSession['userData'];
  token?: string;
  userId?: string;
  error?: string;
}

/**
 * Inicia sesión con un usuario existente
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResult> => {
  try {
    const { username, password } = credentials;

    if (!username.trim() || !password.trim()) {
      return {
        success: false,
        error: 'Por favor completa todos los campos',
      };
    }

    // Buscar usuario en la base de datos
    const result = await executeQuery(
      'SELECT * FROM users WHERE username = ? LIMIT 1',
      [username.trim()]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'Usuario no encontrado',
      };
    }

    // Usuario existe, verificar contraseña
    const user: User = result.rows.item(0);

    if (user.password !== password.trim()) {
      return {
        success: false,
        error: 'Contraseña incorrecta',
      };
    }

    // Contraseña correcta, generar token y retornar datos del usuario
    const token = `token_${user.id}_${Date.now()}`;
    const userId = user.id.toString();

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        fullnames: user.fullnames,
      },
      token,
      userId,
    };
  } catch (error) {
    console.error('Error en login:', error);
    return {
      success: false,
      error: 'No se pudo iniciar sesión. Intenta nuevamente.',
    };
  }
};

/**
 * Registra un nuevo usuario
 */
export const register = async (credentials: RegisterCredentials): Promise<AuthResult> => {
  try {
    const { username, password, fullnames } = credentials;

    if (!username.trim() || !password.trim() || !fullnames.trim()) {
      return {
        success: false,
        error: 'Por favor completa todos los campos',
      };
    }

    // Verificar si el usuario ya existe
    const existingUser = await executeQuery(
      'SELECT * FROM users WHERE username = ? LIMIT 1',
      [username.trim()]
    );

    if (existingUser.rows.length > 0) {
      return {
        success: false,
        error: 'El nombre de usuario ya está en uso',
      };
    }

    // Crear nuevo usuario
    const insertResult = await executeQuery(
      'INSERT INTO users (username, password, fullnames) VALUES (?, ?, ?)',
      [username.trim(), password.trim(), fullnames.trim()]
    );

    if (!insertResult.insertId) {
      return {
        success: false,
        error: 'No se pudo crear el usuario',
      };
    }

    // Obtener el usuario recién creado
    const newUserResult = await executeQuery(
      'SELECT * FROM users WHERE id = ?',
      [insertResult.insertId]
    );

    if (newUserResult.rows.length === 0) {
      return {
        success: false,
        error: 'Usuario creado pero no se pudo obtener la información',
      };
    }

    const user: User = newUserResult.rows.item(0);
    const token = `token_${user.id}_${Date.now()}`;
    const userId = user.id.toString();

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        fullnames: user.fullnames,
      },
      token,
      userId,
    };
  } catch (error) {
    console.error('Error en register:', error);
    return {
      success: false,
      error: 'No se pudo registrar el usuario. Intenta nuevamente.',
    };
  }
};

