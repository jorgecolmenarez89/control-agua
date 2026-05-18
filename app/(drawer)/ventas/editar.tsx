// Redirigir a la pantalla nuevo con el parámetro id
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

export default function EditarVentaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const saleId = params.id;

  useEffect(() => {
    if (saleId) {
      router.replace(`/(drawer)/ventas/nuevo?id=${saleId}`);
    } else {
      router.back();
    }
  }, [saleId]);

  return null;
}

