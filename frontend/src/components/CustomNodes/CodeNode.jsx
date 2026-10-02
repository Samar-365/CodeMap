import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { 
  FileCode, 
  Globe, 
  Database, 
  Cpu, 
  Settings, 
  ArrowRight,
  Boxes,
  Code
} from 'lucide-react';

const LAYER_CONFIG = {
  frontend: {
    icon: Globe,
    badgeClass: 'badge-frontend',
    label: 'Frontend UI',
    borderColor: '#06b6d4',
  },
  api_route: {
    icon: Cpu,
    badgeClass: 'badge-api',
    label: 'API Route',
    borderColor: '#10b981',
  },
  service: {
    icon: Boxes,
    badgeClass: 'badge-service',
    label: 'Service',
    borderColor: '#3b82f6',
  },
  data_model: {
    icon: Database,
    badgeClass: 'badge-model',
    label: 'Data Model',
    borderColor: '#a855f7',
  },
  config: {
    icon: Settings,
    badgeClass: 'badge-config',
    label: 'Config',
    borderColor: '#f59e0b',
  },
  utility: {
    icon: Code,
    badgeClass: 'glass-pill',
    label: 'Utility',
    borderColor: '#64748b',
  },
  unknown: {
    icon: FileCode,
    badgeClass: 'glass-pill',
    label: 'General',
    borderColor: '#475569',
  },
};

export const CodeNode = memo(({ data, isConnectable, selected }) => {
  const layerMeta = LAYER_CONFIG[data.layer] || LAYER_CONFIG.unknown;
  const IconComponent = layerMeta.icon;

  return (
    <div 
      className={`custom-node ${selected ? 'selected' : ''}`}
      style={{
        borderLeft: `4px solid ${layerMeta.borderColor}`,
      }}
    >
      {/* Target Connection Handle */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        style={{
          background: layerMeta.borderColor,
          width: 8,
          height: 8,
          border: '2px solid #07090e'
        }}
      />

      {/* Node Header */}
      <div className="custom-node-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IconComponent size={14} color={layerMeta.borderColor} />
          </div>
          <div>
            <div className="custom-node-title" title={data.label}>{data.label}</div>
            <div className="custom-node-subtitle">{data.relative_path}</div>
          </div>
        </div>

        {/* Layer Badge */}
        <span className={`glass-pill ${layerMeta.badgeClass}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
          {layerMeta.label}
        </span>
      </div>

      {/* Purpose Summary */}
      <div className="custom-node-purpose" title={data.purpose_summary}>
        {data.purpose_summary || 'Component module'}
      </div>

      {/* Tags & Metrics Footer */}
      <div style={{
        marginTop: '10px',
        paddingTop: '8px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11px',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {data.tags && data.tags.slice(0, 2).map((t) => (
            <span key={t} style={{
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '1px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              color: 'var(--text-secondary)'
            }}>
              {t}
            </span>
          ))}
        </div>
        <div>
          <span>{data.line_count || 0} lines</span>
        </div>
      </div>

      {/* Source Connection Handle */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        style={{
          background: layerMeta.borderColor,
          width: 8,
          height: 8,
          border: '2px solid #07090e'
        }}
      />
    </div>
  );
});

export default CodeNode;
