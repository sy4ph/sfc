import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    Connection,
    Edge,
    EdgeChange,
    Node,
    NodeChange,
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
} from '@xyflow/react';

export interface PlannerNodeData extends Record<string, unknown> {
    machineId?: string;
    recipeId?: string;
    efficiency: number;
    machineCount: number;
    customName?: string;
    isResource?: boolean;
    resourceId?: string;
    outputRate?: number; // Base rate for resources
    inputs?: Record<string, number>; // itemId -> actual incoming rate
    outputs?: Record<string, number>; // itemId -> actual outgoing rate
    bottlenecks?: string[]; // itemIds that are under-supplied
}

export type PlannerNode = Node<PlannerNodeData>;

interface PlannerState {
    nodes: PlannerNode[];
    edges: Edge[];
    onNodesChange: (changes: NodeChange<PlannerNode>[], recipes: Record<string, any>) => void;
    onEdgesChange: (changes: EdgeChange[], recipes: Record<string, any>) => void;
    onConnect: (connection: Connection, recipes: Record<string, any>) => void;
    addNode: (node: PlannerNode, recipes: Record<string, any>) => void;
    deleteNode: (nodeId: string, recipes: Record<string, any>) => void;
    updateNodeData: (nodeId: string, data: Partial<PlannerNodeData>, recipes: Record<string, any>) => void;
    clearPlanner: () => void;
    calculateFlows: (recipes: Record<string, any>) => void;
}

export const usePlannerStore = create<PlannerState>()(
    persist(
        (set, get) => ({
            nodes: [],
            edges: [],

            calculateFlows: (recipes) => {
                const { nodes, edges } = get();
                if (nodes.length === 0) {
                    // If no nodes, clear all flow data
                    set({ nodes: nodes.map(n => ({ ...n, data: { ...n.data, inputs: {}, outputs: {}, bottlenecks: [] } })) });
                    return;
                }

                const newNodes = [...nodes];
                const nodeMap = new Map(newNodes.map(n => [n.id, { ...n, data: { ...n.data, inputs: {}, outputs: {}, bottlenecks: [] } }]));

                // 1. Initialize Resources
                nodeMap.forEach(node => {
                    if (node.data.isResource && node.data.resourceId) {
                        const rate = (node.data.outputRate || 60) * (node.data.efficiency / 100) * (node.data.machineCount || 1);
                        node.data.outputs = { [node.data.resourceId]: rate };
                    }
                });

                // 2. Propagate flows (simplistic multi-pass or topological sort)
                // For a small graph, multiple passes until stable or max 10 passes is fine for a POC
                for (let i = 0; i < 10; i++) {
                    let changed = false;

                    // Reset inputs for each pass to re-sum from edges
                    nodeMap.forEach(node => {
                        if (!node.data.isResource) node.data.inputs = {};
                    });

                    // Aggregate inputs from edges
                    edges.forEach(edge => {
                        const source = nodeMap.get(edge.source);
                        const target = nodeMap.get(edge.target);
                        if (source && target && edge.sourceHandle) {
                            const itemId = edge.sourceHandle; // We'll use itemId as handleId
                            const sourceOutput = source.data.outputs?.[itemId] || 0;

                            // Multi-connect split logic: if source port has multiple edges, split flow
                            const outgoingEdges = edges.filter(e => e.source === edge.source && e.sourceHandle === edge.sourceHandle);
                            const splitFlow = outgoingEdges.length > 0 ? sourceOutput / outgoingEdges.length : sourceOutput;

                            target.data.inputs = target.data.inputs || {};
                            target.data.inputs[itemId] = (target.data.inputs[itemId] || 0) + splitFlow;
                        }
                    });

                    // Calculate outputs based on inputs and recipes
                    nodeMap.forEach(node => {
                        if (node.data.isResource || !node.data.recipeId) return;

                        const recipe = recipes[node.data.recipeId];
                        if (!recipe) return;

                        // Calculate throughput % based on inputs
                        let throughput = 1.0;
                        const bottlenecks: string[] = [];

                        recipe.ingredients.forEach((ing: any) => {
                            const required = (ing.amount / recipe.time) * 60 * (node.data.efficiency / 100) * (node.data.machineCount || 1);
                            const available = node.data.inputs?.[ing.item] || 0;

                            if (required > 0 && available < required - 0.01) { // Check required > 0 to avoid division by zero
                                const factor = available / required;
                                if (factor < throughput) throughput = factor;
                                bottlenecks.push(ing.item);
                            }
                        });

                        node.data.bottlenecks = bottlenecks;

                        // Calculate products
                        const newOutputs: Record<string, number> = {};
                        recipe.products.forEach((prod: any) => {
                            const baseRate = (prod.amount / recipe.time) * 60;
                            newOutputs[prod.item] = baseRate * (node.data.efficiency / 100) * (node.data.machineCount || 1) * throughput;
                        });

                        const oldOutputsJSON = JSON.stringify(node.data.outputs);
                        node.data.outputs = newOutputs;
                        if (JSON.stringify(newOutputs) !== oldOutputsJSON) changed = true;
                    });

                    if (!changed) break;
                }

                set({ nodes: Array.from(nodeMap.values()) });
            },

            onNodesChange: (changes, recipes) => {
                set((state) => ({
                    nodes: applyNodeChanges(changes, state.nodes),
                }));
                get().calculateFlows(recipes);
            },

            onEdgesChange: (changes, recipes) => {
                set((state) => ({
                    edges: applyEdgeChanges(changes, state.edges),
                }));
                get().calculateFlows(recipes);
            },

            onConnect: (connection, recipes) => {
                set((state) => ({
                    edges: addEdge({ ...connection, animated: true, style: { stroke: '#FA9549' } }, state.edges),
                }));
                get().calculateFlows(recipes);
            },

            addNode: (node, recipes) => {
                set((state) => ({
                    nodes: [...state.nodes, node],
                }));
                get().calculateFlows(recipes);
            },

            deleteNode: (nodeId, recipes) => {
                set((state) => ({
                    nodes: state.nodes.filter((node) => node.id !== nodeId),
                    edges: state.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
                }));
                get().calculateFlows(recipes);
            },

            updateNodeData: (nodeId, data, recipes) => {
                set((state) => ({
                    nodes: state.nodes.map((node) => {
                        if (node.id === nodeId) {
                            return { ...node, data: { ...node.data, ...data } };
                        }
                        return node;
                    }),
                }));
                get().calculateFlows(recipes);
            },

            clearPlanner: () => {
                if (window.confirm('Are you sure you want to clear the entire planner?')) {
                    set({ nodes: [], edges: [] });
                    // No need to call calculateFlows here, as it will be called with empty nodes/edges
                    // and will correctly reset flow data.
                }
            },
        }),
        {
            name: 'sfc-planner-storage',
        }
    )
);
