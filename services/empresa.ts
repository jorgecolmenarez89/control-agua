import { executeQuery } from './database';

export interface Empresa {
  id: number;
  name: string | null;
  rif: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
  updated_at: string;
}

export interface UpdateEmpresa {
  name?: string | null;
  rif?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  description?: string | null;
}

/**
 * Obtiene la información de la empresa
 */
export const getEmpresa = async (): Promise<Empresa | null> => {
  try {
    const result = await executeQuery('SELECT * FROM empresa WHERE id = 1');
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows.item(0);
  } catch (error) {
    console.error('Error al obtener información de empresa:', error);
    throw error;
  }
};

/**
 * Actualiza la información de la empresa
 */
export const updateEmpresa = async (data: UpdateEmpresa): Promise<Empresa> => {
  try {
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.rif !== undefined) {
      updates.push('rif = ?');
      values.push(data.rif);
    }
    if (data.address !== undefined) {
      updates.push('address = ?');
      values.push(data.address);
    }
    if (data.phone !== undefined) {
      updates.push('phone = ?');
      values.push(data.phone);
    }
    if (data.email !== undefined) {
      updates.push('email = ?');
      values.push(data.email);
    }
    if (data.website !== undefined) {
      updates.push('website = ?');
      values.push(data.website);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    
    if (updates.length === 0) {
      const empresa = await getEmpresa();
      if (!empresa) {
        throw new Error('No se pudo obtener la información de la empresa');
      }
      return empresa;
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    await executeQuery(
      `UPDATE empresa SET ${updates.join(', ')} WHERE id = 1`,
      values
    );
    
    const updatedEmpresa = await getEmpresa();
    if (!updatedEmpresa) {
      throw new Error('Empresa actualizada pero no se pudo obtener');
    }
    
    return updatedEmpresa;
  } catch (error) {
    console.error('Error al actualizar información de empresa:', error);
    throw error;
  }
};

