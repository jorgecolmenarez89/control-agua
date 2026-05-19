import api from './api';

interface EmpresaApi {
  id?: number;
  nombre: string;
  rif: string | null;
  direccion: string | null;
  telefono: string | null;
  descripcion: string | null;
}

export interface Empresa {
  id?: number;
  nombre: string;
  rif: string | null;
  direccion: string | null;
  telefono: string | null;
  descripcion: string | null;
}

export interface CreateEmpresa {
  nombre: string;
  rif?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  descripcion?: string | null;
}

export interface UpdateEmpresa {
  nombre?: string | null;
  rif?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  descripcion?: string | null;
}

const normalizeEmpresa = (data: EmpresaApi): Empresa => {
  return {
    id: data.id,
    nombre: data.nombre || '',
    rif: data.rif ?? null,
    direccion: data.direccion ?? null,
    telefono: data.telefono ?? null,
    descripcion: data.descripcion ?? null,
  };
};

/**
 * Obtiene la empresa única del sistema tomando el primer elemento del endpoint.
 */
export const getEmpresa = async (): Promise<Empresa | null> => {
  const response = await api.get<EmpresaApi[] | EmpresaApi>('/empresas');
  const data = response.data;

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return null;
    }

    return normalizeEmpresa(data[0]);
  }

  if (!data) {
    return null;
  }

  return normalizeEmpresa(data);
};

/**
 * Crea la empresa única del sistema
 */
export const createEmpresa = async (data: CreateEmpresa): Promise<Empresa> => {
  const payload = {
    nombre: data.nombre.trim(),
    rif: data.rif ?? null,
    direccion: data.direccion ?? null,
    telefono: data.telefono ?? null,
    descripcion: data.descripcion ?? null,
  };

  const response = await api.post<EmpresaApi>('/empresas', payload);
  return normalizeEmpresa(response.data);
};

/**
 * Actualiza la empresa única del sistema
 */
export const updateEmpresa = async (
  empresaId: number,
  data: UpdateEmpresa
): Promise<Empresa> => {
  const payload = {
    nombre: data.nombre ?? null,
    rif: data.rif ?? null,
    direccion: data.direccion ?? null,
    telefono: data.telefono ?? null,
    descripcion: data.descripcion ?? null,
  };

  const response = await api.put<EmpresaApi>(`/empresas/${empresaId}`, payload);
  return normalizeEmpresa(response.data);
};
