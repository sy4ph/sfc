'use client';

import { useState } from 'react';
import { useRecipes } from '@/hooks';
import { Button, Input, Toggle, Select } from '@/components/ui';
import { RecipeCard } from './RecipeCard';

export function RecipesPanel() {
    const [filterText, setFilterText] = useState('');
    const [showAlternatesOnly, setShowAlternatesOnly] = useState(false);
    const [showActiveOnly, setShowActiveOnly] = useState(false);
    const [machineFilter, setMachineFilter] = useState<string | null>(null);

    const {
        recipes,
        isLoading,
        error,
        stats,
        machineTypes,
        toggleRecipe,
        enableAll,
        disableAll,
        enableAllStandard,
        disableAllAlternates,
        isRecipeActive,
    } = useRecipes({
        filterText,
        showAlternatesOnly,
        showActiveOnly,
        machineFilter,
    });

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="animate-pulse bg-surface-high rounded-lg h-10" />
                <div className="animate-pulse bg-surface-high rounded-lg h-20" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400">{error}</p>
            </div>
        );
    }

    const machineOptions = [
        { value: '', label: 'All Machines' },
        ...machineTypes.map((m) => ({
            value: m,
            label: m.replace('Desc_', '').replace('Mk1_C', '').replace('_C', ''),
        })),
    ];

    return (
        <div className="space-y-4 pb-20">
            {/* Header */}
            <div>
                <h2 className="text-lg font-semibold text-text">Recipes</h2>
                <p className="text-xs text-text-dim mt-1">
                    {stats.active} of {stats.total} recipes active
                    {stats.activeAlternates > 0 && (
                        <span className="text-accent"> • {stats.activeAlternates} alternates</span>
                    )}
                </p>
            </div>

            <div className="flex flex-col gap-3">
                <Input
                    placeholder="Search recipes..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    size="sm"
                />

                <Select
                    options={machineOptions}
                    value={machineFilter || ''}
                    onChange={(val) => setMachineFilter(val === '' ? null : val)}
                    placeholder="Filter by machine"
                    className="z-50"
                />

                <div className="grid grid-cols-2 gap-2">
                    <Toggle
                        checked={showAlternatesOnly}
                        onChange={setShowAlternatesOnly}
                        label="Alts Only"
                        size="sm"
                    />
                    <Toggle
                        checked={showActiveOnly}
                        onChange={setShowActiveOnly}
                        label="Active Only"
                        size="sm"
                    />
                </div>
            </div>

            {/* Bulk Actions */}
            <div className="flex flex-wrap gap-1.5 border-t border-border pt-4">
                <ActionButton onClick={enableAllStandard} label="Standard On" />
                <ActionButton onClick={disableAllAlternates} label="Alts Off" />
                <ActionButton onClick={enableAll} label="All On" />
                <ActionButton onClick={disableAll} label="All Off" />
            </div>

            {/* Recipe List */}
            <div className="space-y-2 max-h-[calc(100vh-450px)] overflow-y-auto pr-2 custom-scrollbar">
                {recipes.length === 0 ? (
                    <div className="text-center py-8 text-text-dim text-sm italic">
                        No recipes match your filters
                    </div>
                ) : (
                    recipes.map((recipe) => (
                        <RecipeCard
                            key={recipe.id}
                            recipe={recipe}
                            isActive={isRecipeActive(recipe.id)}
                            onToggle={() => toggleRecipe(recipe.id)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

function ActionButton({ onClick, label }: { onClick: () => void; label: string }) {
    return (
        <button
            onClick={onClick}
            className="px-2 py-1 text-[10px] uppercase tracking-wider font-bold bg-surface-high hover:bg-surface-higher text-text-dim hover:text-text rounded transition-colors border border-border"
        >
            {label}
        </button>
    );
}
