import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { 
  Building2, 
  Users, 
  Package, 
  Calendar, 
  DollarSign, 
  Power,
  AlertTriangle,
  Check,
  Clock,
  Eye,
  Settings
} from 'lucide-react';

interface Tenant {
  id: string;
  subdomain: string;
  companyName: string;
  planId?: string;
  createdAt: string;
  updatedAt: string;
  userCount: number;
  moduleCount: number;
  status: 'active' | 'suspended' | 'trial' | 'inactive';
  trialEndsAt?: string;
  lastActivity?: string;
  revenue?: number;
}

interface TenantCardProps {
  tenant: Tenant;
  onViewDetails?: (tenant: Tenant) => void;
  onManageModules?: (tenant: Tenant) => void;
  onToggleStatus?: (tenant: Tenant, newStatus: string) => Promise<void>;
  isToggling?: boolean;
}

const TenantCard: React.FC<TenantCardProps> = ({ 
  tenant, 
  onViewDetails, 
  onManageModules, 
  onToggleStatus,
  isToggling = false 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatRevenue = (amount?: number) => {
    if (!amount) return '$0';
    return `$${amount.toLocaleString()}`;
  };

  const getStatusBadge = () => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800 border-green-200', icon: Check, text: 'Active' },
      trial: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock, text: 'Trial' },
      suspended: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle, text: 'Suspended' },
      inactive: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Power, text: 'Inactive' }
    };

    const config = statusConfig[tenant.status] || statusConfig.inactive;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const isTrialExpiringSoon = () => {
    if (!tenant.trialEndsAt) return false;
    const trialEnd = new Date(tenant.trialEndsAt);
    const now = new Date();
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 7 && daysLeft > 0;
  };

  const isTrialExpired = () => {
    if (!tenant.trialEndsAt) return false;
    const trialEnd = new Date(tenant.trialEndsAt);
    const now = new Date();
    return now > trialEnd;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{tenant.companyName}</CardTitle>
              <p className="text-sm text-gray-500">{tenant.subdomain}.yourdomain.com</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
        
        {/* Trial warning */}
        {tenant.status === 'trial' && (isTrialExpiringSoon() || isTrialExpired()) && (
          <div className={`mt-2 p-2 rounded-md text-sm flex items-center gap-2 ${
            isTrialExpired() 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
          }`}>
            <AlertTriangle className="h-4 w-4" />
            {isTrialExpired() 
              ? 'Trial expired'
              : `Trial expires ${formatDate(tenant.trialEndsAt!)}`
            }
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <div>
              <p className="font-medium">{tenant.userCount}</p>
              <p className="text-gray-500">Users</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-400" />
            <div>
              <p className="font-medium">{tenant.moduleCount}</p>
              <p className="text-gray-500">Modules</p>
            </div>
          </div>
        </div>

        {/* Revenue & Dates */}
        <div className="grid grid-cols-1 gap-3 text-sm border-t pt-3">
          {tenant.revenue !== undefined && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-500">
                <DollarSign className="h-4 w-4" />
                Monthly Revenue
              </div>
              <span className="font-medium text-green-600">{formatRevenue(tenant.revenue)}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="h-4 w-4" />
              Created
            </div>
            <span className="font-medium">{formatDate(tenant.createdAt)}</span>
          </div>
          
          {tenant.lastActivity && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-500">
                <Clock className="h-4 w-4" />
                Last Activity
              </div>
              <span className="font-medium">{formatDate(tenant.lastActivity)}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button 
            onClick={() => onViewDetails?.(tenant)}
            className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
          >
            <Eye className="h-3 w-3" />
            Details
          </button>
          
          <button 
            onClick={() => onManageModules?.(tenant)}
            className="flex-1 px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors flex items-center justify-center gap-1"
          >
            <Settings className="h-3 w-3" />
            Modules
          </button>
          
          {onToggleStatus && (
            <button 
              onClick={() => onToggleStatus(tenant, tenant.status === 'active' ? 'suspended' : 'active')}
              disabled={isToggling}
              className={`px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-center gap-1 ${
                tenant.status === 'active' 
                  ? 'bg-red-50 text-red-700 hover:bg-red-100 disabled:bg-red-25 disabled:text-red-400' 
                  : 'bg-green-50 text-green-700 hover:bg-green-100 disabled:bg-green-25 disabled:text-green-400'
              } ${isToggling ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              <Power className="h-3 w-3" />
              {tenant.status === 'active' ? 'Suspend' : 'Activate'}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TenantCard;