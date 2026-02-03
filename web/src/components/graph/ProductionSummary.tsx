'use client';

import type { ProductionSummary as SummaryType } from '@/types';
import { useItems } from '@/hooks';
import { getItemIconPath, formatNumber, getMachineName } from '@/lib/utils';
import Image from 'next/image';

interface ProductionSummaryProps {
    summary: SummaryType;
    targetItemName: string;
    amountRequested: number;
    strategy: string;
    provenOptimal: boolean;
}

export function ProductionSummary({
    summary,
    targetItemName,
    amountRequested,
    strategy,
    provenOptimal,
}: ProductionSummaryProps) {
    const { getItemName } = useItems();

    return (
        <div className="bg-surface/50 backdrop-blur-md border border-border rounded-xl p-5 space-y-6 shadow-xl animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-bold text-text">Production Summary</h3>
                    <p className="text-sm text-text-dim mt-0.5">
                        Total production for <span className="text-primary font-medium">{amountRequested}/min {targetItemName}</span>
                    </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                    {provenOptimal && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-wider rounded border border-green-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Optimal
                        </div>
                    )}
                    <div className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded border border-primary/20">
                        {strategy.replace(/_/g, ' ')}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="Power Usage"
                    value={`${formatNumber(summary.total_power ?? 0)} MW`}
                    icon={<BoltIcon />}
                    color="text-amber-400"
                />
                <StatCard
                    label="Total Machines"
                    value={Math.ceil(summary.total_machines)}
                    subValue={`${formatNumber(summary.total_machines)} theoretical`}
                    icon={<CubeIcon />}
                />
                <StatCard
                    label="Base Resources"
                    value={summary.unique_base_resource_types}
                    subValue="Distinct types"
                    icon={<GlobeIcon />}
                />
                <StatCard
                    label="Production Steps"
                    value={summary.total_recipe_nodes}
                    subValue="Unique nodes"
                    icon={<RouteIcon />}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Machine Breakdown */}
                {Object.keys(summary.machine_breakdown).length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-text-dim flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            Factory Requirements
                        </h4>
                        <div className="grid gap-2">
                            {Object.entries(summary.machine_breakdown).map(([machine, count]) => (
                                <div
                                    key={machine}
                                    className="flex items-center justify-between p-2.5 bg-surface-high border border-border/50 rounded-lg group hover:border-primary/40 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-8 h-8 rounded bg-surface/80 p-0.5 border border-border/30">
                                            <Image
                                                src={getItemIconPath(machine)}
                                                alt=""
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-text">
                                                {getMachineName(machine)}
                                            </div>
                                            <div className="text-[10px] text-text-dim uppercase tracking-tight font-medium">
                                                Standard Efficiency
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-xl font-mono font-bold text-primary">
                                        {count}x
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Base Resources */}
                {Object.keys(summary.base_resources).length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-text-dim flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Raw Materials
                        </h4>
                        <div className="grid gap-2">
                            {Object.entries(summary.base_resources)
                                .sort((a, b) => b[1] - a[1])
                                .map(([resource, rate]) => (
                                    <div
                                        key={resource}
                                        className="flex items-center justify-between p-2.5 bg-surface-high border border-border/50 rounded-lg group hover:border-green-500/40 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-8 h-8 rounded bg-surface/80 p-1 border border-border/30">
                                                <Image
                                                    src={getItemIconPath(resource)}
                                                    alt=""
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                            <div className="text-sm font-medium text-text">
                                                {getItemName(resource)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-mono font-bold text-green-500">
                                                {formatNumber(rate)}/min
                                            </div>
                                            <div className="text-[10px] text-text-dim font-medium">Input Rate</div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({
    label,
    value,
    subValue,
    icon,
    color = 'text-primary'
}: {
    label: string;
    value: string | number;
    subValue?: string;
    icon?: React.ReactNode;
    color?: string;
}) {
    return (
        <div className="bg-surface-high/80 border border-border/40 rounded-xl p-4 flex flex-col items-center text-center group hover:bg-surface-higher transition-all">
            {icon && <div className={`mb-2 ${color} opacity-80 group-hover:scale-110 transition-transform`}>{icon}</div>}
            <div className="text-2xl font-black text-text tracking-tight">{value}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim mt-1">{label}</div>
            {subValue && (
                <div className="text-[9px] text-text-dim opacity-50 mt-1 font-medium">{subValue}</div>
            )}
        </div>
    );
}

// Icons
function BoltIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    );
}

function CubeIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
    );
}

function GlobeIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5a3.5 3.5 0 013.5 3.5V17a4 4 0 01-4 4H12a3 3 0 01-3-3V7a3 3 0 01-3-3V3.5a1 1 0 011-1h1a1 1 0 011 1z" />
        </svg>
    );
}

function RouteIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
    );
}
