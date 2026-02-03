'use client';

import React from 'react';
import Image from 'next/image';
import { usePlannerStore } from '@/stores';
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
];

const RESOURCES = [
    { id: 'Desc_IronOre_C', machine: 'Desc_MinerMk1_C' },
    { id: 'Desc_CopperOre_C', machine: 'Desc_MinerMk1_C' },
    { id: 'Desc_Stone_C', machine: 'Desc_MinerMk1_C', label: 'Limestone' },
    { id: 'Desc_Coal_C', machine: 'Desc_MinerMk1_C' },
    { id: 'Desc_RawQuartz_C', machine: 'Desc_MinerMk1_C', label: 'Quartz' },
    { id: 'Desc_Sulfur_C', machine: 'Desc_MinerMk1_C' },
    { id: 'Desc_Bauxite_C', machine: 'Desc_MinerMk1_C' },
    { id: 'Desc_UraniumOre_C', machine: 'Desc_MinerMk1_C' },
    { id: 'Desc_SAM_C', machine: 'Desc_MinerMk1_C', label: 'SAM' },
    { id: 'Desc_LiquidOil_C', machine: 'Desc_OilPump_C', label: 'Crude Oil' },
    { id: 'Desc_Water_C', machine: 'Desc_WaterPump_C' },
    { id: 'Desc_NitrogenGas_C', machine: 'Desc_FrackingSmasher_C' },
];

export function PlannerToolbox() {
    const { addNode } = usePlannerStore();

    const onAddMachine = (machineId: string) => {
        const id = `${machineId}-${Date.now()}`;
        addNode({
            id,
            type: 'productionNode',
            position: { x: 400 + Math.random() * 50, y: 100 + Math.random() * 50 },
            data: {
                machineId,
                efficiency: 100,
                machineCount: 1,
                isResource: false,
            },
        });
    };

    const onAddResource = (resource: typeof RESOURCES[0]) => {
        const id = `${resource.id}-${Date.now()}`;
        addNode({
            id,
            type: 'productionNode',
            position: { x: 100 + Math.random() * 50, y: 100 + Math.random() * 50 },
            data: {
                resourceId: resource.id,
                machineId: resource.machine,
                efficiency: 100,
                machineCount: 1,
                isResource: true,
                outputRate: 60,
            },
        });
    };

    return (
        <div className="w-72 border-r border-border bg-surface/50 backdrop-blur-md flex flex-col h-full overflow-hidden shrink-0 shadow-2xl z-10">
            <div className="p-6 border-b border-border bg-surface-high/10">
                <h2 className="text-sm font-black uppercase tracking-widest text-text leading-none mb-1">Architect</h2>
                <p className="text-[10px] font-bold text-text-dim/40 uppercase tracking-tighter">Factory Construction Kit</p>
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
                            <button
                                key={r.id}
                                onClick={() => onAddResource(r)}
                                title={r.label || r.id.replace('Desc_', '').replace('_C', '')}
                                className="group aspect-square p-2 bg-surface-high/30 hover:bg-surface-high/60 rounded-xl border border-border/30 hover:border-primary/50 transition-all flex flex-col items-center justify-center gap-1 active:scale-95"
                            >
                                <div className="relative w-8 h-8 group-hover:scale-110 transition-transform duration-300">
                                    <Image src={getItemIconPath(r.id)} alt="" fill className="object-contain" />
                                </div>
                                <span className="text-[7px] font-black uppercase tracking-tighter text-text-dim/60 group-hover:text-text truncate w-full text-center">
                                    {r.label || r.id.replace('Desc_', '').replace('_C', '').replace('Ore', '')}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Machines Section */}
                <section className="space-y-4">
                    <h3 className="text-[10px] font-black text-accent uppercase tracking-widest flex items-center gap-2">
                        <span className="w-4 h-[1px] bg-accent/30" />
                        <span>Production Logic</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {MACHINES.map(m => (
                            <button
                                key={m}
                                onClick={() => onAddMachine(m)}
                                className="group p-4 bg-surface-high/30 hover:bg-surface-high/60 rounded-2xl border border-border/30 hover:border-accent/50 transition-all flex flex-col items-center text-center gap-3 active:scale-95 text-left"
                            >
                                <div className="relative w-10 h-10 group-hover:rotate-6 transition-transform duration-300">
                                    <Image src={getItemIconPath(m)} alt="" fill className="object-contain" />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-tight text-text-dim/80 group-hover:text-text leading-tight">
                                    {getMachineName(m).replace('Mk1', '')}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pt-10">
                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10 backdrop-blur-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                    <p className="text-[8px] font-bold text-text-dim/80 leading-tight">
                        Click to spawn nodes. Connect outputs to inputs to build chains.
                    </p>
                </div>
            </div>
        </div>
    );
}
