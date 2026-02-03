'use client';

import React, { memo, useMemo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import Image from 'next/image';
import { getItemIconPath, getMachineName } from '@/lib/utils';
import { usePlannerStore, useRecipeStore } from '@/stores';
import { PlannerNode, PlannerNodeData } from '@/stores/plannerStore';

export const ProductionNode = memo((props: NodeProps<PlannerNode>) => {
    const { id, data, selected } = props;
    const { updateNodeData, deleteNode } = usePlannerStore();
    const { recipes } = useRecipeStore();

    // Type safe access to nested data
    const nodeData = data as PlannerNodeData;
    const isResource = !!nodeData.isResource;
    const machineId = nodeData.machineId as string | undefined;
    const resourceId = nodeData.resourceId as string | undefined;
    const recipeId = nodeData.recipeId as string | undefined;
    const customName = nodeData.customName as string | undefined;
    const efficiency = (nodeData.efficiency as number) ?? 100;
    const machineCount = (nodeData.machineCount as number) ?? 1;
    const outputRate = nodeData.outputRate as number | undefined;

    const machineName = machineId ? getMachineName(machineId) : 'Resource';
    const iconKey = isResource ? (resourceId || '') : (machineId || '');

    // Get available recipes for this machine
    const availableRecipes = useMemo(() => {
        if (!machineId) return [];
        return Object.values(recipes).filter(r =>
            r.producedIn.includes(machineId) ||
            r.producedIn.some(m => m.includes(machineId))
        );
    }, [recipes, machineId]);

    const handleRecipeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updateNodeData(id, { recipeId: e.target.value });
    };

    const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value) || 1;
        updateNodeData(id, { machineCount: Math.max(1, val) });
    };

    const handleEfficiencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value) || 100;
        updateNodeData(id, { efficiency: Math.max(1, val) });
    };

    return (
        <div className={`
            min-w-[220px] bg-surface/90 backdrop-blur-xl rounded-2xl border-2 transition-all duration-300
            ${selected ? 'border-primary shadow-[0_0_30px_rgba(250,149,73,0.3)] scale-[1.02]' : 'border-border/50 hover:border-border shadow-2xl'}
        `}>
            {/* Input Port - Only for non-resources */}
            {!isResource && (
                <Handle
                    type="target"
                    position={Position.Left}
                    className="!w-4 !h-4 !bg-primary !border-4 !border-surface-higher !-left-2 transition-transform hover:scale-125"
                />
            )}

            <div className="p-4 relative">
                {/* Delete Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); deleteNode(id); }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-full flex items-center justify-center border border-red-500/30 transition-all opacity-0 group-hover:opacity-100 group-focus:opacity-100 focus:opacity-100 group-hover-visible"
                    title="Delete Node"
                    style={{ opacity: selected ? 1 : undefined }}
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex items-center gap-4 mb-4">
                    <div className="relative w-12 h-12 rounded-xl bg-bg/50 p-2 border border-border/30 shadow-inner">
                        <Image
                            src={getItemIconPath(iconKey)}
                            alt=""
                            fill
                            className="object-contain"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-black uppercase tracking-wider text-text leading-tight truncate">
                            {customName || machineName}
                        </h3>
                        <p className="text-[10px] font-bold text-text-dim/50 uppercase tracking-widest mt-0.5">
                            {isResource ? 'Extraction' : 'Factory Node'}
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    {!isResource && (
                        <div className="bg-bg/40 rounded-xl p-2.5 border border-border/30 hover:bg-bg/60 transition-colors group relative">
                            <span className="text-[8px] font-black text-text-dim/60 uppercase tracking-widest block mb-1">Recipe Configuration</span>
                            <select
                                value={recipeId || ''}
                                onChange={handleRecipeChange}
                                className="w-full bg-transparent text-[10px] font-bold text-text outline-none appearance-none cursor-pointer group-hover:text-primary transition-colors pr-4"
                            >
                                <option value="" disabled className="bg-surface-higher text-text-dim">Select Recipe...</option>
                                {availableRecipes.map(r => (
                                    <option key={r.id} value={r.id} className="bg-surface-higher text-text">
                                        {r.name}
                                    </option>
                                ))}
                            </select>
                            <svg className="absolute right-2.5 bottom-2.5 w-3 h-3 text-text-dim/40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <span className="text-[8px] font-black text-text-dim/60 uppercase tracking-widest block">Count</span>
                            <input
                                type="number"
                                value={machineCount}
                                onChange={handleCountChange}
                                className="w-full bg-bg/40 rounded-lg p-1.5 border border-border/30 text-[10px] font-bold text-text outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[8px] font-black text-text-dim/60 uppercase tracking-widest block">Clock %</span>
                            <input
                                type="number"
                                value={efficiency}
                                onChange={handleEfficiencyChange}
                                className="w-full bg-bg/40 rounded-lg p-1.5 border border-border/30 text-[10px] font-bold text-text outline-none focus:border-accent/50 transition-colors"
                            />
                        </div>
                    </div>

                    {!isResource && (
                        <div className="w-full h-1.5 bg-bg/60 rounded-full overflow-hidden border border-border/20">
                            <div
                                className="h-full bg-gradient-to-r from-accent/50 to-accent shadow-[0_0_10px_rgba(250,149,73,0.5)] transition-all duration-700 ease-out"
                                style={{ width: `${Math.min(250, efficiency) / 2.5}%` }}
                            />
                        </div>
                    )}
                </div>

                {isResource && (
                    <div className="mt-3 flex items-center justify-between bg-bg/40 rounded-xl p-2.5 border border-border/30">
                        <span className="text-[9px] font-black text-text-dim uppercase tracking-widest">Base Rate</span>
                        <span className="text-[10px] font-black text-green-400 font-mono">{outputRate || 60}<span className="text-[8px] opacity-60 ml-0.5">m³</span></span>
                    </div>
                )}
            </div>

            {/* Output Port */}
            <Handle
                type="source"
                position={Position.Right}
                className="!w-4 !h-4 !bg-accent !border-4 !border-surface-higher !-right-2 transition-transform hover:scale-125"
            />

            {/* Decorator Dot */}
            <div className={`
                absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full border-2 border-surface
                ${recipeId || isResource ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]'}
            `} />
        </div>
    );
});

ProductionNode.displayName = 'ProductionNode';
