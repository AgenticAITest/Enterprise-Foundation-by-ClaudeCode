import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { TenantProvider } from '@/providers/tenant-provider';
import LoginPage from '@/pages/login';
// Old dashboard imports removed - using admin dashboard only
import IntegrationsModule from '@/pages/integrations';
import TenantsPage from '@/pages/tenants';
import CurrenciesPage from '@/pages/currencies';
import DebugPage from '@/pages/debug';
import IntegrationTest from '@/pages/integration-test';
import SimpleTest from '@/pages/simple-test';
import IntegrationDemoSimple from '@/pages/integration-demo-simple';

// Tenant Admin Components
import TenantAdminLayout from '@/layouts/admin/tenant-admin-layout-simple';
import AdminDashboard from '@/pages/admin/admin-dashboard-simple';
import ModulesDashboard from '@/pages/admin/modules-dashboard-full';
import UserManagement from '@/pages/admin/user-management';
import RoleManagement from '@/pages/admin/role-management';
import DataScopes from '@/pages/admin/data-scopes';
import AuditLogs from '@/pages/admin/audit-logs';
import AdminSettings from '@/pages/admin/admin-settings';
import ModuleSwitcherDemo from '@/pages/admin/module-switcher-demo-simple';
import ModuleSwitcherTest from '@/pages/admin/module-switcher-test';
import ModuleSwitcherStandalone from '@/pages/admin/module-switcher-standalone';
import DynamicNavigationDemo from '@/pages/admin/dynamic-navigation-demo';
import NavigationSimpleTest from '@/pages/admin/navigation-simple-test';
import PermissionRenderingDemo from '@/pages/admin/permission-rendering-demo';
import DataFilteringDemo from '@/pages/admin/data-filtering-demo';
import FieldMaskingDemo from '@/pages/admin/field-masking-demo';
import ModuleDashboardDemo from '@/pages/admin/module-dashboard-demo';

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
            
            {/* Tenant Admin Portal */}
            <Route path="/admin" element={<TenantAdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="modules" element={<ModulesDashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="roles" element={<RoleManagement />} />
              <Route path="data-scopes" element={<DataScopes />} />
              <Route path="audit" element={<AuditLogs />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="tenants" element={<TenantsPage />} />
              <Route path="currencies" element={<CurrenciesPage />} />
              <Route path="integrations/*" element={<IntegrationsModule />} />
              <Route path="module-switcher-demo" element={<ModuleSwitcherDemo />} />
              <Route path="module-switcher-test" element={<ModuleSwitcherTest />} />
              <Route path="module-switcher-standalone" element={<ModuleSwitcherStandalone />} />
              <Route path="dynamic-navigation-demo" element={<DynamicNavigationDemo />} />
              <Route path="navigation-simple-test" element={<NavigationSimpleTest />} />
              <Route path="permission-rendering-demo" element={<PermissionRenderingDemo />} />
              <Route path="data-filtering-demo" element={<DataFilteringDemo />} />
              <Route path="field-masking-demo" element={<FieldMaskingDemo />} />
              <Route path="module-dashboard-demo" element={<ModuleDashboardDemo />} />
            </Route>
            
            {/* Redirect root to admin dashboard */}
            <Route path="/" element={<Navigate to="/admin" replace />} />
          </Routes>
          <Toaster />
        </TenantProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;