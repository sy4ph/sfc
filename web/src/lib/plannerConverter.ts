/**
 * Planner Converter Utilities
 * Converts between Calculator results and Factory Planner format,
 * and handles .sfc file import/export.
 */

import { CalculateResponse, RecipeNode } from '@/types';
import { PlannerNode, PlannerEdge, PlannerNodeData } from '@/stores/plannerStore';
import ELK from 'elkjs/lib/elk.bundled.js';

// SFC File Format Version
const SFC_VERSION = '1.0';

export interface SFCFile {
    version: string;
    exportedAt: string;
    name?: string;
    nodes: PlannerNode[];
    edges: PlannerEdge[];
}

const elk = new ELK();

/**
 * Convert Calculator API response to Factory Planner nodes and edges.
 * Uses ELK for proper hierarchical layout.
 */
export async function convertCalculationToPlannerAsync(response: CalculateResponse): Promise<{ nodes: PlannerNode[], edges: PlannerEdge[] }> {
    const { production_graph } = response;
    const recipeNodes = production_graph.recipe_nodes;

    const nodes: PlannerNode[] = [];
    const edges: PlannerEdge[] = [];

    // Track which node produces which items and how much
    interface ProducerInfo {
        nodeId: string;
        amount: number;
    }
    const itemProducers: Map<string, ProducerInfo[]> = new Map(); // itemId -> producers[]
    const itemTotalProduction: Map<string, number> = new Map();   // itemId -> totalAmount

    // Build ELK graph structure
    const elkNodes: any[] = [];
    const elkEdges: any[] = [];

    // First pass: Create nodes and track producers
    const nodeEntries = Object.entries(recipeNodes);

    nodeEntries.forEach(([nodeId, recipeNode]) => {
        // Estimate node size based on type
        const width = recipeNode.is_base_resource ? 200 : 300;
        const height = recipeNode.is_base_resource ? 150 : 350;

        elkNodes.push({
            id: nodeId,
            width,
            height,
        });

        // Track which items this node produces
        Object.entries(recipeNode.outputs).forEach(([itemId, amount]) => {
            const currentProducers = itemProducers.get(itemId) || [];
            currentProducers.push({ nodeId, amount });
            itemProducers.set(itemId, currentProducers);

            const currentTotal = itemTotalProduction.get(itemId) || 0;
            itemTotalProduction.set(itemId, currentTotal + amount);
        });
    });

    // Second pass: Create edges based on inputs matching outputs
    nodeEntries.forEach(([nodeId, recipeNode]) => {
        if (recipeNode.is_base_resource || recipeNode.is_end_product_node || recipeNode.is_surplus_node) {
            return;
        }

        Object.entries(recipeNode.inputs).forEach(([itemId, inputAmount]) => {
            const producers = itemProducers.get(itemId);
            const totalProduction = itemTotalProduction.get(itemId) || 0;

            if (producers && totalProduction > 0 && inputAmount > 0) {
                // Distribute input demand across producers
                producers.forEach(producer => {
                    // Calculate flow share: (ProducerOutput / TotalOutput) * ConsumerInput
                    // We use the producer's share of total supply to fulfill this consumer's demand share
                    const flowShare = (producer.amount / totalProduction) * inputAmount;

                    if (flowShare > 0.001) {
                        elkEdges.push({
                            id: `e-${producer.nodeId}-${nodeId}-${itemId}`,
                            sources: [producer.nodeId],
                            targets: [nodeId],
                        });
                    }
                });
            }
        });
    });

    // Run ELK layout
    const elkGraph = {
        id: 'root',
        layoutOptions: {
            'elk.algorithm': 'layered',
            'elk.direction': 'RIGHT',
            'elk.spacing.nodeNode': '150',
            'elk.layered.spacing.nodeNodeBetweenLayers': '250',
            'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
            'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
        },
        children: elkNodes,
        edges: elkEdges,
    };

    const layoutedGraph = await elk.layout(elkGraph);

    // Create planner nodes with layouted positions
    nodeEntries.forEach(([nodeId, recipeNode]) => {
        const elkNode = layoutedGraph.children?.find(n => n.id === nodeId);
        const x = elkNode?.x ?? 100;
        const y = elkNode?.y ?? 100;

        const nodeData: PlannerNodeData = {
            machineId: recipeNode.machine_type,
            recipeId: recipeNode.is_base_resource ? undefined : recipeNode.recipe_id,
            efficiency: recipeNode.machine_efficiency, // Keep full precision
            machineCount: recipeNode.actual_machines || 1,
            isResource: recipeNode.is_base_resource,
            resourceId: recipeNode.is_base_resource ? recipeNode.item_id : undefined,
            outputRate: recipeNode.is_base_resource ? Object.values(recipeNode.outputs)[0] : undefined,
        };

        const plannerNode: PlannerNode = {
            id: nodeId,
            type: recipeNode.is_base_resource ? 'sourceNode' : 'productionNode',
            position: { x, y },
            data: nodeData,
        };

        nodes.push(plannerNode);
    });

    // Create edges (REAL edges for the store)
    nodeEntries.forEach(([nodeId, recipeNode]) => {
        if (recipeNode.is_base_resource || recipeNode.is_end_product_node || recipeNode.is_surplus_node) {
            return;
        }

        Object.entries(recipeNode.inputs).forEach(([itemId, inputAmount]) => {
            const producers = itemProducers.get(itemId);
            const totalProduction = itemTotalProduction.get(itemId) || 0;

            if (producers && totalProduction > 0 && inputAmount > 0) {
                producers.forEach(producer => {
                    const flowShare = (producer.amount / totalProduction) * inputAmount;

                    if (flowShare > 0.001) {
                        const edge: PlannerEdge = {
                            id: `e-${producer.nodeId}-${nodeId}-${itemId}`,
                            source: producer.nodeId,
                            target: nodeId,
                            sourceHandle: itemId,
                            targetHandle: itemId,
                            type: 'customEdge',
                            animated: true,
                            style: { stroke: '#FA9549', strokeWidth: 2 },
                            data: { actualFlow: flowShare }, // Use the calculated share!
                        };
                        edges.push(edge);
                    }
                });
            }
        });
    });

    return { nodes, edges };
}

/**
 * Synchronous wrapper for convertCalculationToPlannerAsync.
 * Uses simple grid layout as fallback for immediate use.
 */
export function convertCalculationToPlanner(response: CalculateResponse): { nodes: PlannerNode[], edges: PlannerEdge[] } {
    const { production_graph } = response;
    const recipeNodes = production_graph.recipe_nodes;

    const nodes: PlannerNode[] = [];
    const edges: PlannerEdge[] = [];

    // Track which node produces which items and how much
    interface ProducerInfo {
        nodeId: string;
        amount: number;
    }
    const itemProducers: Map<string, ProducerInfo[]> = new Map(); // itemId -> producers[]
    const itemTotalProduction: Map<string, number> = new Map();   // itemId -> totalAmount

    const nodeEntries = Object.entries(recipeNodes);

    // Simple grid layout as fallback
    const gridCols = Math.ceil(Math.sqrt(nodeEntries.length));

    nodeEntries.forEach(([nodeId, recipeNode], index) => {
        const row = Math.floor(index / gridCols);
        const col = index % gridCols;
        const x = 100 + col * 350;
        const y = 100 + row * 450;

        const nodeData: PlannerNodeData = {
            machineId: recipeNode.machine_type,
            recipeId: recipeNode.is_base_resource ? undefined : recipeNode.recipe_id,
            efficiency: recipeNode.machine_efficiency, // Keep full precision, round in UI only
            machineCount: recipeNode.actual_machines || 1,
            isResource: recipeNode.is_base_resource,
            resourceId: recipeNode.is_base_resource ? recipeNode.item_id : undefined,
            outputRate: recipeNode.is_base_resource ? Object.values(recipeNode.outputs)[0] : undefined,
        };

        nodes.push({
            id: nodeId,
            type: recipeNode.is_base_resource ? 'sourceNode' : 'productionNode',
            position: { x, y },
            data: nodeData,
        });

        Object.entries(recipeNode.outputs).forEach(([itemId, amount]) => {
            const currentProducers = itemProducers.get(itemId) || [];
            currentProducers.push({ nodeId, amount });
            itemProducers.set(itemId, currentProducers);

            const currentTotal = itemTotalProduction.get(itemId) || 0;
            itemTotalProduction.set(itemId, currentTotal + amount);
        });
    });

    nodeEntries.forEach(([nodeId, recipeNode]) => {
        if (recipeNode.is_base_resource || recipeNode.is_end_product_node || recipeNode.is_surplus_node) {
            return;
        }

        Object.entries(recipeNode.inputs).forEach(([itemId, inputAmount]) => {
            const producers = itemProducers.get(itemId);
            const totalProduction = itemTotalProduction.get(itemId) || 0;

            if (producers && totalProduction > 0 && inputAmount > 0) {
                producers.forEach(producer => {
                    const flowShare = (producer.amount / totalProduction) * inputAmount;

                    if (flowShare > 0.001) {
                        edges.push({
                            id: `e-${producer.nodeId}-${nodeId}-${itemId}`,
                            source: producer.nodeId,
                            target: nodeId,
                            sourceHandle: itemId,
                            targetHandle: itemId,
                            type: 'customEdge',
                            animated: true,
                            style: { stroke: '#FA9549', strokeWidth: 2 },
                            data: { actualFlow: flowShare },
                        });
                    }
                });
            }
        });
    });

    return { nodes, edges };
}

/**
 * Export planner state to SFC file format.
 */
export function exportToSFC(nodes: PlannerNode[], edges: PlannerEdge[], name?: string): string {
    const sfcFile: SFCFile = {
        version: SFC_VERSION,
        exportedAt: new Date().toISOString(),
        name,
        nodes,
        edges,
    };
    return JSON.stringify(sfcFile, null, 2);
}

/**
 * Parse and validate SFC file content.
 * Returns null if invalid.
 */
export function parseSFCFile(content: string): SFCFile | null {
    try {
        const parsed = JSON.parse(content);

        // Basic validation
        if (!parsed.version || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
            console.error('Invalid SFC file: missing required fields');
            return null;
        }

        // Version check (allow forward compatibility for now)
        if (!parsed.version.startsWith('1.')) {
            console.warn(`SFC file version ${parsed.version} may not be fully compatible`);
        }

        return parsed as SFCFile;
    } catch (e) {
        console.error('Failed to parse SFC file:', e);
        return null;
    }
}

/**
 * Download a string as a file.
 */
export function downloadFile(content: string, filename: string) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
