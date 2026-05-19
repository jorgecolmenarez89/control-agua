import api from './api';

interface ReporteResumenApi {
  cantidad_ventas: number;
  total_bruto: string;
  total_descuento: string;
  total_neto: string;
}

interface ReporteVentaApi {
  id: number;
  numero: string;
  fecha: string;
  total_bruto: string;
  total_descuento: string;
  total_neto: string;
}

interface ReporteVentasApiResponse {
  resumen: ReporteResumenApi;
  ventas: ReporteVentaApi[];
  filtro: {
    tipo: string;
    fecha_inicio: string;
    fecha_fin: string;
  };
}

export interface ReporteVenta {
  id: number;
  numero: string;
  fecha: string;
  totalBruto: number;
  totalDescuento: number;
  totalNeto: number;
}

export interface ReporteVentas {
  cantidadVentas: number;
  totalBruto: number;
  totalDescuento: number;
  totalNeto: number;
  ventas: ReporteVenta[];
  filtro: {
    tipo: string;
    fechaInicio: string;
    fechaFin: string;
  };
}

const toNumber = (value: string | number | null | undefined): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapReporteVentas = (data: ReporteVentasApiResponse): ReporteVentas => {
  return {
    cantidadVentas: data.resumen?.cantidad_ventas ?? 0,
    totalBruto: toNumber(data.resumen?.total_bruto),
    totalDescuento: toNumber(data.resumen?.total_descuento),
    totalNeto: toNumber(data.resumen?.total_neto),
    ventas: Array.isArray(data.ventas)
      ? data.ventas.map((venta) => ({
          id: venta.id,
          numero: venta.numero,
          fecha: venta.fecha,
          totalBruto: toNumber(venta.total_bruto),
          totalDescuento: toNumber(venta.total_descuento),
          totalNeto: toNumber(venta.total_neto),
        }))
      : [],
    filtro: {
      tipo: data.filtro?.tipo ?? '',
      fechaInicio: data.filtro?.fecha_inicio ?? '',
      fechaFin: data.filtro?.fecha_fin ?? '',
    },
  };
};

const fetchReporteVentas = async (endpoint: string): Promise<ReporteVentas> => {
  const response = await api.get<ReporteVentasApiResponse>(endpoint);
  return mapReporteVentas(response.data);
};

export const getReporteVentasHoy = async (): Promise<ReporteVentas> => {
  return fetchReporteVentas('/reportes/ventas/hoy');
};

export const getReporteVentasSemanaActual = async (): Promise<ReporteVentas> => {
  return fetchReporteVentas('/reportes/ventas/semana-actual');
};

export const getReporteVentasMesActual = async (): Promise<ReporteVentas> => {
  return fetchReporteVentas('/reportes/ventas/mes-actual');
};

export const getReporteVentasRango = async (
  fechaInicio: string,
  fechaFin: string
): Promise<ReporteVentas> => {
  const response = await api.get<ReporteVentasApiResponse>('/reportes/ventas/rango', {
    params: {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    },
  });

  return mapReporteVentas(response.data);
};
