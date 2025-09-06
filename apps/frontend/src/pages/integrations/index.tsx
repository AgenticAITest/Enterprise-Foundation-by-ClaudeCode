import React from 'react';
import { Routes, Route } from 'react-router-dom';
import IntegrationDashboard from './dashboard';
import IntegrationList from './list';
import IntegrationBuilder from './create';
import IntegrationDetail from './detail';
import ApiKeyManagement from './api-keys';
import IntegrationLogs from './logs';

const IntegrationsModule: React.FC = () => {
  return (
    <Routes>
      <Route index element={<IntegrationDashboard />} />
      <Route path="list" element={<IntegrationList />} />
      <Route path="create" element={<IntegrationBuilder />} />
      <Route path=":id" element={<IntegrationDetail />} />
      <Route path="api-keys" element={<ApiKeyManagement />} />
      <Route path="logs" element={<IntegrationLogs />} />
    </Routes>
  );
};

export default IntegrationsModule;