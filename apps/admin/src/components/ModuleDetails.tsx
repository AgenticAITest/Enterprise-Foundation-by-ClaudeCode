import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@erp/ui';
import { X, Package, DollarSign, Users, Calendar, GitBranch, Check, AlertTriangle } from 'lucide-react';

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

interface ModuleDetailsProps {
  module: Module;
  onClose: () => void;
  adoptionCount?: number;
}

const ModuleDetails: React.FC<ModuleDetailsProps> = ({ 
  module, 
  onClose, 
  adoptionCount = 0 
}) => {
  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    return num === 0 ? 'Free' : `$${num.toFixed(0)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Mock additional data that would come from API
  const mockFeatures = {
    core: ['User Management', 'Basic Reporting', 'Multi-tenant Support', 'API Access'],
    accounting: ['General Ledger', 'Accounts Payable/Receivable', 'Financial Reports', 'Tax Management'],
    hr: ['Employee Records', 'Payroll Processing', 'Leave Management', 'Performance Reviews'],
    pos: ['Sales Processing', 'Inventory Tracking', 'Receipt Printing', 'Multi-store Support'],
    wms: ['Inventory Management', 'Order Processing', 'Barcode Scanning', 'Shipping Integration']
  };

  const features = mockFeatures[module.code as keyof typeof mockFeatures] || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: module.color }}
            >
              <Package className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{module.name}</h2>
              <p className="text-gray-500">Version {module.version}</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {module.is_active ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 font-medium">Active</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-red-600 font-medium">Inactive</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Tenant Adoption</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-600 font-medium">{adoptionCount} tenants</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Module Code</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className="bg-gray-100 text-gray-800">
                  {module.code}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 leading-relaxed">
                {module.description}
              </p>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-900">{formatPrice(module.base_price)}</p>
                    <p className="text-sm text-blue-600">Base monthly fee</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">{formatPrice(module.price_per_user)}</p>
                    <p className="text-sm text-green-600">Per user per month</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Key Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Dependencies */}
          {module.dependencies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Dependencies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-orange-600" />
                  <span className="text-gray-600">Requires:</span>
                  <div className="flex gap-2">
                    {module.dependencies.map((dep) => (
                      <Badge key={dep} className="bg-orange-100 text-orange-800">
                        {dep}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Module Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Created:</span>
                  <span className="font-medium">{formatDate(module.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Last Updated:</span>
                  <span className="font-medium">{formatDate(module.updated_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Configure Module
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModuleDetails;