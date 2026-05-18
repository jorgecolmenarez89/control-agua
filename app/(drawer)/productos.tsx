import { useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAllProducts, deleteProduct } from '@/services/products';
import { Product } from '@/types/product';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function ProductosScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const loadProducts = useCallback(async () => {
    try {
      const data = await getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  const handleDelete = (product: Product) => {
    Alert.alert(
      'Eliminar producto',
      `¿Estás seguro de eliminar "${product.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(product.id);
              loadProducts();
              Alert.alert('Éxito', 'Producto eliminado correctamente');
            } catch (error: any) {
              const errorMessage = error?.message || 'No se pudo eliminar el producto';
              Alert.alert('Error', errorMessage);
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

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.loadingText}>Cargando productos...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Productos
          </ThemedText>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: tintColor }]}
            onPress={() => router.push('/(drawer)/productos/nuevo')}>
            <Ionicons name="add" size={24} color="#fff" />
            <ThemedText style={styles.addButtonText}>Nuevo</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadProducts} />
          }>
        {products.length === 0 ? (
          <ThemedView style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color={textColor} style={{ opacity: 0.5 }} />
            <ThemedText style={styles.emptyText}>
              No hay productos registrados
            </ThemedText>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: tintColor, marginTop: 16 }]}
              onPress={() => router.push('/(drawer)/productos/nuevo')}>
              <Ionicons name="add" size={20} color="#fff" />
              <ThemedText style={styles.addButtonText}>Crear primer producto</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ) : (
          products.map((product) => (
            <ThemedView key={product.id} style={styles.productCard}>
              <ThemedView style={styles.productInfo}>
                <ThemedView style={styles.productHeader}>
                  <ThemedText type="subtitle" style={styles.productName}>
                    {product.name}
                  </ThemedText>
                  {product.active === 0 && (
                    <ThemedView style={styles.inactiveBadge}>
                      <ThemedText style={styles.inactiveText}>Inactivo</ThemedText>
                    </ThemedView>
                  )}
                </ThemedView>
                {product.description && (
                  <ThemedText style={styles.productDescription}>
                    {product.description}
                  </ThemedText>
                )}
                <ThemedText style={[styles.productPrice, { color: tintColor }]}>
                  {formatPrice(product.price)}
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.productActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push(`/(drawer)/productos/editar?id=${product.id}`)}>
                  <Ionicons name="pencil-outline" size={20} color={tintColor} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(product)}>
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
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
  productCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  productInfo: {
    flex: 1,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
  },
  inactiveBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  productDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  productActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});
