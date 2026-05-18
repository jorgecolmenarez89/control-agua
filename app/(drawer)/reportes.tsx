import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getSalesPaginated, getSaleWithRelations, SalesFilter } from '@/services/sales';
import { Sale } from '@/types/sale';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
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
import { SafeAreaView } from 'react-native-safe-area-context';

type FilterType = 'day' | 'week' | 'month' | 'range';

export default function ReportesScreen() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  
  const [filterType, setFilterType] = useState<FilterType>('day');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);

  const colorScheme = useColorScheme();
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const isDark = colorScheme === 'dark';

  const PAGE_SIZE = 20;

  useEffect(() => {
    loadSales(true);
  }, [filterType, startDate, endDate]);

  const loadSales = async (reset: boolean = false) => {
    try {
      if (reset) {
        setIsLoading(true);
        setCurrentPage(0);
        setSales([]);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      const filter: SalesFilter = {
        type: filterType,
      };

      if (filterType === 'range') {
        // Convertir fechas a formato local sin UTC para evitar problemas de zona horaria
        const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')} 00:00:00.000`;
        const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')} 23:59:59.999`;
        filter.startDate = startStr;
        filter.endDate = endStr;
      }

      const offset = reset ? 0 : currentPage * PAGE_SIZE;
      const result = await getSalesPaginated(filter, PAGE_SIZE, offset);

      if (reset) {
        setSales(result.sales);
      } else {
        setSales([...sales, ...result.sales]);
      }

      setTotal(result.total);
      setTotalAmount(result.totalAmount || 0);
      setHasMore(result.sales.length === PAGE_SIZE);
      setCurrentPage(reset ? 1 : currentPage + 1);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      Alert.alert('Error', 'No se pudieron cargar las ventas');
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSales(true);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadSales(false);
    }
  };

  const handleFilterChange = (type: FilterType) => {
    setFilterType(type);
    if (type === 'day') {
      const today = new Date();
      setStartDate(today);
      setEndDate(today);
    } else if (type === 'week') {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(today);
      monday.setDate(monday.getDate() - diff + 1);
      setStartDate(monday);
      setEndDate(today);
    } else if (type === 'month') {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay);
      setEndDate(today);
    }
  };

  const formatDate = (date: Date): string => {
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

  const formatCurrencyShort = (amount: number): string => {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
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

  const handleSalePress = async (sale: Sale) => {
    try {
      const saleDetail = await getSaleWithRelations(sale.id);
      if (saleDetail) {
        setSelectedSale(saleDetail);
        setShowDetail(true);
      }
    } catch (error) {
      console.error('Error al cargar detalle:', error);
      Alert.alert('Error', 'No se pudo cargar el detalle de la venta');
    }
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

  if (showDetail && selectedSale) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ThemedView style={styles.detailHeader}>
          <TouchableOpacity
            onPress={() => setShowDetail(false)}
            style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.detailTitle}>
            Detalle de Venta
          </ThemedText>
        </ThemedView>

        <ScrollView 
          style={styles.detailContent}
          contentContainerStyle={styles.detailContentContainer}>
          <ThemedView
            style={[
              styles.detailCard,
              {
                backgroundColor: isDark ? '#2C2C2E' : '#fff',
                borderColor: isDark ? '#3A3A3C' : '#ddd',
              },
            ]}>
            <ThemedView style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>ID:</ThemedText>
              <ThemedText style={styles.detailValue}>#{selectedSale.id}</ThemedText>
            </ThemedView>

            <ThemedView style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Fecha de Venta:</ThemedText>
              <ThemedText style={styles.detailValue}>
                {selectedSale.sale_date
                  ? formatDateTime(selectedSale.sale_date)
                  : formatDateTime(selectedSale.created_at)}
              </ThemedText>
            </ThemedView>

            {selectedSale.reference && (
              <ThemedView style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Referencia:</ThemedText>
                <ThemedText style={styles.detailValue}>{selectedSale.reference}</ThemedText>
              </ThemedView>
            )}

            <ThemedView style={styles.detailSection}>
              <ThemedText style={styles.detailSectionTitle}>Producto</ThemedText>
              <ThemedView style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Nombre:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {selectedSale.product?.name || 'N/A'}
                </ThemedText>
              </ThemedView>
              {selectedSale.product?.description && (
                <ThemedView style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Descripción:</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {selectedSale.product.description}
                  </ThemedText>
                </ThemedView>
              )}
              <ThemedView style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Precio Unitario:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {formatCurrency(selectedSale.product?.price || 0)}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.detailSection}>
              <ThemedText style={styles.detailSectionTitle}>Venta</ThemedText>
              <ThemedView style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Cantidad:</ThemedText>
                <ThemedText style={styles.detailValue}>{selectedSale.quantity}</ThemedText>
              </ThemedView>
              <ThemedView style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Precio Real:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {formatCurrency(selectedSale.price_real)}
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { fontWeight: 'bold' }]}>
                  Total:
                </ThemedText>
                <ThemedText style={[styles.detailValue, { color: tintColor, fontWeight: 'bold' }]}>
                  {formatCurrency(selectedSale.total_price)}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.detailSection}>
              <ThemedText style={styles.detailSectionTitle}>Tipo de Pago</ThemedText>
              <ThemedView style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Nombre:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {selectedSale.tipo_pago?.name || 'N/A'}
                </ThemedText>
              </ThemedView>
              {selectedSale.tipo_pago?.description && (
                <ThemedView style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Descripción:</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {selectedSale.tipo_pago.description}
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Reportes
        </ThemedText>
        <ThemedView style={styles.subtitleContainer}>
          <ThemedText style={styles.subtitle}>
            Total: {total} ventas
          </ThemedText>
          <ThemedText style={[styles.subtitle, { fontWeight: '600' }]}>
            | Bs {formatCurrencyShort(totalAmount)}
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
                <ThemedText style={{ color: textColor }}>
                  {formatDate(startDate)}
                </ThemedText>
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
                <ThemedText style={{ color: textColor }}>
                  {formatDate(endDate)}
                </ThemedText>
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
      </ThemedView>

      {isLoading ? (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={styles.loadingText}>Cargando ventas...</ThemedText>
        </ThemedView>
      ) : sales.length === 0 ? (
        <ThemedView style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={textColor} opacity={0.3} />
          <ThemedText style={styles.emptyText}>No hay ventas para mostrar</ThemedText>
        </ThemedView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const paddingToBottom = 20;
            if (
              layoutMeasurement.height + contentOffset.y >=
              contentSize.height - paddingToBottom
            ) {
              loadMore();
            }
          }}
          scrollEventThrottle={400}>
          {sales.map((sale) => (
            <TouchableOpacity
              key={sale.id}
              style={[
                styles.saleCard,
                {
                  backgroundColor: isDark ? '#2C2C2E' : '#fff',
                  borderColor: isDark ? '#3A3A3C' : '#ddd',
                },
              ]}
              onPress={() => handleSalePress(sale)}>
              <ThemedView style={styles.saleCardHeader}>
                <ThemedText style={[styles.saleId, { color: tintColor }]}>
                  {sale.tipo_pago_name || 'Sin tipo de pago'}
                </ThemedText>
                <ThemedText style={styles.saleDate}>
                  {sale.sale_date
                    ? formatDateOnly(sale.sale_date)
                    : formatDateOnly(sale.created_at)}
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.saleCardBody}>
                <ThemedText style={styles.saleTotal}>
                  {formatCurrency(sale.total_price)}
                </ThemedText>
                <ThemedText style={styles.saleQuantity}>
                  Cantidad: {sale.quantity}
                </ThemedText>
              </ThemedView>
              {sale.reference && (
                <ThemedText style={styles.saleReference}>
                  Ref: {sale.reference}
                </ThemedText>
              )}
              <Ionicons
                name="chevron-forward"
                size={20}
                color={textColor}
                style={styles.chevron}
              />
            </TouchableOpacity>
          ))}

          {loadingMore && (
            <ThemedView style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color={tintColor} />
              <ThemedText style={styles.loadingMoreText}>Cargando más...</ThemedText>
            </ThemedView>
          )}

          {!hasMore && sales.length > 0 && (
            <ThemedView style={styles.endContainer}>
              <ThemedText style={styles.endText}>No hay más ventas</ThemedText>
            </ThemedView>
          )}
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
  scrollView: {
    flex: 1,
  },
  saleCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
  },
  saleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingRight: 30,
  },
  saleId: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saleDate: {
    fontSize: 12,
    opacity: 0.6,
    flex: 1,
    textAlign: 'right',
  },
  saleCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  saleTotal: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  saleQuantity: {
    fontSize: 14,
    opacity: 0.7,
  },
  saleReference: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  chevron: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
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
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    opacity: 0.7,
  },
  endContainer: {
    padding: 20,
    alignItems: 'center',
  },
  endText: {
    fontSize: 14,
    opacity: 0.5,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  detailTitle: {
    flex: 1,
  },
  detailContent: {
    flex: 1,
  },
  detailContentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  detailCard: {
    padding: 20,
    paddingBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  detailLabel: {
    fontSize: 14,
    opacity: 0.7,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  detailSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
});
