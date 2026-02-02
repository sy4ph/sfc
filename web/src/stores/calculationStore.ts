import { create } from 'zustand';
import type {
    CalculateResponse,
    OptimizationStrategy,
    StrategyWeights,
    CalculateRequest
} from '@/types';
import { DEFAULT_WEIGHTS } from '@/types';
import api from '@/lib/api';
import { useRecipeStore } from './recipeStore';

interface CalculationStore {
    // State
    targetItem: string | null;
    targetAmount: number;
    strategy: OptimizationStrategy;
    customWeights: StrategyWeights;
    result: CalculateResponse | null;
    isCalculating: boolean;
    isFinishing: boolean;
    error: string | null;

    // Actions
    setTargetItem: (itemId: string | null) => void;
    setTargetAmount: (amount: number) => void;
    setStrategy: (strategy: OptimizationStrategy) => void;
    setCustomWeights: (weights: Partial<StrategyWeights>) => void;
    calculate: () => Promise<void>;
    clearResult: () => void;
    clearError: () => void;
}

export const useCalculationStore = create<CalculationStore>()((set, get) => ({
    targetItem: null,
    targetAmount: 10,
    strategy: 'balanced_production',
    customWeights: DEFAULT_WEIGHTS,
    result: null,
    isCalculating: false,
    isFinishing: false,
    error: null,

    setTargetItem: (itemId) => {
        set({ targetItem: itemId, error: null });
    },

    setTargetAmount: (amount) => {
        set({ targetAmount: Math.max(0.01, amount), error: null });
    },

    setStrategy: (strategy) => {
        set({ strategy, error: null });
    },

    setCustomWeights: (weights) => {
        set((state) => ({
            customWeights: { ...state.customWeights, ...weights },
            error: null,
        }));
    },

    calculate: async () => {
        const { targetItem, targetAmount, strategy, customWeights } = get();

        if (!targetItem) {
            set({ error: 'Please select an item to produce' });
            return;
        }

        if (targetAmount <= 0) {
            set({ error: 'Amount must be greater than 0' });
            return;
        }

        set({ isCalculating: true, error: null });

        try {
            const activeRecipes = useRecipeStore.getState().getActiveRecipesMap();

            const request: CalculateRequest = {
                item: targetItem,
                amount: targetAmount,
                optimization_strategy: strategy,
                active_recipes: activeRecipes,
            };

            // Only include custom weights if using custom strategy
            if (strategy === 'custom') {
                request.weights = customWeights;
            }

            const result = await api.calculate(request);

            // Artificial delay to show 100% progress
            set({ isFinishing: true });

            // Short delay to let the progress bar fill up
            setTimeout(() => {
                set({ result, isCalculating: false, isFinishing: false });
            }, 600);

        } catch (err) {
            set({
                error: err instanceof Error ? err.message : 'Calculation failed',
                isCalculating: false,
                isFinishing: false
            });
        }
    },

    clearResult: () => {
        set({ result: null });
    },

    clearError: () => {
        set({ error: null });
    },
}));
