import { create } from 'zustand';
import type {
    CalculateResponse,
    OptimizationStrategy,
    StrategyWeights,
    Target
} from '@/types';
import { DEFAULT_WEIGHTS } from '@/types';
import api from '@/lib/api';
import { useRecipeStore } from './recipeStore';

export interface CalculationTab {
    id: string;
    name: string;
    targets: Target[];
    strategy: OptimizationStrategy;
    customWeights: StrategyWeights;
    result: CalculateResponse | null;
    isCalculating: boolean;
    isFinishing: boolean;
    error: string | null;
}

interface CalculationStore {
    // Tab State
    tabs: CalculationTab[];
    activeTabId: string;

    // Tab Actions
    addTab: () => void;
    removeTab: (id: string) => void;
    setActiveTab: (id: string) => void;
    updateTabName: (id: string, name: string) => void;

    // Active Tab Actions
    addTarget: (itemId: string) => void;
    removeTarget: (index: number) => void;
    updateTargetItem: (index: number, itemId: string) => void;
    updateTargetAmount: (index: number, amount: number) => void;
    setStrategy: (strategy: OptimizationStrategy) => void;
    setCustomWeights: (weights: Partial<StrategyWeights>) => void;
    calculate: () => Promise<void>;
    clearResult: () => void;
    clearError: () => void;

    // Legacy single-target compatibility (proxies to active tab)
    get targetItem(): string | null;
    get targetAmount(): number;
    setTargetItem: (itemId: string | null) => void;
    setTargetAmount: (amount: number) => void;
}

const createDefaultTab = (id: string, name: string): CalculationTab => ({
    id,
    name,
    targets: [],
    strategy: 'balanced_production',
    customWeights: DEFAULT_WEIGHTS,
    result: null,
    isCalculating: false,
    isFinishing: false,
    error: null,
});

export const useCalculationStore = create<CalculationStore>()((set, get) => ({
    tabs: [createDefaultTab('tab-1', 'Factory 1')],
    activeTabId: 'tab-1',

    // Legacy getters
    get targetItem() {
        const tab = get().tabs.find(t => t.id === get().activeTabId);
        return tab && tab.targets.length > 0 ? tab.targets[0].item : null;
    },

    get targetAmount() {
        const tab = get().tabs.find(t => t.id === get().activeTabId);
        return tab && tab.targets.length > 0 ? tab.targets[0].amount : 10;
    },

    // Tab Actions
    addTab: () => {
        set((state) => {
            const newId = `tab-${Date.now()}`;
            return {
                tabs: [...state.tabs, createDefaultTab(newId, `Factory ${state.tabs.length + 1}`)],
                activeTabId: newId
            };
        });
    },

    removeTab: (id) => {
        set((state) => {
            if (state.tabs.length <= 1) return state; // Prevent removing last tab
            const newTabs = state.tabs.filter(t => t.id !== id);
            // If active tab removed, switch to last available
            const newActiveId = state.activeTabId === id ? newTabs[newTabs.length - 1].id : state.activeTabId;
            return { tabs: newTabs, activeTabId: newActiveId };
        });
    },

    setActiveTab: (id) => set({ activeTabId: id }),

    updateTabName: (id, name) => {
        set((state) => ({
            tabs: state.tabs.map(t => t.id === id ? { ...t, name } : t)
        }));
    },

    addTarget: (itemId) => {
        set((state) => ({
            tabs: state.tabs.map(t => t.id === state.activeTabId ? {
                ...t,
                targets: [...t.targets, { item: itemId, amount: 10 }],
                error: null
            } : t)
        }));
    },

    removeTarget: (index) => {
        set((state) => ({
            tabs: state.tabs.map(t => t.id === state.activeTabId ? {
                ...t,
                targets: t.targets.filter((_, i) => i !== index),
                error: null
            } : t)
        }));
    },

    updateTargetItem: (index, itemId) => {
        set((state) => ({
            tabs: state.tabs.map(t => t.id === state.activeTabId ? {
                ...t,
                targets: t.targets.map((target, i) => i === index ? { ...target, item: itemId } : target),
                error: null
            } : t)
        }));
    },

    updateTargetAmount: (index, amount) => {
        set((state) => ({
            tabs: state.tabs.map(t => t.id === state.activeTabId ? {
                ...t,
                targets: t.targets.map((target, i) => i === index ? { ...target, amount: Math.max(0.01, amount) } : target),
                error: null
            } : t)
        }));
    },

    setStrategy: (strategy) => {
        set((state) => ({
            tabs: state.tabs.map(t => t.id === state.activeTabId ? { ...t, strategy } : t)
        }));
    },

    setCustomWeights: (weights) => {
        set((state) => ({
            tabs: state.tabs.map(t => t.id === state.activeTabId ? {
                ...t,
                customWeights: { ...t.customWeights, ...weights }
            } : t)
        }));
    },

    calculate: async () => {
        const { activeTabId, tabs } = get();
        const activeTab = tabs.find(t => t.id === activeTabId);
        if (!activeTab) return;

        // Validation
        if (activeTab.targets.length === 0) {
            set((state) => ({
                tabs: state.tabs.map(t => t.id === activeTabId ? { ...t, error: 'Please add at least one target.' } : t)
            }));
            return;
        }

        const invalidTarget = activeTab.targets.find(t => !t.item || t.amount <= 0);
        if (invalidTarget) {
            set((state) => ({
                tabs: state.tabs.map(t => t.id === activeTabId ? { ...t, error: 'Please ensure all targets have an item and valid amount.' } : t)
            }));
            return;
        }

        // Set Loading
        set((state) => ({
            tabs: state.tabs.map(t => t.id === activeTabId ? { ...t, isCalculating: true, error: null, result: null } : t)
        }));

        try {
            // Get active recipes from RecipeStore
            const recipeStore = useRecipeStore.getState();
            const activeRecipes = recipeStore.activeRecipes;

            const response = await api.calculate({
                targets: activeTab.targets,
                optimization_strategy: activeTab.strategy,
                weights: activeTab.strategy === 'custom' ? activeTab.customWeights : undefined,
                active_recipes: activeRecipes
            });

            // Finishing State (Animation support)
            set((state) => ({
                tabs: state.tabs.map(t => t.id === activeTabId ? { ...t, isCalculating: false, isFinishing: true } : t)
            }));

            setTimeout(() => {
                set((state) => ({
                    tabs: state.tabs.map(t => t.id === activeTabId ? {
                        ...t,
                        isFinishing: false,
                        result: response
                    } : t)
                }));
            }, 800);

        } catch (err: any) {
            set((state) => ({
                tabs: state.tabs.map(t => t.id === activeTabId ? {
                    ...t,
                    isCalculating: false,
                    isFinishing: false,
                    error: err.response?.data?.error || err.message || 'Calculation failed'
                } : t)
            }));
        }
    },

    clearResult: () => {
        set((state) => ({
            tabs: state.tabs.map(t => t.id === state.activeTabId ? { ...t, result: null, error: null } : t)
        }));
    },

    clearError: () => {
        set((state) => ({
            tabs: state.tabs.map(t => t.id === state.activeTabId ? { ...t, error: null } : t)
        }));
    },

    // Legacy Setters
    setTargetItem: (itemId) => {
        if (itemId === null) {
            set((state) => ({
                tabs: state.tabs.map(t => t.id === state.activeTabId ? { ...t, targets: [], error: null } : t)
            }));
        } else {
            set((state) => ({
                tabs: state.tabs.map(t => t.id === state.activeTabId ? {
                    ...t,
                    targets: t.targets.length === 0
                        ? [{ item: itemId, amount: 10 }]
                        : [{ ...t.targets[0], item: itemId }, ...t.targets.slice(1)],
                    error: null
                } : t)
            }));
        }
    },

    setTargetAmount: (amount) => {
        set((state) => ({
            tabs: state.tabs.map(t => t.id === state.activeTabId ? {
                ...t,
                targets: t.targets.length === 0
                    ? [{ item: 'desc_ironplate_c', amount: amount }] // Fallback
                    : [{ ...t.targets[0], amount: Math.max(0.01, amount) }, ...t.targets.slice(1)],
                error: null
            } : t)
        }));
    },
}));
