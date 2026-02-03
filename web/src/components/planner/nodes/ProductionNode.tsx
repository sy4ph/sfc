'use client';

import React, { memo, useMemo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import Image from 'next/image';
import { getItemIconPath, getMachineName } from '@/lib/utils';
import { calculateMachinePower } from '@/lib/powerData';
import { usePlannerStore, useRecipeStore } from '@/stores';
import { PlannerNode, PlannerNodeData } from '@/stores/plannerStore';

export const ProductionNode = memo((props: NodeProps<PlannerNode>) => {
    const { id, data, selected } = props;
    const { updateNodeData, deleteNode } = usePlannerStore();
    const { recipes } = useRecipeStore();

    // Type safe access
    const nodeData = data as PlannerNodeData;
    const isResource = !!nodeData.isResource;
    const machineId = nodeData.machineId as string | undefined;
    const resourceId = nodeData.resourceId as string | undefined;
    const recipeId = nodeData.recipeId as string | undefined;
    const customName = nodeData.customName as string | undefined;
    const efficiency = (nodeData.efficiency as number) ?? 100;
    const machineCount = (nodeData.machineCount as number) ?? 1;
    const outputRate = (nodeData.outputRate as number) ?? 60;

    const inputRates = (nodeData.inputs || {}) as Record<string, number>;
    const outputRates = (nodeData.outputs || {}) as Record<string, number>;
    const bottlenecks = (nodeData.bottlenecks || []) as string[];

    const machineName = machineId ? getMachineName(machineId) : 'Resource';
    const iconKey = isResource ? (resourceId || '') : (machineId || '');

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Get active recipe
    const activeRecipe = useMemo(() => {
        return recipeId ? recipes[recipeId] : null;
    }, [recipes, recipeId]);

    // Get available recipes for this machine
    const availableRecipes = useMemo(() => {
        if (!machineId) return [];
        return Object.values(recipes).filter(r =>
            r.producedIn.includes(machineId) ||
            r.producedIn.some(m => m.includes(machineId))
        );
    }, [recipes, machineId]);

    // Filtered recipes for dropdown
    const filteredRecipes = useMemo(() => {
        if (!searchQuery) return availableRecipes;
        return availableRecipes.filter(r =>
            r.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [availableRecipes, searchQuery]);

    const [localCount, setLocalCount] = useState(machineCount.toString());
    const [localEff, setLocalEff] = useState(efficiency.toString());
    const [localExtraction, setLocalExtraction] = useState(outputRate.toString());

    // Update local state when prop changes (from elsewhere)
    React.useEffect(() => { setLocalCount(machineCount.toString()); }, [machineCount]);
    React.useEffect(() => { setLocalEff(efficiency.toString()); }, [efficiency]);
    React.useEffect(() => { setLocalExtraction(outputRate.toString()); }, [outputRate]);

    const handleRecipeChange = (rId: string) => {
        updateNodeData(id, { recipeId: rId }, recipes);
        setIsDropdownOpen(false);
        setSearchQuery('');
    };

    const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalCount(val);
        const num = parseInt(val);
        if (!isNaN(num) && num > 0) {
            updateNodeData(id, { machineCount: num }, recipes);
        }
    };

    const handleEfficiencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalEff(val);
        const num = parseInt(val);
        if (!isNaN(num) && num > 0) {
            updateNodeData(id, { efficiency: num }, recipes);
        }
    };

    const handleExtractionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalExtraction(val);
        const num = parseInt(val);
        if (!isNaN(num) && num > 0) {
            updateNodeData(id, { outputRate: num }, recipes);
        }
    };

    const handleBlur = (type: 'count' | 'eff' | 'extract') => {
        if (type === 'count' && (localCount === '' || parseInt(localCount) < 1)) {
            setLocalCount('1');
            updateNodeData(id, { machineCount: 1 }, recipes);
        } else if (type === 'eff' && (localEff === '' || parseInt(localEff) < 1)) {
            setLocalEff('100');
            updateNodeData(id, { efficiency: 100 }, recipes);
        } else if (type === 'extract' && (localExtraction === '' || parseInt(localExtraction) < 1)) {
            setLocalExtraction('60');
            updateNodeData(id, { outputRate: 60 }, recipes);
        }
    };

    return (
        <div className={`
            min-w-[240px] bg-surface/90 backdrop-blur-xl rounded-xl border-2 transition-all duration-300 group nopan nowheel
            ${selected ? 'border-primary shadow-[0_0_30px_rgba(250,149,73,0.3)] scale-[1.02]' : 'border-border/50 hover:border-border shadow-xl'}
        `}>
            {/* Delete Button */}
            <button
                onClick={(e) => { e.stopPropagation(); deleteNode(id, recipes); }}
                className="absolute -top-3 -right-3 w-8 h-8 bg-surface-higher text-red-500 hover:bg-red-500 hover:text-white rounded-full flex items-center justify-center border border-border shadow-lg transition-all z-50 opacity-0 group-hover:opacity-100"
                style={{ opacity: selected ? 1 : undefined }}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Input Handles Section */}
            {!isResource && activeRecipe && (
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-8 py-2">
                    {activeRecipe.ingredients.map((ing) => {
                        const isStarved = bottlenecks.includes(ing.item);
                        return (
                            <div key={ing.item} className="relative w-6 h-6 flex items-center justify-center">
                                <Handle
                                    type="target"
                                    position={Position.Left}
                                    id={ing.item}
                                    className={`
                                        !w-5 !h-5 !border-4 !border-surface-higher !transition-all hover:!scale-150
                                        ${isStarved ? '!bg-red-500 !shadow-[0_0_10px_rgba(239,68,68,0.8)]' : '!bg-primary'}
                                    `}
                                />
                                {/* Port Label */}
                                <div className="absolute right-full mr-3 flex items-center gap-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    <div className="bg-surface-higher/80 backdrop-blur px-2 py-1 rounded border border-border/50 flex items-center gap-2 shadow-2xl">
                                        <Image src={getItemIconPath(ing.item)} width={14} height={14} alt="" />
                                        <span className={`text-[10px] font-black uppercase ${isStarved ? 'text-red-400' : 'text-text'}`}>
                                            {(inputRates[ing.item] || 0).toFixed(1)}/m
                                        </span>
                                    </div>
                                </div>
                                {isStarved && (
                                    <div className="absolute bottom-full mb-1 left-0 px-1.5 py-0.5 bg-red-500 text-[7px] font-black text-white uppercase rounded animate-pulse border border-red-400">
                                        Deficit
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="p-3">
                <div className="flex items-center gap-3 mb-3">
                    <div className="relative w-10 h-10 rounded-lg bg-primary/20 p-1.5 border border-primary/30 shrink-0">
                        <Image src={getItemIconPath(iconKey)} alt="" fill className="object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-text leading-tight truncate">
                            {customName || (isResource ? 'Resource Node' : machineName)}
                        </h3>
                        <p className="text-xs text-text-dim/60 mt-0.5 truncate">
                            {isResource ? 'Extraction Point' : 'Production Segment'}
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    {/* Recipe Selection */}
                    {!isResource && (
                        <div className="relative">
                            <span className="text-[10px] font-bold text-text-dim/70 block mb-1">Recipe</span>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className={`
                                    w-full bg-bg/40 rounded-lg p-2.5 border text-xs font-medium text-left flex items-center justify-between transition-all
                                    ${activeRecipe ? 'border-border/30 text-text' : 'border-primary/40 text-primary animate-pulse'}
                                    hover:bg-bg/60 hover:border-primary/50
                                `}
                            >
                                <div className="flex items-center gap-3 truncate">
                                    {activeRecipe && <Image src={getItemIconPath(activeRecipe.products[0]?.item)} width={18} height={18} alt="" />}
                                    <span className="truncate">{activeRecipe?.name || 'INITIALIZE NODE...'}</span>
                                </div>
                                <svg className={`w-4 h-4 text-text-dim transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-surface-higher border border-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="p-3 border-b border-border bg-bg/40">
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Filter recipes..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => e.stopPropagation()}
                                            className="w-full bg-surface-high/50 rounded-lg px-3 py-2 text-[10px] font-bold text-text outline-none border border-border/50 focus:border-primary/50 transition-colors nodrag"
                                        />
                                    </div>
                                    <div className="max-h-60 overflow-y-auto scrollbar-hide py-2">
                                        {filteredRecipes.length > 0 ? filteredRecipes.map(r => (
                                            <button
                                                key={r.id}
                                                onClick={() => handleRecipeChange(r.id)}
                                                className={`
                                                    w-full px-4 py-3 text-left text-[11px] font-bold transition-all flex items-center justify-between group
                                                    ${recipeId === r.id ? 'bg-primary/20 text-primary' : 'text-text-dim hover:bg-surface-high/30 hover:text-text'}
                                                `}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Image src={getItemIconPath(r.products[0]?.item)} width={18} height={18} alt="" />
                                                    {r.name}
                                                </div>
                                                {r.alternate && <span className="text-[7px] bg-accent/20 text-accent px-1 rounded font-black">ALT</span>}
                                            </button>
                                        )) : (
                                            <div className="px-4 py-8 text-center text-text-dim/40 text-[10px] font-bold italic">No candidates found</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Recipe Stats Section */}
                    {!isResource && activeRecipe && (
                        <div className="bg-bg/30 rounded-lg p-2.5 border border-border/10 space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-bold text-text-dim/50 border-b border-border/10 pb-1.5">
                                <span>Throughput</span>
                                <span>{activeRecipe.time}s cycle</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold text-text-dim/50 block">In (actual / max)</span>
                                    {activeRecipe.ingredients.map(ing => {
                                        const maxDemand = (ing.amount / activeRecipe.time * 60 * machineCount * (efficiency / 100));
                                        return (
                                            <div key={ing.item} className="flex items-center gap-1.5">
                                                <Image src={getItemIconPath(ing.item)} width={14} height={14} alt="" />
                                                <span className="text-xs font-bold text-text">
                                                    {(inputRates[ing.item] || 0).toFixed(0)}<span className="text-text-dim/40">/{maxDemand.toFixed(0)}</span>
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="space-y-1.5 text-right">
                                    <span className="text-[10px] font-bold text-text-dim/50 block">Out</span>
                                    {activeRecipe.products.map(prod => (
                                        <div key={prod.item} className="flex items-center justify-end gap-1.5">
                                            <span className="text-xs font-bold text-accent">
                                                {(outputRates[prod.item] || 0).toFixed(0)}/m
                                            </span>
                                            <Image src={getItemIconPath(prod.item)} width={14} height={14} alt="" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Power Display */}
                    {machineId && (
                        <div className="flex items-center justify-between bg-yellow-500/10 rounded-lg p-2 border border-yellow-500/20">
                            <div className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span className="text-[10px] font-bold text-yellow-500/80">Power</span>
                            </div>
                            <span className="text-xs font-bold text-yellow-500">
                                {calculateMachinePower(machineId, efficiency, machineCount).toFixed(1)} MW
                            </span>
                        </div>
                    )}

                    {/* Machine Controls */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <span className="text-[10px] font-bold text-text-dim/70 block mb-1">Units</span>
                            <input
                                type="text"
                                value={localCount}
                                onChange={handleCountChange}
                                onBlur={() => handleBlur('count')}
                                onKeyDown={(e) => e.stopPropagation()}
                                className="w-full bg-bg/40 rounded-lg p-2 border border-border/30 text-sm font-bold text-text outline-none focus:border-primary transition-all nopan nowheel nodrag"
                            />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-text-dim/70 block mb-1">Clock %</span>
                            <input
                                type="text"
                                value={localEff}
                                onChange={handleEfficiencyChange}
                                onBlur={() => handleBlur('eff')}
                                onKeyDown={(e) => e.stopPropagation()}
                                className="w-full bg-bg/40 rounded-lg p-2 border border-border/30 text-sm font-bold text-accent outline-none focus:border-accent transition-all nopan nowheel nodrag"
                            />
                        </div>
                    </div>

                    {/* Extraction Logic */}
                    {isResource && (
                        <div className="space-y-4 pt-3 border-t border-border/10">
                            <div className="space-y-1.5">
                                <span className="text-[9px] font-black text-text-dim/60 uppercase tracking-widest block">Base Node Yield</span>
                                <input
                                    type="text"
                                    value={localExtraction}
                                    onChange={handleExtractionChange}
                                    onBlur={() => handleBlur('extract')}
                                    onKeyDown={(e) => e.stopPropagation()}
                                    className="w-full bg-bg/40 rounded-xl p-3 border border-border/30 text-[11px] font-bold text-text outline-none focus:border-green-500 transition-all nopan nowheel nodrag"
                                />
                            </div>
                            <div className="flex items-center justify-between bg-green-500/5 rounded-xl p-4 border border-green-500/20 shadow-inner">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-green-500/60 uppercase tracking-widest">Calculated Output</span>
                                    <span className="text-xl font-black text-green-400 font-mono tracking-tighter">
                                        {((outputRates[resourceId || ''] || 0)).toFixed(1)}
                                        <span className="text-[10px] ml-1 opacity-60">IPM</span>
                                    </span>
                                </div>
                                <div className="relative w-10 h-10 opacity-40">
                                    <Image src={getItemIconPath(resourceId || '')} alt="" fill className="object-contain" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Output Handles Section */}
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex flex-col gap-8 py-2">
                {(isResource && resourceId ? [{ item: resourceId }] : (activeRecipe?.products || [])).map((prod) => (
                    <div key={prod.item} className="relative w-6 h-6 flex items-center justify-center">
                        {/* Port Label */}
                        <div className="absolute left-full ml-3 flex items-center gap-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            <div className="bg-surface-higher/80 backdrop-blur px-2 py-1 rounded border border-border/50 flex items-center gap-2">
                                <span className="text-[9px] font-black text-accent uppercase">{(outputRates[prod.item] || 0).toFixed(1)}/m</span>
                                <Image src={getItemIconPath(prod.item)} width={12} height={12} alt="" />
                            </div>
                        </div>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id={prod.item}
                            className="!w-5 !h-5 !bg-accent !border-4 !border-surface-higher !transition-all hover:!scale-150"
                        />
                    </div>
                ))}
            </div>

            {/* Indicator Dot */}
            <div className={`
                absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full border-2 border-surface
                ${bottlenecks.length > 0 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                    recipeId || isResource ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' :
                        'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]'}
            `} />
        </div>
    );
});

ProductionNode.displayName = 'ProductionNode';
