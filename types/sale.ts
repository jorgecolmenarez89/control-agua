/**
 * Interfaz para el tipo de pago
 */
export interface TipoPago {
  id: number;
  name: string;
  description: string | null;
  active: number; // 0 = inactivo, 1 = activo
}

/**
 * Interfaz para la venta
 */
export interface Sale {
  id: number;
  product_id: number;
  price_real: number;
  created_at: string;
  type_pago_id: number;
  quantity: number;
  total_price: number;
  sale_date: string | null;
  reference: string | null;
  tipo_pago_name?: string; // Nombre del tipo de pago (incluido cuando se obtiene con JOIN)
}

/**
 * Interfaz para crear una nueva venta (sin id ni created_at)
 */
export interface CreateSale {
  product_id: number;
  price_real: number;
  type_pago_id: number;
  quantity: number;
  total_price: number;
  sale_date?: string | null;
  reference?: string | null;
}

/**
 * Interfaz para actualizar una venta
 */
export interface UpdateSale {
  id: number;
  product_id?: number;
  price_real?: number;
  type_pago_id?: number;
  quantity?: number;
  total_price?: number;
  sale_date?: string | null;
  reference?: string | null;
}

