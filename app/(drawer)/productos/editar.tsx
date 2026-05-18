// Redirigir a la pantalla nuevo con el parámetro id
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

export default function EditarProductoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const productId = params.id;

  useEffect(() => {
    if (productId) {
      router.replace(`/(drawer)/productos/nuevo?id=${productId}`);
    } else {
      router.back();
    }
  }, [productId]);

  return null;
}

