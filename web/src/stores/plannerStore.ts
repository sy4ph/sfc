import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';
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
    efficiency?: number;
    machineCount?: number;
    customName?: string;
    isResource?: boolean;
    resourceId?: string;
    outputRate?: number; // Base rate for resources
    inputs?: Record<string, number>; // itemId -> actual incoming rate
    outputs?: Record<string, number>; // itemId -> actual outgoing rate
    theoreticalOutputs?: Record<string, number>; // Potential at current clock speed
    bottlenecks?: string[]; // itemIds that are under-supplied
    label?: string; // For GroupNode
    text?: string; // For NoteNode
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
    copySelection: () => void;
    paste: (recipes: Record<string, any>) => void;
    calculateFlows: (recipes: Record<string, any>) => void;
    importNodes: (nodes: PlannerNode[], edges: PlannerEdge[], recipes: Record<string, any>) => void;
    assignParent: (nodeId: string, parentId: string | undefined) => void;
}

/**
 * Sort nodes so that parent nodes always come before their children.
 * This is required by React Flow - parent nodes must appear in the array
 * before any nodes that reference them via parentId.
 */
function sortNodesWithParentsFirst(nodes: PlannerNode[]): PlannerNode[] {
    // Separate parent nodes (groups) and child nodes
    const parentNodes = nodes.filter(n => n.type === 'group');
    const childNodesWithParent = nodes.filter(n => n.parentId && n.type !== 'group');
    const rootNodes = nodes.filter(n => !n.parentId && n.type !== 'group');

    // Return: parent nodes first, then root nodes, then child nodes
    return [...parentNodes, ...rootNodes, ...childNodesWithParent];
}

// PERF: Debounce timer for flow calculation
let flowCalcTimer: ReturnType<typeof setTimeout> | null = null;
const FLOW_CALC_DEBOUNCE_MS = 100; // 100ms debounce

/**
 * Strip computed fields from nodes for serialization/history.
 * Only stores essential configuration, not calculated data.
 */
function stripComputedFields(nodes: PlannerNode[]): PlannerNode[] {
    return nodes.map(n => ({
        ...n,
        data: {
            ...n.data,
            inputs: undefined,
            outputs: undefined,
            theoreticalOutputs: undefined,
            bottlenecks: undefined,
        }
    }));
}

export const usePlannerStore = create<PlannerState>()(
    temporal(
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
                    // For SourceNodes (isResource), the outputRate IS the final rate - no modifiers needed
                    nodeMap.forEach(node => {
                        if (node.data.isResource && node.data.resourceId) {
                            const rate = (node.data.outputRate as number) || 60;
                            const outputs = node.data.outputs as Record<string, number>;
                            const theoreticalOutputs = node.data.theoreticalOutputs as Record<string, number>;
                            outputs[node.data.resourceId] = rate;
                            theoreticalOutputs[node.data.resourceId] = rate;
                        }
                    });

                    // 2. Propagate flows (approximate using passes for convergence)
                    // Increased passes to 100 to handle complex cycles (e.g. Excited Photonic Matter)
                    for (let i = 0; i < 100; i++) {
                        let changed = false;

                        // CRITICAL FIX: Reset inputs at the start of each pass to prevent accumulation
                        nodeMap.forEach(node => {
                            if (!node.data.isResource) {
                                node.data.inputs = {};
                            }
                        });

                        // Aggregate inputs from edges
                        // Aggregate inputs from edges
                        // NEW: Group edges by source+handle to handle Distribution properly (Water-filling)
                        const edgesBySourcePort = new Map<string, PlannerEdge[]>();
                        edgeMap.forEach(edge => {
                            if (edge.source && edge.sourceHandle) {
                                const key = `${edge.source}__${edge.sourceHandle}`;
                                if (!edgesBySourcePort.has(key)) {
                                    edgesBySourcePort.set(key, []);
                                }
                                edgesBySourcePort.get(key)!.push(edge);
                            }
                        });

                        // Process each source port's distribution
                        edgesBySourcePort.forEach((edges, key) => {
                            const [sourceId, handleId] = key.split('__');
                            const source = nodeMap.get(sourceId);
                            if (!source) return;

                            const sourceOutputs = (source.data.outputs || {}) as Record<string, number>;
                            // Output of this port
                            const totalSourceOutput = sourceOutputs[handleId] || 0;

                            // 1. Separate Manual vs Auto
                            const manualEdges = edges.filter(e => e.data?.manualFlow !== undefined);
                            const autoEdges = edges.filter(e => e.data?.manualFlow === undefined);

                            let flowUsed = 0;

                            // 2. Fulfill Manual first
                            manualEdges.forEach(edge => {
                                const requested = edge.data!.manualFlow!;
                                const allocated = Math.min(requested, totalSourceOutput - flowUsed);
                                flowUsed += allocated;

                                // Update Edge
                                const oldFlow = edge.data?.actualFlow || 0;
                                if (Math.abs(oldFlow - allocated) > 0.0001) changed = true;
                                edge.data = { ...edge.data, actualFlow: allocated };

                                // Update Target
                                const target = nodeMap.get(edge.target);
                                if (target) {
                                    const targetInputs = (target.data.inputs || {}) as Record<string, number>;
                                    targetInputs[handleId] = (targetInputs[handleId] || 0) + allocated;
                                }
                            });

                            if (autoEdges.length === 0) return;

                            // 3. Water-filling for Auto Edges
                            let flowAvailable = Math.max(0, totalSourceOutput - flowUsed);

                            // Calculate capacity constraints for each edge
                            interface FlowRequest {
                                edge: PlannerEdge;
                                cap: number;
                                assigned: number;
                            }

                            const allRequests: FlowRequest[] = autoEdges.map(edge => {
                                let cap = Number.MAX_VALUE;
                                const target = nodeMap.get(edge.target);

                                if (target && target.data.recipeId && recipes[target.data.recipeId]) {
                                    const recipe = recipes[target.data.recipeId];
                                    const ingredient = recipe.ingredients.find((ing: any) => ing.item === handleId);
                                    if (ingredient) {
                                        const targetEfficiency = (target.data.efficiency as number) || 100;
                                        const targetMachineCount = (target.data.machineCount as number) || 1;
                                        const maxIntake = (ingredient.amount / recipe.time) * 60 * (targetEfficiency / 100) * targetMachineCount;

                                        const alreadyReceived = ((target.data.inputs || {}) as Record<string, number>)[handleId] || 0;
                                        // Allow small epsilon for floating point issues
                                        cap = Math.max(0, maxIntake - alreadyReceived + 0.0001);
                                    }
                                }
                                return { edge, cap, assigned: 0 };
                            });

                            let activeRequests = [...allRequests];

                            // Iterative distribution
                            let distributing = true;
                            while (distributing && activeRequests.length > 0 && flowAvailable > 0.0001) {
                                distributing = false;
                                const share = flowAvailable / activeRequests.length;

                                // Identify constrained requests (Cap < Share)
                                const constrained = activeRequests.filter(r => r.cap < share);

                                if (constrained.length > 0) {
                                    // Lock constrained requests
                                    constrained.forEach(r => {
                                        r.assigned = r.cap;
                                        flowAvailable -= r.assigned;
                                    });
                                    // Remove from active pool
                                    activeRequests = activeRequests.filter(r => r.cap >= share);
                                    distributing = true; // Need to redistribute surplus
                                } else {
                                    // No constraints, everyone takes the share
                                    activeRequests.forEach(r => {
                                        r.assigned = share;
                                    });
                                    flowAvailable = 0;
                                    activeRequests = [];
                                }
                            }

                            // 4. Apply flows
                            allRequests.forEach(req => {
                                const oldFlow = req.edge.data?.actualFlow || 0;
                                if (Math.abs(oldFlow - req.assigned) > 0.0001) changed = true;
                                req.edge.data = { ...req.edge.data, actualFlow: req.assigned };

                                const target = nodeMap.get(req.edge.target);
                                if (target) {
                                    const targetInputs = (target.data.inputs || {}) as Record<string, number>;
                                    targetInputs[handleId] = (targetInputs[handleId] || 0) + req.assigned;
                                }
                            });
                        });

                        // Calculate outputs based on inputs and recipes
                        nodeMap.forEach(node => {
                            if (node.data.isResource || !node.data.recipeId) return;

                            const recipe = recipes[node.data.recipeId];
                            if (!recipe) return;

                            const nodeEfficiency = (node.data.efficiency as number) || 100;
                            const nodeMachineCount = (node.data.machineCount as number) || 1;

                            let throughput = 1.0;
                            const bottlenecks: string[] = [];
                            const theoreticalOutputs: Record<string, number> = {};

                            recipe.ingredients.forEach((ing: any) => {
                                const required = (ing.amount / recipe.time) * 60 * (nodeEfficiency / 100) * nodeMachineCount;
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
                                const baseRate = (prod.amount / recipe.time) * 60 * (nodeEfficiency / 100) * nodeMachineCount;
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
                    // Only calculate flows if nodes are removed
                    // Position/Selection/Dimensions changes do not affect flow
                    const shouldRecalculate = changes.some(c => c.type === 'remove');
                    if (shouldRecalculate) {
                        get().calculateFlows(recipes);
                    }
                },

                onEdgesChange: (changes, recipes) => {
                    set((state) => ({ edges: applyEdgeChanges(changes, state.edges) as PlannerEdge[] }));
                    // Only calculate if edges are removed
                    const shouldRecalculate = changes.some(c => c.type === 'remove');
                    if (shouldRecalculate) {
                        get().calculateFlows(recipes);
                    }
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
                    set((state) => {
                        // Special handling for SourceNode: if resourceId changes, update connected edges
                        let updatedEdges = state.edges;
                        const targetNode = state.nodes.find(n => n.id === nodeId);

                        // Check if this is a SourceNode (custom source) and resourceId is changing
                        if (targetNode &&
                            targetNode.type === 'sourceNode' &&
                            data.resourceId &&
                            data.resourceId !== targetNode.data.resourceId) {

                            // Update all outgoing edges to use the new resourceId as sourceHandle
                            updatedEdges = state.edges.map(edge => {
                                if (edge.source === nodeId) {
                                    return {
                                        ...edge,
                                        sourceHandle: data.resourceId,
                                        // Reset edge flow data since item type changed
                                        data: { ...edge.data, actualFlow: 0, manualFlow: undefined }
                                    };
                                }
                                return edge;
                            });
                        }

                        // Apply node updates
                        const updatedNodes = state.nodes.map((node) => {
                            if (node.id === nodeId) {
                                return { ...node, data: { ...node.data, ...data } };
                            }
                            return node;
                        });

                        return {
                            nodes: updatedNodes,
                            edges: updatedEdges
                        };
                    });

                    // PERF: Debounce flow calculation for rapid updates (e.g., typing in inputs)
                    if (flowCalcTimer) clearTimeout(flowCalcTimer);
                    flowCalcTimer = setTimeout(() => {
                        get().calculateFlows(recipes);
                    }, FLOW_CALC_DEBOUNCE_MS);
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

                    // PERF: Debounce flow calculation
                    if (flowCalcTimer) clearTimeout(flowCalcTimer);
                    flowCalcTimer = setTimeout(() => {
                        get().calculateFlows(recipes);
                    }, FLOW_CALC_DEBOUNCE_MS);
                },

                clearPlanner: () => {
                    if (window.confirm('Are you sure you want to clear the entire planner?')) {
                        set({ nodes: [], edges: [] });
                    }
                },

                copySelection: () => {
                    const { nodes, edges } = get();
                    const selectedNodes = nodes.filter(n => n.selected);
                    if (selectedNodes.length === 0) return;

                    const selectedNodeIds = new Set(selectedNodes.map(n => n.id));
                    // Only copy edges that connect two selected nodes
                    const selectedEdges = edges.filter(e =>
                        selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target)
                    );

                    const clipboardData = {
                        nodes: selectedNodes,
                        edges: selectedEdges
                    };

                    localStorage.setItem('sfc-clipboard', JSON.stringify(clipboardData));
                    console.log('Copied to clipboard', clipboardData);
                },

                paste: (recipes: Record<string, any>) => {
                    try {
                        const clipboardJson = localStorage.getItem('sfc-clipboard');
                        if (!clipboardJson) return;

                        const clipboardData = JSON.parse(clipboardJson);
                        const { nodes: pastedNodes, edges: pastedEdges } = clipboardData as { nodes: PlannerNode[], edges: PlannerEdge[] };

                        if (!pastedNodes || pastedNodes.length === 0) return;

                        // Generate ID mapping
                        const idMap = new Map<string, string>();
                        pastedNodes.forEach(n => {
                            idMap.set(n.id, crypto.randomUUID());
                        });

                        // Offset (center of viewport would be better, but fixed offset is simpler for now)
                        // We'll apply a scatter offset so repeated pastes don't stack perfectly
                        const offset = { x: 50, y: 50 };

                        const newNodes = pastedNodes.map(n => ({
                            ...n,
                            id: idMap.get(n.id)!,
                            selected: true, // Select the new copies
                            position: {
                                x: n.position.x + offset.x,
                                y: n.position.y + offset.y
                            },
                            data: {
                                ...n.data,
                                // Reset runtime data
                                inputs: {},
                                outputs: {},
                                theoreticalOutputs: {},
                                bottlenecks: []
                            }
                        }));

                        const newEdges = pastedEdges.map(e => ({
                            ...e,
                            id: crypto.randomUUID(),
                            source: idMap.get(e.source)!,
                            target: idMap.get(e.target)!,
                            selected: true
                        }));

                        set(state => ({
                            // Deselect existing
                            nodes: [
                                ...state.nodes.map(n => ({ ...n, selected: false })),
                                ...newNodes
                            ],
                            edges: [
                                ...state.edges.map(e => ({ ...e, selected: false })),
                                ...newEdges
                            ]
                        }));

                        get().calculateFlows(recipes);
                    } catch (e) {
                        console.error('Failed to paste:', e);
                    }
                },

                importNodes: (nodes, edges, recipes) => {
                    set({ nodes, edges });
                    get().calculateFlows(recipes);
                },

                assignParent: (nodeId, parentId) => {
                    const { nodes } = get();
                    const node = nodes.find(n => n.id === nodeId);
                    if (!node) return;

                    // If no change, return
                    if (node.parentId === parentId) return;

                    let newPosition = { ...node.position };

                    if (parentId) {
                        // Moving INTO a parent
                        const parent = nodes.find(n => n.id === parentId);
                        if (!parent) return;

                        // Convert Global -> Local
                        if (node.parentId) {
                            // Local(Old) -> Global -> Local(New)
                            const oldParent = nodes.find(n => n.id === node.parentId);
                            if (oldParent) {
                                newPosition.x += oldParent.position.x;
                                newPosition.y += oldParent.position.y;
                            }
                        }

                        // Global -> New Parent Local
                        newPosition.x -= parent.position.x;
                        newPosition.y -= parent.position.y;
                    } else {
                        // Moving OUT of a parent (to Root)
                        if (node.parentId) {
                            const oldParent = nodes.find(n => n.id === node.parentId);
                            if (oldParent) {
                                // Local -> Global
                                newPosition.x += oldParent.position.x;
                                newPosition.y += oldParent.position.y;
                            }
                        }
                    }

                    // Update the node
                    let updatedNodes = nodes.map(n => n.id === nodeId ? {
                        ...n,
                        parentId,
                        extent: (parentId ? 'parent' : undefined) as 'parent' | undefined,
                        position: newPosition,
                        expandParent: !!parentId
                    } : n);

                    // CRITICAL: Sort nodes so parents always come before children
                    // This prevents "Parent node not found" errors in React Flow
                    updatedNodes = sortNodesWithParentsFirst(updatedNodes);

                    set({ nodes: updatedNodes });
                },
            }),
            {
                name: 'sfc-planner-storage',
            }
        ),
        {
            limit: 30, // PERF: Reduced from 50 to lower memory usage
            partialize: (state) => {
                // PERF: Strip computed fields from nodes to reduce history size
                // Only track essential user-editable properties
                return {
                    nodes: stripComputedFields(state.nodes),
                    edges: state.edges.map(e => ({
                        ...e,
                        data: { ...e.data, actualFlow: undefined } // Strip computed flow
                    }))
                };
            },
            equality: (pastState, currentState) => {
                // PERF: Smart equality check - only track structural changes
                // Skip history push if only computed data changed
                if (!pastState || !currentState) return false;

                const past = pastState as { nodes: PlannerNode[], edges: PlannerEdge[] };
                const curr = currentState as { nodes: PlannerNode[], edges: PlannerEdge[] };

                // Quick length check
                if (past.nodes.length !== curr.nodes.length) return false;
                if (past.edges.length !== curr.edges.length) return false;

                // Compare node essentials (not computed data) INCLUDING POSITION
                for (let i = 0; i < past.nodes.length; i++) {
                    const pn = past.nodes[i];
                    const cn = curr.nodes[i];
                    if (pn.id !== cn.id) return false;
                    if (pn.data.recipeId !== cn.data.recipeId) return false;
                    if (pn.data.machineCount !== cn.data.machineCount) return false;
                    if (pn.data.efficiency !== cn.data.efficiency) return false;
                    if (pn.data.outputRate !== cn.data.outputRate) return false;
                    if (pn.parentId !== cn.parentId) return false;
                    // Track position changes for undo
                    if (pn.position.x !== cn.position.x) return false;
                    if (pn.position.y !== cn.position.y) return false;
                }

                // Compare edges
                for (let i = 0; i < past.edges.length; i++) {
                    const pe = past.edges[i];
                    const ce = curr.edges[i];
                    if (pe.id !== ce.id) return false;
                    if (pe.source !== ce.source) return false;
                    if (pe.target !== ce.target) return false;
                }

                return true; // States are effectively equal, skip history
            }
        }
    )
);
