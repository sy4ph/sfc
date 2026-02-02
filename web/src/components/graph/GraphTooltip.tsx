'use client';

import Image from 'next/image';
import type { RecipeNode } from '@/types';
import { getItemIconPath } from '@/lib/utils';

interface GraphTooltipProps {
    node: RecipeNode;
    x: number;
    y: number;
}

export function GraphTooltip({ node, x, y }: GraphTooltipProps) {
    if (!node) return null;

    return (
        <div
            className="absolute pointer-events-none bg-surface/95 backdrop-blur-md border border-border rounded-xl p-4 shadow-2xl z-[60] text-xs transition-opacity duration-200 animate-in fade-in zoom-in-95"
            style={{
                left: x + 20,
                top: y + 20,
                maxWidth: '280px'
            }}
        >
            <div className="space-y-3">
                <div className="font-black text-text text-sm mb-1 border-b border-border/50 pb-2 flex justify-between items-center gap-4">
                    <span className="truncate">{node.recipe_name}</span>
                    {node.is_alternate && (
                        <span className="text-[9px] bg-accent/10 text-accent px-1.5 py-0.5 rounded border border-accent/20 uppercase font-black">Alt</span>
                    )}
                </div>

                {!node.is_base_resource && (
                    <div className="flex justify-between items-center gap-4 bg-surface-high/50 p-1.5 rounded-lg border border-border/30">
                        <span className="text-text-dim font-bold uppercase tracking-tighter text-[10px]">Machine</span>
                        <span className="text-text font-bold">{node.machine_display}</span>
                    </div>
                )}

                {Object.entries(node.inputs).length > 0 && (
                    <div className="space-y-1.5">
                        <div className="text-[9px] uppercase tracking-widest text-text-dim font-black flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-primary" />
                            Inputs
                        </div>
                        <div className="grid gap-1">
                            {Object.entries(node.inputs).map(([item, rate]) => (
                                <div key={item} className="flex justify-between gap-4 items-center px-1">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="relative w-4 h-4 flex-shrink-0 bg-surface rounded p-0.5 border border-border/50">
                                            <Image
                                                src={getItemIconPath(item)}
                                                alt=""
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                        <span className="truncate opacity-80 font-medium">{item.replace('Desc_', '').replace('_C', '')}</span>
                                    </div>
                                    <span className="text-accent font-mono font-black">{rate.toFixed(1)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {Object.entries(node.outputs).length > 0 && (
                    <div className="space-y-1.5">
                        <div className="text-[9px] uppercase tracking-widest text-text-dim font-black flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-green-500" />
                            Outputs
                        </div>
                        <div className="grid gap-1">
                            {Object.entries(node.outputs).map(([item, rate]) => (
                                <div key={item} className="flex justify-between gap-4 items-center px-1">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="relative w-4 h-4 flex-shrink-0 bg-surface rounded p-0.5 border border-border/50">
                                            <Image
                                                src={getItemIconPath(item)}
                                                alt=""
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                        <span className="truncate font-semibold text-text">{item.replace('Desc_', '').replace('_C', '')}</span>
                                    </div>
                                    <span className="text-green-500 font-mono font-black">{rate.toFixed(1)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
