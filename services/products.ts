import { executeQuery } from './database';
import { Product, CreateProduct, UpdateProduct } from '@/types/product';
import { hasProductInSales } from './sales';

/**
 * Obtiene todos los productos
 */
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const result = await executeQuery(
      'SELECT * FROM productos ORDER BY name ASC'
    );
    
    const products: Product[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      products.push(result.rows.item(i));
    }
    
    return products;
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
    const result = await executeQuery(
      'SELECT * FROM productos WHERE id = ?',
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows.item(0);
  } catch (error) {
    console.error('Error al obtener producto:', error);
    throw error;
  }
};

/**
 * Crea un nuevo producto
 */
export const createProduct = async (product: CreateProduct): Promise<Product> => {
  try {
    const result = await executeQuery(
      'INSERT INTO productos (name, description, price, active) VALUES (?, ?, ?, ?)',
      [product.name, product.description || null, product.price, product.active]
    );
    
    if (!result.insertId) {
      throw new Error('No se pudo crear el producto');
    }
    
    const newProduct = await getProductById(Number(result.insertId));
    if (!newProduct) {
      throw new Error('Producto creado pero no se pudo obtener');
    }
    
    return newProduct;
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
    const existingProduct = await getProductById(product.id);
    if (!existingProduct) {
      throw new Error('Producto no encontrado');
    }
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (product.name !== undefined) {
      updates.push('name = ?');
      values.push(product.name);
    }
    if (product.description !== undefined) {
      updates.push('description = ?');
      values.push(product.description || null);
    }
    if (product.price !== undefined) {
      updates.push('price = ?');
      values.push(product.price);
    }
    if (product.active !== undefined) {
      updates.push('active = ?');
      values.push(product.active);
    }
    
    if (updates.length === 0) {
      return existingProduct;
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(product.id);
    
    await executeQuery(
      `UPDATE productos SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    const updatedProduct = await getProductById(product.id);
    if (!updatedProduct) {
      throw new Error('Producto actualizado pero no se pudo obtener');
    }
    
    return updatedProduct;
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    throw error;
  }
};

/**
 * Elimina un producto (soft delete - marca como inactivo)
 * Valida que el producto no esté siendo usado en ninguna venta
 */
export const deleteProduct = async (id: number): Promise<void> => {
  try {
    // Verificar si el producto está en alguna venta
    const isInSales = await hasProductInSales(id);
    if (isInSales) {
      throw new Error('No se puede eliminar el producto porque está siendo usado en una o más ventas');
    }
    
    await executeQuery(
      'UPDATE productos SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
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
    await executeQuery('DELETE FROM productos WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error al eliminar producto permanentemente:', error);
    throw error;
  }
};

