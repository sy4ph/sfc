import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Recipe } from '@/types';
import api from '@/lib/api';

interface RecipeStore {
    // State
    recipes: Record<string, Recipe>;
    activeRecipes: Record<string, boolean>;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchRecipes: () => Promise<void>;
    toggleRecipe: (recipeId: string) => void;
    setRecipeActive: (recipeId: string, active: boolean) => void;
    enableAll: () => void;
    disableAll: () => void;
    enableAllStandard: () => void;
    enableAllAlternates: () => void;
    disableAllAlternates: () => void;
    enableAllConverted: () => void;
    disableAllConverted: () => void;
    getActiveRecipesMap: () => Record<string, boolean>;
}

export const useRecipeStore = create<RecipeStore>()(
    persist(
        (set, get) => ({
            recipes: {},
            activeRecipes: {},
            isLoading: false,
            error: null,

            fetchRecipes: async () => {
                if (get().isLoading) return;
                set({ isLoading: true, error: null });
                try {
                    const recipes = await api.getRecipes();

                    // Initialize active recipes from defaults if not already set
                    const currentActive = get().activeRecipes;
                    const activeRecipes: Record<string, boolean> = {};

                    for (const [id, recipe] of Object.entries(recipes)) {
                        // Use existing state if available, otherwise use default
                        activeRecipes[id] = currentActive[id] ?? recipe.active;
                    }

                    set({ recipes, activeRecipes, isLoading: false });
                } catch (err) {
                    set({
                        error: err instanceof Error ? err.message : 'Failed to fetch recipes',
                        isLoading: false
                    });
                }
            },

            toggleRecipe: (recipeId: string) => {
                set((state) => ({
                    activeRecipes: {
                        ...state.activeRecipes,
                        [recipeId]: !state.activeRecipes[recipeId],
                    },
                }));
            },

            setRecipeActive: (recipeId: string, active: boolean) => {
                set((state) => ({
                    activeRecipes: {
                        ...state.activeRecipes,
                        [recipeId]: active,
                    },
                }));
            },

            enableAll: () => {
                set((state) => {
                    const activeRecipes: Record<string, boolean> = {};
                    for (const id of Object.keys(state.recipes)) {
                        activeRecipes[id] = true;
                    }
                    return { activeRecipes };
                });
            },

            disableAll: () => {
                set((state) => {
                    const activeRecipes: Record<string, boolean> = {};
                    for (const id of Object.keys(state.recipes)) {
                        activeRecipes[id] = false;
                    }
                    return { activeRecipes };
                });
            },

            enableAllStandard: () => {
                set((state) => {
                    const activeRecipes: Record<string, boolean> = {};
                    for (const [id, recipe] of Object.entries(state.recipes)) {
                        activeRecipes[id] = !recipe.alternate;
                    }
                    return { activeRecipes };
                });
            },

            enableAllAlternates: () => {
                set((state) => {
                    const activeRecipes = { ...state.activeRecipes };
                    for (const [id, recipe] of Object.entries(state.recipes)) {
                        if (recipe.alternate) {
                            activeRecipes[id] = true;
                        }
                    }
                    return { activeRecipes };
                });
            },

            disableAllAlternates: () => {
                set((state) => {
                    const activeRecipes = { ...state.activeRecipes };
                    for (const [id, recipe] of Object.entries(state.recipes)) {
                        if (recipe.alternate) {
                            activeRecipes[id] = false;
                        }
                    }
                    return { activeRecipes };
                });
            },

            enableAllConverted: () => {
                set((state) => {
                    const activeRecipes = { ...state.activeRecipes };
                    for (const [id, recipe] of Object.entries(state.recipes)) {
                        const isConverter = recipe.producedIn.some(m => m.includes('Converter_C'));
                        const hasSam = recipe.ingredients.some(i => i.item === 'Desc_SAMIngot_C'); // Reanimated SAM
                        const isFicsite = id.includes('FicsiteIngot');

                        if (isConverter && hasSam && !isFicsite) {
                            activeRecipes[id] = true;
                        }
                    }
                    return { activeRecipes };
                });
            },

            disableAllConverted: () => {
                set((state) => {
                    const activeRecipes = { ...state.activeRecipes };
                    for (const [id, recipe] of Object.entries(state.recipes)) {
                        const isConverter = recipe.producedIn.some(m => m.includes('Converter_C'));
                        const hasSam = recipe.ingredients.some(i => i.item === 'Desc_SAMIngot_C'); // Reanimated SAM
                        const isFicsite = id.includes('FicsiteIngot');

                        if (isConverter && hasSam && !isFicsite) {
                            activeRecipes[id] = false;
                        }
                    }
                    return { activeRecipes };
                });
            },

            getActiveRecipesMap: () => {
                return get().activeRecipes;
            },
        }),
        {
            name: 'sfc-recipes',
            partialize: (state) => ({ activeRecipes: state.activeRecipes }),
        }
    )
);
