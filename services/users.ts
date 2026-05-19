import { User, UserRole } from '@/types/user';
import api from './api';

interface ApiRole {
  id: number;
  nombre: string;
}

interface ApiUser {
  id: number;
  correo: string;
  id_rol: number;
  activo: boolean;
  rol?: ApiRole;
}

export interface CreateUser {
  correo: string;
  contrasena: string;
  id_rol: number;
  activo: boolean;
}

export interface UpdateUser {
  id: number;
  correo: string;
  contrasena: string;
  id_rol: number;
  activo: boolean;
}

const mapRole = (role: ApiRole): UserRole => ({
  id: role.id,
  nombre: role.nombre,
});

const mapUser = (user: ApiUser): User => ({
  id: user.id,
  correo: user.correo,
  id_rol: user.id_rol,
  activo: user.activo,
  rol: user.rol ? mapRole(user.rol) : undefined,
});

/**
 * Obtiene todos los usuarios
 */
export const getAllUsers = async (): Promise<User[]> => {
  const response = await api.get<ApiUser[]>('/usuarios');
  const data = Array.isArray(response.data) ? response.data : [];
  return data.map(mapUser);
};

/**
 * Obtiene todos los roles
 */
export const getRoles = async (): Promise<UserRole[]> => {
  const response = await api.get<ApiRole[]>('/roles');
  const data = Array.isArray(response.data) ? response.data : [];
  return data.map(mapRole);
};

/**
 * Crea un nuevo usuario
 */
export const createUser = async (user: CreateUser): Promise<User> => {
  const response = await api.post<ApiUser>('/usuarios', {
    correo: user.correo.trim(),
    contrasena: user.contrasena,
    id_rol: user.id_rol,
    activo: user.activo,
  });

  return mapUser(response.data);
};

/**
 * Actualiza un usuario
 */
export const updateUser = async (user: UpdateUser): Promise<User> => {
  const response = await api.put<ApiUser>(`/usuarios/${user.id}`, {
    correo: user.correo.trim(),
    contrasena: user.contrasena,
    id_rol: user.id_rol,
    activo: user.activo,
  });

  return mapUser(response.data);
};

/**
 * Elimina un usuario
 */
export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`/usuarios/${id}`);
};
