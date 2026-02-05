import React, { memo, useCallback, useState, useEffect } from 'react';
import { NodeProps, NodeResizer, useReactFlow } from '@xyflow/react';
import { usePlannerStore, useRecipeStore } from '@/stores';

export const GroupNode = memo(({ id, data, selected }: NodeProps) => {
    const [label, setLabel] = useState((data.label as string) || '');
    const { recipes } = useRecipeStore();

    const handleDelete = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Delete this group? Nodes inside will remain.')) {
            // First, unparent all children of this group
            const nodes = usePlannerStore.getState().nodes;
            nodes.forEach(node => {
                if (node.parentId === id) {
                    usePlannerStore.getState().assignParent(node.id, undefined);
                }
            });
            // Now delete the group
            usePlannerStore.getState().deleteNode(id, recipes);
        }
    }, [id, recipes]);

    const handleLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setLabel(e.target.value);
    }, []);

    const handleLabelBlur = useCallback(() => {
        usePlannerStore.getState().updateNodeData(id, { label }, recipes);
    }, [id, label, recipes]);

    return (
        <>
            <NodeResizer
                isVisible={selected}
                minWidth={200}
                minHeight={200}
                lineClassName="border-primary opacity-50"
                handleClassName="h-3 w-3 bg-primary border-2 border-bg rounded-full"
            />
            <div className="w-full h-full min-w-[200px] min-h-[200px] bg-surface-high/10 rounded-3xl border-2 border-dashed border-text-dim/20 relative group transition-colors hover:border-text-dim/40 -z-50">
                <div className="absolute -top-8 left-0 right-0 flex items-center justify-between">
                    <div className="px-4 py-1.5 bg-surface-high/30 backdrop-blur-md rounded-xl border border-border/50">
                        <input
                            className="bg-transparent text-sm font-black uppercase tracking-widest text-text-dim focus:text-text outline-none w-48 placeholder:text-text-dim/30"
                            placeholder="GROUP NAME"
                            value={label}
                            onChange={handleLabelChange}
                            onBlur={handleLabelBlur}
                            onMouseDown={(e) => e.stopPropagation()}
                        />
                    </div>
                    <button
                        onClick={handleDelete}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-red-500/20 hover:bg-red-500/40 rounded-lg border border-red-500/30"
                        title="Delete group"
                    >
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-transparent rounded-[22px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
        </>
    );
});
