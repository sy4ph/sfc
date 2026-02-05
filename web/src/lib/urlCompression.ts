
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { PlannerNode, PlannerEdge } from '@/stores/plannerStore';
import { Edge, Node } from '@xyflow/react';

// Minified interfaces for URL storage
interface MinifiedNode {
    i: string;        // id
    t: string;        // type
    x: number;        // position.x
    y: number;        // position.y
    d: any;           // data (stripped)
}

interface MinifiedEdge {
    i: string;        // id
    s: string;        // source
    t: string;        // target
    sh: string;       // sourceHandle
    th: string;       // targetHandle
    d?: any;          // data (flow)
}

interface MinifiedPlan {
    v: number;        // version
    n: MinifiedNode[];
    e: MinifiedEdge[];
}

const PLAN_VERSION = 1;

/**
 * Compress planner state to a URL-safe string
 */
export function compressPlan(nodes: PlannerNode[], edges: PlannerEdge[]): string {
    const minifiedNodes: MinifiedNode[] = nodes.map(node => ({
        i: node.id,
        t: node.type || 'default',
        x: Math.round(node.position.x),
        y: Math.round(node.position.y),
        d: stripNodeData(node.data)
    }));

    const minifiedEdges: MinifiedEdge[] = edges.map(edge => ({
        i: edge.id,
        s: edge.source,
        t: edge.target,
        sh: edge.sourceHandle || '',
        th: edge.targetHandle || '',
        d: edge.data ? { actualFlow: edge.data.actualFlow } : undefined
    }));

    const plan: MinifiedPlan = {
        v: PLAN_VERSION,
        n: minifiedNodes,
        e: minifiedEdges
    };

    return compressToEncodedURIComponent(JSON.stringify(plan));
}

/**
 * Decompress a URL string back to planner state
 */
export function decompressPlan(compressed: string): { nodes: PlannerNode[], edges: PlannerEdge[] } | null {
    try {
        const decompressed = decompressFromEncodedURIComponent(compressed);
        if (!decompressed) return null;

        const plan: MinifiedPlan = JSON.parse(decompressed);

        if (plan.v !== PLAN_VERSION) {
            console.warn('Plan version mismatch, attempting best-effort load');
        }

        const nodes: PlannerNode[] = plan.n.map(n => ({
            id: n.i,
            type: n.t,
            position: { x: n.x, y: n.y },
            data: n.d
        }));

        const edges: PlannerEdge[] = plan.e.map(e => ({
            id: e.i,
            source: e.s,
            target: e.t,
            sourceHandle: e.sh,
            targetHandle: e.th,
            type: 'customEdge', // Force correct type
            animated: true,
            style: { stroke: '#FA9549', strokeWidth: 2 },
            data: e.d
        }));

        return { nodes, edges };
    } catch (e) {
        console.error('Failed to decompress plan:', e);
        return null;
    }
}

/**
 * Strip calculated or redundant data to save space
 */
function stripNodeData(data: any): any {
    // Keep essential config
    return {
        machineId: data.machineId,
        recipeId: data.recipeId,
        efficiency: data.efficiency,
        machineCount: data.machineCount,
        isResource: data.isResource,
        resourceId: data.resourceId,
        outputRate: data.outputRate,
        label: data.label, // for group nodes
        // Do NOT store calculated inputs/outputs if they can be re-derived (optional optimization)
        // For now, keep it simple and store what's needed for rendering
    };
}
