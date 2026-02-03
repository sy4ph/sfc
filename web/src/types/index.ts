// ===== API Request Types =====

export interface CalculateRequest {
    item: string;
    amount: number;
    optimization_strategy?: OptimizationStrategy;
    active_recipes?: Record<string, boolean>;
    weights?: StrategyWeights;
    solver?: SolverOptions;
}

export type OptimizationStrategy =
    | 'resource_efficiency'
    | 'resource_consolidation'
    | 'compact_build'
    | 'balanced_production'
    | 'custom';

export interface StrategyWeights {
    base: number;
    base_types: number;
    machines: number;
    recipes: number;
}

export interface SolverOptions {
    time_limit?: number;
    rel_gap?: number;
}

// ===== API Response Types =====

export interface CalculateResponse {
    production_graph: ProductionGraph;
    target_item: string;
    target_item_name: string;
    amount_requested: number;
    optimization_strategy: string;
    summary: ProductionSummary;
    lp: boolean;
}

export interface ProductionGraph {
    recipe_nodes: Record<string, RecipeNode>;
    target_item: string;
    target_amount: number;
    weights_used: StrategyWeights;
    strategy: string;
    proven_optimal: boolean;
}

export interface RecipeNode {
    node_id: string;
    recipe_id: string;
    item_id: string;
    recipe_name: string;
    machine_type: string;
    machines_needed: number;
    actual_machines: number;
    machine_efficiency: number;
    machine_display: string;
    recipe_time?: number;
    cycles_per_minute?: number;
    is_base_resource: boolean;
    is_alternate?: boolean;
    is_surplus_node?: boolean;
    is_end_product_node?: boolean;
    inputs: Record<string, number>;
    outputs: Record<string, number>;
    surplus_amount?: number;
    surplus_item_id?: string;
    target_item_id?: string;
    target_amount?: number;
}

export interface ProductionSummary {
    total_machines: number;
    total_actual_machines: number;
    machine_breakdown: Record<string, number>;
    base_resources: Record<string, number>;
    total_recipe_nodes: number;
    total_base_resource_nodes: number;
    unique_base_resource_types: number;
    total_base_resource_amount: number;
    unique_recipes: number;
    total_power?: number;
}

// ===== Reference Data Types =====

export interface Item {
    id: string;
    name: string;
    description?: string;
    stackSize?: number;
    sinkPoints?: number;
}

export interface Ingredient {
    item: string;
    amount: number;
}

export interface Product {
    item: string;
    amount: number;
}

export interface Recipe {
    id: string;
    name: string;
    time: number;
    ingredients: Ingredient[];
    products: Product[];
    producedIn: string[];
    alternate: boolean;
    active: boolean;
}

// ===== UI State Types =====

export interface CalculationState {
    targetItem: string | null;
    targetAmount: number;
    strategy: OptimizationStrategy;
    customWeights: StrategyWeights;
    result: CalculateResponse | null;
    isCalculating: boolean;
    error: string | null;
}

export interface RecipeState {
    recipes: Record<string, Recipe>;
    activeRecipes: Record<string, boolean>;
    isLoading: boolean;
    error: string | null;
}

export interface ItemState {
    items: Record<string, Item>;
    isLoading: boolean;
    error: string | null;
}

// ===== Strategy Metadata =====

export interface StrategyInfo {
    id: OptimizationStrategy;
    name: string;
    description: string;
}

export const STRATEGIES: StrategyInfo[] = [
    {
        id: 'balanced_production',
        name: 'Balanced Production',
        description: 'Balance between resource usage and factory complexity'
    },
    {
        id: 'resource_efficiency',
        name: 'Resource Efficiency',
        description: 'Minimize total base resource consumption'
    },
    {
        id: 'resource_consolidation',
        name: 'Resource Consolidation',
        description: 'Minimize variety of base resources needed'
    },
    {
        id: 'compact_build',
        name: 'Compact Build',
        description: 'Minimize number of unique recipes and machines'
    },
    {
        id: 'custom',
        name: 'Custom Weights',
        description: 'Define your own optimization priorities'
    }
];

export const DEFAULT_WEIGHTS: StrategyWeights = {
    base: 1.0,
    base_types: 0.2,
    machines: 0.0,
    recipes: 1.0
};
