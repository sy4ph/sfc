import React, { memo } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';

export const NoteNode = memo(({ data, selected }: NodeProps) => {
    return (
        <>
            <NodeResizer
                isVisible={selected}
                minWidth={150}
                minHeight={100}
                lineClassName="border-accent opacity-50"
                handleClassName="h-3 w-3 bg-accent border-2 border-bg rounded-full"
            />
            <div className="w-full h-full min-w-[150px] min-h-[100px] bg-[#fff9c4] dark:bg-yellow-200/90 text-black rounded-lg shadow-lg rotate-1 hover:rotate-0 transition-transform duration-200 origin-top-left flex flex-col overflow-hidden">
                <div className="h-4 bg-black/10 w-full cursor-move shrink-0" />
                <textarea
                    className="flex-1 w-full h-full bg-transparent resize-none p-4 text-sm font-handwriting leading-relaxed outline-none placeholder:text-black/30 scrollbar-hide font-medium"
                    placeholder="Write a note..."
                    defaultValue={(data.text as string) || ''}
                    onMouseDown={(e) => e.stopPropagation()}
                    onChange={(e) => data.text = e.target.value} // Direct mutation for performance, or use store action
                />
            </div>
        </>
    );
});
