import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { TenantProvider } from '@/providers/tenant-provider';
import LoginPage from '@/pages/login';
import DashboardLayout from '@/layouts/dashboard-layout';
import DashboardPage from '@/pages/dashboard';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="erp-ui-theme">
      <AuthProvider>
        <TenantProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<DashboardPage />} />
            </Route>
          </Routes>
          <Toaster />
        </TenantProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;