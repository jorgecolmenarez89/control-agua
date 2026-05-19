import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getVentaById, VentaListado } from '@/services/ventas';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VentaDetalleScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const ventaId = params.id ? Number(params.id) : null;
  const [venta, setVenta] = useState<VentaListado | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVenta();
  }, [ventaId]);

  const loadVenta = async () => {
    if (!ventaId || Number.isNaN(ventaId)) {
      Alert.alert('Error', 'ID de venta inválido');
      router.back();
      return;
    }

    try {
      setIsLoading(true);
      const data = await getVentaById(ventaId);

      if (!data) {
        Alert.alert('Error', 'Venta no encontrada');
        router.back();
        return;
      }

      setVenta(data);
    } catch (error) {
      console.error('Error al cargar venta:', error);
      Alert.alert('Error', 'No se pudo cargar el detalle de la venta');
      router.back();
    } finally {
      setIsLoading(false);
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
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tintColor} />
        <ThemedText style={styles.loadingText}>Cargando detalle...</ThemedText>
      </ThemedView>
    );
  }

  if (!venta) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>
            Detalle de venta
          </ThemedText>
        </ThemedView>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.card}>
            <ThemedText style={styles.sectionTitle}>Información general</ThemedText>
            <ThemedText style={styles.detailLine}>Venta #{venta.id}</ThemedText>
            <ThemedText style={styles.detailLine}>Número: {venta.numero}</ThemedText>
            <ThemedText style={styles.detailLine}>Fecha: {formatDate(venta.fecha)}</ThemedText>
            <ThemedText style={styles.detailLine}>Items: {venta.cantidadItems}</ThemedText>
            <ThemedText style={styles.detailLine}>Bruto: {formatPrice(venta.totalBruto)}</ThemedText>
            <ThemedText style={styles.detailLine}>Descuento: {formatPrice(venta.totalDescuento)}</ThemedText>
            <ThemedText style={styles.detailLine}>Pagado: {formatPrice(venta.totalPagado)}</ThemedText>
            <ThemedText style={[styles.detailLine, styles.netLine, { color: tintColor }]}> 
              Neto: {formatPrice(venta.totalNeto)}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.card}>
            <ThemedText style={styles.sectionTitle}>Detalles</ThemedText>
            {venta.detalles.map((detalle, index) => (
              <View key={`${detalle.idProducto}-${index}`} style={styles.blockRow}>
                <ThemedText style={styles.blockTitle}>Producto ID: {detalle.idProducto}</ThemedText>
                <ThemedText style={styles.blockText}>Cantidad: {detalle.cantidad}</ThemedText>
                <ThemedText style={styles.blockText}>Precio real: {formatPrice(detalle.precioRealVenta)}</ThemedText>
                <ThemedText style={styles.blockText}>Descuento: {formatPrice(detalle.descuento)}</ThemedText>
              </View>
            ))}
          </ThemedView>

          <ThemedView style={styles.card}>
            <ThemedText style={styles.sectionTitle}>Pagos</ThemedText>
            {venta.pagos.map((pago, index) => (
              <View key={`${pago.idTipoPago}-${index}`} style={styles.blockRow}>
                <ThemedText style={styles.blockTitle}>
                  {pago.tipoPagoNombre || `Tipo de pago ID: ${pago.idTipoPago}`}
                </ThemedText>
                <ThemedText style={styles.blockText}>Monto: {formatPrice(pago.monto)}</ThemedText>
                <ThemedText style={styles.blockText}>
                  Referencia: {pago.referencia || 'Sin referencia'}
                </ThemedText>
              </View>
            ))}
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
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
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  detailLine: {
    fontSize: 14,
    opacity: 0.85,
  },
  netLine: {
    marginTop: 4,
    fontWeight: '700',
  },
  blockRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    paddingTop: 8,
    marginTop: 4,
    gap: 2,
  },
  blockTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  blockText: {
    fontSize: 13,
    opacity: 0.8,
  },
});
