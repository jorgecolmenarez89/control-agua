import { useFocusEffect } from 'expo-router';
import React, { useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAllSalesPaginated, deleteSale } from '@/services/sales';
import { Sale } from '@/types/sale';
import { useThemeColor } from '@/hooks/use-theme-color';

const PAGE_SIZE = 30;

export default function VentasScreen() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const currentPageRef = useRef(0);
  const router = useRouter();
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const loadSales = useCallback(async (reset: boolean = false) => {
    try {
      if (reset) {
        setIsLoading(true);
        currentPageRef.current = 0;
        setSales([]);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      const offset = reset ? 0 : currentPageRef.current * PAGE_SIZE;
      const result = await getAllSalesPaginated(PAGE_SIZE, offset);

      if (reset) {
        setSales(result.sales);
      } else {
        setSales((prevSales) => [...prevSales, ...result.sales]);
      }

      setHasMore(result.sales.length === PAGE_SIZE);
      currentPageRef.current = reset ? 1 : currentPageRef.current + 1;
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      Alert.alert('Error', 'No se pudieron cargar las ventas');
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSales(true);
    }, [loadSales])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSales(true);
  }, [loadSales]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadSales(false);
    }
  }, [loadingMore, hasMore, loadSales]);

  const handleDelete = (sale: Sale) => {
    Alert.alert(
      'Eliminar venta',
      '¿Estás seguro de eliminar esta venta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSale(sale.id);
              loadSales(true);
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la venta');
            }
          },
        },
      ]
    );
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

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
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
          {sales.length === 0 ? (
            <ThemedView style={styles.emptyContainer}>
              <Ionicons name="cart-outline" size={64} color={textColor} style={{ opacity: 0.5 }} />
              <ThemedText style={styles.emptyText}>
                No hay ventas registradas
              </ThemedText>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: tintColor, marginTop: 16 }]}
                onPress={() => router.push('/(drawer)/ventas/nuevo')}>
                <Ionicons name="add" size={20} color="#fff" />
                <ThemedText style={styles.addButtonText}>Registrar primera venta</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          ) : (
            <>
              {sales.map((sale) => (
                <ThemedView key={sale.id} style={styles.saleCard}>
                  <ThemedView style={styles.saleInfo}>
                    <ThemedView style={styles.saleHeader}>
                      <ThemedText type="subtitle" style={styles.saleId}>
                        Venta #{sale.id}
                      </ThemedText>
                      <ThemedText style={styles.saleDate}>
                        {formatDate(sale.sale_date || sale.created_at)}
                      </ThemedText>
                    </ThemedView>
                    <ThemedText style={styles.saleDetail}>
                      Cantidad: {sale.quantity} | Precio unitario: {formatPrice(sale.price_real)}
                    </ThemedText>
                    {sale.tipo_pago_name && (
                      <ThemedText style={styles.salePaymentType}>
                        Tipo de pago: {sale.tipo_pago_name}
                      </ThemedText>
                    )}
                    <ThemedText style={[styles.saleTotal, { color: tintColor }]}>
                      Total: {formatPrice(sale.total_price)}
                    </ThemedText>
                  </ThemedView>
                  <ThemedView style={styles.saleActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => router.push(`/(drawer)/ventas/editar?id=${sale.id}`)}>
                      <Ionicons name="pencil-outline" size={20} color={tintColor} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDelete(sale)}>
                      <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </ThemedView>
                </ThemedView>
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
            </>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  saleInfo: {
    flex: 1,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  saleId: {
    fontSize: 18,
    fontWeight: '600',
  },
  saleDate: {
    fontSize: 13,
    opacity: 0.7,
    fontWeight: '500',
  },
  saleDetail: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  salePaymentType: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  saleTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  saleActions: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
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
});
