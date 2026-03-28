import React, { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User, Tenant, LoginRequest, RegisterRequest } from '../types';
import { authApi } from '../api/auth';
import { tokenUtils } from '../utils/token';

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  register: (data: RegisterRequest) => Promise<void>;
  setAuthState: (user: User, tenant: Tenant, token: string) => void;
  isAdmin: () => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Define logout first so it can be used in useEffects
  const logout = useCallback(() => {
    setUser(null);
    setTenant(null);
    setToken(null);
    setError(null);
    tokenUtils.clearAll();
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.login(data);
      setUser(response.user);
      setTenant(response.tenant);
      setToken(response.accessToken);

      // Persist to localStorage
      tokenUtils.setToken(response.accessToken);
      tokenUtils.setTenantId(response.tenant.id);
      tokenUtils.setUserId(response.user.id);
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.register(data);
      setUser(response.user);
      setTenant(response.tenant);
      setToken(response.accessToken);

      // Persist to localStorage
      tokenUtils.setToken(response.accessToken);
      tokenUtils.setTenantId(response.tenant.id);
      tokenUtils.setUserId(response.user.id);
    } catch (err: any) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const isAdmin = useCallback(() => {
    return user?.role === 'admin';
  }, [user]);

  const setAuthState = useCallback((user: User, tenant: Tenant, token: string) => {
    setUser(user);
    setTenant(tenant);
    setToken(token);

    // Persist to localStorage
    tokenUtils.setToken(token);
    tokenUtils.setTenantId(tenant.id);
    tokenUtils.setUserId(user.id);
  }, []);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      console.log('🔐 AuthContext: Initializing auth...');
      try {
        const storedToken = tokenUtils.getToken();
        const storedTenantId = tokenUtils.getTenantId();
        const storedUserId = tokenUtils.getUserId();

        console.log('🔐 AuthContext: Stored token exists:', !!storedToken);
        console.log('🔐 AuthContext: Stored tenantId:', storedTenantId);
        console.log('🔐 AuthContext: Stored userId:', storedUserId);

        if (storedToken && storedTenantId && storedUserId) {
          // Check if token is expired
          if (tokenUtils.isTokenExpired(storedToken)) {
            console.log('⚠️ AuthContext: Token is expired, clearing storage');
            tokenUtils.clearAll();
          } else {
            console.log('✅ AuthContext: Token is valid, restoring session...');
            setToken(storedToken);

            // Try to get user info from API to ensure token is still valid
            try {
              const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
              const response = await fetch(`${apiBaseUrl}/auth/me`, {
                headers: {
                  'Authorization': `Bearer ${storedToken}`,
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                const responseData = await response.json();
                console.log('🔍 AuthContext: Raw API response:', responseData);
                // Backend returns { success: true, data: { user, tenant } }
                const data = responseData.data || responseData;
                console.log('🔍 AuthContext: Extracted data:', data);
                console.log('🔍 AuthContext: User object:', data.user);
                console.log('🔍 AuthContext: Tenant object:', data.tenant);

                if (data.user) {
                  console.log('✅ AuthContext: Session restored, user:', data.user.email);
                  setUser(data.user);
                  setTenant(data.tenant);
                } else {
                  console.log('⚠️ AuthContext: No user in response, clearing auth');
                  tokenUtils.clearAll();
                  setToken(null);
                }
              } else {
                // Token invalid, clear storage
                console.log('⚠️ AuthContext: Token invalid (response not ok), clearing storage');
                tokenUtils.clearAll();
                setToken(null);
              }
            } catch (err) {
              console.error('❌ AuthContext: Failed to validate token:', err);
              // Keep token but don't fail initialization
            }
          }
        }
      } catch (err) {
        console.error('❌ AuthContext: Failed to initialize auth:', err);
        tokenUtils.clearAll();
      } finally {
        console.log('🏁 AuthContext: Initialization complete');
        setIsInitialized(true);
      }
    };

    initAuth();
  }, []);

  // Listen for auth errors from API interceptor
  useEffect(() => {
    const handleAuthError = (event: any) => {
      if (event.detail?.code === 'UNAUTHORIZED') {
        console.log('Auth error detected, logging out user');
        logout();
      }
    };

    window.addEventListener('authError', handleAuthError);
    return () => window.removeEventListener('authError', handleAuthError);
  }, [logout]);

  const value: AuthContextType = {
    user,
    tenant,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    isInitialized,
    error,
    login,
    logout,
    register,
    setAuthState,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
