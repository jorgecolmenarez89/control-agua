// Esta pantalla no se muestra, solo se usa para el botón de cerrar sesión en el drawer
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function CerrarSesionScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    // Redirigir al home si se accede directamente
    router.replace('/(drawer)/home');
  }, []);

  return null;
}

