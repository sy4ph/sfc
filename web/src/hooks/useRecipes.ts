'use client';
import { useEffect, useMemo } from 'react';
import { useRecipeStore } from '@/stores/recipeStore';
import type { Recipe } from '@/types';
interface UseRecipesOptions {
    filterText?: string;
    category?: 'standard' | 'alternate' | 'converted' | null;
    showActiveOnly?: boolean;
    showAlternatesOnly?: boolean;
    machineFilter?: string | null;
}
export function useRecipes(options: UseRecipesOptions = {}) {
    const {
        recipes,
        activeRecipes,
        isLoading,
        error,
        fetchRecipes,
        toggleRecipe,
        setRecipeActive,
        enableAll,
        disableAll,
        enableAllStandard,
        disableAllAlternates,
        enableAllAlternates,
        enableAllConverted,
        disableAllConverted,
    } = useRecipeStore();
    useEffect(() => {
        if (Object.keys(recipes).length === 0 && !isLoading) {
            fetchRecipes();
        }
    }, [recipes, isLoading, fetchRecipes]);
    // Get filtered and sorted recipes
    const filteredRecipes = useMemo(() => {
        let result = Object.values(recipes);
        // Filter by text
        if (options.filterText) {
            const searchLower = options.filterText.toLowerCase();
            result = result.filter((r) =>
                r.name.toLowerCase().includes(searchLower) ||
                r.id.toLowerCase().includes(searchLower)
            );
        }
        // Helper to check for "Converted" recipes (Ore A + Reanimated SAM -> Ore B)
        const isConvertedRecipe = (r: Recipe) => {
            const isConverter = r.producedIn.some(m => m.includes('Converter_C'));
            const hasSam = r.ingredients.some(i => i.item === 'Desc_SAMIngot_C'); // Reanimated SAM
            const isFicsite = r.id.includes('FicsiteIngot');
            return isConverter && hasSam && !isFicsite;
        };
        // Category Filter
        if (options.category === 'alternate') {
            result = result.filter(r => r.alternate);
        } else if (options.category === 'converted') {
            result = result.filter(r => isConvertedRecipe(r));
        } else if (options.category === 'standard') {
            // Standard: not alternate and not converted
            result = result.filter(r =>
                !r.alternate &&
                !isConvertedRecipe(r) &&
                // Also exclude Quantum stuff from Standard if not explicitly requested? 
                // For now, Standard + Converted + Alternate covers mostly everything.
                // Keeping it simple: Standard is what's left.
                // But wait, QuantumEncoder recipes might be "Standard" game-wise but maybe "Advanced" for user?
                // User only specified definition for "Converted".
                // I'll stick to: Standard = !Alternate && !Converted.
                true
            );
        }
        // Filter active only
        if (options.showActiveOnly) {
            result = result.filter((r) => activeRecipes[r.id]);
        }
        // Filter alternates only
        if (options.showAlternatesOnly) {
            result = result.filter((r) => r.alternate);
        }
        // Filter by machine
        if (options.machineFilter) {
            result = result.filter((r) =>
                r.producedIn.some((m) => m.includes(options.machineFilter!))
            );
        }
        // Sort: standard recipes first, then by name
        return result.sort((a, b) => {
            if (options.category) return a.name.localeCompare(b.name);
            if (a.alternate !== b.alternate) {
                return a.alternate ? 1 : -1;
            }
            return a.name.localeCompare(b.name);
        });
    }, [recipes, activeRecipes, options.filterText, options.category, options.showActiveOnly, options.machineFilter]);
    // Get unique machine types
    const machineTypes = useMemo(() => {
        const machines = new Set<string>();
        for (const recipe of Object.values(recipes)) {
            for (const machine of recipe.producedIn) {
                machines.add(machine);
            }
        }
        return Array.from(machines).sort();
    }, [recipes]);
    // Stats
    const stats = useMemo(() => {
        const total = Object.keys(recipes).length;
        const active = Object.values(activeRecipes).filter(Boolean).length;
        const alternates = Object.values(recipes).filter((r) => r.alternate).length;
        const activeAlternates = Object.entries(recipes)
            .filter(([id, r]) => r.alternate && activeRecipes[id])
            .length;
        return { total, active, alternates, activeAlternates };
    }, [recipes, activeRecipes]);
    return {
        recipes: filteredRecipes,
        allRecipes: recipes,
        activeRecipes,
        isLoading,
        error,
        stats,
        machineTypes,
        toggleRecipe,
        setRecipeActive,
        enableAll,
        disableAll,
        enableAllStandard,
        disableAllAlternates,
        enableAllAlternates,
        enableAllConverted,
        disableAllConverted,
        isRecipeActive: (recipeId: string) => activeRecipes[recipeId] ?? false,
    };
}
