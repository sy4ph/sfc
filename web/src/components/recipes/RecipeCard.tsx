'use client';

import Image from 'next/image';
import { Toggle } from '@/components/ui';
import type { Recipe } from '@/types';
import { useItems } from '@/hooks';
import { getItemIconPath } from '@/lib/utils';

interface RecipeCardProps {
    recipe: Recipe;
    isActive: boolean;
    onToggle: () => void;
}

export function RecipeCard({ recipe, isActive, onToggle }: RecipeCardProps) {
    const { getItemName } = useItems();

    return (
        <div
            className={`
        p-3 rounded-lg border transition-all duration-200
        ${isActive
                    ? 'bg-surface-high border-primary/40 shadow-sm'
                    : 'bg-surface border-border opacity-60 hover:opacity-100 hover:border-border-hover'
                }
        ${recipe.alternate ? 'border-l-4 border-l-accent' : ''}
      `}
        >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-text truncate text-sm">
                        {recipe.name}
                    </h4>
                    {recipe.alternate && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Alternate</span>
                    )}
                </div>
                <Toggle checked={isActive} onChange={onToggle} size="sm" />
            </div>

            {/* Ingredients & Products */}
            <div className="flex items-center gap-2 text-xs">
                {/* Ingredients */}
                <div className="flex items-center gap-1 flex-wrap">
                    {recipe.ingredients.slice(0, 4).map((ing, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-1 bg-surface-higher px-1.5 py-0.5 rounded border border-border/50"
                            title={`${ing.amount}x ${getItemName(ing.item)}`}
                        >
                            <div className="relative w-3.5 h-3.5 flex-shrink-0">
                                <Image
                                    src={getItemIconPath(ing.item)}
                                    alt=""
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <span className="text-text-dim text-[10px]">{ing.amount}</span>
                        </div>
                    ))}
                </div>

                <span className="text-text-dim opacity-50">→</span>

                {/* Products */}
                <div className="flex items-center gap-1 flex-wrap">
                    {recipe.products.map((prod, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-1 bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20"
                            title={`${prod.amount}x ${getItemName(prod.item)}`}
                        >
                            <div className="relative w-3.5 h-3.5 flex-shrink-0">
                                <Image
                                    src={getItemIconPath(prod.item)}
                                    alt=""
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <span className="text-primary font-medium text-[10px]">{prod.amount}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Machine */}
            <div className="mt-2 flex items-center justify-between text-[10px] text-text-dim font-medium uppercase tracking-tight">
                <span>{getMachineName(recipe.producedIn[0])}</span>
                <span>{recipe.time}s</span>
            </div>
        </div>
    );
}

function getMachineName(machineId: string): string {
    const names: Record<string, string> = {
        Desc_SmelterMk1_C: 'Smelter',
        Desc_ConstructorMk1_C: 'Constructor',
        Desc_AssemblerMk1_C: 'Assembler',
        Desc_ManufacturerMk1_C: 'Manufacturer',
        Desc_FoundryMk1_C: 'Foundry',
        Desc_OilRefinery_C: 'Refinery',
        Desc_Packager_C: 'Packager',
        Desc_Blender_C: 'Blender',
        Desc_HadronCollider_C: 'Particle Accelerator',
        Desc_QuantumEncoder_C: 'Quantum Encoder',
        Desc_Converter_C: 'Converter',
    };
    return names[machineId] || machineId.replace(/^Desc_/, '').replace(/_C$/, '').replace(/Mk1/, '');
}
