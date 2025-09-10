import React, { useState, useEffect, useMemo } from 'react';
import { useTenantAdmin } from '@/providers/tenant-admin-provider';
import {
  Users,
  Shield,
  Settings,
  ChevronDown,
  ChevronRight,
  Database,
  Warehouse,
  Calculator,
  ShoppingCart,
  UserCheck,
  Save,
  Eye,
  TestTube,
  AlertTriangle,
  CheckCircle,
  X,
  Copy,
  Layers,
  Clock,
  MapPin,
  Monitor,
  Zap,
  FileText,
  Star,
  RotateCcw
} from 'lucide-react';

interface RoleBuilderProps {
  mode: 'create' | 'edit' | 'template' | 'clone';
  roleId?: string;
  templateId?: string;
  sourceRoleId?: string;
  selectedModule: string;
  onSave: (roleData: RoleFormData) => Promise<void>;
  onCancel: () => void;
}

interface RoleFormData {
  name: string;
  code: string;
  description: string;
  moduleCode: string;
  type: 'system' | 'custom' | 'template-based';
  status: 'active' | 'inactive' | 'draft';
  permissions: Record<string, boolean>;
  inheritance?: {
    baseRoleId?: string;
    inheritsPermissions: boolean;
  };
  advancedConfig?: {
    sessionLimits?: number;
    ipRestrictions?: string[];
    timeBasedAccess?: {
      allowedHours: { start: string; end: string }[];
      timezone: string;
    };
  };
}

interface PermissionNode {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  type: 'resource' | 'action';
  parent?: string;
  children?: PermissionNode[];
  granted: boolean;
  inherited: boolean;
  description: string;
}

interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning';
}

const RoleBuilder: React.FC<RoleBuilderProps> = ({
  mode,
  roleId,
  templateId,
  sourceRoleId,
  selectedModule,
  onSave,
  onCancel
}) => {
  const {
    rolesByModule,
    permissionResources,
    roleTemplates,
    isLoading
  } = useTenantAdmin();

  // Form State
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    code: '',
    description: '',
    moduleCode: selectedModule,
    type: 'custom',
    status: 'draft',
    permissions: {},
    inheritance: {
      inheritsPermissions: false
    }
  });

  // UI State
  const [activePanel, setActivePanel] = useState<'basic' | 'permissions' | 'advanced'>('basic');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showPreview, setShowPreview] = useState(false);

  // Permission tree structure
  const permissionTree = useMemo(() => {
    const resources = permissionResources[selectedModule] || {};
    const nodes: PermissionNode[] = [];

    Object.entries(resources).forEach(([resourceKey, resource]) => {
      const resourceNode: PermissionNode = {
        id: resourceKey,
        name: resource.name,
        icon: getResourceIcon(resourceKey),
        type: 'resource',
        granted: false,
        inherited: false,
        description: resource.description || '',
        children: []
      };

      resource.actions.forEach(action => {
        const actionNode: PermissionNode = {
          id: `${resourceKey}.${action.code}`,
          name: action.name,
          icon: getActionIcon(action.code),
          type: 'action',
          parent: resourceKey,
          granted: formData.permissions[`${resourceKey}.${action.code}`] || false,
          inherited: false,
          description: action.description || ''
        };
        
        resourceNode.children!.push(actionNode);
      });

      // Update resource granted status based on children
      resourceNode.granted = resourceNode.children!.some(child => child.granted);
      nodes.push(resourceNode);
    });

    return nodes;
  }, [selectedModule, permissionResources, formData.permissions]);

  // Initialize form based on mode
  useEffect(() => {
    initializeForm();
  }, [mode, roleId, templateId, sourceRoleId]);

  const initializeForm = () => {
    if (mode === 'template' && templateId) {
      const template = roleTemplates.find(t => t.id === templateId);
      if (template) {
        setFormData({
          name: `${template.name} (Custom)`,
          code: generateRoleCode(template.name),
          description: template.description,
          moduleCode: template.moduleCode,
          type: 'template-based',
          status: 'draft',
          permissions: template.permissions || {},
          inheritance: { inheritsPermissions: false }
        });
      }
    } else if (mode === 'edit' && roleId) {
      const existingRole = rolesByModule[selectedModule]?.find(r => r.id === roleId);
      if (existingRole) {
        setFormData({
          name: existingRole.name,
          code: existingRole.code,
          description: existingRole.description,
          moduleCode: existingRole.moduleCode,
          type: existingRole.type || 'custom',
          status: existingRole.status || 'active',
          permissions: existingRole.permissions || {},
          inheritance: { inheritsPermissions: false }
        });
      }
    } else if (mode === 'clone' && sourceRoleId) {
      const sourceRole = rolesByModule[selectedModule]?.find(r => r.id === sourceRoleId);
      if (sourceRole) {
        setFormData({
          name: `${sourceRole.name} (Copy)`,
          code: generateRoleCode(`${sourceRole.name}_copy`),
          description: sourceRole.description,
          moduleCode: sourceRole.moduleCode,
          type: 'custom',
          status: 'draft',
          permissions: { ...sourceRole.permissions },
          inheritance: { inheritsPermissions: false }
        });
      }
    } else {
      // Create mode - start fresh
      setFormData({
        name: '',
        code: '',
        description: '',
        moduleCode: selectedModule,
        type: 'custom',
        status: 'draft',
        permissions: {},
        inheritance: { inheritsPermissions: false }
      });
    }
  };

  const generateRoleCode = (name: string): string => {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30);
  };

  const getResourceIcon = (resourceKey: string): React.ComponentType<any> => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      users: Users,
      companies: Database,
      documents: FileText,
      reports: FileText,
      settings: Settings,
      inventory: Warehouse,
      orders: ShoppingCart,
      invoices: Calculator,
      employees: UserCheck
    };
    return iconMap[resourceKey] || Shield;
  };

  const getActionIcon = (actionCode: string): React.ComponentType<any> => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      create: Zap,
      read: Eye,
      update: Settings,
      delete: X,
      export: Copy,
      import: Copy
    };
    return iconMap[actionCode] || Shield;
  };

  const handleInputChange = (field: keyof RoleFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);

    // Auto-generate code from name
    if (field === 'name' && typeof value === 'string') {
      setFormData(prev => ({
        ...prev,
        code: generateRoleCode(value)
      }));
    }

    // Clear validation errors for this field
    setValidationErrors(prev => prev.filter(error => error.field !== field));
  };

  const handlePermissionToggle = (permissionId: string, granted: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permissionId]: granted
      }
    }));
    setIsDirty(true);

    // Handle parent-child relationships
    if (permissionId.includes('.')) {
      // This is an action permission
      const [resourceKey] = permissionId.split('.');
      updateResourcePermission(resourceKey);
    } else {
      // This is a resource permission - toggle all children
      const resource = permissionTree.find(node => node.id === permissionId);
      if (resource && resource.children) {
        const childUpdates: Record<string, boolean> = {};
        resource.children.forEach(child => {
          childUpdates[child.id] = granted;
        });
        
        setFormData(prev => ({
          ...prev,
          permissions: {
            ...prev.permissions,
            ...childUpdates
          }
        }));
      }
    }
  };

  const updateResourcePermission = (resourceKey: string) => {
    // Check if any actions are granted for this resource
    const resource = permissionTree.find(node => node.id === resourceKey);
    if (resource && resource.children) {
      const hasGrantedActions = resource.children.some(child => 
        formData.permissions[child.id]
      );
      
      setFormData(prev => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [resourceKey]: hasGrantedActions
        }
      }));
    }
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const validateForm = (): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!formData.name.trim()) {
      errors.push({ field: 'name', message: 'Role name is required', type: 'error' });
    }

    if (!formData.code.trim()) {
      errors.push({ field: 'code', message: 'Role code is required', type: 'error' });
    }

    if (formData.name.length > 50) {
      errors.push({ field: 'name', message: 'Role name must be less than 50 characters', type: 'error' });
    }

    // Check for duplicate role name
    const existingRoles = rolesByModule[selectedModule] || [];
    const isDuplicate = existingRoles.some(role => 
      role.name.toLowerCase() === formData.name.toLowerCase() && 
      (mode !== 'edit' || role.id !== roleId)
    );
    
    if (isDuplicate) {
      errors.push({ field: 'name', message: 'A role with this name already exists', type: 'error' });
    }

    // Check if at least one permission is granted
    const hasPermissions = Object.values(formData.permissions).some(granted => granted);
    if (!hasPermissions) {
      errors.push({ field: 'permissions', message: 'At least one permission must be granted', type: 'warning' });
    }

    return errors;
  };

  const handleSave = async (status: 'draft' | 'active' = 'draft') => {
    const errors = validateForm();
    setValidationErrors(errors);

    const hasErrors = errors.some(error => error.type === 'error');
    if (hasErrors) {
      return;
    }

    setSaveStatus('saving');
    try {
      const roleData = {
        ...formData,
        status
      };
      
      await onSave(roleData);
      setSaveStatus('saved');
      setIsDirty(false);
      
      // Auto-close after successful save
      setTimeout(() => {
        onCancel();
      }, 1500);
    } catch (error) {
      setSaveStatus('error');
      console.error('Error saving role:', error);
    }
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'create': return 'Create New Role';
      case 'edit': return 'Edit Role';
      case 'template': return 'Customize Template';
      case 'clone': return 'Clone Role';
      default: return 'Role Builder';
    }
  };

  const getEffectivePermissionsCount = () => {
    return Object.values(formData.permissions).filter(Boolean).length;
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        color: '#6b7280'
      }}>
        <Settings size={20} style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} />
        Loading role builder...
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        padding: '20px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1f2937',
            margin: '0 0 4px 0'
          }}>
            {getModeTitle()}
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: 0
          }}>
            Module: <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>{selectedModule}</span>
            {mode === 'template' && templateId && (
              <span> • Template: {roleTemplates.find(t => t.id === templateId)?.name}</span>
            )}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Save Status Indicator */}
          {saveStatus === 'saved' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
              <CheckCircle size={16} />
              <span style={{ fontSize: '14px' }}>Saved</span>
            </div>
          )}
          
          {isDirty && (
            <span style={{ fontSize: '12px', color: '#f59e0b' }}>Unsaved changes</span>
          )}

          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              backgroundColor: showPreview ? '#3b82f6' : 'white',
              color: showPreview ? 'white' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Eye size={16} />
            {showPreview ? 'Hide Preview' : 'Preview'}
          </button>

          <button
            onClick={() => handleSave('draft')}
            disabled={saveStatus === 'saving'}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Save size={16} />
            Save Draft
          </button>

          <button
            onClick={() => handleSave('active')}
            disabled={saveStatus === 'saving' || validationErrors.some(e => e.type === 'error')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: (saveStatus === 'saving' || validationErrors.some(e => e.type === 'error')) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: (saveStatus === 'saving' || validationErrors.some(e => e.type === 'error')) ? 0.6 : 1
            }}
          >
            <CheckCircle size={16} />
            {saveStatus === 'saving' ? 'Saving...' : 'Save & Activate'}
          </button>

          <button
            onClick={onCancel}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280',
              borderRadius: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Panel Navigation */}
      <div style={{
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 24px',
        display: 'flex'
      }}>
        {[
          { key: 'basic', label: 'Basic Information', icon: FileText },
          { key: 'permissions', label: 'Permissions', icon: Shield },
          { key: 'advanced', label: 'Advanced', icon: Settings }
        ].map(panel => (
          <button
            key={panel.key}
            onClick={() => setActivePanel(panel.key as any)}
            style={{
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '500',
              backgroundColor: 'transparent',
              color: activePanel === panel.key ? '#3b82f6' : '#6b7280',
              border: 'none',
              borderBottom: `2px solid ${activePanel === panel.key ? '#3b82f6' : 'transparent'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <panel.icon size={16} />
            {panel.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: showPreview ? '2fr 1fr' : '1fr',
        minHeight: '600px'
      }}>
        {/* Form Panels */}
        <div style={{ padding: '24px' }}>
          {activePanel === 'basic' && (
            <BasicInformationPanel
              formData={formData}
              validationErrors={validationErrors}
              onInputChange={handleInputChange}
              rolesByModule={rolesByModule}
              selectedModule={selectedModule}
            />
          )}

          {activePanel === 'permissions' && (
            <PermissionsPanel
              permissionTree={permissionTree}
              expandedNodes={expandedNodes}
              onPermissionToggle={handlePermissionToggle}
              onNodeToggle={toggleNode}
              validationErrors={validationErrors}
            />
          )}

          {activePanel === 'advanced' && (
            <AdvancedPanel
              formData={formData}
              onInputChange={handleInputChange}
            />
          )}
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <PreviewPanel
            formData={formData}
            permissionTree={permissionTree}
            effectivePermissionsCount={getEffectivePermissionsCount()}
            validationErrors={validationErrors}
          />
        )}
      </div>
    </div>
  );
};

// Basic Information Panel Component
const BasicInformationPanel: React.FC<{
  formData: RoleFormData;
  validationErrors: ValidationError[];
  onInputChange: (field: keyof RoleFormData, value: any) => void;
  rolesByModule: Record<string, any[]>;
  selectedModule: string;
}> = ({ formData, validationErrors, onInputChange, rolesByModule, selectedModule }) => {
  const getFieldError = (field: string) => {
    return validationErrors.find(error => error.field === field);
  };

  const availableBaseRoles = rolesByModule[selectedModule] || [];

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '16px'
        }}>
          Role Details
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          {/* Role Name */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Role Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onInputChange('name', e.target.value)}
              placeholder="Enter role name"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: `1px solid ${getFieldError('name') ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '6px',
                outline: 'none'
              }}
            />
            {getFieldError('name') && (
              <div style={{
                fontSize: '12px',
                color: '#ef4444',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <AlertTriangle size={12} />
                {getFieldError('name')?.message}
              </div>
            )}
          </div>

          {/* Role Code */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Role Code *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => onInputChange('code', e.target.value)}
              placeholder="Auto-generated from name"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: `1px solid ${getFieldError('code') ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '6px',
                outline: 'none'
              }}
            />
            {getFieldError('code') && (
              <div style={{
                fontSize: '12px',
                color: '#ef4444',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <AlertTriangle size={12} />
                {getFieldError('code')?.message}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '6px'
          }}>
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => onInputChange('description', e.target.value)}
            placeholder="Describe this role's purpose and responsibilities"
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              outline: 'none',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          {/* Role Type */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Role Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => onInputChange('type', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                outline: 'none',
                backgroundColor: 'white'
              }}
            >
              <option value="custom">Custom</option>
              <option value="template-based">Template-based</option>
              <option value="system">System</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => onInputChange('status', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                outline: 'none',
                backgroundColor: 'white'
              }}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Module */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Module
            </label>
            <select
              value={formData.moduleCode}
              onChange={(e) => onInputChange('moduleCode', e.target.value)}
              disabled
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                outline: 'none',
                backgroundColor: '#f9fafb',
                color: '#6b7280',
                cursor: 'not-allowed'
              }}
            >
              <option value={formData.moduleCode} style={{ textTransform: 'capitalize' }}>
                {formData.moduleCode}
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Role Inheritance */}
      <div>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Layers size={18} />
          Role Inheritance
        </h3>

        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={formData.inheritance?.inheritsPermissions || false}
                onChange={(e) => onInputChange('inheritance', {
                  ...formData.inheritance,
                  inheritsPermissions: e.target.checked
                })}
                style={{ cursor: 'pointer' }}
              />
              Inherit permissions from base role
            </label>
          </div>

          {formData.inheritance?.inheritsPermissions && (
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Base Role
              </label>
              <select
                value={formData.inheritance?.baseRoleId || ''}
                onChange={(e) => onInputChange('inheritance', {
                  ...formData.inheritance,
                  baseRoleId: e.target.value
                })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  outline: 'none',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Select a base role...</option>
                {availableBaseRoles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Permissions Panel Component
const PermissionsPanel: React.FC<{
  permissionTree: PermissionNode[];
  expandedNodes: Set<string>;
  onPermissionToggle: (permissionId: string, granted: boolean) => void;
  onNodeToggle: (nodeId: string) => void;
  validationErrors: ValidationError[];
}> = ({ permissionTree, expandedNodes, onPermissionToggle, onNodeToggle, validationErrors }) => {
  const hasPermissionError = validationErrors.some(error => error.field === 'permissions');

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#1f2937',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Shield size={18} />
          Permission Configuration
        </h3>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => {
              // Expand all nodes
              const allNodeIds = new Set<string>();
              const collectIds = (nodes: PermissionNode[]) => {
                nodes.forEach(node => {
                  allNodeIds.add(node.id);
                  if (node.children) {
                    collectIds(node.children);
                  }
                });
              };
              collectIds(permissionTree);
              onNodeToggle('expand_all');
            }}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '500',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Expand All
          </button>
          <button
            onClick={() => {
              // Grant all permissions
              const allPermissions: Record<string, boolean> = {};
              const collectPermissions = (nodes: PermissionNode[]) => {
                nodes.forEach(node => {
                  allPermissions[node.id] = true;
                  if (node.children) {
                    collectPermissions(node.children);
                  }
                });
              };
              collectPermissions(permissionTree);
              
              // Apply all permissions
              Object.entries(allPermissions).forEach(([permissionId, granted]) => {
                onPermissionToggle(permissionId, granted);
              });
            }}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '500',
              backgroundColor: '#dbeafe',
              color: '#1d4ed8',
              border: '1px solid #93c5fd',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Grant All
          </button>
          <button
            onClick={() => {
              // Clear all permissions
              const allPermissions: Record<string, boolean> = {};
              const collectPermissions = (nodes: PermissionNode[]) => {
                nodes.forEach(node => {
                  allPermissions[node.id] = false;
                  if (node.children) {
                    collectPermissions(node.children);
                  }
                });
              };
              collectPermissions(permissionTree);
              
              // Clear all permissions
              Object.entries(allPermissions).forEach(([permissionId]) => {
                onPermissionToggle(permissionId, false);
              });
            }}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '500',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear All
          </button>
        </div>
      </div>

      {hasPermissionError && (
        <div style={{
          backgroundColor: '#fef3cd',
          border: '1px solid #fbbf24',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          color: '#92400e'
        }}>
          <AlertTriangle size={16} />
          {validationErrors.find(error => error.field === 'permissions')?.message}
        </div>
      )}

      {/* Permission Tree */}
      <div style={{
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        backgroundColor: 'white',
        maxHeight: '500px',
        overflowY: 'auto'
      }}>
        {permissionTree.map(resourceNode => (
          <div key={resourceNode.id}>
            {/* Resource Header */}
            <div
              onClick={() => onNodeToggle(resourceNode.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              {expandedNodes.has(resourceNode.id) ? (
                <ChevronDown size={16} color="#6b7280" />
              ) : (
                <ChevronRight size={16} color="#6b7280" />
              )}
              
              <resourceNode.icon size={16} color="#3b82f6" />
              
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flex: 1,
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={resourceNode.granted}
                  onChange={(e) => onPermissionToggle(resourceNode.id, e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span>{resourceNode.name}</span>
              </label>
            </div>

            {/* Action Items */}
            {expandedNodes.has(resourceNode.id) && resourceNode.children && (
              <div style={{ backgroundColor: 'white' }}>
                {resourceNode.children.map(actionNode => (
                  <div
                    key={actionNode.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px 10px 48px',
                      borderBottom: '1px solid #f1f5f9'
                    }}
                  >
                    <actionNode.icon size={14} color="#6b7280" />
                    
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flex: 1,
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}>
                      <input
                        type="checkbox"
                        checked={actionNode.granted}
                        onChange={(e) => onPermissionToggle(actionNode.id, e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>{actionNode.name}</span>
                    </label>

                    {actionNode.description && (
                      <span style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontStyle: 'italic'
                      }}>
                        {actionNode.description}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Advanced Panel Component
const AdvancedPanel: React.FC<{
  formData: RoleFormData;
  onInputChange: (field: keyof RoleFormData, value: any) => void;
}> = ({ formData, onInputChange }) => {
  return (
    <div style={{ maxWidth: '600px' }}>
      <h3 style={{
        fontSize: '16px',
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Settings size={18} />
        Advanced Configuration
      </h3>

      {/* Session Limits */}
      <div style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <Monitor size={16} color="#3b82f6" />
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#1f2937',
            margin: 0
          }}>
            Session Management
          </h4>
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '6px'
          }}>
            Maximum Concurrent Sessions
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={formData.advancedConfig?.sessionLimits || 1}
            onChange={(e) => onInputChange('advancedConfig', {
              ...formData.advancedConfig,
              sessionLimits: parseInt(e.target.value)
            })}
            style={{
              width: '120px',
              padding: '8px 12px',
              fontSize: '14px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              outline: 'none'
            }}
          />
          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            marginTop: '4px'
          }}>
            Number of simultaneous login sessions allowed
          </div>
        </div>
      </div>

      {/* Time-based Access */}
      <div style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <Clock size={16} color="#10b981" />
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#1f2937',
            margin: 0
          }}>
            Time-based Access Control
          </h4>
        </div>

        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          Configure specific hours when this role can access the system. Leave empty for 24/7 access.
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginTop: '12px'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '4px'
            }}>
              Start Time
            </label>
            <input
              type="time"
              value={formData.advancedConfig?.timeBasedAccess?.allowedHours?.[0]?.start || ''}
              onChange={(e) => onInputChange('advancedConfig', {
                ...formData.advancedConfig,
                timeBasedAccess: {
                  allowedHours: [{
                    start: e.target.value,
                    end: formData.advancedConfig?.timeBasedAccess?.allowedHours?.[0]?.end || '23:59'
                  }],
                  timezone: 'UTC'
                }
              })}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                outline: 'none'
              }}
            />
          </div>
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '4px'
            }}>
              End Time
            </label>
            <input
              type="time"
              value={formData.advancedConfig?.timeBasedAccess?.allowedHours?.[0]?.end || ''}
              onChange={(e) => onInputChange('advancedConfig', {
                ...formData.advancedConfig,
                timeBasedAccess: {
                  allowedHours: [{
                    start: formData.advancedConfig?.timeBasedAccess?.allowedHours?.[0]?.start || '00:00',
                    end: e.target.value
                  }],
                  timezone: 'UTC'
                }
              })}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                outline: 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* IP Restrictions */}
      <div style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <MapPin size={16} color="#f59e0b" />
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#1f2937',
            margin: 0
          }}>
            IP Access Restrictions
          </h4>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '6px'
          }}>
            Allowed IP Addresses
          </label>
          <textarea
            placeholder="Enter IP addresses or ranges (one per line)&#10;Example:&#10;192.168.1.100&#10;10.0.0.0/24"
            value={(formData.advancedConfig?.ipRestrictions || []).join('\n')}
            onChange={(e) => onInputChange('advancedConfig', {
              ...formData.advancedConfig,
              ipRestrictions: e.target.value.split('\n').filter(ip => ip.trim())
            })}
            rows={3}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '14px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              outline: 'none',
              fontFamily: 'monospace',
              resize: 'vertical'
            }}
          />
          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            marginTop: '4px'
          }}>
            Leave empty to allow access from any IP address. Supports individual IPs and CIDR notation.
          </div>
        </div>
      </div>
    </div>
  );
};

// Preview Panel Component
const PreviewPanel: React.FC<{
  formData: RoleFormData;
  permissionTree: PermissionNode[];
  effectivePermissionsCount: number;
  validationErrors: ValidationError[];
}> = ({ formData, permissionTree, effectivePermissionsCount, validationErrors }) => {
  const hasErrors = validationErrors.filter(error => error.type === 'error').length > 0;
  const hasWarnings = validationErrors.filter(error => error.type === 'warning').length > 0;

  return (
    <div style={{
      backgroundColor: '#f8fafc',
      borderLeft: '1px solid #e2e8f0',
      padding: '24px',
      overflowY: 'auto'
    }}>
      <h3 style={{
        fontSize: '16px',
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Eye size={18} />
        Role Preview
      </h3>

      {/* Validation Status */}
      <div style={{ marginBottom: '20px' }}>
        {hasErrors && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '12px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#dc2626',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px'
            }}>
              <AlertTriangle size={16} />
              Validation Errors ({validationErrors.filter(e => e.type === 'error').length})
            </div>
            {validationErrors.filter(e => e.type === 'error').map((error, index) => (
              <div key={index} style={{
                fontSize: '13px',
                color: '#b91c1c',
                marginLeft: '24px'
              }}>
                • {error.message}
              </div>
            ))}
          </div>
        )}

        {hasWarnings && (
          <div style={{
            backgroundColor: '#fefbf0',
            border: '1px solid #fbbf24',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '12px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#d97706',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px'
            }}>
              <AlertTriangle size={16} />
              Warnings ({validationErrors.filter(e => e.type === 'warning').length})
            </div>
            {validationErrors.filter(e => e.type === 'warning').map((error, index) => (
              <div key={index} style={{
                fontSize: '13px',
                color: '#92400e',
                marginLeft: '24px'
              }}>
                • {error.message}
              </div>
            ))}
          </div>
        )}

        {!hasErrors && !hasWarnings && (
          <div style={{
            backgroundColor: '#dcfce7',
            border: '1px solid #bbf7d0',
            borderRadius: '6px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#16a34a',
            fontSize: '14px'
          }}>
            <CheckCircle size={16} />
            Role configuration is valid
          </div>
        )}
      </div>

      {/* Role Summary */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        <h4 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '12px'
        }}>
          Role Summary
        </h4>
        
        <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: '#6b7280' }}>Name:</span>
            <span style={{ fontWeight: '500' }}>{formData.name || 'Untitled Role'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: '#6b7280' }}>Code:</span>
            <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{formData.code || 'auto-generated'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: '#6b7280' }}>Module:</span>
            <span style={{ textTransform: 'capitalize' }}>{formData.moduleCode}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: '#6b7280' }}>Type:</span>
            <span style={{ textTransform: 'capitalize' }}>{formData.type.replace('-', ' ')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: '#6b7280' }}>Status:</span>
            <span style={{
              textTransform: 'capitalize',
              color: formData.status === 'active' ? '#16a34a' : formData.status === 'draft' ? '#f59e0b' : '#6b7280'
            }}>
              {formData.status}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6b7280' }}>Permissions:</span>
            <span style={{ fontWeight: '500' }}>{effectivePermissionsCount}</span>
          </div>
        </div>
      </div>

      {/* Permission Summary */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        <h4 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '12px'
        }}>
          Effective Permissions
        </h4>

        {effectivePermissionsCount === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '13px',
            fontStyle: 'italic',
            padding: '20px'
          }}>
            No permissions granted
          </div>
        ) : (
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {permissionTree.map(resource => {
              const grantedActions = resource.children?.filter(action => 
                formData.permissions[action.id]
              ) || [];
              
              if (grantedActions.length === 0) return null;

              return (
                <div key={resource.id} style={{ marginBottom: '12px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    <resource.icon size={14} />
                    {resource.name}
                  </div>
                  <div style={{ marginLeft: '20px' }}>
                    {grantedActions.map(action => (
                      <div key={action.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: '#6b7280',
                        marginBottom: '2px'
                      }}>
                        <action.icon size={12} />
                        {action.name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Advanced Configuration Summary */}
      {(formData.advancedConfig?.sessionLimits || 
        formData.advancedConfig?.timeBasedAccess?.allowedHours?.length || 
        formData.advancedConfig?.ipRestrictions?.length) && (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '12px'
          }}>
            Security Restrictions
          </h4>

          <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
            {formData.advancedConfig?.sessionLimits && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Monitor size={12} color="#3b82f6" />
                <span>Max {formData.advancedConfig.sessionLimits} concurrent sessions</span>
              </div>
            )}

            {formData.advancedConfig?.timeBasedAccess?.allowedHours?.length && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Clock size={12} color="#10b981" />
                <span>
                  Time restricted: {formData.advancedConfig.timeBasedAccess.allowedHours[0].start} - {formData.advancedConfig.timeBasedAccess.allowedHours[0].end}
                </span>
              </div>
            )}

            {formData.advancedConfig?.ipRestrictions?.length && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={12} color="#f59e0b" />
                <span>IP restricted ({formData.advancedConfig.ipRestrictions.length} rules)</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleBuilder;