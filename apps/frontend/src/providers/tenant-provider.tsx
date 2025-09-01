import React, { createContext, useContext, useEffect, useState } from 'react';
import { Tenant } from '@shared/types';
import { useAuth } from './auth-provider';

interface TenantContextType {
  tenant: Tenant | null;
  isLoading: boolean;
  switchTenant: (tenantId: string) => Promise<void>;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

interface TenantProviderProps {
  children: React.ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, token } = useAuth();

  const fetchTenantData = async () => {
    if (!user || !token) {
      setTenant(null);
      setIsLoading(false);
      return;
    }

    try {
      // For development, we'll create a mock tenant based on the user's tenantId
      // In production, this would fetch from the API
      const mockTenant: Tenant = {
        id: user.tenantId || 'dev',
        subdomain: 'dev',
        companyName: 'Development Company',
        status: 'active',
        planId: 'business',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date()
      };

      setTenant(mockTenant);
    } catch (error) {
      console.error('Failed to fetch tenant data:', error);
      setTenant(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantData();
  }, [user, token]);

  const switchTenant = async (tenantId: string) => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      // In a real implementation, this would switch the user's active tenant
      // For now, we'll just update the local tenant data
      const newTenant: Tenant = {
        id: tenantId,
        subdomain: tenantId,
        companyName: `${tenantId} Company`,
        status: 'active',
        planId: 'business',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setTenant(newTenant);
    } catch (error) {
      console.error('Failed to switch tenant:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTenant = async () => {
    await fetchTenantData();
  };

  const value: TenantContextType = {
    tenant,
    isLoading,
    switchTenant,
    refreshTenant
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};