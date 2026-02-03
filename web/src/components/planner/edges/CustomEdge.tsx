'use client';

import React, { useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getSmoothStepPath } from '@xyflow/react';
import { usePlannerStore, useRecipeStore } from '@/stores';
import { PlannerEdgeData } from '@/stores/plannerStore';

export function CustomEdge({
    id,
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
}: EdgeProps) {
    const { updateEdgeData, deleteEdge } = usePlannerStore();
    const { recipes } = useRecipeStore();
    const edgeData = data as PlannerEdgeData;

    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState(edgeData.manualFlow?.toString() || '');

    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const handleLabelClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
    };

    const handleInputBlur = () => {
        setIsEditing(false);
        const val = parseFloat(inputValue);
        if (isNaN(val)) {
            updateEdgeData(id, { manualFlow: undefined }, recipes);
        } else {
            updateEdgeData(id, { manualFlow: val }, recipes);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleInputBlur();
        if (e.key === 'Escape') {
            setIsEditing(false);
            setInputValue(edgeData.manualFlow?.toString() || '');
        }
        e.stopPropagation();
    };

    const handleDeleteEdge = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteEdge(id, recipes);
    };

    const actualFlow = edgeData.actualFlow || 0;
    const isManual = edgeData.manualFlow !== undefined;

    return (
        <>
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    strokeWidth: 2 + Math.min(actualFlow / 60, 4),
                    stroke: actualFlow > 0 ? (isManual ? '#4ADE80' : '#FA9549') : '#333',
                    transition: 'all 0.3s ease'
                }}
            />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: 'all',
                    }}
                    className="flex flex-col items-center gap-1 group/edge"
                >
                    <div className="flex items-center gap-1">
                        <div
                            onClick={handleLabelClick}
                            className={`
                                relative px-2 py-1.5 rounded-lg text-[10px] font-black shadow-2xl transition-all cursor-pointer border-2
                                bg-surface/90 backdrop-blur-md
                                ${actualFlow > 0 ? 'text-text' : 'text-text-dim/40 border-border/10'}
                                ${isManual ? 'border-green-500/50 text-green-400' : 'border-border hover:border-primary/50'}
                            `}
                        >
                            {isEditing ? (
                                <input
                                    autoFocus
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onBlur={handleInputBlur}
                                    onKeyDown={handleKeyDown}
                                    className="w-12 bg-transparent outline-none text-center nopan nowheel"
                                    placeholder="Auto"
                                />
                            ) : (
                                <div className="flex items-center gap-1">
                                    <span>{actualFlow.toFixed(1)}</span>
                                    <span className="text-[7px] opacity-50 uppercase tracking-tighter">IPM</span>
                                </div>
                            )}

                            {/* Manual Override Indicator */}
                            {isManual && !isEditing && (
                                <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-green-500 rounded-full border-2 border-surface flex items-center justify-center">
                                    <div className="w-1 h-1 bg-white rounded-full" />
                                </div>
                            )}
                        </div>

                        {/* Delete Button */}
                        <button
                            onClick={handleDeleteEdge}
                            className="w-6 h-6 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg border border-red-500/20 flex items-center justify-center transition-all opacity-0 group-hover/edge:opacity-100 shadow-xl"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    {isManual && !isEditing && (
                        <div className="text-[7px] font-black text-green-500/60 uppercase tracking-widest bg-green-500/5 px-1 rounded border border-green-500/10">
                            Locked @ {edgeData.manualFlow}
                        </div>
                    )}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}
