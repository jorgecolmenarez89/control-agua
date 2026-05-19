import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getAllProducts } from '@/services/products';
import {
    createVenta,
    CreateVentaDetalleInput,
    CreateVentaPagoInput,
    getTiposPagoVenta,
    TipoPagoVenta,
} from '@/services/ventas';
import { Product } from '@/types/product';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type DetalleDraft = {
  key: string;
  idProducto: number | null;
  precioRealVenta: string;
  descuento: string;
  cantidad: string;
};

type PagoDraft = {
  key: string;
  idTipoPago: number | null;
  monto: string;
  referencia: string;
};

const createDetalleDraft = (): DetalleDraft => ({
  key: `detalle-${Date.now()}-${Math.random()}`,
  idProducto: null,
  precioRealVenta: '',
  descuento: '0.00',
  cantidad: '1',
});

const createPagoDraft = (): PagoDraft => ({
  key: `pago-${Date.now()}-${Math.random()}`,
  idTipoPago: null,
  monto: '',
  referencia: '',
});

export default function NuevaVentaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const saleId = params.id ? Number(params.id) : null;
  const colorScheme = useColorScheme();
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const isDark = colorScheme === 'dark';

  const [products, setProducts] = useState<Product[]>([]);
  const [tiposPago, setTiposPago] = useState<TipoPagoVenta[]>([]);
  const [saleDate, setSaleDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [detalles, setDetalles] = useState<DetalleDraft[]>([createDetalleDraft()]);
  const [pagos, setPagos] = useState<PagoDraft[]>([createPagoDraft()]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (saleId) {
      Alert.alert('Info', 'La edición de ventas no está habilitada en esta fase');
      router.back();
    }
  }, [saleId]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [productsData, tiposPagoData] = await Promise.all([
        getAllProducts(),
        getTiposPagoVenta(),
      ]);

      setProducts(productsData.filter((product) => product.active === 1));
      setTiposPago(tiposPagoData);
    } catch (error) {
      console.error('Error al cargar datos para venta:', error);
      Alert.alert('Error', 'No se pudieron cargar productos o tipos de pago');
    } finally {
      setLoadingData(false);
    }
  };

  const formatDateForApi = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00`;
  };

  const formatDateLabel = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatCurrency = (amount: number): string => {
    return `Bs ${new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      setSaleDate(selectedDate);
    }
  };

  const updateDetalle = (index: number, patch: Partial<DetalleDraft>) => {
    setDetalles((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const getProductBasePrice = (productId: number | null): number | null => {
    if (!productId) {
      return null;
    }

    const product = products.find((item) => item.id === productId);
    if (!product) {
      return null;
    }

    return Number(product.price);
  };

  const formatDecimal = (value: number): string => {
    return (Number.isFinite(value) ? value : 0).toFixed(2);
  };

  const handleDetallePriceChange = (index: number, value: string) => {
    const detail = detalles[index];
    if (!detail) {
      return;
    }

    const basePrice = getProductBasePrice(detail.idProducto);
    const parsedPrice = Number(value);

    if (basePrice === null || !Number.isFinite(parsedPrice)) {
      updateDetalle(index, { precioRealVenta: value });
      return;
    }

    const descuento = Math.max(basePrice - parsedPrice, 0);
    updateDetalle(index, {
      precioRealVenta: value,
      descuento: formatDecimal(descuento),
    });
  };

  const handleDetalleDiscountChange = (index: number, value: string) => {
    const detail = detalles[index];
    if (!detail) {
      return;
    }

    const basePrice = getProductBasePrice(detail.idProducto);
    const parsedDiscount = Number(value);

    if (basePrice === null || !Number.isFinite(parsedDiscount)) {
      updateDetalle(index, { descuento: value });
      return;
    }

    const precioReal = Math.max(basePrice - Math.max(parsedDiscount, 0), 0);
    updateDetalle(index, {
      descuento: value,
      precioRealVenta: formatDecimal(precioReal),
    });
  };

  const updatePago = (index: number, patch: Partial<PagoDraft>) => {
    setPagos((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const addDetalle = () => {
    setDetalles((prev) => [...prev, createDetalleDraft()]);
  };

  const removeDetalle = (index: number) => {
    setDetalles((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const addPago = () => {
    setPagos((prev) => [...prev, createPagoDraft()]);
  };

  const removePago = (index: number) => {
    setPagos((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const totals = useMemo(() => {
    const totalBruto = detalles.reduce((acc, item) => {
      const precio = Number(item.precioRealVenta) || 0;
      const cantidad = Number(item.cantidad) || 0;
      return acc + precio * cantidad;
    }, 0);

    const totalDescuento = detalles.reduce((acc, item) => {
      const descuento = Number(item.descuento) || 0;
      return acc + descuento;
    }, 0);

    const totalNeto = totalBruto - totalDescuento;

    const totalPagado = pagos.reduce((acc, item) => {
      const monto = Number(item.monto) || 0;
      return acc + monto;
    }, 0);

    return {
      totalBruto,
      totalDescuento,
      totalNeto,
      totalPagado,
    };
  }, [detalles, pagos]);

  const validateForm = (): {
    detallesPayload: CreateVentaDetalleInput[];
    pagosPayload: CreateVentaPagoInput[];
  } | null => {
    const detallesPayload: CreateVentaDetalleInput[] = [];
    const pagosPayload: CreateVentaPagoInput[] = [];

    for (let i = 0; i < detalles.length; i += 1) {
      const item = detalles[i];
      if (!item.idProducto) {
        Alert.alert('Error', `Selecciona un producto en el detalle ${i + 1}`);
        return null;
      }

      const precio = Number(item.precioRealVenta);
      const descuento = Number(item.descuento || '0');
      const cantidad = Number(item.cantidad);

      if (!Number.isFinite(precio) || precio <= 0) {
        Alert.alert('Error', `Precio inválido en el detalle ${i + 1}`);
        return null;
      }

      if (!Number.isFinite(descuento) || descuento < 0) {
        Alert.alert('Error', `Descuento inválido en el detalle ${i + 1}`);
        return null;
      }

      if (!Number.isFinite(cantidad) || cantidad <= 0) {
        Alert.alert('Error', `Cantidad inválida en el detalle ${i + 1}`);
        return null;
      }

      detallesPayload.push({
        idProducto: item.idProducto,
        precioRealVenta: precio,
        descuento,
        cantidad,
      });
    }

    for (let i = 0; i < pagos.length; i += 1) {
      const item = pagos[i];
      if (!item.idTipoPago) {
        Alert.alert('Error', `Selecciona un tipo de pago en el pago ${i + 1}`);
        return null;
      }

      const monto = Number(item.monto);
      if (!Number.isFinite(monto) || monto <= 0) {
        Alert.alert('Error', `Monto inválido en el pago ${i + 1}`);
        return null;
      }

      pagosPayload.push({
        idTipoPago: item.idTipoPago,
        monto,
        referencia: item.referencia.trim() || undefined,
      });
    }

    if (Math.abs(totals.totalNeto - totals.totalPagado) > 0.01) {
      Alert.alert('Error', 'El total pagado debe ser igual al total neto de la venta');
      return null;
    }

    return { detallesPayload, pagosPayload };
  };

  const resetForm = () => {
    setSaleDate(new Date());
    setDetalles([createDetalleDraft()]);
    setPagos([createPagoDraft()]);
  };

  const handleSave = async () => {
    const validated = validateForm();
    if (!validated) {
      return;
    }

    setIsLoading(true);
    try {
      await createVenta({
        fecha: formatDateForApi(saleDate),
        detalles: validated.detallesPayload,
        pagos: validated.pagosPayload,
      });

      resetForm();
      router.replace('/(drawer)/ventas');
    } catch (error) {
      console.error('Error al crear venta:', error);
      Alert.alert('Error', 'No se pudo crear la venta');
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingData) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText style={styles.loadingText}>Cargando datos...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <ThemedView style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            Nueva Venta
          </ThemedText>

          <ThemedText style={styles.label}>Fecha *</ThemedText>
          <TouchableOpacity
            style={[
              styles.input,
              styles.dateButton,
              {
                backgroundColor: isDark ? '#2C2C2E' : '#fff',
                borderColor: isDark ? '#3A3A3C' : '#ddd',
              },
            ]}
            onPress={() => setShowDatePicker(true)}
            disabled={isLoading}>
            <ThemedText style={{ color: textColor, fontSize: 16 }}>
              {formatDateLabel(saleDate)}
            </ThemedText>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={saleDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}

          {Platform.OS === 'ios' && showDatePicker && (
            <View style={styles.iosDatePickerContainer}>
              <TouchableOpacity
                style={[styles.iosDateButton, { backgroundColor: tintColor }]}
                onPress={() => setShowDatePicker(false)}>
                <ThemedText style={styles.iosDateButtonText}>Confirmar</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Detalles</ThemedText>
            <TouchableOpacity
              style={[styles.smallButton, { backgroundColor: tintColor }]}
              onPress={addDetalle}
              disabled={isLoading}>
              <Ionicons name="add" size={16} color="#fff" />
              <ThemedText style={styles.smallButtonText}>Agregar</ThemedText>
            </TouchableOpacity>
          </View>

          {detalles.map((item, index) => (
            <ThemedView
              key={item.key}
              style={[
                styles.block,
                {
                  backgroundColor: isDark ? '#2C2C2E' : '#fff',
                  borderColor: isDark ? '#3A3A3C' : '#ddd',
                },
              ]}>
              <View style={styles.blockHeader}>
                <ThemedText style={styles.blockTitle}>Detalle {index + 1}</ThemedText>
                <TouchableOpacity
                  onPress={() => removeDetalle(index)}
                  disabled={detalles.length === 1 || isLoading}
                  style={styles.iconButton}>
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={detalles.length === 1 ? '#999' : '#FF3B30'}
                  />
                </TouchableOpacity>
              </View>

              <ThemedText style={styles.label}>Producto *</ThemedText>
              <View style={[styles.pickerContainer, { borderColor: isDark ? '#3A3A3C' : '#ddd' }]}>
                <Picker
                  selectedValue={item.idProducto}
                  onValueChange={(value) => {
                    const selected = products.find((product) => product.id === value);
                    updateDetalle(index, {
                      idProducto: value,
                      precioRealVenta: selected ? formatDecimal(selected.price) : item.precioRealVenta,
                      descuento: selected ? '0.00' : item.descuento,
                    });
                  }}
                  style={{ color: textColor }}
                  enabled={!isLoading}>
                  <Picker.Item label="Selecciona un producto" value={null} />
                  {products.map((product) => (
                    <Picker.Item key={product.id} label={product.name} value={product.id} />
                  ))}
                </Picker>
              </View>

              <View style={styles.row}>
                <View style={styles.col}>
                  <ThemedText style={styles.label}>Precio real *</ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#1C1C1E' : '#fff',
                        color: textColor,
                        borderColor: isDark ? '#3A3A3C' : '#ddd',
                      },
                    ]}
                    value={item.precioRealVenta}
                    onChangeText={(text) => handleDetallePriceChange(index, text)}
                    placeholder="0.00"
                    placeholderTextColor={isDark ? '#8E8E93' : '#999'}
                    keyboardType="decimal-pad"
                    editable={!isLoading}
                  />
                </View>
                <View style={styles.col}>
                  <ThemedText style={styles.label}>Cantidad *</ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#1C1C1E' : '#fff',
                        color: textColor,
                        borderColor: isDark ? '#3A3A3C' : '#ddd',
                      },
                    ]}
                    value={item.cantidad}
                    onChangeText={(text) => updateDetalle(index, { cantidad: text })}
                    placeholder="1"
                    placeholderTextColor={isDark ? '#8E8E93' : '#999'}
                    keyboardType="number-pad"
                    editable={!isLoading}
                  />
                </View>
              </View>

              <ThemedText style={styles.label}>Descuento</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#1C1C1E' : '#fff',
                    color: textColor,
                    borderColor: isDark ? '#3A3A3C' : '#ddd',
                  },
                ]}
                value={item.descuento}
                onChangeText={(text) => handleDetalleDiscountChange(index, text)}
                placeholder="0.00"
                placeholderTextColor={isDark ? '#8E8E93' : '#999'}
                keyboardType="decimal-pad"
                editable={!isLoading}
              />
            </ThemedView>
          ))}

          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Pagos</ThemedText>
            <TouchableOpacity
              style={[styles.smallButton, { backgroundColor: tintColor }]}
              onPress={addPago}
              disabled={isLoading}>
              <Ionicons name="add" size={16} color="#fff" />
              <ThemedText style={styles.smallButtonText}>Agregar</ThemedText>
            </TouchableOpacity>
          </View>

          {pagos.map((item, index) => (
            <ThemedView
              key={item.key}
              style={[
                styles.block,
                {
                  backgroundColor: isDark ? '#2C2C2E' : '#fff',
                  borderColor: isDark ? '#3A3A3C' : '#ddd',
                },
              ]}>
              <View style={styles.blockHeader}>
                <ThemedText style={styles.blockTitle}>Pago {index + 1}</ThemedText>
                <TouchableOpacity
                  onPress={() => removePago(index)}
                  disabled={pagos.length === 1 || isLoading}
                  style={styles.iconButton}>
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={pagos.length === 1 ? '#999' : '#FF3B30'}
                  />
                </TouchableOpacity>
              </View>

              <ThemedText style={styles.label}>Tipo de pago *</ThemedText>
              <View style={[styles.pickerContainer, { borderColor: isDark ? '#3A3A3C' : '#ddd' }]}>
                <Picker
                  selectedValue={item.idTipoPago}
                  onValueChange={(value) => updatePago(index, { idTipoPago: value })}
                  style={{ color: textColor }}
                  enabled={!isLoading}>
                  <Picker.Item label="Selecciona un tipo" value={null} />
                  {tiposPago.map((tipo) => (
                    <Picker.Item key={tipo.id} label={tipo.nombre} value={tipo.id} />
                  ))}
                </Picker>
              </View>

              <ThemedText style={styles.label}>Monto *</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#1C1C1E' : '#fff',
                    color: textColor,
                    borderColor: isDark ? '#3A3A3C' : '#ddd',
                  },
                ]}
                value={item.monto}
                onChangeText={(text) => updatePago(index, { monto: text })}
                placeholder="0.00"
                placeholderTextColor={isDark ? '#8E8E93' : '#999'}
                keyboardType="decimal-pad"
                editable={!isLoading}
              />

              <ThemedText style={styles.label}>Referencia</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#1C1C1E' : '#fff',
                    color: textColor,
                    borderColor: isDark ? '#3A3A3C' : '#ddd',
                  },
                ]}
                value={item.referencia}
                onChangeText={(text) => updatePago(index, { referencia: text })}
                placeholder="Opcional"
                placeholderTextColor={isDark ? '#8E8E93' : '#999'}
                editable={!isLoading}
              />
            </ThemedView>
          ))}

          <ThemedView style={styles.totalContainer}>
            <ThemedText style={styles.totalLine}>Bruto: {formatCurrency(totals.totalBruto)}</ThemedText>
            <ThemedText style={styles.totalLine}>Descuento: {formatCurrency(totals.totalDescuento)}</ThemedText>
            <ThemedText style={styles.totalLine}>Pagado: {formatCurrency(totals.totalPagado)}</ThemedText>
            <ThemedText style={[styles.totalFinal, { color: tintColor }]}>Neto: {formatCurrency(totals.totalNeto)}</ThemedText>
          </ThemedView>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: tintColor }, isLoading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={isLoading}>
            <ThemedText style={styles.buttonText}>{isLoading ? 'Guardando...' : 'Crear venta'}</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} disabled={isLoading}>
            <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.75,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  content: {
    padding: 20,
  },
  title: {
    marginBottom: 14,
  },
  sectionHeader: {
    marginTop: 18,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  smallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  smallButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  block: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  iconButton: {
    padding: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 6,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  dateButton: {
    minHeight: 46,
    justifyContent: 'center',
  },
  iosDatePickerContainer: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  iosDateButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  iosDateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  totalContainer: {
    marginTop: 18,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    padding: 14,
    gap: 4,
  },
  totalLine: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalFinal: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '800',
  },
  button: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    marginTop: 10,
    padding: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    opacity: 0.75,
  },
});
