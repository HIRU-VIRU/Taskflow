import React, { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Tenant, Subscription, FeatureCode } from '../types';
import { subscriptionsApi } from '../api/subscriptions';
import { useAuth } from './AuthContext';

interface TenantContextType {
  tenant: Tenant | null;
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  hasFeature: (feature: FeatureCode) => boolean;
  checkUsage: (key: string, current?: number) => { allowed: boolean; remaining: number; limit: number };
  fetchTenantInfo: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

export const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const { user, tenant: authTenant, isAuthenticated } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(authTenant || null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch tenant subscription info
  const fetchTenantInfo = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);
    try {
      const sub = await subscriptionsApi.getCurrentSubscription();
      setSubscription(sub);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch subscription';
      setError(errorMessage);
      console.error('Failed to fetch tenant info:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Refresh subscription (call to update after plan change)
  const refreshSubscription = useCallback(async () => {
    await fetchTenantInfo();
  }, [fetchTenantInfo]);

  // Update tenant from auth context
  useEffect(() => {
    if (authTenant) {
      setTenant(authTenant);
    }
  }, [authTenant]);

  // Fetch subscription on auth
  useEffect(() => {
    if (isAuthenticated) {
      fetchTenantInfo();
    }
  }, [isAuthenticated, fetchTenantInfo]);

  // Check if user has a specific feature
  const hasFeature = useCallback(
    (feature: FeatureCode): boolean => {
      if (!subscription || !subscription.features) return false;
      return subscription.features.includes(feature);
    },
    [subscription]
  );

  // Check usage status for a limit
  const checkUsage = useCallback(
    (key: string, current = 0): { allowed: boolean; remaining: number; limit: number } => {
      if (!subscription || !subscription.limits) {
        return { allowed: true, remaining: -1, limit: -1 };
      }

      const limit = subscription.limits[key];
      if (limit === undefined || limit === -1) {
        // Unlimited
        return { allowed: true, remaining: -1, limit: -1 };
      }

      const remaining = Math.max(0, limit - current);
      const allowed = current < limit;

      return { allowed, remaining, limit };
    },
    [subscription]
  );

  const value: TenantContextType = {
    tenant,
    subscription,
    isLoading,
    error,
    hasFeature,
    checkUsage,
    fetchTenantInfo,
    refreshSubscription,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

// Hook to use tenant context
export const useTenant = (): TenantContextType => {
  const context = React.useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
};
