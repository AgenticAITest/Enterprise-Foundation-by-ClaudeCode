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
import IntegrationsModule from '@/pages/integrations';
import DebugPage from '@/pages/debug';
import IntegrationTest from '@/pages/integration-test';
import SimpleTest from '@/pages/simple-test';
import IntegrationDemoSimple from '@/pages/integration-demo-simple';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="erp-ui-theme">
      <AuthProvider>
        <TenantProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            {/* Debug Routes */}
            <Route path="/debug" element={<DebugPage />} />
            <Route path="/integration-test" element={<IntegrationTest />} />
            <Route path="/simple-test" element={<SimpleTest />} />
            <Route path="/integration-demo" element={<IntegrationDemoSimple />} />
            {/* Standalone Integration Demo - No Auth Required */}
            <Route path="/demo/integrations/*" element={<IntegrationsModule />} />
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="tenants" element={<TenantsPage />} />
              <Route path="currencies" element={<CurrenciesPage />} />
              <Route path="integrations/*" element={<IntegrationsModule />} />
              <Route path="integration-test" element={<IntegrationTest />} />
              <Route path="debug" element={<DebugPage />} />
            </Route>
          </Routes>
          <Toaster />
        </TenantProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;