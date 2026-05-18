import { executeQuery } from './database';
import { User } from '@/types/user';

export interface CreateUser {
  username: string;
  password: string;
  fullnames: string;
}

export interface UpdateUser {
  id: number;
  username?: string;
  password?: string;
  fullnames?: string;
}

/**
 * Obtiene todos los usuarios
 */
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const result = await executeQuery(
      'SELECT id, username, fullnames, created_at FROM users ORDER BY created_at DESC'
    );
    
    const users: User[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      users.push({
        id: row.id,
        username: row.username,
        password: '', // No retornar contraseña
        fullnames: row.fullnames,
      });
    }
    
    return users;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
};

/**
 * Obtiene un usuario por ID
 */
export const getUserById = async (id: number): Promise<User | null> => {
  try {
    const result = await executeQuery(
      'SELECT id, username, fullnames, created_at FROM users WHERE id = ?',
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows.item(0);
    return {
      id: row.id,
      username: row.username,
      password: '', // No retornar contraseña
      fullnames: row.fullnames,
    };
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    throw error;
  }
};

/**
 * Crea un nuevo usuario
 */
export const createUser = async (user: CreateUser): Promise<User> => {
  try {
    // Verificar si el usuario ya existe
    const existingUser = await executeQuery(
      'SELECT * FROM users WHERE username = ? LIMIT 1',
      [user.username.trim()]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('El nombre de usuario ya está en uso');
    }

    const result = await executeQuery(
      'INSERT INTO users (username, password, fullnames) VALUES (?, ?, ?)',
      [user.username.trim(), user.password.trim(), user.fullnames.trim()]
    );
    
    if (!result.insertId) {
      throw new Error('No se pudo crear el usuario');
    }
    
    const newUser = await getUserById(Number(result.insertId));
    if (!newUser) {
      throw new Error('Usuario creado pero no se pudo obtener');
    }
    
    return newUser;
  } catch (error) {
    console.error('Error al crear usuario:', error);
    throw error;
  }
};

/**
 * Actualiza un usuario
 */
export const updateUser = async (user: UpdateUser): Promise<User> => {
  try {
    const existingUser = await getUserById(user.id);
    if (!existingUser) {
      throw new Error('Usuario no encontrado');
    }
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (user.username !== undefined) {
      // Verificar si el nuevo username ya existe en otro usuario
      const existingUsername = await executeQuery(
        'SELECT * FROM users WHERE username = ? AND id != ? LIMIT 1',
        [user.username.trim(), user.id]
      );
      
      if (existingUsername.rows.length > 0) {
        throw new Error('El nombre de usuario ya está en uso');
      }
      
      updates.push('username = ?');
      values.push(user.username.trim());
    }
    if (user.password !== undefined && user.password.trim() !== '') {
      updates.push('password = ?');
      values.push(user.password.trim());
    }
    if (user.fullnames !== undefined) {
      updates.push('fullnames = ?');
      values.push(user.fullnames.trim());
    }
    
    if (updates.length === 0) {
      return existingUser;
    }
    
    values.push(user.id);
    
    await executeQuery(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    const updatedUser = await getUserById(user.id);
    if (!updatedUser) {
      throw new Error('Usuario actualizado pero no se pudo obtener');
    }
    
    return updatedUser;
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    throw error;
  }
};

/**
 * Elimina un usuario
 */
export const deleteUser = async (id: number): Promise<void> => {
  try {
    // Verificar si es el último usuario
    const allUsers = await getAllUsers();
    if (allUsers.length <= 1) {
      throw new Error('No se puede eliminar el último usuario');
    }
    
    await executeQuery('DELETE FROM users WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    throw error;
  }
};

