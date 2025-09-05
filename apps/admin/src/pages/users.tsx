import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@erp/ui';
import { Users } from 'lucide-react';

const UsersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage users across all tenants
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Global User Management
          </CardTitle>
          <CardDescription>
            Cross-tenant user administration and support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Coming soon - Global user management interface</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersPage;