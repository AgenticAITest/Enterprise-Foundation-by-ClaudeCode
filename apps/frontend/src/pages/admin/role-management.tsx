import React, { useState, useEffect } from 'react';
import { useTenantAdmin } from '@/providers/tenant-admin-provider';
import RoleListView from '@/components/admin/RoleListView';
import RolePermissionMatrix from '@/components/admin/RolePermissionMatrix';
import RoleTemplatesBrowser from '@/components/admin/RoleTemplatesBrowser';
import TemplatePreviewModal from '@/components/admin/TemplatePreviewModal';
import RoleBuilderModal from '@/components/admin/RoleBuilderModal';
import BulkAssignmentModal from '@/components/admin/BulkAssignmentModal';
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
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Plus,
  Eye,
  Grid3X3,
  BookOpen
} from 'lucide-react';

/**
 * Role Management Page - Step 2A: RoleListView Component Integration
 * Professional role management interface with comprehensive list view
 */
const RoleManagement: React.FC = () => {
  const {
    rolesByModule,
    permissionResources,
    roleTemplates,
    selectedModule,
    isLoading,
    error,
    refreshRoleData,
    getRolesForModule,
    createRole,
    updateRole,
    deleteRole,
    cloneRole,
    createRoleFromTemplate,
    bulkAssignRoles
  } = useTenantAdmin();

  const [selectedRoleModule, setSelectedRoleModule] = useState('core');
  const [viewMode, setViewMode] = useState<'list' | 'matrix' | 'templates' | 'test'>('list');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  
  // Role Builder state
  const [showRoleBuilder, setShowRoleBuilder] = useState(false);
  const [roleBuilderMode, setRoleBuilderMode] = useState<'create' | 'edit' | 'template' | 'clone'>('create');
  const [roleBuilderProps, setRoleBuilderProps] = useState<{
    roleId?: string;
    templateId?: string;
    sourceRoleId?: string;
  }>({});
  
  // Bulk Assignment state
  const [showBulkAssignment, setShowBulkAssignment] = useState(false);
  const [bulkAssignmentProps, setBulkAssignmentProps] = useState<{
    preselectedUsers?: string[];
    preselectedRoles?: string[];
  }>({});
  
  // Global loading and error states
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    refreshRoleData();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + N: Create new role
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        if (!showRoleBuilder && !showBulkAssignment) {
          handleCreateRole();
        }
      }
      
      // Ctrl/Cmd + B: Open bulk assignment
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        if (!showRoleBuilder && !showBulkAssignment) {
          handleBulkAssignment();
        }
      }
      
      // F1: Show help
      if (event.key === 'F1') {
        event.preventDefault();
        setShowHelp(true);
      }
      
      // Escape: Close modals
      if (event.key === 'Escape') {
        if (showHelp) {
          setShowHelp(false);
        } else if (showRoleBuilder) {
          handleRoleBuilderClose();
        } else if (showBulkAssignment) {
          handleBulkAssignmentClose();
        } else if (showTemplatePreview) {
          setShowTemplatePreview(false);
          setSelectedTemplate(null);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showRoleBuilder, showBulkAssignment, showTemplatePreview, showHelp]);

  // Role action handlers
  const handleCreateRole = () => {
    console.log('Create new role for module:', selectedRoleModule);
    setRoleBuilderMode('create');
    setRoleBuilderProps({});
    setShowRoleBuilder(true);
  };

  const handleEditRole = (role: any) => {
    console.log('Edit role:', role.name);
    setRoleBuilderMode('edit');
    setRoleBuilderProps({ roleId: role.id });
    setShowRoleBuilder(true);
  };

  const handleCloneRole = (role: any) => {
    console.log('Clone role:', role.name);
    setRoleBuilderMode('clone');
    setRoleBuilderProps({ sourceRoleId: role.id });
    setShowRoleBuilder(true);
  };

  const handleDeleteRole = (role: any) => {
    console.log('Delete role:', role.name);
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete the role "${role.name}"?\n\n` +
      `This will affect ${role.userCount || 0} users and cannot be undone.`
    );
    
    if (confirmed) {
      deleteRole(role.id).catch(error => {
        console.error('Failed to delete role:', error);
        alert('Failed to delete role. Please try again.');
      });
    }
  };

  const handleViewPermissions = (role: any) => {
    console.log('View permissions for role:', role.name);
    // Switch to matrix view and highlight this role
    setViewMode('matrix');
    // Optional: Add role highlighting logic here
  };

  const handleModuleChange = (moduleCode: string) => {
    setSelectedRoleModule(moduleCode);
  };

  // Matrix action handlers
  const handlePermissionToggle = (roleId: string, permissionId: string, granted: boolean) => {
    console.log('Toggle permission:', { roleId, permissionId, granted });
    // TODO: Call API to update role permission
  };

  const handleBulkToggle = (type: 'role' | 'permission', id: string, granted: boolean) => {
    console.log('Bulk toggle:', { type, id, granted });
    // TODO: Call API to bulk update permissions
  };

  // Template action handlers
  const handleTemplateSelect = (templateId: string) => {
    console.log('Template selected:', templateId);
  };

  const handleTemplatePreview = (template: any) => {
    setSelectedTemplate(template);
    setShowTemplatePreview(true);
  };

  const handleTemplateApply = (templateId: string, customizations?: any) => {
    console.log('Apply template:', templateId, customizations);
    setRoleBuilderMode('template');
    setRoleBuilderProps({ templateId });
    setShowTemplatePreview(false);
    setShowRoleBuilder(true);
  };

  const handleTemplateCustomize = (templateId: string) => {
    console.log('Customize template:', templateId);
    setRoleBuilderMode('template');
    setRoleBuilderProps({ templateId });
    setShowTemplatePreview(false);
    setShowRoleBuilder(true);
  };

  const handleCompareTemplates = (templateIds: string[]) => {
    console.log('Compare templates:', templateIds);
    // TODO: Open template comparison modal
  };

  // Role Builder handlers
  const handleRoleSave = async (roleData: any) => {
    try {
      setGlobalLoading(true);
      setGlobalError(null);
      
      if (roleBuilderMode === 'create') {
        await createRole(roleData);
        setSuccessMessage(`Role "${roleData.name}" created successfully!`);
      } else if (roleBuilderMode === 'edit' && roleBuilderProps.roleId) {
        await updateRole(roleBuilderProps.roleId, roleData);
        setSuccessMessage(`Role "${roleData.name}" updated successfully!`);
      } else if (roleBuilderMode === 'template' && roleBuilderProps.templateId) {
        await createRoleFromTemplate(roleBuilderProps.templateId, roleData);
        setSuccessMessage(`Role created from template successfully!`);
      } else if (roleBuilderMode === 'clone' && roleBuilderProps.sourceRoleId) {
        await cloneRole(roleBuilderProps.sourceRoleId, roleData.name);
        setSuccessMessage(`Role "${roleData.name}" cloned successfully!`);
      }
      
      setShowRoleBuilder(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error saving role:', error);
      setGlobalError(`Failed to save role: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error; // Re-throw to let RoleBuilder handle the error state
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleRoleBuilderClose = () => {
    setShowRoleBuilder(false);
    setRoleBuilderProps({});
  };

  // Bulk Assignment handlers
  const handleBulkAssignment = (preselectedUsers?: string[], preselectedRoles?: string[]) => {
    setBulkAssignmentProps({ preselectedUsers, preselectedRoles });
    setShowBulkAssignment(true);
  };

  const handleBulkAssignmentSave = async (assignments: any[]) => {
    try {
      setGlobalLoading(true);
      setGlobalError(null);
      
      await bulkAssignRoles(assignments);
      
      const userCount = new Set(assignments.map(a => a.userId)).size;
      const roleCount = new Set(assignments.map(a => a.roleId)).size;
      
      setSuccessMessage(
        `Bulk assignment completed! ${assignments.length} assignments across ${userCount} users and ${roleCount} roles.`
      );
      
      setShowBulkAssignment(false);
      
      // Clear success message after 4 seconds (longer for bulk operations)
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (error) {
      console.error('Error executing bulk assignment:', error);
      setGlobalError(`Bulk assignment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleBulkAssignmentClose = () => {
    setShowBulkAssignment(false);
    setBulkAssignmentProps({});
  };

  if (isLoading) {
    return (
      <div>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            Role Management
          </h1>
          <p style={{ color: '#6b7280' }}>
            Create, edit, and configure user roles and permissions.
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          color: '#6b7280'
        }}>
          <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} />
          Loading role data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            Role Management
          </h1>
          <p style={{ color: '#6b7280' }}>
            Create, edit, and configure user roles and permissions.
          </p>
        </div>
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#dc2626'
        }}>
          <AlertCircle size={20} />
          Error loading role data: {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Global Loading Overlay */}
      {globalLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
            <span style={{ color: '#1f2937', fontWeight: '500' }}>Processing...</span>
          </div>
        </div>
      )}

      {/* Global Notifications */}
      {successMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#10b981',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1500,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          maxWidth: '400px'
        }}>
          <CheckCircle size={16} />
          <span style={{ fontSize: '14px' }}>{successMessage}</span>
        </div>
      )}

      {globalError && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#dc2626',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1500,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          maxWidth: '400px'
        }}>
          <AlertCircle size={16} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>Error</div>
            <div style={{ fontSize: '12px', marginTop: '2px' }}>{globalError}</div>
          </div>
          <button
            onClick={() => setGlobalError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0',
              marginLeft: '8px'
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            Role Management
          </h1>
          <p style={{ color: '#6b7280' }}>
            Manage user roles and permissions across all modules.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Bulk Assignment Button */}
          <button
            onClick={() => handleBulkAssignment()}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Bulk Assignment (Ctrl+B)"
          >
            <Users size={16} />
            Bulk Assignment
          </button>
          
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', backgroundColor: '#f3f4f6', borderRadius: '6px', padding: '2px' }}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '8px 12px',
                fontSize: '14px',
                fontWeight: '500',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: viewMode === 'list' ? 'white' : 'transparent',
                color: viewMode === 'list' ? '#1f2937' : '#6b7280',
                boxShadow: viewMode === 'list' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none'
              }}
              title="List View - Browse and manage roles in a table format"
            >
              <Users size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              List View
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              style={{
                padding: '8px 12px',
                fontSize: '14px',
                fontWeight: '500',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: viewMode === 'matrix' ? 'white' : 'transparent',
                color: viewMode === 'matrix' ? '#1f2937' : '#6b7280',
                boxShadow: viewMode === 'matrix' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none'
              }}
              title="Matrix View - Visual permissions grid for roles and resources"
            >
              <Grid3X3 size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Matrix View
            </button>
            <button
              onClick={() => setViewMode('templates')}
              style={{
                padding: '8px 12px',
                fontSize: '14px',
                fontWeight: '500',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: viewMode === 'templates' ? 'white' : 'transparent',
                color: viewMode === 'templates' ? '#1f2937' : '#6b7280',
                boxShadow: viewMode === 'templates' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none'
              }}
              title="Templates - Browse and apply pre-configured role templates"
            >
              <BookOpen size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Templates
            </button>
            <button
              onClick={() => setViewMode('test')}
              style={{
                padding: '8px 12px',
                fontSize: '14px',
                fontWeight: '500',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: viewMode === 'test' ? 'white' : 'transparent',
                color: viewMode === 'test' ? '#1f2937' : '#6b7280',
                boxShadow: viewMode === 'test' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none'
              }}
              title="Test View - Debug and integration status information"
            >
              <Eye size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Test View
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        // Professional Role List View
        <RoleListView
          rolesByModule={rolesByModule}
          selectedModule={selectedRoleModule}
          onModuleChange={handleModuleChange}
          onCreateRole={handleCreateRole}
          onEditRole={handleEditRole}
          onCloneRole={handleCloneRole}
          onDeleteRole={handleDeleteRole}
          onViewPermissions={handleViewPermissions}
        />
      ) : viewMode === 'matrix' ? (
        // Permission Matrix View
        <RolePermissionMatrix
          selectedModule={selectedRoleModule}
          roles={getRolesForModule(selectedRoleModule) || []}
          permissionResources={permissionResources[selectedRoleModule] || {}}
          onPermissionToggle={handlePermissionToggle}
          onBulkToggle={handleBulkToggle}
          readOnly={false}
        />
      ) : viewMode === 'templates' ? (
        // Role Templates Browser
        <RoleTemplatesBrowser
          selectedModule={selectedRoleModule}
          roleTemplates={roleTemplates}
          onTemplateSelect={handleTemplateSelect}
          onTemplatePreview={handleTemplatePreview}
          onTemplateApply={handleTemplateApply}
          onCreateCustomRole={handleCreateRole}
          onCompareTemplates={handleCompareTemplates}
        />
      ) : (
        // Test/Debug View (Previous Step 1 Content)
        <div>
          {/* Data Integration Status */}
          <div style={{
            backgroundColor: '#dcfce7',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle size={20} color="#16a34a" />
            <div>
              <div style={{ fontWeight: '600', color: '#16a34a' }}>
                Role Management Data Integration Complete - Step 1 ✅
              </div>
              <div style={{ fontSize: '14px', color: '#15803d' }}>
                {Object.keys(rolesByModule).length} modules • {roleTemplates.length} role templates • {Object.keys(permissionResources).reduce((total, module) => total + Object.keys(permissionResources[module]).length, 0)} permission resources
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Left Column: Roles by Module Summary */}
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Users size={20} color="#3b82f6" />
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                  Roles Summary
                </h2>
              </div>

              {Object.entries(rolesByModule).map(([moduleCode, roles]) => (
                <div key={moduleCode} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {moduleCode === 'core' && <Database size={16} color="#3b82f6" />}
                    {moduleCode === 'wms' && <Warehouse size={16} color="#10b981" />}
                    {moduleCode === 'accounting' && <Calculator size={16} color="#f59e0b" />}
                    {moduleCode === 'pos' && <ShoppingCart size={16} color="#8b5cf6" />}
                    {moduleCode === 'hr' && <UserCheck size={16} color="#ef4444" />}
                    <span style={{ fontSize: '14px', fontWeight: '500', textTransform: 'capitalize' }}>
                      {moduleCode}
                    </span>
                  </div>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>
                    {roles.length} roles
                  </span>
                </div>
              ))}
            </div>

            {/* Right Column: Templates & Resources Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Shield size={20} color="#10b981" />
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                    Permission Resources
                  </h3>
                </div>
                {Object.entries(permissionResources).map(([moduleCode, resources]) => (
                  <div key={moduleCode} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '14px',
                    marginBottom: '4px'
                  }}>
                    <span style={{ textTransform: 'capitalize' }}>{moduleCode}:</span>
                    <span style={{ color: '#6b7280' }}>{Object.keys(resources).length} resources</span>
                  </div>
                ))}
              </div>

              <div style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Settings size={20} color="#f59e0b" />
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                    Role Templates ({roleTemplates.length})
                  </h3>
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  Pre-configured role templates ready for deployment across all modules. 
                  Switch to List View to see the full professional interface.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Preview Modal */}
      {showTemplatePreview && selectedTemplate && (
        <TemplatePreviewModal
          template={selectedTemplate}
          onClose={() => {
            setShowTemplatePreview(false);
            setSelectedTemplate(null);
          }}
          onApply={handleTemplateApply}
          onCustomize={handleTemplateCustomize}
        />
      )}

      {/* Role Builder Modal */}
      <RoleBuilderModal
        mode={roleBuilderMode}
        roleId={roleBuilderProps.roleId}
        templateId={roleBuilderProps.templateId}
        sourceRoleId={roleBuilderProps.sourceRoleId}
        selectedModule={selectedRoleModule}
        isOpen={showRoleBuilder}
        onClose={handleRoleBuilderClose}
        onSave={handleRoleSave}
      />

      {/* Bulk Assignment Modal */}
      <BulkAssignmentModal
        isOpen={showBulkAssignment}
        selectedModule={selectedRoleModule}
        preselectedUsers={bulkAssignmentProps.preselectedUsers}
        preselectedRoles={bulkAssignmentProps.preselectedRoles}
        onClose={handleBulkAssignmentClose}
        onAssign={handleBulkAssignmentSave}
      />

      {/* Help Modal */}
      {showHelp && (
        <div
          onClick={(e) => e.target === e.currentTarget && setShowHelp(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
              }}>
                Role Management Help
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ color: '#374151', lineHeight: '1.6' }}>
              <section style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>
                  Keyboard Shortcuts
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Create new role</span>
                    <kbd style={{
                      backgroundColor: '#f3f4f6',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      border: '1px solid #d1d5db'
                    }}>Ctrl+N</kbd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Open bulk assignment</span>
                    <kbd style={{
                      backgroundColor: '#f3f4f6',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      border: '1px solid #d1d5db'
                    }}>Ctrl+B</kbd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Show this help</span>
                    <kbd style={{
                      backgroundColor: '#f3f4f6',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      border: '1px solid #d1d5db'
                    }}>F1</kbd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Close modals</span>
                    <kbd style={{
                      backgroundColor: '#f3f4f6',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      border: '1px solid #d1d5db'
                    }}>Escape</kbd>
                  </div>
                </div>
              </section>

              <section style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>
                  View Modes
                </h3>
                <div style={{ fontSize: '14px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>List View:</strong> Browse and manage roles in a table format with filtering and sorting.
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Matrix View:</strong> Visual permissions grid showing roles and their resource permissions.
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Templates:</strong> Browse and apply pre-configured role templates for common use cases.
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Test View:</strong> Debug information and integration status for development.
                  </div>
                </div>
              </section>

              <section>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>
                  Quick Actions
                </h3>
                <div style={{ fontSize: '14px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    • Click <strong>Create Role</strong> from any role list to start building a new role
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    • Use <strong>Bulk Assignment</strong> to assign roles to multiple users efficiently
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    • Apply <strong>Templates</strong> to quickly create roles with pre-defined permissions
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    • Use <strong>View Permissions</strong> to quickly switch to matrix view for a specific role
                  </div>
                </div>
              </section>
            </div>

            <div style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowHelp(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;