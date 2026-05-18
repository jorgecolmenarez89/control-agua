import { executeQuery } from './database';
import { TipoPago } from '@/types/sale';

/**
 * Obtiene todos los tipos de pago activos
 */
export const getAllTiposPago = async (): Promise<TipoPago[]> => {
  try {
    const result = await executeQuery(
      'SELECT * FROM tipo_pago WHERE active = 1 ORDER BY name ASC'
    );
    
    const tiposPago: TipoPago[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      tiposPago.push(result.rows.item(i));
    }
    
    return tiposPago;
  } catch (error) {
    console.error('Error al obtener tipos de pago:', error);
    throw error;
  }
};

/**
 * Obtiene un tipo de pago por ID
 */
export const getTipoPagoById = async (id: number): Promise<TipoPago | null> => {
  try {
    const result = await executeQuery(
      'SELECT * FROM tipo_pago WHERE id = ?',
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows.item(0);
  } catch (error) {
    console.error('Error al obtener tipo de pago:', error);
    throw error;
  }
};

