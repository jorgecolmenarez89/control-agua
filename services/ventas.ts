import api from './api';

export type VentasFiltroTipo = 'dia' | 'semana' | 'mes' | 'rango';

interface VentaDetalleApi {
  id_producto: number;
  id_venta?: number;
  precio_real_venta: string | number;
  descuento: string | number;
  cantidad: number;
}

interface VentaPagoApi {
  id_venta?: number;
  id_tipo_pago: number;
  monto: string | number;
  referencia?: string | null;
  tipo_pago?: {
    id: number;
    nombre: string;
  };
}

interface VentaListadoApi {
  id: number;
  numero: string;
  fecha: string;
  detalles: VentaDetalleApi[];
  pagos: VentaPagoApi[];
}

interface TipoPagoApi {
  id: number;
  nombre: string;
}

interface VentaCreateDetalleApi {
  id_producto: number;
  precio_real_venta: string;
  descuento: string;
  cantidad: number;
}

interface VentaCreatePagoApi {
  id_tipo_pago: number;
  monto: string;
  referencia?: string;
}

interface VentaCreateRequest {
  fecha: string;
  detalles: VentaCreateDetalleApi[];
  pagos: VentaCreatePagoApi[];
}

export interface VentaDetalle {
  idProducto: number;
  idVenta?: number;
  precioRealVenta: number;
  descuento: number;
  cantidad: number;
}

export interface VentaPago {
  idVenta?: number;
  idTipoPago: number;
  tipoPagoId?: number;
  tipoPagoNombre?: string;
  monto: number;
  referencia?: string | null;
}

export interface VentaListado {
  id: number;
  numero: string;
  fecha: string;
  detalles: VentaDetalle[];
  pagos: VentaPago[];
  cantidadItems: number;
  totalBruto: number;
  totalDescuento: number;
  totalNeto: number;
  totalPagado: number;
}

export interface VentasQueryParams {
  tipo?: VentasFiltroTipo;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface TipoPagoVenta {
  id: number;
  nombre: string;
}

export interface CreateVentaDetalleInput {
  idProducto: number;
  precioRealVenta: number;
  descuento: number;
  cantidad: number;
}

export interface CreateVentaPagoInput {
  idTipoPago: number;
  monto: number;
  referencia?: string;
}

export interface CreateVentaInput {
  fecha: string;
  detalles: CreateVentaDetalleInput[];
  pagos: CreateVentaPagoInput[];
}

const toNumber = (value: string | number | null | undefined): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toDecimalString = (value: number): string => {
  return (Number.isFinite(value) ? value : 0).toFixed(2);
};

const mapVenta = (venta: VentaListadoApi): VentaListado => {
  const detalles = Array.isArray(venta.detalles)
    ? venta.detalles.map((detalle) => ({
        idProducto: detalle.id_producto,
        idVenta: detalle.id_venta,
        precioRealVenta: toNumber(detalle.precio_real_venta),
        descuento: toNumber(detalle.descuento),
        cantidad: Number(detalle.cantidad ?? 0),
      }))
    : [];

  const pagos = Array.isArray(venta.pagos)
    ? venta.pagos.map((pago) => ({
        idVenta: pago.id_venta,
        idTipoPago: pago.id_tipo_pago,
        tipoPagoId: pago.tipo_pago?.id,
        tipoPagoNombre: pago.tipo_pago?.nombre,
        monto: toNumber(pago.monto),
        referencia: pago.referencia,
      }))
    : [];

  const cantidadItems = detalles.reduce((acc, item) => acc + item.cantidad, 0);
  const totalBruto = detalles.reduce(
    (acc, item) => acc + item.precioRealVenta * item.cantidad,
    0
  );
  const totalDescuento = detalles.reduce(
    (acc, item) => acc + item.descuento,
    0
  );
  const totalNeto = totalBruto - totalDescuento;
  const totalPagado = pagos.reduce((acc, pago) => acc + pago.monto, 0);

  return {
    id: venta.id,
    numero: venta.numero,
    fecha: venta.fecha,
    detalles,
    pagos,
    cantidadItems,
    totalBruto,
    totalDescuento,
    totalNeto,
    totalPagado,
  };
};

export const getListadoVentas = async (
  params?: VentasQueryParams
): Promise<VentaListado[]> => {
  const queryParams: Record<string, string> = {};

  if (params?.tipo) {
    queryParams.tipo = params.tipo;

    if (params.tipo === 'rango' && params.fechaInicio && params.fechaFin) {
      queryParams.fecha_inicio = params.fechaInicio;
      queryParams.fecha_fin = params.fechaFin;
    }
  }

  const response = await api.get<VentaListadoApi[] | VentaListadoApi>('/ventas', {
    params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
  });

  const payload = response.data;
  const items = Array.isArray(payload) ? payload : payload ? [payload] : [];

  return items.map(mapVenta);
};

export const getVentaById = async (id: number): Promise<VentaListado | null> => {
  try {
    const response = await api.get<VentaListadoApi>(`/ventas/${id}`);
    return mapVenta(response.data);
  } catch {
    const sales = await getListadoVentas();
    return sales.find((sale) => sale.id === id) || null;
  }
};

export const getTiposPagoVenta = async (): Promise<TipoPagoVenta[]> => {
  const response = await api.get<TipoPagoApi[]>('/tipos-pago');
  const data = Array.isArray(response.data) ? response.data : [];

  return data.map((item) => ({
    id: item.id,
    nombre: item.nombre,
  }));
};

export const createVenta = async (payload: CreateVentaInput): Promise<VentaListado> => {
  const body: VentaCreateRequest = {
    fecha: payload.fecha,
    detalles: payload.detalles.map((item) => ({
      id_producto: item.idProducto,
      precio_real_venta: toDecimalString(item.precioRealVenta),
      descuento: toDecimalString(item.descuento),
      cantidad: item.cantidad,
    })),
    pagos: payload.pagos.map((item) => ({
      id_tipo_pago: item.idTipoPago,
      monto: toDecimalString(item.monto),
      referencia: item.referencia?.trim() || undefined,
    })),
  };

  const response = await api.post<VentaListadoApi>('/ventas', body);
  return mapVenta(response.data);
};

export const deleteVenta = async (id: number): Promise<void> => {
  await api.delete(`/ventas/${id}`);
};
