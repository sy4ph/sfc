'use client';

export function GraphLegend() {
    return (
        <div className="absolute bottom-4 left-4 bg-surface/80 backdrop-blur-md border border-border rounded-xl p-2.5 flex flex-col gap-1.5 shadow-lg z-10">
            <LegendItem color="#6366f1" label="Standard Recipe" />
            <LegendItem color="#f59e0b" label="Alternate Recipe" />
            <LegendItem color="#10b981" label="Base Resource" shape="rounded-full" />
            <LegendItem color="#f97316" label="Surplus Output" shape="rounded-full" />
        </div>
    );
}

function LegendItem({ color, label, shape = 'rounded' }: { color: string; label: string; shape?: string }) {
    return (
        <div className="flex items-center gap-2.5 text-[9px] font-black uppercase tracking-widest text-text-dim px-1.5">
            <div className={`w-2.5 h-2.5 ${shape} flex-shrink-0 shadow-sm border border-white/10`} style={{ backgroundColor: color }} />
            <span>{label}</span>
        </div>
    );
}
