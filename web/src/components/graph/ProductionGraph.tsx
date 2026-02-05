'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { ProductionGraph as GraphType, RecipeNode } from '@/types';
import { getItemIconPath } from '@/lib/utils';
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
                background: '#2A2E35',
                border: FICSIT_ORANGE,
                highlight: { background: '#2A2E35', border: '#FFF' },
            };
            const borderWidth = 2;
            let font = { color: FICSIT_ORANGE, size: 14, face: 'Inter, monospace', bold: true };

            if (node.is_base_resource) {
                color.border = '#4ADE80';
                font.color = '#4ADE80'; // Green for extraction
            } else if (node.is_surplus_node) {
                color.border = '#A855F7';
                font.color = '#A855F7'; // Purple for surplus
            } else if (node.is_alternate) {
                color.border = '#F59E0B';
                font.color = '#F59E0B'; // Yellow for alternates
            } else if (node.is_end_product_node) {
                color = {
                    background: '#A855F7',
                    border: '#A855F7',
                    highlight: { background: '#A855F7', border: '#FFF' },
                };
                font.color = '#A855F7'; // Purple for end product (output items)
                font.size = 16;
            } else {
                // Standard recipes
                font.color = '#FA9549'; // Orange for standard
            }

            return {
                id: node.node_id,
                label: formatNodeLabel(node),
                image: getItemIconPath(node.item_id || 'desc_ironingot_c', 256),
                shape: 'image',
                color: color,
                borderWidth,
                font: font,
                size: 30, // Adjust image size
                shadow: { enabled: true, color: 'rgba(0,0,0,0.5)', size: 10, x: 5, y: 5 },
            };
        });
    }, []);

    const buildEdges = useCallback((recipeNodes: Record<string, RecipeNode>) => {
        const edges: any[] = [];
        let edgeId = 0;

        // Pre-calculate total production per item
        const itemTotalProduction: Record<string, number> = {};
        Object.values(recipeNodes).forEach(node => {
            Object.entries(node.outputs).forEach(([item, amount]) => {
                itemTotalProduction[item] = (itemTotalProduction[item] || 0) + amount;
            });
        });

        for (const [sourceId, sourceNode] of Object.entries(recipeNodes)) {
            for (const [outputItem, outputRate] of Object.entries(sourceNode.outputs)) {
                for (const [targetId, targetNode] of Object.entries(recipeNodes)) {
                    if (sourceId === targetId) continue;

                    const inputRate = targetNode.inputs[outputItem];
                    const totalProd = itemTotalProduction[outputItem] || 0;

                    if (inputRate && inputRate > 0 && totalProd > 0) {
                        // Calculate proportional flow: (SourceOutput / TotalSupply) * TargetDemand
                        const flowShare = (outputRate / totalProd) * inputRate;

                        if (flowShare > 0.001) {
                            edges.push({
                                id: `edge_${edgeId++}`,
                                from: sourceId,
                                to: targetId,
                                label: `${flowShare.toFixed(1)}/min`,
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
                const nodesWithPos = nodesData.map((node, index) => {
                    const pos = layouted.children?.find((c: any) => c.id === node.id);
                    if (pos) {
                        return { ...node, x: pos.x, y: pos.y };
                    }
                    // Fallback: Grid position for unlayouted nodes
                    console.warn(`Node ${node.id} missing ELK position, using fallback.`);
                    return {
                        ...node,
                        x: 100 + (index % 5) * 250,
                        y: 800 + Math.floor(index / 5) * 150
                    };
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
