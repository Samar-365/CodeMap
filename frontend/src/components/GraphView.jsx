import React, { useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import CodeNode from './CustomNodes/CodeNode';
import { getLayoutedElements } from '../utils/layout';

const nodeTypes = {
  customNode: CodeNode,
};

export function GraphView({
  graphData,
  onNodeSelect,
  selectedNodeId,
  layoutDirection = 'LR',
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Compute Layout whenever graphData or direction changes
  useEffect(() => {
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      graphData.nodes,
      graphData.edges,
      layoutDirection
    );

    // Format edges with React Flow visual properties
    const formattedEdges = layoutedEdges.map((edge) => {
      const isApi = edge.relation_type === 'calls_api';
      const isModel = edge.relation_type === 'uses_model';

      return {
        ...edge,
        type: 'smoothstep',
        animated: isApi,
        style: {
          stroke: isApi ? '#06b6d4' : isModel ? '#a855f7' : '#475569',
          strokeWidth: isApi ? 2.5 : 1.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isApi ? '#06b6d4' : isModel ? '#a855f7' : '#475569',
          width: 14,
          height: 14,
        },
      };
    });

    setNodes(layoutedNodes);
    setEdges(formattedEdges);
  }, [graphData, layoutDirection, setNodes, setEdges]);

  // Handle node selection
  const handleNodeClick = useCallback((event, node) => {
    if (onNodeSelect) {
      onNodeSelect(node.data);
    }
  }, [onNodeSelect]);

  // Node color function for MiniMap
  const nodeColor = useCallback((node) => {
    const layer = node.data?.layer;
    if (layer === 'frontend') return '#06b6d4';
    if (layer === 'api_route') return '#10b981';
    if (layer === 'service') return '#3b82f6';
    if (layer === 'data_model') return '#a855f7';
    if (layer === 'config') return '#f59e0b';
    return '#64748b';
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: 'smoothstep' }}
      >
        <Controls showInteractive={false} />
        <MiniMap 
          nodeColor={nodeColor}
          maskColor="rgba(9, 9, 11, 0.75)"
          style={{
            height: 100,
            width: 150,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
          }}
        />
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1.5} 
          color="rgba(255, 255, 255, 0.07)" 
        />
      </ReactFlow>
    </div>
  );
}

export default GraphView;
