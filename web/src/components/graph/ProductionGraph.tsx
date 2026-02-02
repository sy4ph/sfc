'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { ProductionGraph as GraphType, RecipeNode } from '@/types';
import { GraphControls } from './GraphControls';
import { GraphTooltip } from './GraphTooltip';
import { GraphLegend } from './GraphLegend';

interface ProductionGraphProps {
    graph: GraphType;
    onNodeClick?: (nodeId: string) => void;
}

interface TooltipState {
    x: number;
    y: number;
    nodeId: string | null;
}

export function ProductionGraph({ graph, onNodeClick }: ProductionGraphProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const networkRef = useRef<any>(null);
    const [tooltip, setTooltip] = useState<TooltipState>({ x: 0, y: 0, nodeId: null });

    const buildNodes = useCallback((recipeNodes: Record<string, RecipeNode>) => {
        return Object.values(recipeNodes).map((node) => {
            // FICSIT Theme Colors
            const FICSIT_ORANGE = '#FA9549';
            const FICSIT_BLUE = '#5F6672'; // Dark Grey/Blue
            const FICSIT_WHITE = '#EFEFEF';

            let color = {
                background: '#2A2E35', // Dark background
                border: FICSIT_ORANGE,
                highlight: { background: '#2A2E35', border: '#FFF' },
            };
            let shape = 'box';
            const borderWidth = 2;
            let font = { color: '#EFEFEF', size: 14, face: 'Inter, monospace' };

            if (node.is_base_resource) {
                // Raw Resources: Circle, No Border (or different border)
                color = {
                    background: '#2A2E35',
                    border: '#4ADE80', // Green
                    highlight: { background: '#2A2E35', border: '#FFF' },
                };
                shape = 'ellipse';
                font.color = '#4ADE80';
            } else if (node.is_alternate) {
                // Alternate: Dashed border logic (handled by vis-network shapeProperties usually, but here we stick to color)
                color.border = '#F59E0B'; // Amber
            } else if (node.is_end_product_node) {
                // End Product: Highlighted
                color = {
                    background: FICSIT_ORANGE,
                    border: FICSIT_ORANGE,
                    highlight: { background: FICSIT_ORANGE, border: '#FFF' },
                };
                font.color = '#1A1D21'; // Dark text on orange
                font.size = 16;
            }

            return {
                id: node.node_id,
                label: formatNodeLabel(node),
                color: color,
                shape,
                borderWidth,
                font: font,
                margin: 12,
                shadow: { enabled: true, color: 'rgba(0,0,0,0.5)', size: 10, x: 5, y: 5 },
            };
        });
    }, []);

    const buildEdges = useCallback((recipeNodes: Record<string, RecipeNode>) => {
        const edges: any[] = [];
        let edgeId = 0;

        for (const [sourceId, sourceNode] of Object.entries(recipeNodes)) {
            for (const [outputItem, outputRate] of Object.entries(sourceNode.outputs)) {
                for (const [targetId, targetNode] of Object.entries(recipeNodes)) {
                    if (sourceId === targetId) continue;
                    const inputRate = targetNode.inputs[outputItem];
                    if (inputRate && inputRate > 0) {
                        edges.push({
                            id: `edge_${edgeId++}`,
                            from: sourceId,
                            to: targetId,
                            label: `${inputRate.toFixed(1)}/min`,
                            arrows: 'to',
                            color: { color: '#4B5563', opacity: 0.8, highlight: '#FA9549' },
                            width: 2,
                            font: { size: 10, color: '#9CA3AF', strokeWidth: 2, strokeColor: '#1A1D21', align: 'horizontal' },
                            smooth: { enabled: true, type: 'cubicBezier', roundness: 0.5 },
                            dashes: sourceNode.is_alternate, // Dash edges from alternate recipes
                        });
                    }
                }
            }
        }
        return edges;
    }, []);

    useEffect(() => {
        if (!containerRef.current || typeof window === 'undefined') return;

        const initNetwork = async () => {
            const vis = await import('vis-network/standalone');
            // Import ELK bundled version for client-side
            const ELK = (await import('elkjs/lib/elk.bundled.js' as any)).default;
            const elk = new ELK();

            const nodesData = buildNodes(graph.recipe_nodes);
            const edgesData = buildEdges(graph.recipe_nodes);

            const elkGraph = {
                id: 'root',
                layoutOptions: {
                    'elk.algorithm': 'layered',
                    'elk.direction': 'RIGHT',
                    'elk.spacing.nodeNode': '80',
                    'elk.layered.spacing.nodeNodeBetweenLayers': '120',
                },
                children: nodesData.map(n => ({ id: n.id, width: 220, height: 80 })),
                edges: edgesData.map(e => ({ id: e.id, sources: [e.from], targets: [e.to] })),
            };

            try {
                const layouted = await elk.layout(elkGraph);
                const nodesWithPos = nodesData.map(node => {
                    const pos = layouted.children?.find((c: any) => c.id === node.id);
                    return pos ? { ...node, x: pos.x, y: pos.y } : node;
                });

                const options = {
                    physics: {
                        enabled: false, // We use ELK for layout
                    },
                    interaction: {
                        hover: true,
                        tooltipDelay: 200,
                        zoomView: true,
                        dragView: true,
                        navigationButtons: false,
                    },
                    nodes: {
                        borderWidth: 2,
                        shadow: { enabled: true, color: 'rgba(0,0,0,0.5)', size: 10, x: 5, y: 5 },
                        shapeProperties: {
                            borderRadius: 4, // More squared look
                        }
                    },
                    edges: {
                        smooth: { enabled: true, type: 'cubicBezier', forceDirection: 'horizontal', roundness: 0.5 },
                        arrows: { to: { enabled: true, scaleFactor: 1 } },
                        color: { inherit: false },
                    },
                };

                const network = new vis.Network(
                    containerRef.current!,
                    { nodes: nodesWithPos as any, edges: edgesData as any },
                    options as any
                );

                network.on('click', (params: any) => {
                    if (params.nodes.length > 0 && onNodeClick) {
                        onNodeClick(params.nodes[0]);
                    }
                });

                network.on('hoverNode', (params: any) => {
                    const { pointer } = params;
                    setTooltip({
                        x: pointer.DOM.x,
                        y: pointer.DOM.y,
                        nodeId: params.node
                    });
                });

                network.on('blurNode', () => {
                    setTooltip(prev => ({ ...prev, nodeId: null }));
                });

                network.on('dragging', () => {
                    setTooltip(prev => ({ ...prev, nodeId: null }));
                });

                networkRef.current = network;

                setTimeout(() => {
                    if (network) {
                        network.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
                    }
                }, 100);
            } catch (err) {
                console.error('ELK Layout failed:', err);
                const fallbackOptions = {
                    layout: { hierarchical: { enabled: true, direction: 'LR' } },
                    physics: { enabled: false },
                };
                const network = new vis.Network(
                    containerRef.current!,
                    { nodes: nodesData as any, edges: edgesData as any },
                    fallbackOptions as any
                );
                networkRef.current = network;
            }
        };

        initNetwork();

        return () => {
            if (networkRef.current) {
                networkRef.current.destroy();
            }
        };
    }, [graph, buildNodes, buildEdges, onNodeClick]);

    const handleFit = () => networkRef.current?.fit();
    const handleZoomIn = () => networkRef.current?.moveTo({ scale: (networkRef.current?.getScale() || 1) * 1.3 });
    const handleZoomOut = () => networkRef.current?.moveTo({ scale: (networkRef.current?.getScale() || 1) / 1.3 });

    return (
        <div className="relative h-full min-h-[400px] bg-surface-high rounded-2xl overflow-hidden border border-border shadow-inner group">
            <div ref={containerRef} className="w-full h-full" />

            {/* Tooltip Overlay */}
            {tooltip.nodeId && (
                <GraphTooltip
                    node={graph.recipe_nodes[tooltip.nodeId]}
                    x={tooltip.x}
                    y={tooltip.y}
                />
            )}

            {/* Controls */}
            <GraphControls
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onFit={handleFit}
            />

            {/* Legend */}
            <GraphLegend />
        </div>
    );
}

function formatNodeLabel(node: RecipeNode): string {
    if (node.is_base_resource) return node.recipe_name;
    return `${node.recipe_name}\n${node.machine_display}`;
}
