import type { Item, Recipe, CalculateResponse } from '@/types';

export const MOCK_ITEMS: Record<string, Item> = {
    'Desc_IronOre_C': { id: 'Desc_IronOre_C', name: 'Iron Ore', stackSize: 100, sinkPoints: 1 },
    'Desc_IronIngot_C': { id: 'Desc_IronIngot_C', name: 'Iron Ingot', stackSize: 100, sinkPoints: 2 },
    'Desc_IronPlate_C': { id: 'Desc_IronPlate_C', name: 'Iron Plate', stackSize: 200, sinkPoints: 6 },
    'Desc_IronRod_C': { id: 'Desc_IronRod_C', name: 'Iron Rod', stackSize: 200, sinkPoints: 4 },
    'Desc_Screw_C': { id: 'Desc_Screw_C', name: 'Screw', stackSize: 500, sinkPoints: 2 },
    'Desc_ReinforcedIronPlate_C': { id: 'Desc_ReinforcedIronPlate_C', name: 'Reinforced Iron Plate', stackSize: 100, sinkPoints: 120 },
};

export const MOCK_RECIPES: Record<string, Recipe> = {
    'Recipe_IronIngot_C': {
        id: 'Recipe_IronIngot_C',
        name: 'Iron Ingot',
        time: 2,
        ingredients: [{ item: 'Desc_IronOre_C', amount: 1 }],
        products: [{ item: 'Desc_IronIngot_C', amount: 1 }],
        producedIn: ['Desc_SmelterMk1_C'],
        alternate: false,
        active: true
    },
    'Recipe_IronPlate_C': {
        id: 'Recipe_IronPlate_C',
        name: 'Iron Plate',
        time: 6,
        ingredients: [{ item: 'Desc_IronIngot_C', amount: 3 }],
        products: [{ item: 'Desc_IronPlate_C', amount: 2 }],
        producedIn: ['Desc_ConstructorMk1_C'],
        alternate: false,
        active: true
    },
    'Recipe_IronRod_C': {
        id: 'Recipe_IronRod_C',
        name: 'Iron Rod',
        time: 4,
        ingredients: [{ item: 'Desc_IronIngot_C', amount: 1 }],
        products: [{ item: 'Desc_IronRod_C', amount: 1 }],
        producedIn: ['Desc_ConstructorMk1_C'],
        alternate: false,
        active: true
    },
    'Recipe_Screw_C': {
        id: 'Recipe_Screw_C',
        name: 'Screw',
        time: 6,
        ingredients: [{ item: 'Desc_IronRod_C', amount: 1 }],
        products: [{ item: 'Desc_Screw_C', amount: 4 }],
        producedIn: ['Desc_ConstructorMk1_C'],
        alternate: false,
        active: true
    },
    'Recipe_Alternate_Screw_C': {
        id: 'Recipe_Alternate_Screw_C',
        name: 'Cast Screw',
        time: 24,
        ingredients: [{ item: 'Desc_IronIngot_C', amount: 5 }],
        products: [{ item: 'Desc_Screw_C', amount: 20 }],
        producedIn: ['Desc_ConstructorMk1_C'],
        alternate: true,
        active: false
    },
    'Recipe_ReinforcedIronPlate_C': {
        id: 'Recipe_ReinforcedIronPlate_C',
        name: 'Reinforced Iron Plate',
        time: 12,
        ingredients: [
            { item: 'Desc_IronPlate_C', amount: 6 },
            { item: 'Desc_Screw_C', amount: 12 }
        ],
        products: [{ item: 'Desc_ReinforcedIronPlate_C', amount: 1 }],
        producedIn: ['Desc_AssemblerMk1_C'],
        alternate: false,
        active: true
    },
    'Recipe_Alternate_ReinforcedIronPlate_1_C': {
        id: 'Recipe_Alternate_ReinforcedIronPlate_1_C',
        name: 'Stitched Iron Plate',
        time: 32,
        ingredients: [
            { item: 'Desc_IronPlate_C', amount: 10 },
            { item: 'Desc_Wire_C', amount: 20 } // Wire is missing from items but okay for mock
        ],
        products: [{ item: 'Desc_ReinforcedIronPlate_C', amount: 3 }],
        producedIn: ['Desc_AssemblerMk1_C'],
        alternate: true,
        active: false
    }
};

export const MOCK_CALCULATION: CalculateResponse = {
    production_graph: {
        recipe_nodes: {
            'node_1': {
                node_id: 'node_1',
                recipe_id: 'Recipe_ReinforcedIronPlate_C',
                item_id: 'Desc_ReinforcedIronPlate_C',
                recipe_name: 'Reinforced Iron Plate',
                machine_type: 'Assembler',
                machines_needed: 2,
                actual_machines: 2,
                machine_efficiency: 100,
                machine_display: '2.0x Assembler',
                is_base_resource: false,
                is_end_product_node: true,
                inputs: { 'Desc_IronPlate_C': 60, 'Desc_Screw_C': 120 },
                outputs: { 'Desc_ReinforcedIronPlate_C': 10 }
            },
            'node_2': {
                node_id: 'node_2',
                recipe_id: 'Recipe_IronPlate_C',
                item_id: 'Desc_IronPlate_C',
                recipe_name: 'Iron Plate',
                machine_type: 'Constructor',
                machines_needed: 3,
                actual_machines: 3,
                machine_efficiency: 100,
                machine_display: '3.0x Constructor',
                is_base_resource: false,
                inputs: { 'Desc_IronIngot_C': 90 },
                outputs: { 'Desc_IronPlate_C': 60 }
            },
            'node_3': {
                node_id: 'node_3',
                recipe_id: 'Recipe_Screw_C',
                item_id: 'Desc_Screw_C',
                recipe_name: 'Screw',
                machine_type: 'Constructor',
                machines_needed: 3,
                actual_machines: 3,
                machine_efficiency: 100,
                machine_display: '3.0x Constructor',
                is_base_resource: false,
                inputs: { 'Desc_IronRod_C': 30 },
                outputs: { 'Desc_Screw_C': 120 }
            },
            'node_4': {
                node_id: 'node_4',
                recipe_id: 'Recipe_IronRod_C',
                item_id: 'Desc_IronRod_C',
                recipe_name: 'Iron Rod',
                machine_type: 'Constructor',
                machines_needed: 2,
                actual_machines: 2,
                machine_efficiency: 100,
                machine_display: '2.0x Constructor',
                is_base_resource: false,
                inputs: { 'Desc_IronIngot_C': 30 },
                outputs: { 'Desc_IronRod_C': 30 }
            },
            'node_5': {
                node_id: 'node_5',
                recipe_id: 'Recipe_IronIngot_C',
                item_id: 'Desc_IronIngot_C',
                recipe_name: 'Iron Ingot',
                machine_type: 'Smelter',
                machines_needed: 4,
                actual_machines: 4,
                machine_efficiency: 100,
                machine_display: '4.0x Smelter',
                is_base_resource: false,
                inputs: { 'Desc_IronOre_C': 120 },
                outputs: { 'Desc_IronIngot_C': 120 }
            },
            'node_6': {
                node_id: 'node_6',
                recipe_id: 'Desc_IronOre_C',
                item_id: 'Desc_IronOre_C',
                recipe_name: 'Iron Ore',
                machine_type: 'Resource',
                machines_needed: 0,
                actual_machines: 0,
                machine_efficiency: 0,
                machine_display: '120.0/min',
                is_base_resource: true,
                inputs: {},
                outputs: { 'Desc_IronOre_C': 120 }
            }
        },
        target_item: 'Desc_ReinforcedIronPlate_C',
        target_amount: 10,
        weights_used: { base: 1, base_types: 0.2, machines: 0, recipes: 1 },
        strategy: 'balanced_production',
        proven_optimal: true
    },
    target_item: 'Desc_ReinforcedIronPlate_C',
    target_item_name: 'Reinforced Iron Plate',
    amount_requested: 10,
    optimization_strategy: 'balanced_production',
    summary: {
        total_machines: 14,
        total_actual_machines: 14,
        machine_breakdown: {
            'Desc_AssemblerMk1_C': 2,
            'Desc_ConstructorMk1_C': 8,
            'Desc_SmelterMk1_C': 4
        },
        base_resources: { 'Desc_IronOre_C': 120 },
        total_recipe_nodes: 6,
        total_base_resource_nodes: 1,
        unique_base_resource_types: 1,
        total_base_resource_amount: 120,
        unique_recipes: 5,
        total_power: 145.5
    },
    lp: true
};
