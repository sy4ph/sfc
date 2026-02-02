'use client';

import { Input } from '@/components/ui';
import type { StrategyWeights } from '@/types';

interface WeightsSelectorProps {
    weights: StrategyWeights;
    onChange: (weights: Partial<StrategyWeights>) => void;
}

export function WeightsSelector({ weights, onChange }: WeightsSelectorProps) {
    return (
        <div className="space-y-4">
            <h4 className="text-sm font-medium text-text">Custom Weights</h4>
            <p className="text-xs text-text-dim">
                Higher values mean stronger optimization for that metric.
            </p>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs text-text-dim mb-1">Base Resources</label>
                    <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={weights.base}
                        onChange={(e) => onChange({ base: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-surface-high border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div>
                    <label className="block text-xs text-text-dim mb-1">Base Types</label>
                    <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={weights.base_types}
                        onChange={(e) => onChange({ base_types: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-surface-high border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div>
                    <label className="block text-xs text-text-dim mb-1">Machines</label>
                    <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={weights.machines}
                        onChange={(e) => onChange({ machines: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-surface-high border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div>
                    <label className="block text-xs text-text-dim mb-1">Recipes</label>
                    <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={weights.recipes}
                        onChange={(e) => onChange({ recipes: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-surface-high border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
            </div>
        </div>
    );
}
