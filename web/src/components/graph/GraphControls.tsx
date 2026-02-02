'use client';

interface GraphControlsProps {
    onZoomIn: () => void;
    onZoomOut: () => void;
    onFit: () => void;
}

export function GraphControls({ onZoomIn, onZoomOut, onFit }: GraphControlsProps) {
    return (
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            <ControlButton onClick={onZoomIn} icon="M12 4v16m8-8H4" title="Zoom In" />
            <ControlButton onClick={onZoomOut} icon="M20 12H4" title="Zoom Out" />
            <ControlButton onClick={onFit} icon="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" title="Fit to View" />
        </div>
    );
}

function ControlButton({ onClick, icon, title }: { onClick: () => void; icon: string; title: string }) {
    return (
        <button
            onClick={onClick}
            className="p-2.5 bg-surface/90 backdrop-blur-md text-text-dim hover:text-primary border border-border rounded-xl hover:bg-surface-high transition-all shadow-lg active:scale-95 group"
            title={title}
        >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
            </svg>
        </button>
    );
}
