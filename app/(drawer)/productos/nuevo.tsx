import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { createProduct, updateProduct, getProductById } from '@/services/products';
import { Product } from '@/types/product';

export default function NuevoProductoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const productId = params.id ? Number(params.id) : null;
  const isEditing = productId !== null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [active, setActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(isEditing);

  const colorScheme = useColorScheme();
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const isDark = colorScheme === 'dark';

  // Limpiar campos cuando se enfoca la pantalla sin ID (modo crear)
  useFocusEffect(
    useCallback(() => {
      if (!productId) {
        setName('');
        setDescription('');
        setPrice('');
        setActive(true);
        setLoadingProduct(false);
      }
    }, [productId])
  );

  useEffect(() => {
    if (isEditing && productId) {
      loadProduct();
    }
  }, [isEditing, productId]);

  const loadProduct = async () => {
    try {
      setLoadingProduct(true);
      const product = await getProductById(productId!);
      if (product) {
        setName(product.name);
        setDescription(product.description || '');
        setPrice(product.price.toString());
        setActive(product.active === 1);
      } else {
        Alert.alert('Error', 'Producto no encontrado');
        router.back();
      }
    } catch (error) {
      console.error('Error al cargar producto:', error);
      Alert.alert('Error', 'No se pudo cargar el producto');
      router.back();
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert('Error', 'El precio debe ser un número válido mayor a 0');
      return;
    }

    setIsLoading(true);
    try {
      if (isEditing && productId) {
        await updateProduct({
          id: productId,
          name: name.trim(),
          description: description.trim() || null,
          price: Number(price),
          active: active ? 1 : 0,
        });
        Alert.alert('Éxito', 'Producto actualizado correctamente', [
          { text: 'OK', onPress: () => router.replace('/(drawer)/productos') },
        ]);
      } else {
        await createProduct({
          name: name.trim(),
          description: description.trim() || null,
          price: Number(price),
          active: active ? 1 : 0,
        });
        // Limpiar campos después de crear
        setName('');
        setDescription('');
        setPrice('');
        setActive(true);
        // Redirigir al listado
        router.replace('/(drawer)/productos');
      }
    } catch (error) {
      console.error('Error al guardar producto:', error);
      Alert.alert('Error', 'No se pudo guardar el producto');
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingProduct) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.loadingText}>Cargando producto...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
        </ThemedText>

        <ThemedView style={styles.form}>
          <ThemedText style={styles.label}>Nombre *</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#2C2C2E' : '#fff',
                color: textColor,
                borderColor: isDark ? '#3A3A3C' : '#ddd',
              },
            ]}
            placeholder="Nombre del producto"
            placeholderTextColor={isDark ? '#8E8E93' : '#999'}
            value={name}
            onChangeText={setName}
            editable={!isLoading}
          />

          <ThemedText style={styles.label}>Descripción</ThemedText>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: isDark ? '#2C2C2E' : '#fff',
                color: textColor,
                borderColor: isDark ? '#3A3A3C' : '#ddd',
              },
            ]}
            placeholder="Descripción del producto (opcional)"
            placeholderTextColor={isDark ? '#8E8E93' : '#999'}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            editable={!isLoading}
          />

          <ThemedText style={styles.label}>Precio *</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#2C2C2E' : '#fff',
                color: textColor,
                borderColor: isDark ? '#3A3A3C' : '#ddd',
              },
            ]}
            placeholder="0.00"
            placeholderTextColor={isDark ? '#8E8E93' : '#999'}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            editable={!isLoading}
          />

          <ThemedView style={styles.switchContainer}>
            <ThemedText style={styles.label}>Activo</ThemedText>
            <Switch
              value={active}
              onValueChange={setActive}
              trackColor={{ false: '#767577', true: tintColor }}
              thumbColor={active ? '#fff' : '#f4f3f4'}
              disabled={isLoading}
            />
          </ThemedView>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: tintColor },
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleSave}
            disabled={isLoading}>
            <ThemedText style={styles.buttonText}>
              {isLoading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={isLoading}>
            <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    marginBottom: 24,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    opacity: 0.7,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});

