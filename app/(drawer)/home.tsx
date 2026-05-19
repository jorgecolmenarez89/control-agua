import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  getReporteVentasHoy,
  getReporteVentasMesActual,
  getReporteVentasSemanaActual,
  ReporteVentas,
} from '@/services/reportes';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

export default function HomeScreen() {
  const { user } = useAuth();
  const [salesToday, setSalesToday] = useState<ReporteVentas>(EMPTY_REPORTE);
  const [salesWeek, setSalesWeek] = useState<ReporteVentas>(EMPTY_REPORTE);
  const [salesMonth, setSalesMonth] = useState<ReporteVentas>(EMPTY_REPORTE);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const colorScheme = useColorScheme();
  const tintColor = useThemeColor({}, 'tint');
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    loadSalesStats();
  }, []);

  const loadSalesStats = async (showLoading: boolean = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }

      const [today, week, month] = await Promise.all([
        getReporteVentasHoy(),
        getReporteVentasSemanaActual(),
        getReporteVentasMesActual(),
      ]);

      setSalesToday(today);
      setSalesWeek(week);
      setSalesMonth(month);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadSalesStats(false);
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

  const renderCard = (title: string, data: ReporteVentas) => {
    return (
      <ThemedView
        style={[
          styles.statCard,
          {
            backgroundColor: isDark ? '#2C2C2E' : '#fff',
            borderColor: isDark ? '#3A3A3C' : '#ddd',
          },
        ]}>
        <ThemedText style={styles.statTitle}>{title}</ThemedText>

        {isLoading ? (
          <ThemedText style={styles.statLoading}>Cargando...</ThemedText>
        ) : (
          <View style={styles.statContent}>
            <View style={styles.statLeft}>
              <ThemedText style={[styles.statCount, { color: tintColor }]}>
                {data.cantidadVentas}
              </ThemedText>
              <ThemedText style={styles.statLabel}>ventas</ThemedText>
            </View>

            <View style={styles.totalsColumn}>
              <View style={styles.amountRow}>
                <ThemedText style={styles.statAmountLabel}>Bruto</ThemedText>
                <ThemedText style={styles.statAmountValue}>{formatCurrency(data.totalBruto)}</ThemedText>
              </View>
              <View style={styles.amountRow}>
                <ThemedText style={styles.statAmountLabel}>Descuento</ThemedText>
                <ThemedText style={styles.statAmountValue}>{formatCurrency(data.totalDescuento)}</ThemedText>
              </View>
              <View style={[styles.amountRow, styles.netRow]}>
                <ThemedText style={[styles.statAmountLabel, styles.netLabel]}>Neto</ThemedText>
                <ThemedText style={[styles.statTotal, { color: tintColor }]}> 
                  {formatCurrency(data.totalNeto)}
                </ThemedText>
              </View>
            </View>
          </View>
        )}
      </ThemedView>
    );
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
            <ThemedText type="subtitle">Correo: {user.correo}</ThemedText>
            <ThemedText>Rol: {user.rol?.nombre || 'Sin rol'}</ThemedText>
          </ThemedView>
        )}

        <View style={styles.statsContainer}>
          {renderCard('Ventas del Día', salesToday)}
          {renderCard('Ventas de la Semana', salesWeek)}
          {renderCard('Ventas del Mes', salesMonth)}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  statLeft: {
    width: '32%',
  },
  statCount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  totalsColumn: {
    flex: 1,
    gap: 10,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
    paddingBottom: 6,
  },
  statAmountLabel: {
    fontSize: 12,
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statAmountValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  netRow: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  netLabel: {
    opacity: 0.85,
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
});

