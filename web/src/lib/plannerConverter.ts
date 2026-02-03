/**
 * Planner Converter Utilities
 * Converts between Calculator results and Factory Planner format,
 * and handles .sfc file import/export.
 */

import { CalculateResponse, RecipeNode } from '@/types';
import { PlannerNode, PlannerEdge, PlannerNodeData } from '@/stores/plannerStore';

// SFC File Format Version
const SFC_VERSION = '1.0';

export interface SFCFile {
    version: string;
    exportedAt: string;
    name?: string;
    nodes: PlannerNode[];
    edges: PlannerEdge[];
}

/**
 * Convert Calculator API response to Factory Planner nodes and edges.
 * Auto-layouts nodes in a rough grid pattern.
 */
export function convertCalculationToPlanner(response: CalculateResponse): { nodes: PlannerNode[], edges: PlannerEdge[] } {
    const { production_graph } = response;
    const recipeNodes = production_graph.recipe_nodes;

    const nodes: PlannerNode[] = [];
    const edges: PlannerEdge[] = [];

    // Track which node produces which items
    const itemProducers: Map<string, string> = new Map(); // itemId -> nodeId

    // First pass: Create nodes and track producers
    const nodeEntries = Object.entries(recipeNodes);
    const gridCols = Math.ceil(Math.sqrt(nodeEntries.length));

    nodeEntries.forEach(([nodeId, recipeNode], index) => {
        const row = Math.floor(index / gridCols);
        const col = index % gridCols;

        // Position nodes in a grid with spacing
        const x = 100 + col * 320;
        const y = 100 + row * 400;

        const nodeData: PlannerNodeData = {
            machineId: recipeNode.machine_type,
            recipeId: recipeNode.is_base_resource ? undefined : recipeNode.recipe_id,
            efficiency: Math.round(recipeNode.machine_efficiency),
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

        // Track which items this node produces
        Object.keys(recipeNode.outputs).forEach(itemId => {
            itemProducers.set(itemId, nodeId);
        });
    });

    // Second pass: Create edges based on inputs matching outputs
    nodeEntries.forEach(([nodeId, recipeNode]) => {
        if (recipeNode.is_base_resource || recipeNode.is_end_product_node || recipeNode.is_surplus_node) {
            return; // Base resources and special nodes don't consume
        }

        Object.entries(recipeNode.inputs).forEach(([itemId, amount]) => {
            const producerNodeId = itemProducers.get(itemId);
            if (producerNodeId && amount > 0) {
                const edge: PlannerEdge = {
                    id: `e-${producerNodeId}-${nodeId}-${itemId}`,
                    source: producerNodeId,
                    target: nodeId,
                    sourceHandle: itemId,
                    targetHandle: itemId,
                    type: 'customEdge',
                    animated: true,
                    style: { stroke: '#FA9549', strokeWidth: 2 },
                    data: { actualFlow: amount },
                };
                edges.push(edge);
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
