'use client';

import { ReactNode } from 'react';

interface SidebarProps {
    children: ReactNode;
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ children, isOpen, onClose }: SidebarProps) {
    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            <aside
                className={`
          w-80 h-[calc(100vh-57px)] border-r border-border bg-surface overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable]
          fixed lg:relative z-40 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
            >
                <div className="p-4 pb-32">
                    <div className="flex justify-between items-center mb-6 lg:hidden">
                        <span className="font-bold text-lg">Menu</span>
                        <button onClick={onClose} className="p-2 text-text-dim hover:text-text">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    {children}
                </div>
            </aside>
        </>
    );
}
