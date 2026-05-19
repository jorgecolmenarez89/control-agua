import { CreateProduct, Product, UpdateProduct } from '@/types/product';
import api from './api';

interface ApiProduct {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: string | number;
  activo: boolean;
}

interface ApiProductPayload {
  nombre?: string;
  descripcion?: string | null;
  precio?: number;
  activo?: boolean;
}

const parseNumber = (value: string | number | null | undefined): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapApiProductToProduct = (product: ApiProduct): Product => {
  return {
    id: product.id,
    name: product.nombre,
    description: product.descripcion ?? null,
    price: parseNumber(product.precio),
    active: product.activo ? 1 : 0,
  };
};

const mapCreatePayload = (product: CreateProduct): ApiProductPayload => {
  return {
    nombre: product.name.trim(),
    descripcion: product.description?.trim() || null,
    precio: Number(product.price),
    activo: product.active === 1,
  };
};

const mapUpdatePayload = (product: UpdateProduct): ApiProductPayload => {
  const payload: ApiProductPayload = {};

  if (product.name !== undefined) {
    payload.nombre = product.name.trim();
  }

  if (product.description !== undefined) {
    payload.descripcion = product.description?.trim() || null;
  }

  if (product.price !== undefined) {
    payload.precio = Number(product.price);
  }

  if (product.active !== undefined) {
    payload.activo = product.active === 1;
  }

  return payload;
};

/**
 * Obtiene todos los productos
 */
export const getAllProducts = async (includeInactive = false): Promise<Product[]> => {
  try {
    const response = await api.get<ApiProduct[]>('/productos');
    const items = Array.isArray(response.data) ? response.data : [];

    const mappedProducts = items.map(mapApiProductToProduct);

    if (includeInactive) {
      return mappedProducts;
    }

    return mappedProducts.filter((product) => product.active === 1);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    throw error;
  }
};

/**
 * Obtiene un producto por ID
 */
export const getProductById = async (id: number): Promise<Product | null> => {
  try {
    const response = await api.get<ApiProduct>(`/productos/${id}`);
    return mapApiProductToProduct(response.data);
  } catch (error) {
    // Fallback para backends que no exponen GET por id
    try {
      const products = await getAllProducts(true);
      return products.find((product) => product.id === id) || null;
    } catch {
      console.error('Error al obtener producto:', error);
      throw error;
    }
  }
};

/**
 * Crea un nuevo producto
 */
export const createProduct = async (product: CreateProduct): Promise<Product> => {
  try {
    const response = await api.post<ApiProduct>('/productos', mapCreatePayload(product));
    return mapApiProductToProduct(response.data);
  } catch (error) {
    console.error('Error al crear producto:', error);
    throw error;
  }
};

/**
 * Actualiza un producto
 */
export const updateProduct = async (product: UpdateProduct): Promise<Product> => {
  try {
    const payload = mapUpdatePayload(product);

    let response;
    try {
      response = await api.put<ApiProduct>(`/productos/${product.id}`, payload);
    } catch {
      response = await api.patch<ApiProduct>(`/productos/${product.id}`, payload);
    }

    return mapApiProductToProduct(response.data);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    throw error;
  }
};

/**
 * Elimina un producto (soft delete - marca como inactivo)
 */
export const deleteProduct = async (id: number): Promise<void> => {
  try {
    await updateProduct({
      id,
      active: 0,
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    throw error;
  }
};

/**
 * Elimina un producto permanentemente
 */
export const hardDeleteProduct = async (id: number): Promise<void> => {
  try {
    await api.delete(`/productos/${id}`);
  } catch (error) {
    console.error('Error al eliminar producto permanentemente:', error);
    throw error;
  }
};
