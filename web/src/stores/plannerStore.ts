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
    theoreticalOutputs?: Record<string, number>; // Potential at current clock speed
    bottlenecks?: string[]; // itemIds that are under-supplied
}

export type PlannerNode = Node<PlannerNodeData>;

export interface PlannerEdgeData extends Record<string, unknown> {
    manualFlow?: number;
    actualFlow?: number;
}

export type PlannerEdge = Edge<PlannerEdgeData>;

interface PlannerState {
    nodes: PlannerNode[];
    edges: PlannerEdge[];
    isSidebarVisible: boolean;
    toggleSidebar: () => void;
    onNodesChange: (changes: NodeChange<PlannerNode>[], recipes: Record<string, any>) => void;
    onEdgesChange: (changes: EdgeChange[], recipes: Record<string, any>) => void;
    onConnect: (connection: Connection, recipes: Record<string, any>) => void;
    addNode: (node: PlannerNode, recipes: Record<string, any>) => void;
    deleteNode: (nodeId: string, recipes: Record<string, any>) => void;
    deleteEdge: (edgeId: string, recipes: Record<string, any>) => void;
    updateNodeData: (nodeId: string, data: Partial<PlannerNodeData>, recipes: Record<string, any>) => void;
    updateEdgeData: (edgeId: string, data: Partial<PlannerEdgeData>, recipes: Record<string, any>) => void;
    clearPlanner: () => void;
    calculateFlows: (recipes: Record<string, any>) => void;
}

export const usePlannerStore = create<PlannerState>()(
    persist(
        (set, get) => ({
            nodes: [],
            edges: [],
            isSidebarVisible: true,
            toggleSidebar: () => set((state) => ({ isSidebarVisible: !state.isSidebarVisible })),

            calculateFlows: (recipes) => {
                const { nodes, edges } = get();
                if (nodes.length === 0) return;

                const nodeMap = new Map<string, PlannerNode>();
                nodes.forEach(n => {
                    nodeMap.set(n.id, {
                        ...n,
                        data: {
                            ...n.data,
                            inputs: {} as Record<string, number>,
                            outputs: {} as Record<string, number>,
                            theoreticalOutputs: {} as Record<string, number>,
                            bottlenecks: [] as string[]
                        }
                    });
                });

                const edgeMap = new Map<string, PlannerEdge>(edges.map(e => [e.id, { ...e, data: { ...e.data, actualFlow: 0 } }]));

                // 1. Initialize Resources (Always output at full capacity/yield)
                nodeMap.forEach(node => {
                    if (node.data.isResource && node.data.resourceId) {
                        const rate = (node.data.outputRate || 60) * (node.data.efficiency / 100) * (node.data.machineCount || 1);
                        const outputs = node.data.outputs as Record<string, number>;
                        const theoreticalOutputs = node.data.theoreticalOutputs as Record<string, number>;
                        outputs[node.data.resourceId] = rate;
                        theoreticalOutputs[node.data.resourceId] = rate;
                    }
                });

                // 2. Propagate flows (approximate using passes for convergence)
                for (let i = 0; i < 20; i++) {
                    let changed = false;

                    // CRITICAL FIX: Reset inputs at the start of each pass to prevent accumulation
                    nodeMap.forEach(node => {
                        if (!node.data.isResource) {
                            node.data.inputs = {};
                        }
                    });

                    // Aggregate inputs from edges
                    edgeMap.forEach(edge => {
                        const source = nodeMap.get(edge.source);
                        const target = nodeMap.get(edge.target);
                        if (source && target && edge.sourceHandle) {
                            const itemId = edge.sourceHandle;
                            const sourceOutputs = (source.data.outputs || {}) as Record<string, number>;
                            const sourceOutput = sourceOutputs[itemId] || 0;

                            // Multi-connect split logic: respect manual overrides
                            const outgoingEdgesFromPort = Array.from(edgeMap.values()).filter(e => e.source === edge.source && e.sourceHandle === edge.sourceHandle);
                            const manualOverrides = outgoingEdgesFromPort.filter(e => e.data?.manualFlow !== undefined);
                            const automaticEdges = outgoingEdgesFromPort.filter(e => e.data?.manualFlow === undefined);

                            let manualTotal = 0;
                            manualOverrides.forEach(e => manualTotal += (e.data?.manualFlow || 0));

                            let splitFlow = 0;
                            if (edge.data?.manualFlow !== undefined) {
                                // Locked flow cannot exceed total supply
                                splitFlow = Math.min(edge.data.manualFlow, sourceOutput);
                            } else {
                                const remainingFlow = Math.max(0, sourceOutput - manualTotal);
                                splitFlow = automaticEdges.length > 0 ? remainingFlow / automaticEdges.length : 0;
                            }

                            // NEW: Limit by target's maximum input capacity for this item
                            if (target.data.recipeId && recipes[target.data.recipeId]) {
                                const recipe = recipes[target.data.recipeId];
                                const ingredient = recipe.ingredients.find((ing: any) => ing.item === itemId);
                                if (ingredient) {
                                    const maxIntake = (ingredient.amount / recipe.time) * 60 * (target.data.efficiency / 100) * (target.data.machineCount || 1);
                                    // How much has target already received from other edges?
                                    const alreadyReceived = ((target.data.inputs || {}) as Record<string, number>)[itemId] || 0;
                                    const remainingCapacity = Math.max(0, maxIntake - alreadyReceived);
                                    splitFlow = Math.min(splitFlow, remainingCapacity);
                                }
                            }

                            edge.data = { ...edge.data, actualFlow: splitFlow };
                            const targetInputs = (target.data.inputs || {}) as Record<string, number>;
                            targetInputs[itemId] = (targetInputs[itemId] || 0) + splitFlow;
                        }
                    });

                    // Calculate outputs based on inputs and recipes
                    nodeMap.forEach(node => {
                        if (node.data.isResource || !node.data.recipeId) return;

                        const recipe = recipes[node.data.recipeId];
                        if (!recipe) return;

                        let throughput = 1.0;
                        const bottlenecks: string[] = [];
                        const theoreticalOutputs: Record<string, number> = {};

                        recipe.ingredients.forEach((ing: any) => {
                            const required = (ing.amount / recipe.time) * 60 * (node.data.efficiency / 100) * (node.data.machineCount || 1);
                            const nodeInputs = (node.data.inputs || {}) as Record<string, number>;
                            const available = nodeInputs[ing.item] || 0;

                            if (required > 0) {
                                const factor = available / required;
                                if (factor < throughput - 0.0001) { // Small epsilon for float stable
                                    throughput = factor;
                                    bottlenecks.push(ing.item);
                                }
                            }
                        });

                        // Important: Throughput cannot exceed 1.0 (machine capacity limit)
                        throughput = Math.min(1.0, throughput);

                        node.data.bottlenecks = bottlenecks;

                        const newOutputs: Record<string, number> = {};
                        recipe.products.forEach((prod: any) => {
                            const baseRate = (prod.amount / recipe.time) * 60 * (node.data.efficiency / 100) * (node.data.machineCount || 1);
                            theoreticalOutputs[prod.item] = baseRate;
                            newOutputs[prod.item] = baseRate * throughput;
                        });

                        node.data.theoreticalOutputs = theoreticalOutputs;
                        const oldOutputsJSON = JSON.stringify(node.data.outputs);
                        node.data.outputs = newOutputs;
                        if (JSON.stringify(newOutputs) !== oldOutputsJSON) changed = true;
                    });

                    if (!changed) break;
                }

                set({
                    nodes: Array.from(nodeMap.values()),
                    edges: Array.from(edgeMap.values())
                });
            },

            onNodesChange: (changes, recipes) => {
                set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) }));
                get().calculateFlows(recipes);
            },

            onEdgesChange: (changes, recipes) => {
                set((state) => ({ edges: applyEdgeChanges(changes, state.edges) as PlannerEdge[] }));
                get().calculateFlows(recipes);
            },

            onConnect: (connection, recipes) => {
                set((state) => ({
                    edges: addEdge({
                        ...connection,
                        type: 'customEdge',
                        animated: true,
                        style: { stroke: '#FA9549' },
                        data: { actualFlow: 0 }
                    }, state.edges) as PlannerEdge[],
                }));
                get().calculateFlows(recipes);
            },

            addNode: (node, recipes) => {
                set((state) => ({ nodes: [...state.nodes, node] }));
                get().calculateFlows(recipes);
            },

            deleteNode: (nodeId, recipes) => {
                set((state) => ({
                    nodes: state.nodes.filter((node) => node.id !== nodeId),
                    edges: state.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
                }));
                get().calculateFlows(recipes);
            },

            deleteEdge: (edgeId, recipes) => {
                set((state) => ({
                    edges: state.edges.filter((edge) => edge.id !== edgeId),
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

            updateEdgeData: (edgeId, data, recipes) => {
                set((state) => ({
                    edges: state.edges.map((edge) => {
                        if (edge.id === edgeId) {
                            return { ...edge, data: { ...edge.data, ...data } };
                        }
                        return edge;
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
