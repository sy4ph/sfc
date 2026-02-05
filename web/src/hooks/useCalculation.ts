'use client';

import { useCalculationStore } from '@/stores/calculationStore';
import { DEFAULT_WEIGHTS, type OptimizationStrategy, type StrategyWeights } from '@/types';

export function useCalculation() {
    const {
        // Store State
        tabs,
        activeTabId,

        // Tab Actions
        addTab,
        removeTab,
        setActiveTab,
        updateTabName,

        // Active Tab Actions
        addTarget,
        removeTarget,
        updateTargetItem,
        updateTargetAmount,
        setStrategy,
        setCustomWeights,
        calculate,
        clearResult,
        clearError,

        // Legacy compatibility
        setTargetItem,
        setTargetAmount,
    } = useCalculationStore();

    // Derived active tab state
    const activeTab = tabs.find(t => t.id === activeTabId);

    // Legacy single-target computeds
    const targetItem = activeTab && activeTab.targets.length > 0 ? activeTab.targets[0].item : null;
    const targetAmount = activeTab && activeTab.targets.length > 0 ? activeTab.targets[0].amount : 10;

    return {
        // Tab Management (New)
        tabs,
        activeTabId,
        activeTab,
        addTab,
        removeTab,
        setActiveTab,
        updateTabName,

        // State (Proxied from active tab or defaults)
        targets: activeTab?.targets || [],
        targetItem,
        targetAmount,
        strategy: activeTab?.strategy || 'balanced_production',
        customWeights: activeTab?.customWeights || DEFAULT_WEIGHTS, // Fix: Provide complete default object
        result: activeTab?.result || null,
        isCalculating: activeTab?.isCalculating || false,
        isFinishing: activeTab?.isFinishing || false,
        error: activeTab?.error || null,

        // Computed
        hasResult: activeTab?.result !== null && activeTab?.result !== undefined,
        canCalculate: activeTab && activeTab.targets.length > 0 && activeTab.targets.every(t => t.item && t.amount > 0) && !activeTab.isCalculating,

        // Multi-target actions
        addTarget,
        removeTarget,
        updateTargetItem,
        updateTargetAmount,

        // Legacy single-target actions
        setTargetItem,
        setTargetAmount,

        // Other actions
        setStrategy,
        setCustomWeights,
        calculate,
        clearResult,
        clearError,
    };
}
