"use client";

import React, { useState, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { saveFunnelVersion } from '@/app/actions/funnels';

// Custom nodes can be added here
const nodeTypes = {};

export default function EditorClient({ 
  funnelId, 
  initialNodes, 
  initialEdges 
}: { 
  funnelId: string, 
  initialNodes: any, 
  initialEdges: any 
}) {
  const [nodes, setNodes] = useState<Node[]>(
    Array.isArray(initialNodes) && initialNodes.length > 0 
      ? initialNodes 
      : [{ id: 'start', position: { x: 250, y: 50 }, data: { label: 'Início do Funil' }, type: 'input' }]
  );
  const [edges, setEdges] = useState<Edge[]>(
    Array.isArray(initialEdges) ? initialEdges : []
  );
  const [isSaving, setIsSaving] = useState(false);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const addNode = (type: string, label: string) => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      position: { x: 250, y: 150 + nodes.length * 50 },
      data: { label, type },
      // if we have custom types we assign type: type here
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleSave = async (publish: boolean) => {
    setIsSaving(true);
    try {
      await saveFunnelVersion(funnelId, nodes, edges, publish);
      alert(publish ? "Funil publicado com sucesso!" : "Rascunho salvo com sucesso!");
    } catch (e) {
      alert("Erro ao salvar funil");
    }
    setIsSaving(false);
  };

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <Panel position="top-right" className="bg-white p-2 rounded shadow flex gap-2">
          <button 
            onClick={() => handleSave(false)} 
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          >
            Salvar Rascunho
          </button>
          <button 
            onClick={() => handleSave(true)} 
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
          >
            Publicar
          </button>
        </Panel>
        <Panel position="top-left" className="bg-white p-4 rounded shadow flex flex-col gap-2 w-48">
          <h3 className="text-sm font-bold text-gray-700 border-b pb-2 mb-2">Adicionar Nó</h3>
          <button onClick={() => addNode('message', 'Mensagem de Texto')} className="text-left text-sm p-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100">
            Mensagem
          </button>
          <button onClick={() => addNode('delay', 'Atraso (Delay)')} className="text-left text-sm p-2 bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100">
            Atraso (Delay)
          </button>
          <button onClick={() => addNode('condition', 'Condicional')} className="text-left text-sm p-2 bg-purple-50 text-purple-700 rounded hover:bg-purple-100">
            Condição
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
