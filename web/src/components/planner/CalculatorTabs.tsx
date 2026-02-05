'use client';

import { useCalculation } from '@/hooks';
import { useState, useRef, useEffect } from 'react';

export function CalculatorTabs() {
    const {
        tabs,
        activeTabId,
        addTab,
        removeTab,
        setActiveTab,
        updateTabName
    } = useCalculation();

    const [editingId, setEditingId] = useState<string | null>(null);
    const editInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingId && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingId]);

    const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
        if (e.key === 'Enter') {
            setEditingId(null);
        }
    };

    return (
        <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide border-b border-border/50 mb-4 px-1">
            {tabs.map(tab => {
                const isActive = tab.id === activeTabId;
                return (
                    <div
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            relative group flex items-center gap-2 px-3 py-1.5 rounded-t-lg border-t border-x border-b-0 cursor-pointer transition-all min-w-[120px] max-w-[200px]
                            ${isActive
                                ? 'bg-bg border-border text-primary font-medium z-10 -mb-[1px] pb-2'
                                : 'bg-surface-high border-transparent hover:bg-surface text-text-dim hover:text-text'
                            }
                        `}
                    >
                        {editingId === tab.id ? (
                            <input
                                ref={editInputRef}
                                type="text"
                                value={tab.name}
                                onChange={(e) => updateTabName(tab.id, e.target.value)}
                                onBlur={() => setEditingId(null)}
                                onKeyDown={(e) => handleKeyDown(e, tab.id)}
                                className="bg-transparent border-none outline-none text-sm w-full font-inherit"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span
                                className="text-sm truncate select-none flex-1"
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    setEditingId(tab.id);
                                }}
                                title="Double click to rename"
                            >
                                {tab.name}
                            </span>
                        )}

                        {tabs.length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeTab(tab.id);
                                }}
                                className={`
                                    p-0.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-500 transition-all
                                    ${isActive ? 'opacity-100' : ''}
                                `}
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}

                        {isActive && (
                            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />
                        )}
                    </div>
                );
            })}

            <button
                onClick={addTab}
                className="p-1.5 rounded-lg hover:bg-surface text-text-dim hover:text-primary transition-colors ml-1"
                title="New Tab"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </button>
        </div>
    );
}
