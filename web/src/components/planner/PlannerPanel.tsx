'use client';

import { useCalculation, useItems } from '@/hooks';
import { Button, Input } from '@/components/ui';
import { ItemSelector } from './ItemSelector';
import { StrategySelector } from './StrategySelector';
import { WeightsSelector } from './WeightsSelector';

export function PlannerPanel() {
    const {
        targets,
        strategy,
        customWeights,
        isCalculating,
        isFinishing,
        error,
        canCalculate,
        addTarget,
        removeTarget,
        updateTargetItem,
        updateTargetAmount,
        setStrategy,
        setCustomWeights,
        calculate,
    } = useCalculation();

    const { getItemName } = useItems();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-lg font-semibold text-text">Production Planner</h2>
                <p className="text-sm text-text-dim mt-1">
                    Calculate the optimal production chain for multiple items
                </p>
            </div>

            {/* Target Items */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-text">Target Items</label>
                    <button
                        onClick={() => addTarget('')}
                        className="text-xs text-primary hover:text-primary-bright transition-colors flex items-center gap-1"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Target
                    </button>
                </div>

                {targets.length === 0 ? (
                    <div
                        onClick={() => addTarget('')}
                        className="p-4 border-2 border-dashed border-border rounded-lg text-center cursor-pointer hover:border-primary/50 transition-colors"
                    >
                        <p className="text-sm text-text-dim">Click to add a production target</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {targets.map((target, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 p-2 bg-surface-high rounded-lg border border-border/50"
                            >
                                <div className="flex-1 min-w-0">
                                    <ItemSelector
                                        value={target.item || null}
                                        onChange={(itemId) => updateTargetItem(index, itemId || '')}
                                        compact
                                    />
                                </div>
                                <div className="w-24">
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="1"
                                        value={target.amount}
                                        onChange={(e) => updateTargetAmount(index, parseFloat(e.target.value) || 0)}
                                        placeholder="Amt"
                                        className="w-full px-2 py-1.5 text-sm bg-surface border border-border rounded text-text placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                                <span className="text-xs text-text-dim">/min</span>
                                <button
                                    onClick={() => removeTarget(index)}
                                    className="p-1.5 text-text-dim hover:text-red-400 transition-colors"
                                    title="Remove target"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Strategy */}
            <StrategySelector value={strategy} onChange={setStrategy} />

            {/* Custom Weights (shown only for custom strategy) */}
            {strategy === 'custom' && (
                <WeightsSelector weights={customWeights} onChange={setCustomWeights} />
            )}

            {/* Error Display */}
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            )}

            {/* Calculate Button & Progress */}
            <div className="space-y-2">
                <Button
                    onClick={calculate}
                    disabled={!canCalculate || isCalculating}
                    isLoading={false}
                    className="w-full relative overflow-hidden"
                    size="lg"
                >
                    <span className="relative z-10 transition-opacity duration-300">
                        {isFinishing ? 'Finalizing...' : (isCalculating ? 'Calculating Optimization...' : 'Calculate Production')}
                    </span>

                    {/* Heuristic Progress Bar */}
                    {(isCalculating || isFinishing) && (
                        <div
                            className="absolute inset-0 bg-primary/20 z-0 animate-[shimmer_2s_infinite]"
                            style={{
                                backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                                backgroundSize: '200% 100%',
                            }}
                        />
                    )}
                    {(isCalculating || isFinishing) && (
                        <div
                            className={`absolute bottom-0 left-0 h-1 bg-accent z-20 transition-all ease-out w-full ${isFinishing ? 'duration-500' : 'duration-[30000ms]'}`}
                            style={{
                                width: isFinishing ? '100%' : '0%',
                                animation: isFinishing ? 'none' : 'progress 30s cubic-bezier(0.1, 0.7, 1.0, 0.1) forwards'
                            }}
                        />
                    )}
                </Button>

                {(isCalculating || isFinishing) && (
                    <div className="flex justify-between text-xs text-text-dim px-1 animate-pulse">
                        <span>{isFinishing ? 'Almost done!' : 'Crunching numbers...'}</span>
                        <span>{isFinishing ? '' : 'Please wait (up to 60s)'}</span>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes progress {
                    0% { width: 0%; }
                    10% { width: 20%; }
                    40% { width: 60%; }
                    80% { width: 85%; }
                    100% { width: 95%; } 
                }
            `}</style>

            {/* Quick Info */}
            {targets.length > 0 && targets.some(t => t.item) && (
                <div className="p-3 bg-surface-high rounded-lg">
                    <p className="text-sm text-text-dim">
                        Calculating optimal production for{' '}
                        <span className="text-primary font-medium">
                            {targets.filter(t => t.item).map((t, i) => (
                                <span key={i}>
                                    {i > 0 && ', '}
                                    {t.amount}x {getItemName(t.item)}
                                </span>
                            ))}
                        </span>{' '}
                        per minute
                    </p>
                </div>
            )}
        </div>
    );
}
