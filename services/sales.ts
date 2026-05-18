import { CreateSale, Sale, UpdateSale } from '@/types/sale';
import { executeQuery } from './database';

/**
 * Convierte una fecha a formato local sin conversión a UTC
 * Ajusta para zona horaria de Venezuela (UTC-4)
 */
const toLocalISOString = (date: Date): string => {
  // Obtener los componentes de la fecha en hora local
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
};

/**
 * Crea una fecha para el inicio del día en hora local (00:00:00)
 */
const getStartOfDay = (date: Date): Date => {
  const localDate = new Date(date);
  localDate.setHours(0, 0, 0, 0);
  return localDate;
};

/**
 * Crea una fecha para el fin del día en hora local (23:59:59.999)
 */
const getEndOfDay = (date: Date): Date => {
  const localDate = new Date(date);
  localDate.setHours(23, 59, 59, 999);
  return localDate;
};

/**
 * Obtiene todas las ventas
 */
export const getAllSales = async (): Promise<Sale[]> => {
  try {
    const result = await executeQuery(
      `SELECT v.*, p.name as product_name, tp.name as tipo_pago_name
       FROM ventas v
       LEFT JOIN productos p ON v.product_id = p.id
       LEFT JOIN tipo_pago tp ON v.type_pago_id = tp.id
       ORDER BY COALESCE(v.sale_date, v.created_at) DESC`
    );
    
    const sales: Sale[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      sales.push({
        id: row.id,
        product_id: row.product_id,
        price_real: row.price_real,
        created_at: row.created_at,
        type_pago_id: row.type_pago_id,
        quantity: row.quantity,
        total_price: row.total_price,
        sale_date: row.sale_date || null,
        reference: row.reference || null,
        tipo_pago_name: row.tipo_pago_name || null,
      });
    }
    
    return sales;
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    throw error;
  }
};

/**
 * Obtiene una venta por ID
 */
export const getSaleById = async (id: number): Promise<Sale | null> => {
  try {
    const result = await executeQuery(
      'SELECT * FROM ventas WHERE id = ?',
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows.item(0);
  } catch (error) {
    console.error('Error al obtener venta:', error);
    throw error;
  }
};

/**
 * Crea una nueva venta
 */
export const createSale = async (sale: CreateSale): Promise<Sale> => {
  try {
    const result = await executeQuery(
      'INSERT INTO ventas (product_id, price_real, type_pago_id, quantity, total_price, sale_date, reference) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [sale.product_id, sale.price_real, sale.type_pago_id, sale.quantity, sale.total_price, sale.sale_date || null, sale.reference || null]
    );
    
    if (!result.insertId) {
      throw new Error('No se pudo crear la venta');
    }
    
    const newSale = await getSaleById(Number(result.insertId));
    if (!newSale) {
      throw new Error('Venta creada pero no se pudo obtener');
    }
    
    return newSale;
  } catch (error) {
    console.error('Error al crear venta:', error);
    throw error;
  }
};

/**
 * Actualiza una venta
 */
export const updateSale = async (sale: UpdateSale): Promise<Sale> => {
  try {
    const existingSale = await getSaleById(sale.id);
    if (!existingSale) {
      throw new Error('Venta no encontrada');
    }
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (sale.product_id !== undefined) {
      updates.push('product_id = ?');
      values.push(sale.product_id);
    }
    if (sale.price_real !== undefined) {
      updates.push('price_real = ?');
      values.push(sale.price_real);
    }
    if (sale.type_pago_id !== undefined) {
      updates.push('type_pago_id = ?');
      values.push(sale.type_pago_id);
    }
    if (sale.quantity !== undefined) {
      updates.push('quantity = ?');
      values.push(sale.quantity);
    }
    if (sale.total_price !== undefined) {
      updates.push('total_price = ?');
      values.push(sale.total_price);
    }
    if (sale.sale_date !== undefined) {
      updates.push('sale_date = ?');
      values.push(sale.sale_date);
    }
    if (sale.reference !== undefined) {
      updates.push('reference = ?');
      values.push(sale.reference);
    }
    
    if (updates.length === 0) {
      return existingSale;
    }
    
    values.push(sale.id);
    
    await executeQuery(
      `UPDATE ventas SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    const updatedSale = await getSaleById(sale.id);
    if (!updatedSale) {
      throw new Error('Venta actualizada pero no se pudo obtener');
    }
    
    return updatedSale;
  } catch (error) {
    console.error('Error al actualizar venta:', error);
    throw error;
  }
};

/**
 * Elimina una venta
 */
export const deleteSale = async (id: number): Promise<void> => {
  try {
    await executeQuery('DELETE FROM ventas WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error al eliminar venta:', error);
    throw error;
  }
};

/**
 * Verifica si un producto está siendo usado en alguna venta
 */
export const hasProductInSales = async (productId: number): Promise<boolean> => {
  try {
    const result = await executeQuery(
      'SELECT COUNT(*) as count FROM ventas WHERE product_id = ?',
      [productId]
    );
    
    if (result.rows.length === 0) {
      return false;
    }
    
    const row = result.rows.item(0);
    return (row.count || 0) > 0;
  } catch (error) {
    console.error('Error al verificar producto en ventas:', error);
    throw error;
  }
};

/**
 * Interfaz para filtros de ventas
 */
export interface SalesFilter {
  type: 'day' | 'week' | 'month' | 'range';
  startDate?: string;
  endDate?: string;
}

/**
 * Obtiene todas las ventas con paginación (sin filtros)
 */
export const getAllSalesPaginated = async (
  limit: number = 30,
  offset: number = 0
): Promise<{ sales: Sale[]; total: number }> => {
  try {
    // Obtener total de registros
    const countResult = await executeQuery(
      `SELECT COUNT(*) as total FROM ventas`
    );
    
    const total = countResult.rows.length > 0 ? countResult.rows.item(0).total : 0;

    // Obtener ventas con paginación
    const result = await executeQuery(
      `SELECT v.*, p.name as product_name, tp.name as tipo_pago_name
       FROM ventas v
       LEFT JOIN productos p ON v.product_id = p.id
       LEFT JOIN tipo_pago tp ON v.type_pago_id = tp.id
       ORDER BY COALESCE(v.sale_date, v.created_at) DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    const sales: Sale[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      sales.push({
        id: row.id,
        product_id: row.product_id,
        price_real: row.price_real,
        created_at: row.created_at,
        type_pago_id: row.type_pago_id,
        quantity: row.quantity,
        total_price: row.total_price,
        sale_date: row.sale_date || null,
        reference: row.reference || null,
        tipo_pago_name: row.tipo_pago_name || null,
      });
    }
    
    return { sales, total };
  } catch (error) {
    console.error('Error al obtener ventas paginadas:', error);
    throw error;
  }
};

/**
 * Obtiene ventas con paginación y filtros
 */
export const getSalesPaginated = async (
  filter: SalesFilter,
  limit: number = 20,
  offset: number = 0
): Promise<{ sales: Sale[]; total: number; totalAmount: number }> => {
  try {
    let whereClause = '';
    const params: any[] = [];

    // Construir filtro de fechas (ajustado para hora local de Venezuela UTC-4)
    if (filter.type === 'day') {
      const today = getStartOfDay(new Date());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayStr = toLocalISOString(today);
      const tomorrowStr = toLocalISOString(tomorrow);
      
      whereClause = `WHERE ((v.sale_date IS NOT NULL AND v.sale_date >= ? AND v.sale_date < ?) 
                 OR (v.sale_date IS NULL AND v.created_at >= ? AND v.created_at < ?))`;
      params.push(todayStr, tomorrowStr, todayStr, tomorrowStr);
    } else if (filter.type === 'week') {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(today);
      monday.setDate(monday.getDate() - diff + 1);
      const mondayStart = getStartOfDay(monday);
      const mondayStr = toLocalISOString(mondayStart);
      
      whereClause = `WHERE ((v.sale_date IS NOT NULL AND v.sale_date >= ?) 
                 OR (v.sale_date IS NULL AND v.created_at >= ?))`;
      params.push(mondayStr, mondayStr);
    } else if (filter.type === 'month') {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const firstDayStart = getStartOfDay(firstDay);
      const firstDayStr = toLocalISOString(firstDayStart);
      
      whereClause = `WHERE ((v.sale_date IS NOT NULL AND v.sale_date >= ?) 
                 OR (v.sale_date IS NULL AND v.created_at >= ?))`;
      params.push(firstDayStr, firstDayStr);
    } else if (filter.type === 'range' && filter.startDate && filter.endDate) {
      // Extraer solo la parte de fecha (sin hora) para comparación
      let startDateStr: string;
      let endDateStr: string;
      
      if (filter.startDate.includes(' ')) {
        // Ya viene con formato completo, extraer solo la parte de fecha
        startDateStr = filter.startDate.split(' ')[0];
        endDateStr = filter.endDate.split(' ')[0];
      } else {
        // Solo viene fecha
        const startDateObj = new Date(filter.startDate);
        const endDateObj = new Date(filter.endDate);
        startDateStr = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, '0')}-${String(startDateObj.getDate()).padStart(2, '0')}`;
        endDateStr = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, '0')}-${String(endDateObj.getDate()).padStart(2, '0')}`;
      }
      
      // Usar función date() de SQLite para extraer solo la parte de fecha y comparar
      // Esto maneja correctamente el caso cuando las fechas son del mismo día
      whereClause = `WHERE ((v.sale_date IS NOT NULL AND date(v.sale_date) >= ? AND date(v.sale_date) <= ?) 
                 OR (v.sale_date IS NULL AND date(v.created_at) >= ? AND date(v.created_at) <= ?))`;
      params.push(startDateStr, endDateStr, startDateStr, endDateStr);
    }

    // Obtener total de registros y total vendido
    const countResult = await executeQuery(
      `SELECT COUNT(*) as total, COALESCE(SUM(v.total_price), 0) as totalAmount
       FROM ventas v
       ${whereClause}`,
      params
    );
    
    const total = countResult.rows.length > 0 ? countResult.rows.item(0).total : 0;
    const totalAmount = countResult.rows.length > 0 ? (countResult.rows.item(0).totalAmount || 0) : 0;

    // Obtener ventas con paginación
    const result = await executeQuery(
      `SELECT v.*, p.name as product_name, tp.name as tipo_pago_name
       FROM ventas v
       LEFT JOIN productos p ON v.product_id = p.id
       LEFT JOIN tipo_pago tp ON v.type_pago_id = tp.id
       ${whereClause}
       ORDER BY COALESCE(v.sale_date, v.created_at) DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    
    const sales: Sale[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      sales.push({
        id: row.id,
        product_id: row.product_id,
        price_real: row.price_real,
        created_at: row.created_at,
        type_pago_id: row.type_pago_id,
        quantity: row.quantity,
        total_price: row.total_price,
        sale_date: row.sale_date || null,
        reference: row.reference || null,
        tipo_pago_name: row.tipo_pago_name || null,
      });
    }
    
    return { sales, total, totalAmount };
  } catch (error) {
    console.error('Error al obtener ventas paginadas:', error);
    throw error;
  }
};

/**
 * Obtiene una venta con toda su información de relaciones
 */
export const getSaleWithRelations = async (id: number): Promise<any> => {
  try {
    const result = await executeQuery(
      `SELECT 
        v.*,
        p.id as product_id,
        p.name as product_name,
        p.description as product_description,
        p.price as product_price,
        tp.id as tipo_pago_id,
        tp.name as tipo_pago_name,
        tp.description as tipo_pago_description
       FROM ventas v
       LEFT JOIN productos p ON v.product_id = p.id
       LEFT JOIN tipo_pago tp ON v.type_pago_id = tp.id
       WHERE v.id = ?`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows.item(0);
    return {
      id: row.id,
      product_id: row.product_id,
      price_real: row.price_real,
      created_at: row.created_at,
      type_pago_id: row.type_pago_id,
      quantity: row.quantity,
      total_price: row.total_price,
      sale_date: row.sale_date || null,
      reference: row.reference || null,
      product: {
        id: row.product_id,
        name: row.product_name,
        description: row.product_description,
        price: row.product_price,
      },
      tipo_pago: {
        id: row.tipo_pago_id,
        name: row.tipo_pago_name,
        description: row.tipo_pago_description,
      },
    };
  } catch (error) {
    console.error('Error al obtener venta con relaciones:', error);
    throw error;
  }
};

/**
 * Obtiene estadísticas de ventas del día actual agrupadas por tipo de pago
 */
export const getSalesTodayByPaymentType = async (): Promise<Array<{ tipo_pago_name: string; count: number }>> => {
  try {
    const today = getStartOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayStr = toLocalISOString(today);
    const tomorrowStr = toLocalISOString(tomorrow);
    
    const result = await executeQuery(
      `SELECT 
        COALESCE(tp.name, 'Sin tipo') as tipo_pago_name,
        COUNT(*) as count
       FROM ventas v
       LEFT JOIN tipo_pago tp ON v.type_pago_id = tp.id
       WHERE ((v.sale_date IS NOT NULL AND v.sale_date >= ? AND v.sale_date < ?)
       OR (v.sale_date IS NULL AND v.created_at >= ? AND v.created_at < ?))
       GROUP BY tp.name
       ORDER BY count DESC`,
      [todayStr, tomorrowStr, todayStr, tomorrowStr]
    );
    
    const stats: Array<{ tipo_pago_name: string; count: number }> = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      stats.push({
        tipo_pago_name: row.tipo_pago_name || 'Sin tipo',
        count: row.count || 0,
      });
    }
    
    return stats;
  } catch (error) {
    console.error('Error al obtener ventas del día por tipo de pago:', error);
    return [];
  }
};

/**
 * Obtiene estadísticas de ventas del día actual
 */
export const getSalesToday = async (): Promise<{ count: number; total: number }> => {
  try {
    const today = getStartOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayStr = toLocalISOString(today);
    const tomorrowStr = toLocalISOString(tomorrow);
    
    const result = await executeQuery(
      `SELECT 
        COUNT(*) as count,
        COALESCE(SUM(total_price), 0) as total
       FROM ventas
       WHERE (sale_date IS NOT NULL AND sale_date >= ? AND sale_date < ?)
       OR (sale_date IS NULL AND created_at >= ? AND created_at < ?)`,
      [todayStr, tomorrowStr, todayStr, tomorrowStr]
    );
    
    if (result.rows.length === 0) {
      return { count: 0, total: 0 };
    }
    
    const row = result.rows.item(0);
    return {
      count: row.count || 0,
      total: row.total || 0,
    };
  } catch (error) {
    console.error('Error al obtener ventas del día:', error);
    throw error;
  }
};

/**
 * Obtiene estadísticas de ventas de la semana actual agrupadas por tipo de pago
 */
export const getSalesThisWeekByPaymentType = async (): Promise<Array<{ tipo_pago_name: string; count: number }>> => {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today);
    monday.setDate(monday.getDate() - diff + 1);
    const mondayStart = getStartOfDay(monday);
    const mondayStr = toLocalISOString(mondayStart);
    
    const result = await executeQuery(
      `SELECT 
        COALESCE(tp.name, 'Sin tipo') as tipo_pago_name,
        COUNT(*) as count
       FROM ventas v
       LEFT JOIN tipo_pago tp ON v.type_pago_id = tp.id
       WHERE ((v.sale_date IS NOT NULL AND v.sale_date >= ?)
       OR (v.sale_date IS NULL AND v.created_at >= ?))
       GROUP BY tp.name
       ORDER BY count DESC`,
      [mondayStr, mondayStr]
    );
    
    const stats: Array<{ tipo_pago_name: string; count: number }> = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      stats.push({
        tipo_pago_name: row.tipo_pago_name || 'Sin tipo',
        count: row.count || 0,
      });
    }
    
    return stats;
  } catch (error) {
    console.error('Error al obtener ventas de la semana por tipo de pago:', error);
    return [];
  }
};

/**
 * Obtiene estadísticas de ventas de la semana actual (lunes a domingo)
 */
export const getSalesThisWeek = async (): Promise<{ count: number; total: number }> => {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Ajustar para que lunes sea el primer día
    const monday = new Date(today);
    monday.setDate(monday.getDate() - diff + 1);
    const mondayStart = getStartOfDay(monday);
    const mondayStr = toLocalISOString(mondayStart);
    
    const result = await executeQuery(
      `SELECT 
        COUNT(*) as count,
        COALESCE(SUM(total_price), 0) as total
       FROM ventas
       WHERE (sale_date IS NOT NULL AND sale_date >= ?)
       OR (sale_date IS NULL AND created_at >= ?)`,
      [mondayStr, mondayStr]
    );
    
    if (result.rows.length === 0) {
      return { count: 0, total: 0 };
    }
    
    const row = result.rows.item(0);
    return {
      count: row.count || 0,
      total: row.total || 0,
    };
  } catch (error) {
    console.error('Error al obtener ventas de la semana:', error);
    throw error;
  }
};

/**
 * Obtiene estadísticas de ventas del mes actual agrupadas por tipo de pago
 */
export const getSalesThisMonthByPaymentType = async (): Promise<Array<{ tipo_pago_name: string; count: number }>> => {
  try {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayStart = getStartOfDay(firstDay);
    const firstDayStr = toLocalISOString(firstDayStart);
    
    const result = await executeQuery(
      `SELECT 
        COALESCE(tp.name, 'Sin tipo') as tipo_pago_name,
        COUNT(*) as count
       FROM ventas v
       LEFT JOIN tipo_pago tp ON v.type_pago_id = tp.id
       WHERE ((v.sale_date IS NOT NULL AND v.sale_date >= ?)
       OR (v.sale_date IS NULL AND v.created_at >= ?))
       GROUP BY tp.name
       ORDER BY count DESC`,
      [firstDayStr, firstDayStr]
    );
    
    const stats: Array<{ tipo_pago_name: string; count: number }> = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      stats.push({
        tipo_pago_name: row.tipo_pago_name || 'Sin tipo',
        count: row.count || 0,
      });
    }
    
    return stats;
  } catch (error) {
    console.error('Error al obtener ventas del mes por tipo de pago:', error);
    return [];
  }
};

/**
 * Obtiene estadísticas de ventas del mes actual
 */
export const getSalesThisMonth = async (): Promise<{ count: number; total: number }> => {
  try {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayStart = getStartOfDay(firstDay);
    const firstDayStr = toLocalISOString(firstDayStart);
    
    const result = await executeQuery(
      `SELECT 
        COUNT(*) as count,
        COALESCE(SUM(total_price), 0) as total
       FROM ventas
       WHERE (sale_date IS NOT NULL AND sale_date >= ?)
       OR (sale_date IS NULL AND created_at >= ?)`,
      [firstDayStr, firstDayStr]
    );
    
    if (result.rows.length === 0) {
      return { count: 0, total: 0 };
    }
    
    const row = result.rows.item(0);
    return {
      count: row.count || 0,
      total: row.total || 0,
    };
  } catch (error) {
    console.error('Error al obtener ventas del mes:', error);
    throw error;
  }
};

