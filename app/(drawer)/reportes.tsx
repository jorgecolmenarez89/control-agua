import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
    getReporteVentasHoy,
    getReporteVentasMesActual,
    getReporteVentasRango,
    getReporteVentasSemanaActual,
    ReporteVenta,
    ReporteVentas,
} from '@/services/reportes';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

type FilterType = 'day' | 'week' | 'month' | 'range';

const EMPTY_REPORTE: ReporteVentas = {
  cantidadVentas: 0,
  totalBruto: 0,
  totalDescuento: 0,
  totalNeto: 0,
  ventas: [],
  filtro: {
    tipo: '',
    fechaInicio: '',
    fechaFin: '',
  },
};

export default function ReportesScreen() {
  const [reporte, setReporte] = useState<ReporteVentas>(EMPTY_REPORTE);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [filterType, setFilterType] = useState<FilterType>('day');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const colorScheme = useColorScheme();
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    const today = new Date();
    loadReportes('day', today, today);
  }, []);

  const getPresetRange = (type: Exclude<FilterType, 'range'>) => {
    const today = new Date();

    if (type === 'day') {
      return { startDate: today, endDate: today };
    }

    if (type === 'week') {
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(today);
      monday.setDate(monday.getDate() - diff + 1);
      return { startDate: monday, endDate: today };
    }

    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return { startDate: firstDay, endDate: today };
  };

  const formatDateForQuery = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const fetchReportByFilter = async (
    type: FilterType,
    rangeStart: Date,
    rangeEnd: Date
  ): Promise<ReporteVentas> => {
    if (type === 'day') {
      return getReporteVentasHoy();
    }

    if (type === 'week') {
      return getReporteVentasSemanaActual();
    }

    if (type === 'month') {
      return getReporteVentasMesActual();
    }

    return getReporteVentasRango(
      formatDateForQuery(rangeStart),
      formatDateForQuery(rangeEnd)
    );
  };

  const loadReportes = async (
    type: FilterType,
    rangeStart: Date,
    rangeEnd: Date,
    isRefresh: boolean = false
  ) => {
    try {
      if (!isRefresh) {
        setIsLoading(true);
      }

      const data = await fetchReportByFilter(type, rangeStart, rangeEnd);
      setReporte(data);
    } catch (error) {
      console.error('Error al cargar reporte de ventas:', error);
      Alert.alert('Error', 'No se pudieron cargar los reportes');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (filterType === 'range') {
      loadReportes('range', startDate, endDate, true);
      return;
    }

    const preset = getPresetRange(filterType);
    loadReportes(filterType, preset.startDate, preset.endDate, true);
  };

  const handleFilterChange = (type: FilterType) => {
    setFilterType(type);
    if (type === 'day') {
      const preset = getPresetRange(type);
      setStartDate(preset.startDate);
      setEndDate(preset.endDate);
      loadReportes(type, preset.startDate, preset.endDate);
    } else if (type === 'week') {
      const preset = getPresetRange(type);
      setStartDate(preset.startDate);
      setEndDate(preset.endDate);
      loadReportes(type, preset.startDate, preset.endDate);
    } else if (type === 'month') {
      const preset = getPresetRange(type);
      setStartDate(preset.startDate);
      setEndDate(preset.endDate);
      loadReportes(type, preset.startDate, preset.endDate);
    }
  };

  const handleApplyRange = () => {
    if (startDate > endDate) {
      Alert.alert('Error', 'La fecha inicial no puede ser mayor que la fecha final');
      return;
    }

    loadReportes('range', startDate, endDate);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateOnly = (dateString: string): string => {
    const date = new Date(dateString);
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

  const renderSaleCard = (sale: ReporteVenta) => {
    return (
      <ThemedView
        key={sale.id}
        style={[
          styles.saleCard,
          {
            backgroundColor: isDark ? '#2C2C2E' : '#fff',
            borderColor: isDark ? '#3A3A3C' : '#ddd',
          },
        ]}>
        <ThemedView style={styles.saleCardHeader}>
          <ThemedText style={[styles.saleNumber, { color: tintColor }]}>#{sale.numero}</ThemedText>
          <ThemedText style={styles.saleDate}>{formatDateOnly(sale.fecha)}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.saleTotalsRow}>
          <ThemedText style={styles.saleLabel}>Bruto:</ThemedText>
          <ThemedText style={styles.saleValue}>{formatCurrency(sale.totalBruto)}</ThemedText>
        </ThemedView>
        <ThemedView style={styles.saleTotalsRow}>
          <ThemedText style={styles.saleLabel}>Descuento:</ThemedText>
          <ThemedText style={styles.saleValue}>{formatCurrency(sale.totalDescuento)}</ThemedText>
        </ThemedView>
        <ThemedView style={[styles.saleTotalsRow, styles.saleTotalsNetRow]}>
          <ThemedText style={[styles.saleLabel, styles.saleNetLabel]}>Neto:</ThemedText>
          <ThemedText style={[styles.saleNetValue, { color: tintColor }]}> 
            {formatCurrency(sale.totalNeto)}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Reportes
        </ThemedText>
        <ThemedView style={styles.subtitleContainer}>
          <ThemedText style={styles.subtitle}>Total: {reporte.cantidadVentas} ventas</ThemedText>
          <ThemedText style={styles.subtitle}>| Bruto: {formatCurrency(reporte.totalBruto)}</ThemedText>
        </ThemedView>
        <ThemedView style={styles.subtitleContainer}>
          <ThemedText style={styles.subtitle}>Descuento: {formatCurrency(reporte.totalDescuento)}</ThemedText>
          <ThemedText style={[styles.subtitle, { fontWeight: '700' }]}> 
            | Neto: {formatCurrency(reporte.totalNeto)}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView
        style={[
          styles.filterContainer,
          {
            backgroundColor: isDark ? '#2C2C2E' : '#fff',
            borderColor: isDark ? '#3A3A3C' : '#ddd',
          },
        ]}>
        <ThemedText style={styles.filterLabel}>Filtro:</ThemedText>
        <View
          style={[
            styles.pickerContainer,
            {
              backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5',
              borderColor: isDark ? '#3A3A3C' : '#ddd',
            },
          ]}>
          <Picker
            selectedValue={filterType}
            onValueChange={handleFilterChange}
            style={{ color: textColor }}>
            <Picker.Item label="Día" value="day" />
            <Picker.Item label="Semana" value="week" />
            <Picker.Item label="Mes" value="month" />
            <Picker.Item label="Rango de Fechas" value="range" />
          </Picker>
        </View>

        {filterType === 'range' && (
          <View style={styles.dateRangeContainer}>
            <View style={styles.dateInputContainer}>
              <ThemedText style={styles.dateLabel}>Desde:</ThemedText>
              <TouchableOpacity
                style={[
                  styles.dateButton,
                  {
                    backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5',
                    borderColor: isDark ? '#3A3A3C' : '#ddd',
                  },
                ]}
                onPress={() => setShowStartDatePicker(true)}>
                <ThemedText style={{ color: textColor }}>{formatDate(startDate)}</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.dateInputContainer}>
              <ThemedText style={styles.dateLabel}>Hasta:</ThemedText>
              <TouchableOpacity
                style={[
                  styles.dateButton,
                  {
                    backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5',
                    borderColor: isDark ? '#3A3A3C' : '#ddd',
                  },
                ]}
                onPress={() => setShowEndDatePicker(true)}>
                <ThemedText style={{ color: textColor }}>{formatDate(endDate)}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}

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

        {Platform.OS === 'ios' && (showStartDatePicker || showEndDatePicker) && (
          <View style={styles.iosDatePickerContainer}>
            <TouchableOpacity
              style={[styles.iosDateButton, { backgroundColor: tintColor }]}
              onPress={() => {
                setShowStartDatePicker(false);
                setShowEndDatePicker(false);
              }}>
              <ThemedText style={styles.iosDateButtonText}>Confirmar</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {filterType === 'range' && (
          <TouchableOpacity
            style={[styles.applyButton, { backgroundColor: tintColor }]}
            onPress={handleApplyRange}>
            <ThemedText style={styles.applyButtonText}>Aplicar rango</ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>

      {isLoading ? (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={styles.loadingText}>Cargando ventas...</ThemedText>
        </ThemedView>
      ) : reporte.ventas.length === 0 ? (
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <ThemedView style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={textColor} opacity={0.3} />
            <ThemedText style={styles.emptyText}>No hay ventas para mostrar</ThemedText>
          </ThemedView>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          {reporte.ventas.map(renderSaleCard)}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    marginBottom: 4,
  },
  subtitleContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  filterContainer: {
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  dateInputContainer: {
    flex: 1,
    gap: 6,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  iosDatePickerContainer: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  iosDateButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  iosDateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    marginTop: 12,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  saleCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  saleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  saleNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  saleDate: {
    fontSize: 12,
    opacity: 0.65,
  },
  saleTotalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  saleLabel: {
    fontSize: 13,
    opacity: 0.75,
  },
  saleValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  saleTotalsNetRow: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    paddingTop: 8,
  },
  saleNetLabel: {
    fontWeight: '700',
    opacity: 0.9,
  },
  saleNetValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 320,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
});
