import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@erp/ui';
import { Building2 } from 'lucide-react';

const TenantsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tenant Management</h1>
        <p className="text-muted-foreground">
          Manage all tenant organizations across the platform
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Advanced Tenant Management
          </CardTitle>
          <CardDescription>
            This page will contain comprehensive tenant management features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Coming soon - Advanced tenant management interface</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantsPage;