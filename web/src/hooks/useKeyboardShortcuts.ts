'use client';

import { useEffect } from 'react';

interface ShortcutOptions {
    onCalculate?: () => void;
    onSwitchTab?: (tabIndex?: number) => void;
    onClose?: () => void;
    onHelp?: () => void;
}

export function useKeyboardShortcuts({
    onCalculate,
    onSwitchTab,
    onClose,
    onHelp,
}: ShortcutOptions) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Don't trigger if user is typing in an input or textarea
            const target = event.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                if (event.key === 'Escape') {
                    target.blur();
                    return;
                }
                // Exception: Ctrl+Enter should still work in inputs
                if (!(event.ctrlKey && event.key === 'Enter')) {
                    return;
                }
            }

            // C or Ctrl + Enter - Calculate
            if (
                (event.key.toLowerCase() === 'c' && !event.ctrlKey && !event.metaKey && !event.altKey) ||
                (event.ctrlKey && event.key === 'Enter')
            ) {
                if (onCalculate) {
                    event.preventDefault();
                    onCalculate();
                }
            }

            // Tab or Alt + [1,2] - Switch Tab
            if (
                (event.key === 'Tab' && !event.ctrlKey && !event.metaKey && !event.altKey) ||
                (event.altKey && (event.key === '1' || event.key === '2'))
            ) {
                if (onSwitchTab) {
                    event.preventDefault();
                    if (event.altKey) {
                        onSwitchTab(parseInt(event.key) - 1);
                    } else {
                        onSwitchTab(); // Toggle
                    }
                }
            }

            // ? - Help
            if (event.key === '?' || (event.shiftKey && event.key === '/')) {
                if (onHelp) {
                    event.preventDefault();
                    onHelp();
                }
            }

            // Escape - Close
            if (event.key === 'Escape') {
                if (onClose) {
                    event.preventDefault();
                    onClose();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCalculate, onSwitchTab, onClose, onHelp]);
}
