import { StyleSheet, ScrollView, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getSalesToday, getSalesThisWeek, getSalesThisMonth, getSalesTodayByPaymentType, getSalesThisWeekByPaymentType, getSalesThisMonthByPaymentType } from '@/services/sales';

interface SalesStats {
  count: number;
  total: number;
}

interface PaymentTypeStats {
  tipo_pago_name: string;
  count: number;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [salesToday, setSalesToday] = useState<SalesStats>({ count: 0, total: 0 });
  const [salesWeek, setSalesWeek] = useState<SalesStats>({ count: 0, total: 0 });
  const [salesMonth, setSalesMonth] = useState<SalesStats>({ count: 0, total: 0 });
  const [salesTodayByType, setSalesTodayByType] = useState<PaymentTypeStats[]>([]);
  const [salesWeekByType, setSalesWeekByType] = useState<PaymentTypeStats[]>([]);
  const [salesMonthByType, setSalesMonthByType] = useState<PaymentTypeStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const colorScheme = useColorScheme();
  const tintColor = useThemeColor({}, 'tint');
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    loadSalesStats();
  }, []);

  const loadSalesStats = async () => {
    try {
      setIsLoading(true);
      const [today, week, month, todayByType, weekByType, monthByType] = await Promise.all([
        getSalesToday(),
        getSalesThisWeek(),
        getSalesThisMonth(),
        getSalesTodayByPaymentType(),
        getSalesThisWeekByPaymentType(),
        getSalesThisMonthByPaymentType(),
      ]);
      setSalesToday(today);
      setSalesWeek(week);
      setSalesMonth(month);
      setSalesTodayByType(todayByType);
      setSalesWeekByType(weekByType);
      setSalesMonthByType(monthByType);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const [today, week, month, todayByType, weekByType, monthByType] = await Promise.all([
        getSalesToday(),
        getSalesThisWeek(),
        getSalesThisMonth(),
        getSalesTodayByPaymentType(),
        getSalesThisWeekByPaymentType(),
        getSalesThisMonthByPaymentType(),
      ]);
      setSalesToday(today);
      setSalesWeek(week);
      setSalesMonth(month);
      setSalesTodayByType(todayByType);
      setSalesWeekByType(weekByType);
      setSalesMonthByType(monthByType);
    } catch (error) {
      console.error('Error al actualizar estadísticas:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `Bs ${new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Bienvenido
        </ThemedText>
        {user && (
          <ThemedView style={styles.userInfo}>
            <ThemedText type="subtitle">Usuario: {user.username}</ThemedText>
            <ThemedText>Nombre: {user.fullnames}</ThemedText>
          </ThemedView>
        )}

        <View style={styles.statsContainer}>
          <ThemedView
            style={[
              styles.statCard,
              {
                backgroundColor: isDark ? '#2C2C2E' : '#fff',
                borderColor: isDark ? '#3A3A3C' : '#ddd',
              },
            ]}>
            <ThemedText style={styles.statTitle}>Ventas del Día</ThemedText>
            {isLoading ? (
              <ThemedText style={styles.statLoading}>Cargando...</ThemedText>
            ) : (
              <View style={styles.statContent}>
                <View style={styles.statLeft}>
                  <ThemedText style={[styles.statCount, { color: tintColor }]}>
                    {salesToday.count}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>ventas</ThemedText>
                  <ThemedText style={[styles.statTotal, { color: tintColor }]}>
                    {formatCurrency(salesToday.total)}
                  </ThemedText>
                </View>
                {salesTodayByType.length > 0 && (
                  <View style={styles.paymentTypesContainer}>
                    {salesTodayByType.map((item, index) => (
                      <View key={index} style={styles.paymentTypeRow}>
                        <ThemedText style={styles.paymentTypeName}>{item.tipo_pago_name}:</ThemedText>
                        <ThemedText style={styles.paymentTypeCount}>{item.count}</ThemedText>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ThemedView>

          <ThemedView
            style={[
              styles.statCard,
              {
                backgroundColor: isDark ? '#2C2C2E' : '#fff',
                borderColor: isDark ? '#3A3A3C' : '#ddd',
              },
            ]}>
            <ThemedText style={styles.statTitle}>Ventas de la Semana</ThemedText>
            {isLoading ? (
              <ThemedText style={styles.statLoading}>Cargando...</ThemedText>
            ) : (
              <View style={styles.statContent}>
                <View style={styles.statLeft}>
                  <ThemedText style={[styles.statCount, { color: tintColor }]}>
                    {salesWeek.count}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>ventas</ThemedText>
                  <ThemedText style={[styles.statTotal, { color: tintColor }]}>
                    {formatCurrency(salesWeek.total)}
                  </ThemedText>
                </View>
                {salesWeekByType.length > 0 && (
                  <View style={styles.paymentTypesContainer}>
                    {salesWeekByType.map((item, index) => (
                      <View key={index} style={styles.paymentTypeRow}>
                        <ThemedText style={styles.paymentTypeName}>{item.tipo_pago_name}:</ThemedText>
                        <ThemedText style={styles.paymentTypeCount}>{item.count}</ThemedText>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ThemedView>

          <ThemedView
            style={[
              styles.statCard,
              {
                backgroundColor: isDark ? '#2C2C2E' : '#fff',
                borderColor: isDark ? '#3A3A3C' : '#ddd',
              },
            ]}>
            <ThemedText style={styles.statTitle}>Ventas del Mes</ThemedText>
            {isLoading ? (
              <ThemedText style={styles.statLoading}>Cargando...</ThemedText>
            ) : (
              <View style={styles.statContent}>
                <View style={styles.statLeft}>
                  <ThemedText style={[styles.statCount, { color: tintColor }]}>
                    {salesMonth.count}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>ventas</ThemedText>
                  <ThemedText style={[styles.statTotal, { color: tintColor }]}>
                    {formatCurrency(salesMonth.total)}
                  </ThemedText>
                </View>
                {salesMonthByType.length > 0 && (
                  <View style={styles.paymentTypesContainer}>
                    {salesMonthByType.map((item, index) => (
                      <View key={index} style={styles.paymentTypeRow}>
                        <ThemedText style={styles.paymentTypeName}>{item.tipo_pago_name}:</ThemedText>
                        <ThemedText style={styles.paymentTypeCount}>{item.count}</ThemedText>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ThemedView>
        </View>
      </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  content: {
    padding: 20,
  },
  title: {
    marginBottom: 20,
  },
  userInfo: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    marginBottom: 24,
  },
  statsContainer: {
    gap: 16,
  },
  statCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    opacity: 0.8,
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statLeft: {
    flex: 1,
  },
  statCount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  statTotal: {
    fontSize: 20,
    fontWeight: '600',
  },
  statLoading: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    paddingVertical: 20,
  },
  paymentTypesContainer: {
    flex: 1,
    marginLeft: 16,
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0,0,0,0.1)',
    gap: 6,
    alignItems: 'flex-end',
  },
  paymentTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentTypeName: {
    fontSize: 13,
    opacity: 0.7,
  },
  paymentTypeCount: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.8,
  },
});

