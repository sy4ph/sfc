'use client';

import { useEffect } from 'react';

interface ShortcutOptions {
    onCalculate?: () => void;
    onSwitchTab?: (tabIndex?: number) => void;
    onClose?: () => void;
    onHelp?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    onCopy?: () => void;
    onPaste?: () => void;
}

export function useKeyboardShortcuts({
    onCalculate,
    onSwitchTab,
    onClose,
    onHelp,
    onUndo,
    onRedo,
    onCopy,
    onPaste,
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

            // Ctrl + Z (Undo), Ctrl + Y or Ctrl + Shift + Z (Redo)
            if (event.ctrlKey || event.metaKey) {
                if (event.key.toLowerCase() === 'z' && !event.shiftKey) {
                    if (onUndo) {
                        event.preventDefault();
                        onUndo();
                    }
                }
                if (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey)) {
                    if (onRedo) {
                        event.preventDefault();
                        onRedo();
                    }
                }
                if (event.key.toLowerCase() === 'c' && !event.shiftKey) {
                    // Check if text is selected to allow normal copying
                    if (!window.getSelection()?.toString()) {
                        if (onCopy) {
                            event.preventDefault();
                            onCopy();
                        }
                    }
                }
                if (event.key.toLowerCase() === 'v' && !event.shiftKey) {
                    if (onPaste) {
                        // Don't prevent default if focusing an input (handled at top of listener, but double check)
                        // The top listener check handles INPUT/TEXTAREA tags, so we are safe to intercept here
                        event.preventDefault();
                        onPaste();
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
