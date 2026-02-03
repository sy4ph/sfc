'use client';

import React, { useMemo, useEffect, useCallback, useRef } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    BackgroundVariant,
    Panel,
    useReactFlow,
    ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { usePlannerStore, useRecipeStore, useItemStore } from '@/stores';
import { ProductionNode } from './nodes/ProductionNode';
import { SourceNode } from './nodes/SourceNode';
import { CustomEdge } from './edges/CustomEdge';
import { PlannerToolbox } from './PlannerToolbox';

const nodeTypes = {
    productionNode: ProductionNode,
    sourceNode: SourceNode,
};

const edgeTypes = {
    customEdge: CustomEdge,
};

function FactoryPlannerInner() {
    const {
        nodes,
        edges,
        isSidebarVisible,
        toggleSidebar,
        onNodesChange,
        onEdgesChange,
        onConnect,
        addNode,
        clearPlanner
    } = usePlannerStore();

    const { recipes, fetchRecipes } = useRecipeStore();
    const { items, fetchItems } = useItemStore();
    const { screenToFlowPosition } = useReactFlow();

    useEffect(() => {
        fetchRecipes();
        fetchItems();
    }, [fetchRecipes, fetchItems]);

    // Drop handler for dragging from toolbox
    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();

        const dataStr = event.dataTransfer.getData('application/reactflow');
        if (!dataStr) return;

        const { type, id, secondaryId } = JSON.parse(dataStr);
        const position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });

        const newNodeId = `${id}-${Date.now()}`;

        if (type === 'sourceNode') {
            addNode({
                id: newNodeId,
                type: 'sourceNode',
                position,
                data: {
                    resourceId: '',
                    efficiency: 100,
                    machineCount: 1,
                    isResource: true,
                    outputRate: 60,
                },
            }, recipes);
        } else if (type === 'resource') {
            addNode({
                id: newNodeId,
                type: 'productionNode',
                position,
                data: {
                    resourceId: id,
                    machineId: secondaryId,
                    efficiency: 100,
                    machineCount: 1,
                    isResource: true,
                    outputRate: 60,
                },
            }, recipes);
        } else {
            addNode({
                id: newNodeId,
                type: 'productionNode',
                position,
                data: {
                    machineId: id,
                    efficiency: 100,
                    machineCount: 1,
                    isResource: false,
                },
            }, recipes);
        }
    }, [screenToFlowPosition, addNode, recipes]);

    // Connection validation (Item ID matching)
    const isValidConnection = useCallback((connection: any) => {
        // Handle source and target handles (Item IDs)
        const sourceItem = connection.sourceHandle;
        const targetItem = connection.targetHandle;

        // Items must match exactly
        return sourceItem === targetItem;
    }, []);

    // Wrapper functions to pass recipes
    const onNodesChangeWithRecipes = useCallback((changes: any) => onNodesChange(changes, recipes), [onNodesChange, recipes]);
    const onEdgesChangeWithRecipes = useCallback((changes: any) => onEdgesChange(changes, recipes), [onEdgesChange, recipes]);
    const onConnectWithRecipes = useCallback((connection: any) => onConnect(connection, recipes), [onConnect, recipes]);

    return (
        <div className="flex h-[calc(100vh-64px)] w-full bg-bg relative animate-in fade-in duration-500 overflow-hidden">
            {isSidebarVisible && <PlannerToolbox />}

            <div className="flex-1 relative" onDragOver={onDragOver} onDrop={onDrop}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChangeWithRecipes}
                    onEdgesChange={onEdgesChangeWithRecipes}
                    onConnect={onConnectWithRecipes}
                    isValidConnection={isValidConnection}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    snapToGrid={true}
                    snapGrid={[20, 20]}
                    minZoom={0.01}
                    fitView
                    colorMode="dark"
                    defaultEdgeOptions={{
                        type: 'customEdge',
                        animated: true,
                        style: { stroke: '#FA9549', strokeWidth: 2 },
                    }}
                >
                    <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#333" />
                    <Controls />
                    <MiniMap
                        nodeStrokeColor="#FA9549"
                        nodeColor="#2A2E35"
                        maskColor="rgba(0, 0, 0, 0.7)"
                        style={{ backgroundColor: '#1A1D21', border: '1px solid #333', borderRadius: '8px' }}
                    />

                    <Panel position="top-left" className="ml-4 mt-4 flex gap-2">
                        <button
                            onClick={toggleSidebar}
                            title={isSidebarVisible ? 'Hide Toolbox' : 'Show Toolbox'}
                            className={`
                                p-3 rounded-xl border backdrop-blur-md transition-all shadow-2xl
                                ${isSidebarVisible ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-surface/80 border-border text-text-dim hover:text-text'}
                            `}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                        </button>
                    </Panel>

                    <Panel position="top-right" className="bg-surface/80 backdrop-blur-md border border-border p-2 rounded-xl flex gap-2 shadow-2xl mr-4 mt-4">
                        <button
                            onClick={clearPlanner}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-red-500/20 transition-all flex items-center gap-2 group"
                        >
                            <svg className="w-3 h-3 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Clear Plan
                        </button>
                    </Panel>
                </ReactFlow>
            </div>
        </div>
    );
}

export function FactoryPlanner() {
    return (
        <ReactFlowProvider>
            <FactoryPlannerInner />
        </ReactFlowProvider>
    );
}
