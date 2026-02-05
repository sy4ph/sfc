'use client';

import React from 'react';
import Image from 'next/image';
import { getItemIconPath, getMachineName } from '@/lib/utils';

const MACHINES = [
    'Desc_SmelterMk1_C',
    'Desc_FoundryMk1_C',
    'Desc_ConstructorMk1_C',
    'Desc_AssemblerMk1_C',
    'Desc_ManufacturerMk1_C',
    'Desc_OilRefinery_C',
    'Desc_Blender_C',
    'Desc_Packager_C',
    'Desc_HadronCollider_C',
    'Desc_QuantumEncoder_C',
    'Desc_Converter_C',
];

const RESOURCES = [
    { id: 'Desc_OreIron_C', machine: 'Desc_MinerMk1_C', label: 'Iron' },
    { id: 'Desc_OreCopper_C', machine: 'Desc_MinerMk1_C', label: 'Copper' },
    { id: 'Desc_Stone_C', machine: 'Desc_MinerMk1_C', label: 'Limestone' },
    { id: 'Desc_Coal_C', machine: 'Desc_MinerMk1_C', label: 'Coal' },
    { id: 'Desc_RawQuartz_C', machine: 'Desc_MinerMk1_C', label: 'Quartz' },
    { id: 'Desc_Sulfur_C', machine: 'Desc_MinerMk1_C', label: 'Sulfur' },
    { id: 'Desc_OreBauxite_C', machine: 'Desc_MinerMk1_C', label: 'Bauxite' },
    { id: 'Desc_OreUranium_C', machine: 'Desc_MinerMk1_C', label: 'Uranium' },
    { id: 'Desc_SAM_C', machine: 'Desc_MinerMk1_C', label: 'SAM' },
    { id: 'Desc_LiquidOil_C', machine: 'Desc_OilPump_C', label: 'Crude Oil' },
    { id: 'Desc_Water_C', machine: 'Desc_WaterPump_C', label: 'Water' },
    { id: 'Desc_NitrogenGas_C', machine: 'Desc_FrackingSmasher_C', label: 'Nitrogen' },
];

import { usePlannerStore } from '@/stores/plannerStore';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

export function PlannerToolbox() {
    const onDragStart = (event: React.DragEvent, type: 'machine' | 'resource' | 'sourceNode' | 'group' | 'note', id: string, secondaryId?: string) => {
        event.dataTransfer.setData('application/reactflow', JSON.stringify({ type, id, secondaryId }));
        event.dataTransfer.effectAllowed = 'move';
    };

    // Zundo Temporal State
    const { undo, redo, pastStates, futureStates } = useStore(
        usePlannerStore.temporal,
        useShallow((state: any) => ({
            undo: state.undo,
            redo: state.redo,
            pastStates: state.pastStates,
            futureStates: state.futureStates,
        }))
    );

    const canUndo = pastStates.length > 0;
    const canRedo = futureStates.length > 0;

    return (
        <div className="w-72 border-r border-border bg-surface/50 backdrop-blur-md flex flex-col h-full overflow-hidden shrink-0 shadow-2xl z-10">
            <div className="p-6 border-b border-border bg-surface-high/10 space-y-4">
                <div>
                    <h2 className="text-sm font-black uppercase tracking-widest text-text leading-none mb-1">Architect</h2>
                    <p className="text-[10px] font-bold text-text-dim/40 uppercase tracking-tighter">Factory Construction Kit</p>
                </div>

                {/* History Controls */}
                <div className="flex gap-2">
                    <button
                        onClick={() => undo()}
                        disabled={!canUndo}
                        className={`flex-1 py-1.5 px-3 rounded-lg border text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${canUndo
                            ? 'bg-surface-high hover:bg-surface-high/80 border-border/50 hover:border-primary/30 text-text'
                            : 'bg-surface/20 border-transparent text-text-dim/20 cursor-not-allowed'
                            }`}
                        title="Undo (Ctrl+Z)"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        Undo
                    </button>
                    <button
                        onClick={() => redo()}
                        disabled={!canRedo}
                        className={`flex-1 py-1.5 px-3 rounded-lg border text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${canRedo
                            ? 'bg-surface-high hover:bg-surface-high/80 border-border/50 hover:border-primary/30 text-text'
                            : 'bg-surface/20 border-transparent text-text-dim/20 cursor-not-allowed'
                            }`}
                        title="Redo (Ctrl+Y)"
                    >
                        Redo
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                        </svg>
                    </button>
                </div>

                <p className="text-[8px] text-primary/80 font-black uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-md border border-primary/10 inline-block">
                    Drag items to place
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide pb-20">
                {/* Resources Section */}
                <section className="space-y-4">
                    <h3 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                        <span className="w-4 h-[1px] bg-primary/30" />
                        <span>Starting Points</span>
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                        {RESOURCES.map(r => (
                            <div
                                key={r.id}
                                draggable
                                onDragStart={(e) => onDragStart(e, 'resource', r.id, r.machine)}
                                title={r.label}
                                className="group aspect-square p-2 bg-surface-high/30 hover:bg-surface-high/60 rounded-xl border border-border/30 hover:border-primary/50 transition-all flex flex-col items-center justify-center gap-1 cursor-grab active:cursor-grabbing"
                            >
                                <div className="relative w-8 h-8 pointer-events-none group-hover:scale-110 transition-transform duration-300">
                                    <Image src={getItemIconPath(r.id)} alt="" fill className="object-contain" />
                                </div>
                                <span className="text-[7px] font-black uppercase tracking-tighter text-text-dim/60 group-hover:text-text truncate w-full text-center pointer-events-none">
                                    {r.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Utility Section */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-text-dim/40 uppercase tracking-[0.2em] px-1">Utilities</h3>
                    <div className="grid grid-cols-1 gap-2">
                        <div
                            draggable
                            onDragStart={(e) => onDragStart(e, 'sourceNode', 'custom-source')}
                            className="w-full bg-surface-high/30 hover:bg-accent/10 rounded-xl p-3 border border-border/50 hover:border-accent/40 text-left transition-all group flex items-center justify-between cursor-grab active:cursor-grabbing"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center border border-accent/20 group-hover:scale-110 transition-transform">
                                    <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-black text-text uppercase group-hover:text-accent transition-colors">Custom Source</h4>
                                    <p className="text-[8px] font-bold text-text-dim/50 uppercase">Virtual Item Input</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Organization Section */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-text-dim/40 uppercase tracking-[0.2em] px-1">Organization</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <div
                            draggable
                            onDragStart={(e) => onDragStart(e, 'group', 'group-node')}
                            className="bg-surface-high/30 hover:bg-primary/10 rounded-xl p-2 border border-border/50 hover:border-primary/40 transition-all group flex flex-col items-center justify-center gap-2 cursor-grab active:cursor-grabbing"
                        >
                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </div>
                            <span className="text-[9px] font-black uppercase text-text-dim group-hover:text-primary">Group</span>
                        </div>

                        <div
                            draggable
                            onDragStart={(e) => onDragStart(e, 'note', 'note-node')}
                            className="bg-surface-high/30 hover:bg-yellow-400/10 rounded-xl p-2 border border-border/50 hover:border-yellow-400/40 transition-all group flex flex-col items-center justify-center gap-2 cursor-grab active:cursor-grabbing"
                        >
                            <div className="w-8 h-8 rounded-lg bg-yellow-400/20 flex items-center justify-center border border-yellow-400/20 group-hover:scale-110 transition-transform">
                                <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                            <span className="text-[9px] font-black uppercase text-text-dim group-hover:text-yellow-400">Note</span>
                        </div>
                    </div>
                </div>

                {/* Machines Section */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-accent uppercase tracking-widest flex items-center gap-2">
                        <span className="w-4 h-[1px] bg-accent/30" />
                        <span>Production Logic</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {MACHINES.map(m => (
                            <div
                                key={m}
                                draggable
                                onDragStart={(e) => onDragStart(e, 'machine', m)}
                                className="group p-4 bg-surface-high/30 hover:bg-surface-high/60 rounded-2xl border border-border/30 hover:border-accent/50 transition-all flex flex-col items-center text-center gap-3 cursor-grab active:cursor-grabbing"
                            >
                                <div className="relative w-10 h-10 pointer-events-none group-hover:rotate-6 transition-transform duration-300">
                                    <Image src={getItemIconPath(m)} alt="" fill className="object-contain" />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-tight text-text-dim/80 group-hover:text-text leading-tight pointer-events-none">
                                    {getMachineName(m).replace('Mk1', '')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10 pointer-events-none">
                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10 backdrop-blur-sm pointer-events-auto">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                    <p className="text-[8px] font-bold text-text-dim/80 leading-tight">
                        Drag machines onto the grid. Join ports to form production segments.
                    </p>
                </div>
            </div>
        </div>
    );
}
