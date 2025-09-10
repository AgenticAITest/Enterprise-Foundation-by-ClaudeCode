import React, { useState, useEffect } from 'react';
import { useTenantAdmin } from '@/providers/tenant-admin-provider';
import {
  Building2, Users, MapPin, Plus, Edit, Trash2, ChevronDown, ChevronRight,
  Save, X, Upload, Download, Search, Filter, Move, Copy, Settings
} from 'lucide-react';

interface OrgUnit {
  id: string;
  name: string;
  type: 'company' | 'department' | 'team' | 'location';
  parentId?: string;
  description?: string;
  managerUserId?: string;
  userIds: string[];
  metadata?: {
    costCenter?: string;
    location?: string;
    email?: string;
    phone?: string;
  };
  isActive: boolean;
  createdAt: string;
}

interface OrganizationalUnitsEditorProps {
  onUnitsChange?: (units: OrgUnit[]) => void;
}

const OrganizationalUnitsEditor: React.FC<OrganizationalUnitsEditorProps> = ({
  onUnitsChange
}) => {
  const { tenantUsers, isLoading } = useTenantAdmin();
  
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set(['root']));
  const [selectedUnit, setSelectedUnit] = useState<OrgUnit | null>(null);
  const [editingUnit, setEditingUnit] = useState<OrgUnit | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addUnitParent, setAddUnitParent] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [draggedUnit, setDraggedUnit] = useState<OrgUnit | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mock organizational units data
  const mockOrgUnits: OrgUnit[] = [
    {
      id: 'company',
      name: 'Acme Corporation',
      type: 'company',
      description: 'Main company entity',
      userIds: [],
      metadata: {
        email: 'info@acmecorp.com',
        phone: '+1-555-0100'
      },
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'dept-sales',
      name: 'Sales Department',
      type: 'department',
      parentId: 'company',
      description: 'Revenue generation and customer acquisition',
      managerUserId: 'user-1',
      userIds: ['user-1', 'user-2', 'user-3'],
      metadata: {
        costCenter: 'CC-001',
        location: 'Building A, Floor 2'
      },
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'dept-marketing',
      name: 'Marketing Department', 
      type: 'department',
      parentId: 'company',
      description: 'Brand management and demand generation',
      managerUserId: 'user-4',
      userIds: ['user-4', 'user-5'],
      metadata: {
        costCenter: 'CC-002',
        location: 'Building A, Floor 3'
      },
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'team-inside-sales',
      name: 'Inside Sales Team',
      type: 'team',
      parentId: 'dept-sales',
      description: 'Inbound sales and lead qualification',
      managerUserId: 'user-2',
      userIds: ['user-2', 'user-6', 'user-7'],
      metadata: {
        costCenter: 'CC-001-A'
      },
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'team-field-sales',
      name: 'Field Sales Team',
      type: 'team',
      parentId: 'dept-sales',
      description: 'Outside sales and enterprise accounts',
      managerUserId: 'user-3',
      userIds: ['user-3', 'user-8'],
      metadata: {
        costCenter: 'CC-001-B'
      },
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'loc-hq',
      name: 'Headquarters',
      type: 'location',
      parentId: 'company',
      description: 'Main office location',
      userIds: ['user-1', 'user-2', 'user-4', 'user-5'],
      metadata: {
        location: '123 Business Ave, City, State 12345',
        phone: '+1-555-0100'
      },
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z'
    }
  ];

  // Initialize with mock data
  useEffect(() => {
    setOrgUnits(mockOrgUnits);
  }, []);

  // Notify parent of changes
  useEffect(() => {
    if (onUnitsChange) {
      onUnitsChange(orgUnits);
    }
  }, [orgUnits, onUnitsChange]);

  // Build hierarchy tree
  const buildTree = (units: OrgUnit[], parentId?: string): OrgUnit[] => {
    return units
      .filter(unit => unit.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(unit => ({
        ...unit,
        children: buildTree(units, unit.id)
      })) as any[];
  };

  const filteredUnits = orgUnits.filter(unit => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!unit.name.toLowerCase().includes(searchLower) &&
          !unit.description?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    
    if (filterType !== 'all' && unit.type !== filterType) {
      return false;
    }
    
    return true;
  });

  const tree = buildTree(filteredUnits);

  const toggleExpansion = (unitId: string) => {
    const newExpanded = new Set(expandedUnits);
    if (newExpanded.has(unitId)) {
      newExpanded.delete(unitId);
    } else {
      newExpanded.add(unitId);
    }
    setExpandedUnits(newExpanded);
  };

  const handleAddUnit = (parentId?: string) => {
    setAddUnitParent(parentId || null);
    setEditingUnit({
      id: '',
      name: '',
      type: 'department',
      parentId: parentId,
      description: '',
      userIds: [],
      isActive: true,
      createdAt: new Date().toISOString()
    });
    setShowAddModal(true);
  };

  const handleEditUnit = (unit: OrgUnit) => {
    setEditingUnit({ ...unit });
    setShowAddModal(true);
  };

  const handleSaveUnit = () => {
    if (!editingUnit || !editingUnit.name.trim()) {
      setError('Unit name is required');
      return;
    }

    try {
      if (editingUnit.id) {
        // Edit existing
        setOrgUnits(units => 
          units.map(u => u.id === editingUnit.id ? editingUnit : u)
        );
      } else {
        // Add new
        const newUnit: OrgUnit = {
          ...editingUnit,
          id: `unit-${Date.now()}`,
          createdAt: new Date().toISOString()
        };
        setOrgUnits(units => [...units, newUnit]);
      }
      
      setShowAddModal(false);
      setEditingUnit(null);
      setError(null);
    } catch (err) {
      setError('Failed to save organizational unit');
    }
  };

  const handleDeleteUnit = (unitId: string) => {
    // Check if unit has children
    const hasChildren = orgUnits.some(u => u.parentId === unitId);
    if (hasChildren) {
      setError('Cannot delete unit that has child units. Please remove or reassign children first.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this organizational unit?')) {
      setOrgUnits(units => units.filter(u => u.id !== unitId));
      if (selectedUnit?.id === unitId) {
        setSelectedUnit(null);
      }
    }
  };

  const handleAssignUser = (unitId: string, userId: string, assign: boolean) => {
    setOrgUnits(units => 
      units.map(unit => {
        if (unit.id === unitId) {
          const userIds = assign 
            ? [...unit.userIds, userId]
            : unit.userIds.filter(id => id !== userId);
          return { ...unit, userIds };
        }
        return unit;
      })
    );
  };

  const getUnitIcon = (type: string) => {
    switch (type) {
      case 'company': return <Building2 size={16} />;
      case 'department': return <Users size={16} />;
      case 'team': return <Users size={16} />;
      case 'location': return <MapPin size={16} />;
      default: return <Building2 size={16} />;
    }
  };

  const getUnitColor = (type: string) => {
    switch (type) {
      case 'company': return '#3b82f6';
      case 'department': return '#10b981';
      case 'team': return '#f59e0b';
      case 'location': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const renderUnitTree = (units: any[], level = 0) => {
    return units.map((unit) => {
      const isExpanded = expandedUnits.has(unit.id);
      const hasChildren = unit.children && unit.children.length > 0;
      const isSelected = selectedUnit?.id === unit.id;

      return (
        <div key={unit.id} style={{ marginLeft: `${level * 20}px` }}>
          {/* Unit Row */}
          <div
            onClick={() => setSelectedUnit(unit)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: isSelected ? '#f0f9ff' : 'transparent',
              borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent',
              cursor: 'pointer',
              borderRadius: '4px',
              margin: '2px 0'
            }}
          >
            {/* Expand/Collapse */}
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpansion(unit.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  color: '#6b7280'
                }}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <div style={{ width: '18px' }} />
            )}

            {/* Icon */}
            <div style={{ color: getUnitColor(unit.type) }}>
              {getUnitIcon(unit.type)}
            </div>

            {/* Name */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '14px',
                fontWeight: isSelected ? '500' : 'normal',
                color: '#1f2937'
              }}>
                {unit.name}
              </div>
              {unit.description && (
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginTop: '2px'
                }}>
                  {unit.description}
                </div>
              )}
            </div>

            {/* User Count */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: '#6b7280'
            }}>
              <Users size={12} />
              {unit.userIds.length}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddUnit(unit.id);
                }}
                style={{
                  padding: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '3px',
                  color: '#6b7280'
                }}
                title="Add child unit"
              >
                <Plus size={12} />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditUnit(unit);
                }}
                style={{
                  padding: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '3px',
                  color: '#6b7280'
                }}
                title="Edit unit"
              >
                <Edit size={12} />
              </button>
              
              {unit.id !== 'company' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteUnit(unit.id);
                  }}
                  style={{
                    padding: '4px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '3px',
                    color: '#ef4444'
                  }}
                  title="Delete unit"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Children */}
          {isExpanded && hasChildren && renderUnitTree(unit.children, level + 1)}
        </div>
      );
    });
  };

  return (
    <div style={{ display: 'flex', height: '600px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
      {/* Left Panel - Tree View */}
      <div style={{
        width: '60%',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Tree Header */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1f2937',
              margin: 0
            }}>
              Organizational Structure
            </h3>
            
            <button
              onClick={() => handleAddUnit()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              <Plus size={14} />
              Add Unit
            </button>
          </div>

          {/* Search and Filter */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search 
                size={14} 
                style={{ 
                  position: 'absolute', 
                  left: '8px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: '#6b7280' 
                }} 
              />
              <input
                type="text"
                placeholder="Search units..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 6px 6px 28px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: '6px 8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              <option value="all">All Types</option>
              <option value="company">Companies</option>
              <option value="department">Departments</option>
              <option value="team">Teams</option>
              <option value="location">Locations</option>
            </select>
          </div>
        </div>

        {/* Tree Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              Loading organizational structure...
            </div>
          ) : tree.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              <Building2 size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '500' }}>
                No organizational units found
              </h4>
              <p style={{ margin: 0, fontSize: '12px' }}>
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Click "Add Unit" to create your first organizational unit'
                }
              </p>
            </div>
          ) : (
            renderUnitTree(tree)
          )}
        </div>
      </div>

      {/* Right Panel - Unit Details */}
      <div style={{ width: '40%', display: 'flex', flexDirection: 'column' }}>
        {selectedUnit ? (
          <>
            {/* Details Header */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <div style={{ color: getUnitColor(selectedUnit.type) }}>
                  {getUnitIcon(selectedUnit.type)}
                </div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: 0
                }}>
                  {selectedUnit.name}
                </h3>
              </div>
              
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                textTransform: 'capitalize'
              }}>
                {selectedUnit.type}
                {selectedUnit.metadata?.costCenter && ` • ${selectedUnit.metadata.costCenter}`}
              </div>
            </div>

            {/* Details Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {/* Basic Information */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  margin: '0 0 8px 0'
                }}>
                  Basic Information
                </h4>
                
                {selectedUnit.description && (
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>Description: </span>
                    <span style={{ fontSize: '12px', color: '#374151' }}>
                      {selectedUnit.description}
                    </span>
                  </div>
                )}
                
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Status: </span>
                  <span style={{
                    fontSize: '12px',
                    color: selectedUnit.isActive ? '#10b981' : '#ef4444',
                    fontWeight: '500'
                  }}>
                    {selectedUnit.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Created: </span>
                  <span style={{ fontSize: '12px', color: '#374151' }}>
                    {new Date(selectedUnit.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Manager */}
              {selectedUnit.managerUserId && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    margin: '0 0 8px 0'
                  }}>
                    Manager
                  </h4>
                  
                  <div style={{
                    padding: '8px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '4px',
                    border: '1px solid #f3f4f6'
                  }}>
                    {(() => {
                      const manager = tenantUsers.find(u => u.id === selectedUnit.managerUserId);
                      return manager ? (
                        <div style={{ fontSize: '12px' }}>
                          <div style={{ fontWeight: '500', color: '#374151' }}>{manager.name}</div>
                          <div style={{ color: '#6b7280' }}>{manager.email}</div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Manager not found</div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Users */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  margin: '0 0 8px 0'
                }}>
                  Users ({selectedUnit.userIds.length})
                </h4>
                
                {selectedUnit.userIds.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedUnit.userIds.map(userId => {
                      const user = tenantUsers.find(u => u.id === userId);
                      return user ? (
                        <div
                          key={userId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 8px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '4px',
                            border: '1px solid #f3f4f6'
                          }}
                        >
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: '#3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '10px',
                            fontWeight: '500'
                          }}>
                            {user.name?.charAt(0)?.toUpperCase()}
                          </div>
                          
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>
                              {user.name}
                            </div>
                            <div style={{ fontSize: '10px', color: '#6b7280' }}>
                              {user.email}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleAssignUser(selectedUnit.id, userId, false)}
                            style={{
                              padding: '2px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#ef4444',
                              borderRadius: '2px'
                            }}
                            title="Remove from unit"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: '#6b7280',
                    fontSize: '12px'
                  }}>
                    No users assigned to this unit
                  </div>
                )}
              </div>

              {/* Metadata */}
              {selectedUnit.metadata && Object.keys(selectedUnit.metadata).length > 0 && (
                <div>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    margin: '0 0 8px 0'
                  }}>
                    Additional Information
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {Object.entries(selectedUnit.metadata).map(([key, value]) => (
                      <div key={key} style={{
                        padding: '6px 8px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '4px',
                        border: '1px solid #f3f4f6'
                      }}>
                        <span style={{ fontSize: '11px', color: '#6b7280', textTransform: 'capitalize' }}>
                          {key.replace(/([A-Z])/g, ' $1')}: 
                        </span>
                        <span style={{ fontSize: '12px', color: '#374151', marginLeft: '6px' }}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7280',
            textAlign: 'center',
            padding: '40px'
          }}>
            <div>
              <Building2 size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '500' }}>
                No unit selected
              </h4>
              <p style={{ margin: 0, fontSize: '12px' }}>
                Select an organizational unit from the tree to view its details
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && editingUnit && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
              setEditingUnit(null);
              setError(null);
            }
          }}
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
            zIndex: 1000
          }}
        >
          <div
            style={{
              width: '500px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                {editingUnit.id ? 'Edit Organizational Unit' : 'Add Organizational Unit'}
              </h3>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '20px' }}>
              {error && (
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '4px',
                  color: '#dc2626',
                  fontSize: '12px',
                  marginBottom: '16px'
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Name *
                  </label>
                  <input
                    type="text"
                    value={editingUnit.name}
                    onChange={(e) => setEditingUnit({ ...editingUnit, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    placeholder="Enter unit name"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Type
                  </label>
                  <select
                    value={editingUnit.type}
                    onChange={(e) => setEditingUnit({ ...editingUnit, type: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="company">Company</option>
                    <option value="department">Department</option>
                    <option value="team">Team</option>
                    <option value="location">Location</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                  Description
                </label>
                <textarea
                  value={editingUnit.description || ''}
                  onChange={(e) => setEditingUnit({ ...editingUnit, description: e.target.value })}
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                  placeholder="Enter description"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Cost Center
                  </label>
                  <input
                    type="text"
                    value={editingUnit.metadata?.costCenter || ''}
                    onChange={(e) => setEditingUnit({ 
                      ...editingUnit, 
                      metadata: { ...editingUnit.metadata, costCenter: e.target.value }
                    })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    placeholder="CC-001"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Location
                  </label>
                  <input
                    type="text"
                    value={editingUnit.metadata?.location || ''}
                    onChange={(e) => setEditingUnit({ 
                      ...editingUnit, 
                      metadata: { ...editingUnit.metadata, location: e.target.value }
                    })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    placeholder="Building A, Floor 2"
                  />
                </div>
              </div>

              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={editingUnit.isActive}
                    onChange={(e) => setEditingUnit({ ...editingUnit, isActive: e.target.checked })}
                  />
                  Active
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingUnit(null);
                  setError(null);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleSaveUnit}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {editingUnit.id ? 'Save Changes' : 'Create Unit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationalUnitsEditor;