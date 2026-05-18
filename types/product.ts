/**
 * Interfaz para el producto
 */
export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  active: number; // 0 = inactivo, 1 = activo (SQLite no tiene boolean)
}

/**
 * Interfaz para crear un nuevo producto (sin id)
 */
export interface CreateProduct {
  name: string;
  description: string | null;
  price: number;
  active: number;
}

/**
 * Interfaz para actualizar un producto (todos los campos opcionales excepto id)
 */
export interface UpdateProduct {
  id: number;
  name?: string;
  description?: string | null;
  price?: number;
  active?: number;
}

