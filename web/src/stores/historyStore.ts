import { create } from 'zustand';
import { PlannerNode, PlannerEdge } from './plannerStore';

interface HistorySnapshot {
    nodes: PlannerNode[];
    edges: PlannerEdge[];
}

interface HistoryState {
    past: HistorySnapshot[];
    future: HistorySnapshot[];

    // Actions
    pushState: (nodes: PlannerNode[], edges: PlannerEdge[]) => void;
    undo: () => HistorySnapshot | null;
    redo: () => HistorySnapshot | null;
    clear: () => void;

    // Computed
    canUndo: () => boolean;
    canRedo: () => boolean;
}

const MAX_HISTORY = 50;

export const useHistoryStore = create<HistoryState>()((set, get) => ({
    past: [],
    future: [],

    pushState: (nodes, edges) => {
        set((state) => {
            // Deep clone to avoid reference issues
            const snapshot: HistorySnapshot = {
                nodes: JSON.parse(JSON.stringify(nodes)),
                edges: JSON.parse(JSON.stringify(edges)),
            };

            const newPast = [...state.past, snapshot].slice(-MAX_HISTORY);

            return {
                past: newPast,
                future: [], // Clear redo stack on new action
            };
        });
    },

    undo: () => {
        const { past } = get();
        if (past.length === 0) return null;

        const previous = past[past.length - 1];

        set((state) => {
            const newPast = state.past.slice(0, -1);
            return { past: newPast };
        });

        return previous;
    },

    redo: () => {
        const { future } = get();
        if (future.length === 0) return null;

        const next = future[0];

        set((state) => ({
            future: state.future.slice(1),
        }));

        return next;
    },

    clear: () => {
        set({ past: [], future: [] });
    },

    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,
}));
