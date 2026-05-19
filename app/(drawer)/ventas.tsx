import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
    deleteVenta,
    getListadoVentas,
    VentaListado,
    VentasFiltroTipo,
    VentasQueryParams,
} from '@/services/ventas';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type FilterValue = '' | VentasFiltroTipo;

export default function VentasScreen() {
  const [sales, setSales] = useState<VentaListado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<FilterValue>('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const router = useRouter();
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const formatDateForQuery = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getQueryParams = (type: FilterValue): VentasQueryParams | undefined => {
    if (!type) {
      return undefined;
    }

    if (type !== 'rango') {
      return { tipo: type };
    }

    return {
      tipo: 'rango',
      fechaInicio: formatDateForQuery(startDate),
      fechaFin: formatDateForQuery(endDate),
    };
  };

  const loadSales = useCallback(
    async (type: FilterValue, isRefresh: boolean = false) => {
      try {
        if (!isRefresh) {
          setIsLoading(true);
        }

        const data = await getListadoVentas(getQueryParams(type));
        setSales(data);
      } catch (error) {
        console.error('Error al cargar ventas:', error);
        Alert.alert('Error', 'No se pudieron cargar las ventas');
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [startDate, endDate]
  );

  useFocusEffect(
    useCallback(() => {
      loadSales(filterType);
    }, [loadSales, filterType])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSales(filterType, true);
  }, [loadSales, filterType]);

  const handleFilterChange = (value: FilterValue) => {
    setFilterType(value);

    if (value === '' || value === 'dia' || value === 'semana' || value === 'mes') {
      loadSales(value);
    }
  };

  const handleApplyRange = () => {
    if (startDate > endDate) {
      Alert.alert('Error', 'La fecha inicial no puede ser mayor que la fecha final');
      return;
    }

    loadSales('rango');
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
    }

    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
    }

    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const formatPrice = (price: number) => {
    return `Bs ${new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const formatDateInput = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const goToDetail = (saleId: number) => {
    router.push(`/(drawer)/ventas/detalle?id=${saleId}`);
  };

  const handleDeleteSale = (sale: VentaListado) => {
    Alert.alert(
      'Eliminar venta',
      `¿Estás seguro de eliminar la venta ${sale.numero}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVenta(sale.id);
              await loadSales(filterType, true);
              Alert.alert('Éxito', 'Venta eliminada correctamente');
            } catch (error: any) {
              const message = error?.message || 'No se pudo eliminar la venta';
              Alert.alert('Error', message);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.loadingText}>Cargando ventas...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Ventas
          </ThemedText>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: tintColor }]}
            onPress={() => router.push('/(drawer)/ventas/nuevo')}>
            <Ionicons name="add" size={24} color="#fff" />
            <ThemedText style={styles.addButtonText}>Nueva</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.filterContainer}>
          <ThemedText style={styles.filterLabel}>Filtro:</ThemedText>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={filterType}
              onValueChange={handleFilterChange}
              style={{ color: textColor }}>
              <Picker.Item label="Sin filtro" value="" />
              <Picker.Item label="Día" value="dia" />
              <Picker.Item label="Semana" value="semana" />
              <Picker.Item label="Mes" value="mes" />
              <Picker.Item label="Rango de fechas" value="rango" />
            </Picker>
          </View>

          {filterType === 'rango' && (
            <>
              <View style={styles.dateRangeContainer}>
                <View style={styles.dateInputContainer}>
                  <ThemedText style={styles.dateLabel}>Desde:</ThemedText>
                  <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartDatePicker(true)}>
                    <ThemedText>{formatDateInput(startDate)}</ThemedText>
                  </TouchableOpacity>
                </View>

                <View style={styles.dateInputContainer}>
                  <ThemedText style={styles.dateLabel}>Hasta:</ThemedText>
                  <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndDatePicker(true)}>
                    <ThemedText>{formatDateInput(endDate)}</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: tintColor }]}
                onPress={handleApplyRange}>
                <ThemedText style={styles.applyButtonText}>Aplicar rango</ThemedText>
              </TouchableOpacity>
            </>
          )}
        </ThemedView>

        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onStartDateChange}
            maximumDate={endDate}
          />
        )}

        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onEndDateChange}
            minimumDate={startDate}
            maximumDate={new Date()}
          />
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          {sales.length === 0 ? (
            <ThemedView style={styles.emptyContainer}>
              <Ionicons name="cart-outline" size={64} color={textColor} style={{ opacity: 0.5 }} />
              <ThemedText style={styles.emptyText}>No hay ventas registradas</ThemedText>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: tintColor, marginTop: 16 }]}
                onPress={() => router.push('/(drawer)/ventas/nuevo')}>
                <Ionicons name="add" size={20} color="#fff" />
                <ThemedText style={styles.addButtonText}>Registrar primera venta</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          ) : (
            sales.map((sale) => (
              <TouchableOpacity
                key={sale.id}
                activeOpacity={0.9}
                onPress={() => goToDetail(sale.id)}
                style={styles.saleCard}>
                <ThemedView style={styles.saleHeader}>
                  <ThemedText type="subtitle" style={styles.saleNumber}>
                    {sale.numero} (#{sale.id})
                  </ThemedText>
                  <View style={styles.saleHeaderRight}>
                    <ThemedText style={styles.saleDate}>{formatDate(sale.fecha)}</ThemedText>
                    <TouchableOpacity
                      onPress={() => goToDetail(sale.id)}
                      style={styles.viewButton}
                      accessibilityLabel="Ver detalle de venta">
                      <Ionicons name="eye-outline" size={18} color={tintColor} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteSale(sale)}
                      style={styles.deleteButton}
                      accessibilityLabel="Eliminar venta">
                      <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </ThemedView>

                <ThemedText style={styles.saleDetail}>Items: {sale.cantidadItems}</ThemedText>
                <ThemedText style={styles.saleDetail}>Bruto: {formatPrice(sale.totalBruto)}</ThemedText>
                <ThemedText style={styles.saleDetail}>Descuento: {formatPrice(sale.totalDescuento)}</ThemedText>
                <ThemedText style={styles.saleDetail}>Pagado: {formatPrice(sale.totalPagado)}</ThemedText>
                <ThemedText style={[styles.saleTotal, { color: tintColor }]}>
                  Neto: {formatPrice(sale.totalNeto)}
                </ThemedText>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  filterContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  dateInputContainer: {
    flex: 1,
    gap: 6,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  applyButton: {
    marginTop: 12,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 400,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  saleCard: {
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  saleHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saleNumber: {
    fontSize: 17,
    fontWeight: '700',
  },
  saleDate: {
    fontSize: 13,
    opacity: 0.7,
  },
  viewButton: {
    padding: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  deleteButton: {
    padding: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.35)',
  },
  saleDetail: {
    fontSize: 14,
    opacity: 0.75,
    marginBottom: 2,
  },
  saleTotal: {
    marginTop: 8,
    fontSize: 17,
    fontWeight: '700',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});
