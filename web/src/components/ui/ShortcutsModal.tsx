'use client';

import { useEffect, useState } from 'react';

interface Shortcut {
    key: string;
    label: string;
    description: string;
}

const SHORTCUTS: Shortcut[] = [
    { key: 'C', label: 'Calculate', description: 'Run production calculation' },
    { key: 'Tab', label: 'Switch Tab', description: 'Toggle between Planner and Recipes' },
    { key: 'Esc', label: 'Close', description: 'Close sidebar or modals' },
    { key: '?', label: 'Help', description: 'Show this shortcuts overlay' },
];

export function ShortcutsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-border bg-surface-high flex justify-between items-center">
                    <h3 className="text-lg font-bold text-text">Keyboard Shortcuts</h3>
                    <button
                        onClick={onClose}
                        className="text-text-dim hover:text-text transition-colors"
                    >
                        <CloseIcon />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    {SHORTCUTS.map((s) => (
                        <div key={s.key} className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-text">{s.label}</span>
                                <span className="text-xs text-text-dim">{s.description}</span>
                            </div>
                            <kbd className="px-2.5 py-1 bg-surface-higher border border-border rounded text-sm font-mono font-bold text-primary shadow-sm">
                                {s.key}
                            </kbd>
                        </div>
                    ))}
                </div>
                <div className="px-6 py-4 bg-surface-high/50 text-center">
                    <p className="text-[10px] text-text-dim uppercase tracking-widest font-bold">
                        Antigravity UI Engine v1.0
                    </p>
                </div>
            </div>
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    );
}

function CloseIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}
