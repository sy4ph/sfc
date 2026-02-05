'use client';

import { useCalculation } from '@/hooks';
import { useRecipeStore } from '@/stores';
import { useMemo } from 'react';

interface ComparisonViewProps {
    onClose: () => void;
}

export function ComparisonView({ onClose }: ComparisonViewProps) {
    const { tabs } = useCalculation();
    const { recipes } = useRecipeStore();

    // Filter tabs that have results
    const resultTabs = useMemo(() => tabs.filter(t => t.result), [tabs]);

    // Calculate Metrics
    const metrics = useMemo(() => {
        return resultTabs.map(tab => {
            const res = tab.result!;
            const recipeNodes = res.production_graph.recipe_nodes;
            const totalMachines = Object.values(recipeNodes).reduce((acc: number, node: any) =>
                acc + (node.actual_machines || node.machine_count || 0), 0
            );

            // Calculate Resource Inputs (Base Resources)
            const resources: Record<string, number> = {};
            Object.values(recipeNodes).forEach((node: any) => {
                if (node.is_base_resource) {
                    const amount = node.outputs[node.item_id] || 0;
                    resources[node.item_id] = (resources[node.item_id] || 0) + amount;
                }
            });

            return {
                id: tab.id,
                name: tab.name,
                power: res.summary.total_power || 0,
                machines: totalMachines,
                resources
            };
        });
    }, [resultTabs]);

    // Find "bests" (lowest is green)
    const bestPower = Math.min(...metrics.map(m => m.power));
    const bestMachines = Math.min(...metrics.map(m => m.machines));

    // Union of all resources used across all tabs
    const allResourceIds = Array.from(new Set(metrics.flatMap(m => Object.keys(m.resources))));

    if (resultTabs.length === 0) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-surface p-6 rounded-xl border border-border shadow-2xl max-w-md w-full text-center">
                    <h3 className="text-xl font-bold text-text mb-2">No Results to Compare</h3>
                    <p className="text-text-dim mb-6">Run calculations on multiple tabs to see a comparison.</p>
                    <button onClick={onClose} className="px-4 py-2 bg-primary text-bg font-bold rounded-lg">Close</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-8 animate-in fade-in duration-200">
            <div className="bg-bg border border-border/50 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-border/50 flex justify-between items-center bg-surface">
                    <div>
                        <h2 className="text-2xl font-bold text-text">Plan Comparison</h2>
                        <p className="text-text-dim">Comparing {metrics.length} factory configurations</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-surface-high rounded-lg text-text-dim hover:text-text transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-auto p-6">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="text-left py-4 px-6 text-text-dim font-medium border-b border-border">Metric</th>
                                {metrics.map(m => (
                                    <th key={m.id} className="text-left py-4 px-6 text-text font-bold border-b border-border min-w-[200px]">
                                        {m.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Power */}
                            <tr className="hover:bg-surface/30 transition-colors">
                                <td className="py-4 px-6 text-text-dim font-medium border-b border-border/50">Total Power</td>
                                {metrics.map(m => (
                                    <td key={m.id} className="py-4 px-6 border-b border-border/50">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-lg font-mono font-medium ${m.power === bestPower ? 'text-green-400' : 'text-text'}`}>
                                                {m.power.toLocaleString()} MW
                                            </span>
                                            {m.power === bestPower && (
                                                <span className="text-xs bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20">Best</span>
                                            )}
                                        </div>
                                    </td>
                                ))}
                            </tr>

                            {/* Machines */}
                            <tr className="hover:bg-surface/30 transition-colors">
                                <td className="py-4 px-6 text-text-dim font-medium border-b border-border/50">Total Machines</td>
                                {metrics.map(m => (
                                    <td key={m.id} className="py-4 px-6 border-b border-border/50">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-lg font-mono font-medium ${m.machines === bestMachines ? 'text-green-400' : 'text-text'}`}>
                                                {m.machines.toLocaleString()}
                                            </span>
                                            {m.machines === bestMachines && (
                                                <span className="text-xs bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20">Lowest</span>
                                            )}
                                        </div>
                                    </td>
                                ))}
                            </tr>

                            {/* Divider */}
                            <tr>
                                <td colSpan={metrics.length + 1} className="py-6 px-6 text-primary font-bold text-sm uppercase tracking-wider">Resource Consumption</td>
                            </tr>

                            {/* Resources */}
                            {allResourceIds.map(resId => {
                                // Find best for this resource (lowest non-zero)
                                const values = metrics.map(m => m.resources[resId] || 0);
                                const minVal = Math.min(...values.filter(v => v > 0));

                                return (
                                    <tr key={resId} className="hover:bg-surface/30 transition-colors">
                                        <td className="py-3 px-6 text-text-dim font-medium border-b border-border/30">
                                            {/* We ideally want name here... pass logic or just ID */}
                                            {resId.replace('Desc_', '').replace('_C', '')}
                                        </td>
                                        {metrics.map(m => {
                                            const val = m.resources[resId] || 0;
                                            const isBest = val > 0 && val === minVal;
                                            return (
                                                <td key={m.id} className="py-3 px-6 border-b border-border/30">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-mono ${isBest ? 'text-green-400' : val === 0 ? 'text-text-dim' : 'text-text'}`}>
                                                            {val > 0 ? val.toFixed(1) : '-'}
                                                        </span>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
