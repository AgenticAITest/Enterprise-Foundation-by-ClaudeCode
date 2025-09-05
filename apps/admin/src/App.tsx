import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/providers/auth-provider';
import AdminLayout from '@/layouts/admin-layout';
import LoginPage from '@/pages/login';
import DashboardPage from '@/pages/dashboard';
import TenantsPage from '@/pages/tenants';
import ModulesPage from '@/pages/modules';
import SystemPage from '@/pages/system';
import UsersPage from '@/pages/users';
import BillingPage from '@/pages/billing';
import AnalyticsPage from '@/pages/analytics';
import SettingsPage from '@/pages/settings';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="tenants" element={<TenantsPage />} />
          <Route path="modules" element={<ModulesPage />} />
          <Route path="system" element={<SystemPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;