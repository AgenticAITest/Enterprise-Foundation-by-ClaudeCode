import React from 'react';
import RoleBuilder from './RoleBuilder';
import { X } from 'lucide-react';

interface RoleBuilderModalProps {
  mode: 'create' | 'edit' | 'template' | 'clone';
  roleId?: string;
  templateId?: string;
  sourceRoleId?: string;
  selectedModule: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (roleData: any) => Promise<void>;
}

const RoleBuilderModal: React.FC<RoleBuilderModalProps> = ({
  mode,
  roleId,
  templateId,
  sourceRoleId,
  selectedModule,
  isOpen,
  onClose,
  onSave
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
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
      <div
        style={{
          width: '95vw',
          maxWidth: '1400px',
          maxHeight: '90vh',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f8fafc'
        }}>
          <div>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              margin: 0
            }}>
              {mode === 'create' ? 'Create New Role' :
               mode === 'edit' ? 'Edit Role' :
               mode === 'template' ? 'Customize Role Template' :
               'Clone Role'}
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: '4px 0 0 0'
            }}>
              Configure role permissions and settings for the {selectedModule} module
            </p>
          </div>
          
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{
          flex: 1,
          overflow: 'hidden'
        }}>
          <RoleBuilder
            mode={mode}
            roleId={roleId}
            templateId={templateId}
            sourceRoleId={sourceRoleId}
            selectedModule={selectedModule}
            onSave={onSave}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
};

export default RoleBuilderModal;