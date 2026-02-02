'use client';

import { useState } from 'react';
import { useRecipes } from '@/hooks';
import { Button, Input, Toggle, Select } from '@/components/ui';
import { RecipeCard } from './RecipeCard';

export function RecipeBook() {
    const [filterText, setFilterText] = useState('');
    const [category, setCategory] = useState<'standard' | 'alternate' | 'converted' | null>(null);
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
        enableAllAlternates,
        disableAllAlternates,
        enableAllConverted,
        disableAllConverted,
        isRecipeActive,
    } = useRecipes({
        filterText,
        category,
        showActiveOnly,
        machineFilter,
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-surface-high rounded-2xl h-48 border border-border/50" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 bg-red-500/10 border border-red-500/30 rounded-2xl text-center">
                <p className="text-red-400 font-bold">Failed to load recipes</p>
                <p className="text-red-400/70 text-sm mt-2">{error}</p>
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
        <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Control Bar */}
            <div className="bg-surface/40 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-xl space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-2 w-full">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim px-1">Search Recipes</label>
                        <Input
                            placeholder="Type to search..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            size="md"
                        />
                    </div>
                    <div className="w-full md:w-64 space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim px-1">Machine Category</label>
                        <Select
                            options={machineOptions}
                            value={machineFilter || ''}
                            onChange={(val) => setMachineFilter(val === '' ? null : val)}
                            placeholder="All Categories"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-6 pt-2 border-t border-border/30">
                    <div className="flex items-center gap-4">
                        <div className="flex bg-surface-high rounded-lg p-1 border border-border/50">
                            {(['standard', 'alternate', 'converted'] as const).map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(prev => prev === cat ? null : cat)}
                                    className={`
                                        px-3 py-1.5 rounded-md text-[10px] uppercase font-bold tracking-wider transition-all
                                        ${category === cat
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'text-text-dim hover:text-text hover:bg-surface-higher'
                                        }
                                    `}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                        <Toggle
                            checked={showActiveOnly}
                            onChange={setShowActiveOnly}
                            label="Enabled Only"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest text-text-dim">
                        <span className="bg-surface-high px-3 py-1.5 rounded-full border border-border/50">
                            {stats.total} Total
                        </span>
                        <span className="bg-primary/20 text-primary px-3 py-1.5 rounded-full border border-primary/20">
                            {stats.active} Enabled
                        </span>
                        {stats.activeAlternates > 0 && (
                            <span className="bg-accent/20 text-accent px-3 py-1.5 rounded-full border border-accent/20">
                                {stats.activeAlternates} Alternates
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <ActionButton onClick={enableAllStandard} label="Standard On" />
                    <ActionButton onClick={enableAllAlternates} label="Alts On" />
                    <ActionButton onClick={disableAllAlternates} label="Alts Off" />
                    <ActionButton onClick={enableAllConverted} label="Conv On" />
                    <ActionButton onClick={disableAllConverted} label="Conv Off" />
                    <ActionButton onClick={enableAll} label="All On" />
                    <ActionButton onClick={disableAll} label="All Off" />
                </div>
            </div>

            {/* Recipe Grid */}
            {recipes.length === 0 ? (
                <div className="text-center py-20 bg-surface/20 rounded-3xl border border-dashed border-border/50">
                    <p className="text-text-dim text-lg font-medium italic">No recipes match your criteria</p>
                    <button
                        onClick={() => {
                            setFilterText('');
                            setMachineFilter(null);
                            setShowActiveOnly(false);
                            setCategory(null);
                        }}
                        className="mt-4 text-primary font-bold hover:underline"
                    >
                        Reset Filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {recipes.map((recipe) => (
                        <div key={recipe.id} className="transition-all hover:scale-[1.02] active:scale-[0.98]">
                            <RecipeCard
                                recipe={recipe}
                                isActive={isRecipeActive(recipe.id)}
                                onToggle={() => toggleRecipe(recipe.id)}
                            />
                        </div>
                    ))}
                </div>
            )
            }
        </div >
    );
}

function ActionButton({ onClick, label }: { onClick: () => void; label: string }) {
    return (
        <button
            onClick={onClick}
            className="px-4 py-2 text-[10px] uppercase tracking-wider font-bold bg-surface-high/50 hover:bg-primary hover:text-white text-text-dim rounded-xl transition-all border border-border/50 hover:border-transparent"
        >
            {label}
        </button>
    );
}
