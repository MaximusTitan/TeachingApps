'use client';

import { useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
} from 'react-flow-renderer';
import { useTheme } from 'next-themes';
import CustomNode from './nodes/CustomNode';
import AINode from './nodes/AINode';

const nodeTypes = {
  custom: CustomNode,
  ai: AINode,
};

export default function FlowChart() {
  const { theme } = useTheme();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onAddNode = useCallback((type: string) => {
    const newNode: Node = {
      id: `node-${nodes.length + 1}`,
      type: type === 'ai' ? 'ai' : 'custom',
      position: { x: 250, y: 250 },
      data: {
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
        content: '',
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [nodes, setNodes]);

  return (
    <div className="h-screen w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className={theme === 'dark' ? 'dark-theme' : ''}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}