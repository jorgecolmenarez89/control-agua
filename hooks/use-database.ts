import { useEffect, useState } from 'react';
import { initDatabase } from '@/services/database';

/**
 * Hook para inicializar la base de datos al montar el componente
 */
export const useDatabase = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        await initDatabase();
        if (isMounted) {
          setIsInitialized(true);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Error desconocido'));
          setIsInitialized(false);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  return { isInitialized, error };
};

