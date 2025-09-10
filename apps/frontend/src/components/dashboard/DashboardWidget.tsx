import React, { useState, useEffect } from 'react';
import { DashboardWidget as WidgetType, WidgetSize } from '@/contexts/ModuleDashboardContext';
import { useModuleDashboard } from '@/contexts/ModuleDashboardContext';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  MoreVertical,
  Maximize2,
  Settings,
  X,
  Eye,
  EyeOff,
  Shield,
  Calendar,
  FileText,
  Database,
  Zap
} from 'lucide-react';

interface DashboardWidgetProps {
  widget: WidgetType;
  data?: any;
  isLoading?: boolean;
  onRefresh?: () => void;
  onRemove?: () => void;
  onResize?: (size: WidgetSize) => void;
  onConfigure?: () => void;
  isCustomizable?: boolean;
  className?: string;
}

const WidgetIcon: React.FC<{ type: string; size?: number }> = ({ type, size = 16 }) => {
  const icons = {
    metric: BarChart3,
    chart: TrendingUp,
    table: FileText,
    list: Users,
    progress: Activity,
    alert: AlertTriangle,
    activity: Clock,
    calendar: Calendar,
    map: Database,
    custom: Settings
  };
  
  const Icon = icons[type as keyof typeof icons] || Settings;
  return <Icon size={size} style={{ color: '#6b7280' }} />;
};

const MetricWidget: React.FC<{ data: any; widget: WidgetType }> = ({ data, widget }) => {
  if (!data?.metrics) return <div>No data available</div>;

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
        {data.metrics.map((metric: any, index: number) => (
          <div key={index} style={{
            textAlign: 'center',
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '4px'
            }}>
              {metric.value}{metric.unit || ''}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              marginBottom: '6px'
            }}>
              {metric.label}
            </div>
            {metric.change && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                fontSize: '11px',
                color: metric.trend === 'up' ? '#10b981' : '#ef4444'
              }}>
                {metric.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {metric.change}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const ChartWidget: React.FC<{ data: any; widget: WidgetType }> = ({ data, widget }) => {
  if (!data?.chartData) return <div>No chart data available</div>;

  return (
    <div style={{ padding: '16px' }}>
      <div style={{
        height: '200px',
        display: 'flex',
        alignItems: 'end',
        gap: '8px',
        padding: '16px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        {data.chartData.map((item: any, index: number) => {
          const maxValue = Math.max(...data.chartData.map((d: any) => d.value));
          const height = (item.value / maxValue) * 160;
          
          return (
            <div key={index} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1
            }}>
              <div style={{
                width: '100%',
                height: `${height}px`,
                backgroundColor: '#3b82f6',
                borderRadius: '4px 4px 0 0',
                marginBottom: '8px',
                transition: 'all 0.3s ease'
              }} />
              <div style={{ fontSize: '11px', color: '#6b7280' }}>{item.name}</div>
              <div style={{ fontSize: '10px', color: '#9ca3af' }}>{item.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TableWidget: React.FC<{ data: any; widget: WidgetType }> = ({ data, widget }) => {
  if (!data?.columns || !data?.rows) return <div>No table data available</div>;

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f9fafb' }}>
            <tr>
              {data.columns.map((column: string, index: number) => (
                <th key={index} style={{
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.slice(0, 5).map((row: string[], rowIndex: number) => (
              <tr key={rowIndex} style={{
                borderBottom: rowIndex < data.rows.length - 1 ? '1px solid #f3f4f6' : 'none'
              }}>
                {row.map((cell: string, cellIndex: number) => (
                  <td key={cellIndex} style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    color: '#374151'
                  }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.rows.length > 5 && (
          <div style={{
            textAlign: 'center',
            padding: '8px',
            fontSize: '12px',
            color: '#6b7280',
            borderTop: '1px solid #f3f4f6'
          }}>
            +{data.rows.length - 5} more items
          </div>
        )}
      </div>
    </div>
  );
};

const ActivityWidget: React.FC<{ data: any; widget: WidgetType }> = ({ data, widget }) => {
  if (!data?.activities) return <div>No activity data available</div>;

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {data.activities.map((activity: any, index: number) => (
          <div key={index} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px',
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#3b82f6',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {activity.user.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', color: '#374151' }}>
                <strong>{activity.user}</strong> {activity.action}
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>
                {activity.timestamp}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProgressWidget: React.FC<{ data: any; widget: WidgetType }> = ({ data, widget }) => {
  if (!data?.progress) return <div>No progress data available</div>;

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {data.progress.map((item: any, index: number) => (
          <div key={index}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px'
            }}>
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                {item.label}
              </span>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                {item.percentage}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e5e7eb',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${item.percentage}%`,
                height: '100%',
                backgroundColor: item.percentage >= 80 ? '#10b981' : item.percentage >= 60 ? '#f59e0b' : '#ef4444',
                transition: 'width 0.5s ease'
              }} />
            </div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
              ${item.current.toLocaleString()} / ${item.target.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  widget,
  data,
  isLoading = false,
  onRefresh,
  onRemove,
  onResize,
  onConfigure,
  isCustomizable = false,
  className = ''
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { getWidgetData } = useModuleDashboard();

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh?.();
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to refresh widget:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderWidgetContent = () => {
    if (isLoading) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '150px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      );
    }

    switch (widget.type) {
      case 'metric':
        return <MetricWidget data={data} widget={widget} />;
      case 'chart':
        return <ChartWidget data={data} widget={widget} />;
      case 'table':
        return <TableWidget data={data} widget={widget} />;
      case 'activity':
        return <ActivityWidget data={data} widget={widget} />;
      case 'progress':
        return <ProgressWidget data={data} widget={widget} />;
      default:
        return (
          <div style={{
            padding: '16px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            Widget type "{widget.type}" not implemented
          </div>
        );
    }
  };

  const getSizeStyles = (size: WidgetSize) => {
    switch (size) {
      case 'small':
        return { minHeight: '200px', gridColumn: 'span 3' };
      case 'medium':
        return { minHeight: '250px', gridColumn: 'span 6' };
      case 'large':
        return { minHeight: '300px', gridColumn: 'span 8' };
      case 'full':
        return { minHeight: '400px', gridColumn: 'span 12' };
      default:
        return { minHeight: '250px', gridColumn: 'span 6' };
    }
  };

  return (
    <div 
      className={`dashboard-widget ${className}`}
      style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        position: 'relative',
        ...getSizeStyles(widget.size)
      }}
    >
      {/* Widget Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid #f3f4f6'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <WidgetIcon type={widget.type} size={16} />
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#1f2937',
            margin: 0
          }}>
            {widget.title}
          </h4>
          {widget.category && (
            <span style={{
              padding: '2px 6px',
              fontSize: '10px',
              fontWeight: '500',
              backgroundColor: '#f3f4f6',
              color: '#6b7280',
              borderRadius: '8px',
              textTransform: 'uppercase'
            }}>
              {widget.category}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {widget.refreshInterval && (
            <div style={{
              fontSize: '10px',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Clock size={10} />
              {lastUpdated.toLocaleTimeString()}
            </div>
          )}

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              padding: '4px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              color: '#6b7280',
              opacity: isRefreshing ? 0.6 : 1
            }}
            title="Refresh widget"
          >
            <RefreshCw 
              size={14} 
              style={{ 
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none' 
              }} 
            />
          </button>

          {isCustomizable && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                style={{
                  padding: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
                title="Widget options"
              >
                <MoreVertical size={14} />
              </button>

              {showMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  zIndex: 10,
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  minWidth: '120px'
                }}>
                  <button
                    onClick={() => {
                      onConfigure?.();
                      setShowMenu(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      textAlign: 'left',
                      border: 'none',
                      backgroundColor: 'transparent',
                      fontSize: '12px',
                      color: '#374151',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Settings size={12} />
                    Configure
                  </button>
                  <button
                    onClick={() => {
                      onRemove?.();
                      setShowMenu(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      textAlign: 'left',
                      border: 'none',
                      backgroundColor: 'transparent',
                      fontSize: '12px',
                      color: '#ef4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <X size={12} />
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Widget Content */}
      <div style={{ height: 'calc(100% - 53px)', overflow: 'auto' }}>
        {renderWidgetContent()}
      </div>

      {/* Widget Description */}
      {widget.description && (
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          padding: '4px 8px',
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '4px',
          fontSize: '10px',
          color: '#6b7280',
          maxWidth: '200px',
          display: showMenu ? 'none' : 'block'
        }}>
          {widget.description}
        </div>
      )}
    </div>
  );
};

export default DashboardWidget;