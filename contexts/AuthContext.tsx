import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSession, isLoggedIn, clearSession, saveSession } from '@/services/sessionStorage';
import { UserSession } from '@/services/sessionStorage';
import { UserSessionData } from '@/types/user';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserSessionData | null;
  login: (session: UserSession) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserSessionData | null>(null);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const loggedIn = await isLoggedIn();
      const session = await getSession();

      if (loggedIn && session?.userData) {
        setIsAuthenticated(true);
        setUser(session.userData);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (session: UserSession) => {
    try {
      await saveSession(session);
      setIsAuthenticated(true);
      setUser(session.userData || null);
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await clearSession();
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
        checkAuth,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

