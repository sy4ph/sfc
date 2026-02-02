'use client';

import { useEffect } from 'react';
import { useCalculation, useItems } from '@/hooks';
import { Button, Input } from '@/components/ui';
import { ItemSelector } from './ItemSelector';
import { StrategySelector } from './StrategySelector';
import { WeightsSelector } from './WeightsSelector';
import { setAccentColor } from '@/lib/colors';

export function PlannerPanel() {
    const {
        targetItem,
        targetAmount,
        strategy,
        customWeights,
        result,
        isCalculating,
        isFinishing,
        error,
        canCalculate,
        setTargetItem,
        setTargetAmount,
        setStrategy,
        setCustomWeights,
        calculate,
    } = useCalculation();

    // Dynamic accent color removed per user request
    /*
    useEffect(() => {
        setAccentColor(targetItem);
    }, [targetItem]);
    */

    const { getItemName } = useItems();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-lg font-semibold text-text">Production Planner</h2>
                <p className="text-sm text-text-dim mt-1">
                    Calculate the optimal production chain for any item
                </p>
            </div>

            {/* Item Selection */}
            <ItemSelector value={targetItem} onChange={setTargetItem} />

            {/* Amount */}
            <Input
                label="Amount (per minute)"
                type="number"
                min="0.01"
                step="1"
                value={targetAmount}
                onChange={(e) => setTargetAmount(parseFloat(e.target.value) || 0)}
                placeholder="Enter amount..."
            />

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
                    isLoading={false} // We handle loading visually
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
            {targetItem && (
                <div className="p-3 bg-surface-high rounded-lg">
                    <p className="text-sm text-text-dim">
                        Calculating optimal production for{' '}
                        <span className="text-primary font-medium">
                            {targetAmount}x {getItemName(targetItem)}
                        </span>{' '}
                        per minute
                    </p>
                </div>
            )}
        </div>
    );
}
