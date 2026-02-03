'use client';

import React, { useMemo, useEffect } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    BackgroundVariant,
    Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { usePlannerStore, useRecipeStore, useItemStore } from '@/stores';
import { ProductionNode } from './nodes/ProductionNode';
import { PlannerToolbox } from './PlannerToolbox';

export function FactoryPlanner() {
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        clearPlanner
    } = usePlannerStore();

    const { fetchRecipes } = useRecipeStore();
    const { fetchItems } = useItemStore();

    useEffect(() => {
        fetchRecipes();
        fetchItems();
    }, [fetchRecipes, fetchItems]);

    const nodeTypes = useMemo(() => ({
        productionNode: ProductionNode,
    }), []);

    return (
        <div className="flex h-[calc(100vh-64px)] w-full bg-bg relative animate-in fade-in duration-500 overflow-hidden">
            <PlannerToolbox />

            <div className="flex-1 relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    fitView
                    colorMode="dark"
                    defaultEdgeOptions={{
                        animated: true,
                        style: { stroke: '#FA9549', strokeWidth: 2 },
                    }}
                >
                    <Background variant={BackgroundVariant.Dots} gap={25} size={1} color="#333" />
                    <Controls />
                    <MiniMap
                        nodeStrokeColor="#FA9549"
                        nodeColor="#2A2E35"
                        maskColor="rgba(0, 0, 0, 0.7)"
                        style={{ backgroundColor: '#1A1D21', border: '1px solid #333', borderRadius: '8px' }}
                    />

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
