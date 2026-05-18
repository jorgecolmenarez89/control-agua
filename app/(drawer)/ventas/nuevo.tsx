import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getAllProducts } from '@/services/products';
import { createSale, getSaleById, updateSale } from '@/services/sales';
import { getAllTiposPago } from '@/services/tipoPago';
import { Product } from '@/types/product';
import { TipoPago } from '@/types/sale';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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

export default function NuevaVentaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const saleId = params.id ? Number(params.id) : null;
  const isEditing = saleId !== null;

  const [productId, setProductId] = useState<number | null>(null);
  const [priceReal, setPriceReal] = useState('');
  const [typePagoId, setTypePagoId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [saleDate, setSaleDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reference, setReference] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSale, setLoadingSale] = useState(isEditing);

  const [products, setProducts] = useState<Product[]>([]);
  const [tiposPago, setTiposPago] = useState<TipoPago[]>([]);

  const colorScheme = useColorScheme();
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, tiposPagoData] = await Promise.all([
        getAllProducts(),
        getAllTiposPago(),
      ]);
      setProducts(productsData.filter(p => p.active === 1));
      setTiposPago(tiposPagoData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    }
  };

  // Limpiar campos cuando se enfoca la pantalla sin ID (modo crear)
  useFocusEffect(
    useCallback(() => {
      if (!saleId) {
        setProductId(null);
        setPriceReal('');
        setTypePagoId(null);
        setQuantity('1');
        setSaleDate(new Date());
        setReference('');
        setLoadingSale(false);
      }
    }, [saleId])
  );

  useEffect(() => {
    if (isEditing && saleId) {
      loadSale();
    }
  }, [isEditing, saleId]);

  const loadSale = async () => {
    try {
      setLoadingSale(true);
      const sale = await getSaleById(saleId!);
      if (sale) {
        setProductId(sale.product_id);
        setPriceReal(sale.price_real.toString());
        setTypePagoId(sale.type_pago_id);
        setQuantity(sale.quantity.toString());
        setReference(sale.reference || '');
        if (sale.sale_date) {
          setSaleDate(new Date(sale.sale_date));
        } else {
          setSaleDate(new Date(sale.created_at));
        }
      } else {
        Alert.alert('Error', 'Venta no encontrada');
        router.back();
      }
    } catch (error) {
      console.error('Error al cargar venta:', error);
      Alert.alert('Error', 'No se pudo cargar la venta');
      router.back();
    } finally {
      setLoadingSale(false);
    }
  };

  const calculateTotal = () => {
    const price = parseFloat(priceReal) || 0;
    const qty = parseInt(quantity) || 0;
    return price * qty;
  };

  const handleSave = async () => {
    if (!productId) {
      Alert.alert('Error', 'Debes seleccionar un producto');
      return;
    }

    if (!priceReal.trim() || isNaN(Number(priceReal)) || Number(priceReal) <= 0) {
      Alert.alert('Error', 'El precio debe ser un número válido mayor a 0');
      return;
    }

    if (!typePagoId) {
      Alert.alert('Error', 'Debes seleccionar un tipo de pago');
      return;
    }

    if (!quantity.trim() || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      Alert.alert('Error', 'La cantidad debe ser un número válido mayor a 0');
      return;
    }

    const totalPrice = calculateTotal();

    setIsLoading(true);
    try {
      // Convertir fecha a formato local sin conversión a UTC para evitar problemas de zona horaria
      const year = saleDate.getFullYear();
      const month = String(saleDate.getMonth() + 1).padStart(2, '0');
      const day = String(saleDate.getDate()).padStart(2, '0');
      const hours = String(saleDate.getHours()).padStart(2, '0');
      const minutes = String(saleDate.getMinutes()).padStart(2, '0');
      const seconds = String(saleDate.getSeconds()).padStart(2, '0');
      const saleDateStr = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.000`;
      const referenceValue = reference.trim() || null;
      if (isEditing && saleId) {
        await updateSale({
          id: saleId,
          product_id: productId,
          price_real: Number(priceReal),
          type_pago_id: typePagoId,
          quantity: Number(quantity),
          total_price: totalPrice,
          sale_date: saleDateStr,
          reference: referenceValue,
        });
        Alert.alert('Éxito', 'Venta actualizada correctamente', [
          { text: 'OK', onPress: () => router.replace('/(drawer)/ventas') },
        ]);
      } else {
        await createSale({
          product_id: productId,
          price_real: Number(priceReal),
          type_pago_id: typePagoId,
          quantity: Number(quantity),
          total_price: totalPrice,
          sale_date: saleDateStr,
          reference: referenceValue,
        });
        // Limpiar campos después de crear
        setProductId(null);
        setPriceReal('');
        setTypePagoId(null);
        setQuantity('1');
        setSaleDate(new Date());
        setReference('');
        // Redirigir al listado
        router.replace('/(drawer)/ventas');
      }
    } catch (error) {
      console.error('Error al guardar venta:', error);
      Alert.alert('Error', 'No se pudo guardar la venta');
    } finally {
      setIsLoading(false);
    }
  };

  const totalPrice = calculateTotal();

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setSaleDate(selectedDate);
    }
  };

  if (loadingSale) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.loadingText}>Cargando venta...</ThemedText>
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
          {isEditing ? 'Editar Venta' : 'Nueva Venta'}
        </ThemedText>

        <ThemedView style={styles.form}>
          <ThemedText style={styles.label}>Producto *</ThemedText>
          <View
            style={[
              styles.pickerContainer,
              {
                backgroundColor: isDark ? '#2C2C2E' : '#fff',
                borderColor: isDark ? '#3A3A3C' : '#ddd',
              },
            ]}>
            <Picker
              selectedValue={productId}
              onValueChange={(value) => {
                setProductId(value);
                const product = products.find(p => p.id === value);
                if (product) {
                  setPriceReal(product.price.toString());
                }
              }}
              style={{ color: textColor }}
              enabled={!isLoading}>
              <Picker.Item label="Selecciona un producto" value={null} />
              {products.map((product) => (
                <Picker.Item
                  key={product.id}
                  label={product.name}
                  value={product.id}
                />
              ))}
            </Picker>
          </View>

          <ThemedText style={styles.label}>Precio Real *</ThemedText>
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
            value={priceReal}
            onChangeText={setPriceReal}
            keyboardType="decimal-pad"
            editable={!isLoading}
          />

          <ThemedText style={styles.label}>Cantidad *</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#2C2C2E' : '#fff',
                color: textColor,
                borderColor: isDark ? '#3A3A3C' : '#ddd',
              },
            ]}
            placeholder="1"
            placeholderTextColor={isDark ? '#8E8E93' : '#999'}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="number-pad"
            editable={!isLoading}
          />

          <ThemedText style={styles.label}>Tipo de Pago *</ThemedText>
          <View
            style={[
              styles.pickerContainer,
              {
                backgroundColor: isDark ? '#2C2C2E' : '#fff',
                borderColor: isDark ? '#3A3A3C' : '#ddd',
              },
            ]}>
            <Picker
              selectedValue={typePagoId}
              onValueChange={setTypePagoId}
              style={{ color: textColor }}
              enabled={!isLoading}>
              <Picker.Item label="Selecciona un tipo de pago" value={null} />
              {tiposPago.map((tipo) => (
                <Picker.Item key={tipo.id} label={tipo.name} value={tipo.id} />
              ))}
            </Picker>
          </View>

          <ThemedText style={styles.label}>Fecha de Venta *</ThemedText>
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
              {formatDate(saleDate)}
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

          <ThemedText style={styles.label}>Referencia</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#2C2C2E' : '#fff',
                color: textColor,
                borderColor: isDark ? '#3A3A3C' : '#ddd',
              },
            ]}
            placeholder="Referencia (opcional)"
            placeholderTextColor={isDark ? '#8E8E93' : '#999'}
            value={reference}
            onChangeText={setReference}
            keyboardType="number-pad"
            editable={!isLoading}
          />

          <ThemedView style={styles.totalContainer}>
            <ThemedText style={styles.totalLabel}>Total:</ThemedText>
            <ThemedText style={[styles.totalPrice, { color: tintColor }]}>
              Bs {new Intl.NumberFormat('es-ES', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(totalPrice)}
            </ThemedText>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
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
  dateButton: {
    justifyContent: 'center',
    minHeight: 48,
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
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: 'bold',
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

