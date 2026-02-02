'use client';

import { useCalculationStore } from '@/stores/calculationStore';
import type { OptimizationStrategy, StrategyWeights } from '@/types';

export function useCalculation() {
    const {
        targetItem,
        targetAmount,
        strategy,
        customWeights,
        result,
        isCalculating,
        isFinishing,
        error,
        setTargetItem,
        setTargetAmount,
        setStrategy,
        setCustomWeights,
        calculate,
        clearResult,
        clearError,
    } = useCalculationStore();

    return {
        // State
        targetItem,
        targetAmount,
        strategy,
        customWeights,
        result,
        isCalculating,
        isFinishing,
        error,

        // Computed
        hasResult: result !== null,
        canCalculate: targetItem !== null && targetAmount > 0 && !isCalculating,

        // Actions
        setTargetItem,
        setTargetAmount,
        setStrategy,
        setCustomWeights,
        calculate,
        clearResult,
        clearError,
    };
}
