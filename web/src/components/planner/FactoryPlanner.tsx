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
import { GroupNode } from './nodes/GroupNode';
import { NoteNode } from './nodes/NoteNode';
import { CustomEdge } from './edges/CustomEdge';
import { PlannerToolbox } from './PlannerToolbox';
import { exportToSFC, parseSFCFile, downloadFile } from '@/lib/plannerConverter';
import { compressPlan, decompressPlan } from '@/lib/urlCompression';

const nodeTypes = {
    productionNode: ProductionNode,
    sourceNode: SourceNode,
    group: GroupNode,
    note: NoteNode,
};

const edgeTypes = {
    customEdge: CustomEdge,
};

import { useShallow } from 'zustand/react/shallow';

// ... imports

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
        clearPlanner,
        importNodes
    } = usePlannerStore(useShallow(state => ({
        nodes: state.nodes,
        edges: state.edges,
        isSidebarVisible: state.isSidebarVisible,
        toggleSidebar: state.toggleSidebar,
        onNodesChange: state.onNodesChange,
        onEdgesChange: state.onEdgesChange,
        onConnect: state.onConnect,
        addNode: state.addNode,
        clearPlanner: state.clearPlanner,
        importNodes: state.importNodes,
    })));

    const { recipes, fetchRecipes } = useRecipeStore();
    const { items, fetchItems } = useItemStore();
    const { screenToFlowPosition } = useReactFlow();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchRecipes();
        fetchItems();
    }, [fetchRecipes, fetchItems]);

    // Hydrate from URL
    useEffect(() => {
        if (Object.keys(recipes).length === 0) return; // Wait for recipes to load

        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const plan = params.get('plan');
            if (plan) {
                const result = decompressPlan(plan);
                if (result) {
                    console.log('Hydrating plan from URL...');
                    // Small timeout to ensure Flow is ready? or just import
                    importNodes(result.nodes, result.edges, recipes);
                }
            }
        }
    }, [recipes, importNodes]);

    // Drag handler for dragging from toolbox
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

        // Check if dropped onto a group (simple hit test)
        const parentGroup = nodes.find(n =>
            n.type === 'group' &&
            position.x >= n.position.x &&
            position.x <= n.position.x + ((n.measured?.width ?? n.style?.width ?? 0) as number) &&
            position.y >= n.position.y &&
            position.y <= n.position.y + ((n.measured?.height ?? n.style?.height ?? 0) as number)
        );

        let finalPosition = position;
        let parentId: string | undefined = undefined;

        if (parentGroup) {
            parentId = parentGroup.id;
            finalPosition = {
                x: position.x - parentGroup.position.x,
                y: position.y - parentGroup.position.y
            };
        }

        const newNodeId = `${id}-${Date.now()}`;
        const commonProps = {
            id: newNodeId,
            parentId,
            extent: (parentId ? 'parent' : undefined) as 'parent' | undefined,
            position: finalPosition,
        };

        if (type === 'sourceNode') {
            addNode({
                ...commonProps,
                type: 'sourceNode',
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
                ...commonProps,
                type: 'productionNode',
                data: {
                    resourceId: id,
                    machineId: secondaryId,
                    efficiency: 100,
                    machineCount: 1,
                    isResource: true,
                    outputRate: 60,
                },
            }, recipes);
        } else if (type === 'group') {
            addNode({
                ...commonProps,
                type: 'group',
                parentId: undefined, // Groups shouldn't be inside groups for now
                position: position, // Always global
                extent: undefined,
                data: { label: 'New Group' },
                style: { width: 400, height: 400, zIndex: -10 },
            }, recipes);
        } else if (type === 'note') {
            addNode({
                ...commonProps,
                type: 'note',
                data: { text: '' },
            }, recipes);
        } else {
            addNode({
                ...commonProps,
                type: 'productionNode',
                data: {
                    machineId: id,
                    efficiency: 100,
                    machineCount: 1,
                    isResource: false,
                },
            }, recipes);
        }
    }, [screenToFlowPosition, addNode, recipes, nodes]);

    // Undo/Redo Fix: Pause history during drag, resume on stop
    const onNodeDragStart = useCallback(() => {
        usePlannerStore.temporal.getState().pause();
    }, []);

    const onNodeDragStop = useCallback((event: React.MouseEvent, node: any) => {
        usePlannerStore.temporal.getState().resume();

        // Grouping Logic: Check overlapping groups
        let globalNodeRect = {
            x: node.position.x,
            y: node.position.y,
            w: (node.measured?.width ?? 0) as number,
            h: (node.measured?.height ?? 0) as number
        };

        // If currently in a parent, convert to global
        if (node.parentId) {
            const parent = nodes.find(n => n.id === node.parentId);
            if (parent) {
                globalNodeRect.x += parent.position.x;
                globalNodeRect.y += parent.position.y;
            }
        }

        const center = {
            x: globalNodeRect.x + globalNodeRect.w / 2,
            y: globalNodeRect.y + globalNodeRect.h / 2
        };

        // 2. Find intersecting group
        const group = nodes.find(n =>
            n.id !== node.id && // Not self
            n.type === 'group' &&
            center.x >= n.position.x &&
            center.x <= n.position.x + ((n.measured?.width ?? n.style?.width ?? 0) as number) &&
            center.y >= n.position.y &&
            center.y <= n.position.y + ((n.measured?.height ?? n.style?.height ?? 0) as number)
        );

        if (group) {
            // Found a group!
            if (node.parentId !== group.id) {
                usePlannerStore.getState().assignParent(node.id, group.id);
            }
        } else {
            // No group found. If it was in a group, unparent it.
            if (node.parentId) {
                usePlannerStore.getState().assignParent(node.id, undefined);
            }
        }

    }, [nodes]);

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
                    onNodeDragStart={onNodeDragStart}
                    onNodeDragStop={onNodeDragStop}
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
                            onClick={() => {
                                const compressed = compressPlan(nodes, edges);
                                const url = new URL(window.location.href);
                                url.searchParams.set('plan', compressed);
                                window.history.pushState({}, '', url.toString());
                                navigator.clipboard.writeText(url.toString());
                                alert('Link copied to clipboard!');
                            }}
                            title="Share Plan (Copy URL)"
                            className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 text-[10px] font-bold uppercase tracking-wide rounded-lg border border-blue-500/20 transition-all flex items-center gap-1.5"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            Share
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".sfc,.json"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                        const content = event.target?.result as string;
                                        const parsed = parseSFCFile(content);
                                        if (parsed) {
                                            importNodes(parsed.nodes, parsed.edges, recipes);
                                        } else {
                                            alert('Invalid .sfc file');
                                        }
                                    };
                                    reader.readAsText(file);
                                    e.target.value = '';
                                }
                            }}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            title="Import .sfc file"
                            className="px-3 py-2 bg-accent/10 hover:bg-accent/20 text-accent text-[10px] font-bold uppercase tracking-wide rounded-lg border border-accent/20 transition-all flex items-center gap-1.5"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Import
                        </button>
                        <button
                            onClick={() => {
                                const content = exportToSFC(nodes, edges, `plan-${Date.now()}`);
                                downloadFile(content, `factory-plan-${new Date().toISOString().slice(0, 10)}.sfc`);
                            }}
                            title="Export as .sfc file"
                            className="px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wide rounded-lg border border-primary/20 transition-all flex items-center gap-1.5"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export
                        </button>
                        <button
                            onClick={clearPlanner}
                            className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wide rounded-lg border border-red-500/20 transition-all flex items-center gap-1.5"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Clear
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
