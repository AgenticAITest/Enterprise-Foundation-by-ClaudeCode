import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { TenantProvider } from '@/providers/tenant-provider';
import LoginPage from '@/pages/login';
import DashboardLayout from '@/layouts/dashboard-layout';
import DashboardPage from '@/pages/dashboard';
import TenantsPage from '@/pages/tenants';
import CurrenciesPage from '@/pages/currencies';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="erp-ui-theme">
      <AuthProvider>
        <TenantProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="tenants" element={<TenantsPage />} />
              <Route path="currencies" element={<CurrenciesPage />} />
            </Route>
          </Routes>
          <Toaster />
        </TenantProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;