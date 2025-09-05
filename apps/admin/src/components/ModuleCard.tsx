import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@erp/ui';
import { Package, DollarSign, Users, Check, X, Power, Loader2 } from 'lucide-react';

interface Module {
  id: string;
  code: string;
  name: string;
  description: string;
  version: string;
  is_active: boolean;
  base_price: string;
  price_per_user: string;
  icon: string;
  color: string;
  dependencies: string[];
  created_at: string;
  updated_at: string;
}

interface ModuleCardProps {
  module: Module;
  adoptionCount?: number;
  onViewDetails?: (module: Module) => void;
  onToggleStatus?: (module: Module, newStatus: boolean) => Promise<void>;
  isToggling?: boolean;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ 
  module, 
  adoptionCount = 0, 
  onViewDetails, 
  onToggleStatus,
  isToggling = false 
}) => {
  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    return num === 0 ? 'Free' : `$${num.toFixed(0)}`;
  };

  const getStatusBadge = () => {
    return module.is_active ? (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <Check className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 border-red-200">
        <X className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: module.color }}
            >
              <Package className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{module.name}</CardTitle>
              <p className="text-sm text-gray-500">v{module.version}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 line-clamp-2">
          {module.description}
        </p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-400" />
            <div>
              <p className="font-medium">{formatPrice(module.base_price)}</p>
              <p className="text-gray-500">Base price</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <div>
              <p className="font-medium">{formatPrice(module.price_per_user)}</p>
              <p className="text-gray-500">Per user</p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {adoptionCount} tenant{adoptionCount !== 1 ? 's' : ''}
            </span>
            {module.dependencies.length > 0 && (
              <span className="text-gray-500">
                Requires: {module.dependencies.join(', ')}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button 
            onClick={() => onViewDetails?.(module)}
            className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
          >
            View Details
          </button>
          {onToggleStatus && (
            <button 
              onClick={() => onToggleStatus(module, !module.is_active)}
              disabled={isToggling || module.code === 'core'}
              className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-center gap-1 ${
                module.is_active 
                  ? 'bg-red-50 text-red-700 hover:bg-red-100 disabled:bg-red-25 disabled:text-red-400' 
                  : 'bg-green-50 text-green-700 hover:bg-green-100 disabled:bg-green-25 disabled:text-green-400'
              } ${(isToggling || module.code === 'core') ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              title={module.code === 'core' ? 'Core module cannot be deactivated' : ''}
            >
              {isToggling ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Power className="h-3 w-3" />
              )}
              {module.is_active ? 'Deactivate' : 'Activate'}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ModuleCard;