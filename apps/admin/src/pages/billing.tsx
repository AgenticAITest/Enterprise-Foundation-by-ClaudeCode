import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@erp/ui';
import { CreditCard } from 'lucide-react';

const BillingPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Revenue</h1>
        <p className="text-muted-foreground">
          Monitor revenue, subscriptions, and billing across all tenants
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Revenue Management
          </CardTitle>
          <CardDescription>
            Subscription management and revenue analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Coming soon - Billing and revenue dashboard</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingPage;