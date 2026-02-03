'use client';

import React, { memo, useState, useMemo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { usePlannerStore, useRecipeStore, useItemStore } from '@/stores';
import { PlannerNode } from '@/stores/plannerStore';
import { getItemIconPath } from '@/lib/utils';
import Image from 'next/image';

export const SourceNode = memo((props: NodeProps<PlannerNode>) => {
    const { id, data, selected } = props;
    const { updateNodeData, deleteNode } = usePlannerStore();
    const { recipes } = useRecipeStore();
    const { items } = useItemStore();

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const currentItemId = data.resourceId || '';
    const outputRate = data.outputRate || 60;

    const [localRate, setLocalRate] = useState(outputRate.toString());

    React.useEffect(() => { setLocalRate(outputRate.toString()); }, [outputRate]);

    const itemArray = useMemo(() => Object.values(items), [items]);

    const activeItem = useMemo(() => {
        return items[currentItemId];
    }, [items, currentItemId]);

    const filteredItems = useMemo(() => {
        if (!searchQuery) return itemArray.slice(0, 50);
        return itemArray.filter(i =>
            i.name.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 50);
    }, [itemArray, searchQuery]);

    const handleItemSelect = (itemId: string) => {
        updateNodeData(id, { resourceId: itemId, isResource: true }, recipes);
        setIsDropdownOpen(false);
        setSearchQuery('');
    };

    const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalRate(val);
        const num = parseFloat(val);
        if (!isNaN(num) && num >= 0) {
            updateNodeData(id, { outputRate: num }, recipes);
        }
    };

    const handleBlur = () => {
        if (localRate === '' || parseFloat(localRate) < 0) {
            setLocalRate('60');
            updateNodeData(id, { outputRate: 60 }, recipes);
        }
    };

    return (
        <div className={`
            min-w-[220px] bg-surface/90 backdrop-blur-xl rounded-xl border-2 transition-all duration-300 group nopan nowheel
            ${selected ? 'border-accent shadow-[0_0_30px_rgba(74,222,128,0.2)] scale-[1.02]' : 'border-border/50 hover:border-border shadow-xl'}
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

            <div className="p-3">
                <div className="flex items-center gap-3 mb-3">
                    <div className="relative w-10 h-10 rounded-lg bg-accent/20 p-1.5 border border-accent/30 flex items-center justify-center shrink-0">
                        {activeItem ? (
                            <Image src={getItemIconPath(activeItem.id)} alt="" width={28} height={28} />
                        ) : (
                            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-text leading-tight truncate">
                            Custom Source
                        </h3>
                        <p className="text-xs text-accent/70 mt-0.5 truncate">
                            Virtual Input
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    {/* Item Selection */}
                    <div className="relative">
                        <span className="text-[10px] font-bold text-text-dim/70 block mb-1">Item</span>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`
                                w-full bg-bg/40 rounded-lg p-2.5 border text-xs font-medium text-left flex items-center justify-between transition-all
                                ${activeItem ? 'border-border/30 text-text' : 'border-accent/40 text-accent animate-pulse'}
                                hover:bg-bg/60 hover:border-accent/50
                            `}
                        >
                            <div className="flex items-center gap-2 truncate">
                                {activeItem && <Image src={getItemIconPath(activeItem.id)} width={16} height={16} alt="" />}
                                <span className="truncate">{activeItem?.name || 'Select item...'}</span>
                            </div>
                            <svg className={`w-3 h-3 text-text-dim transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-surface-higher border border-border rounded-xl shadow-2xl z-[100] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="p-2 border-b border-border bg-bg/40">
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Search items..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.stopPropagation()}
                                        className="w-full bg-surface-high/50 rounded-lg px-2 py-1.5 text-[10px] font-bold text-text outline-none border border-border/50 focus:border-accent/50 nodrag"
                                    />
                                </div>
                                <div className="max-h-48 overflow-y-auto scrollbar-hide py-1">
                                    {filteredItems.map(i => (
                                        <button
                                            key={i.id}
                                            onClick={() => handleItemSelect(i.id)}
                                            className={`
                                                w-full px-3 py-2 text-left text-[10px] font-bold transition-all flex items-center gap-2
                                                ${currentItemId === i.id ? 'bg-accent/20 text-accent' : 'text-text-dim hover:bg-surface-high/30 hover:text-text'}
                                            `}
                                        >
                                            <Image src={getItemIconPath(i.id)} width={16} height={16} alt="" />
                                            {i.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Rate Input */}
                    <div>
                        <span className="text-[10px] font-bold text-text-dim/70 block mb-1">Rate (items/min)</span>
                        <input
                            type="text"
                            value={localRate}
                            onChange={handleRateChange}
                            onBlur={handleBlur}
                            onKeyDown={(e) => e.stopPropagation()}
                            className="w-full bg-bg/40 rounded-lg p-2 border border-border/30 text-sm font-bold text-accent outline-none focus:border-accent transition-all nodrag"
                        />
                    </div>
                </div>
            </div>

            {/* Output Handle */}
            {activeItem && (
                <div className="absolute -right-3 top-1/2 -translate-y-1/2">
                    <div className="relative w-6 h-6 flex items-center justify-center">
                        <Handle
                            type="source"
                            position={Position.Right}
                            id={activeItem.id}
                            className="!w-5 !h-5 !bg-accent !border-4 !border-surface-higher !transition-all hover:!scale-150"
                        />
                        {/* Port Label */}
                        <div className="absolute left-full ml-3 flex items-center gap-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            <div className="bg-surface-higher/80 backdrop-blur px-2 py-1 rounded border border-border/50 flex items-center gap-2 shadow-2xl">
                                <Image src={getItemIconPath(activeItem.id)} width={14} height={14} alt="" />
                                <span className="text-[10px] font-black text-accent uppercase">
                                    {outputRate.toFixed(1)}/m
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

SourceNode.displayName = 'SourceNode';
