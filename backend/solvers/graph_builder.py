"""
Graph builder module for Satisfactory Factory Calculator.
Provides functions to build different types of nodes for the production graph.
"""

from typing import Dict, Any, List
from ..utils.math_helpers import round_to_precision
from ..utils.machine_helpers import calculate_machine_info, get_machine_display_name
from ..data.items import get_item_name
from ..data.base_resources import BASE_RESOURCE_RATES, BASE_RESOURCE_MACHINES

def build_recipe_node(node_id: str, recipe_id: str, recipe_data: Dict[str, Any], 
                      machines_needed: float, cycles_per_min: float, 
                      inputs: Dict[str, float], outputs: Dict[str, float]) -> Dict[str, Any]:
    """Build a standard recipe production node."""
    machine_type = recipe_data.get('producedIn', ['Unknown'])[0]
    machine_display_name = get_machine_display_name(machine_type)
    machine_info = calculate_machine_info(machines_needed, machine_display_name)
    
    return {
        'node_id': node_id,
        'recipe_id': recipe_id,
        'recipe_name': recipe_data.get('name', recipe_id),
        'machine_type': machine_type,
        'machines_needed': round_to_precision(machines_needed),
        'actual_machines': machine_info['actual_machines'],
        'machine_efficiency': machine_info['efficiency_percent'],
        'machine_display': machine_info['display_text'],
        'recipe_time': recipe_data.get('time', 1.0),
        'cycles_per_minute': cycles_per_min,
        'is_base_resource': False,
        'is_alternate': recipe_data.get('alternate', False),
        'inputs': inputs,
        'outputs': outputs,
        'recipe_data': recipe_data, # Include original data for reference if needed
        'optimal_recipe': True      # In MILP result, all recipes used are part of optimal solution
    }

def build_base_resource_node(node_id: str, item_id: str, rate: float) -> Dict[str, Any]:
    """Build a node representing a base resource extraction site."""
    theoretical_machines = rate / BASE_RESOURCE_RATES.get(item_id, 60)
    machine_type_class = BASE_RESOURCE_MACHINES.get(item_id, 'Miner')
    machine_display_name = get_machine_display_name(machine_type_class)
    machine_info = calculate_machine_info(theoretical_machines, machine_display_name)
    
    return {
        'node_id': node_id,
        'recipe_id': f'extract_{item_id}',
        'recipe_name': f'Extract {get_item_name(item_id)}',
        'machine_type': machine_type_class,
        'machines_needed': round_to_precision(theoretical_machines),
        'actual_machines': machine_info['actual_machines'],
        'machine_efficiency': machine_info['efficiency_percent'],
        'machine_display': machine_info['display_text'],
        'is_base_resource': True,
        'inputs': {},
        'outputs': {item_id: round_to_precision(rate)}
    }

def build_end_product_node(node_id: str, item_id: str, amount: float) -> Dict[str, Any]:
    """Build the final target product node."""
    return {
        'node_id': node_id,
        'recipe_id': f'end_product_{item_id}',
        'recipe_name': f'Target: {get_item_name(item_id)}',
        'machine_type': 'End Product',
        'machines_needed': 0,
        'is_end_product_node': True,
        'inputs': {item_id: amount},
        'outputs': {},
        'target_item_id': item_id,
        'target_amount': amount
    }

def build_surplus_node(node_id: str, item_id: str, amount: float) -> Dict[str, Any]:
    """Build a node representing surplus/excess production of an item."""
    return {
        'node_id': node_id,
        'recipe_id': f'surplus_{item_id}',
        'recipe_name': f'Surplus: {get_item_name(item_id)}',
        'machine_type': 'Surplus Output',
        'machines_needed': 0,
        'is_surplus_node': True,
        'inputs': {item_id: amount},
        'outputs': {},
        'surplus_amount': amount,
        'surplus_item_id': item_id
    }
