import React, { createContext, useContext, useState, useEffect } from 'react';
import { platformApi, platformTokenUtils } from '../api/platform';
import { PlatformAdmin } from '../types';

interface PlatformAuthContextType {
  platformAdmin: PlatformAdmin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const PlatformAuthContext = createContext<PlatformAuthContextType | undefined>(undefined);

export const PlatformAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [platformAdmin, setPlatformAdmin] = useState<PlatformAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    // Listen for auth errors (e.g., from interceptor)
    const handleAuthError = () => {
      setPlatformAdmin(null);
    };

    window.addEventListener('platformAuthError', handleAuthError);
    return () => window.removeEventListener('platformAuthError', handleAuthError);
  }, []);

  const checkAuth = async () => {
    const token = platformTokenUtils.getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await platformApi.getMe();
      setPlatformAdmin(data.platformAdmin);
    } catch (error) {
      console.error('Platform Auth check failed:', error);
      platformTokenUtils.clearToken();
      setPlatformAdmin(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const data: any = await platformApi.login(email, password);
    platformTokenUtils.setToken(data.accessToken);
    setPlatformAdmin(data.admin);
  };

  const logout = () => {
    platformTokenUtils.clearToken();
    setPlatformAdmin(null);
  };

  return (
    <PlatformAuthContext.Provider
      value={{
        platformAdmin,
        isAuthenticated: !!platformAdmin,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </PlatformAuthContext.Provider>
  );
};

export const usePlatformAuth = () => {
  const context = useContext(PlatformAuthContext);
  if (context === undefined) {
    throw new Error('usePlatformAuth must be used within a PlatformAuthProvider');
  }
  return context;
};
