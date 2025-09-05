import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@erp/ui';
import { BarChart3 } from 'lucide-react';

const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Platform-wide analytics and insights
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Platform Analytics
          </CardTitle>
          <CardDescription>
            Usage statistics, performance metrics, and business insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Coming soon - Advanced analytics dashboard</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage;