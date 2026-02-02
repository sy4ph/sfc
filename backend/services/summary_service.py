"""
Summary service for Satisfactory Factory Calculator.
Calculates aggregate statistics and breakdown from a production graph.
"""

from collections import defaultdict
from typing import Dict, Any
from ..utils.math_helpers import round_to_precision
from ..data.machines import get_machine_power_usage
from ..data.recipes import get_recipe_power_data

def calculate_summary_stats(graph: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze the production graph and calculate summary statistics.
    
    Provides total machines, resource usage, and breakdown for the frontend.
    """
    nodes = graph.get('recipe_nodes', {})
    
    total_theoretical = 0.0
    total_actual = 0
    total_power = 0.0
    base_amount = 0.0
    base_types = set()
    unique_recipes = set()
    machine_breakdown = defaultdict(int)
    base_resources = {}
    recipe_node_count = 0
    base_node_count = 0
    
    for nd in nodes.values():
        if nd.get('is_base_resource'):
            base_node_count += 1
            # Accumulate base resource outputs
            for item_id, rate in nd.get('outputs', {}).items():
                base_amount += rate
                base_types.add(item_id)
                base_resources[item_id] = round_to_precision(base_resources.get(item_id, 0) + rate)
            
            # Base resources also use machines (Miners, Pumps)
            machine_type = nd.get('machine_type', 'Unknown')
            machine_count = nd.get('actual_machines', 0) or 0
            if machine_count > 0:
                machine_breakdown[machine_type] += machine_count
                total_power += get_machine_power_usage(machine_type) * machine_count
                
        elif not nd.get('is_surplus_node') and not nd.get('is_end_product_node'):
            recipe_node_count += 1
            total_theoretical += nd.get('machines_needed', 0) or 0
            total_actual += nd.get('actual_machines', 0) or 0
            
            recipe_id = nd.get('recipe_id')
            if recipe_id:
                unique_recipes.add(recipe_id)
                
            machine_type = nd.get('machine_type', 'Unknown')
            machine_count = nd.get('actual_machines', 0) or 0
            
            machine_breakdown[machine_type] += machine_count
            
            # Calculate power
            power_usage = 0.0
            power_data = get_recipe_power_data(recipe_id)
            
            if power_data['is_variable']:
                # For variable power, we assume average usage: (min + max) / 2
                avg_power_per_machine = (power_data['min_power'] + power_data['max_power']) / 2
                power_usage = avg_power_per_machine * machine_count
            else:
                # Standard power usage based on machine type
                power_usage = get_machine_power_usage(machine_type) * machine_count
                
            total_power += power_usage
            
    # Calculate overall machine efficiency
    avg_efficiency = f"{round((total_theoretical/total_actual)*100, 1)}%" if total_actual > 0 else '0%'
    
    return {
        # Core totals
        'total_machines': round_to_precision(total_theoretical),
        'total_actual_machines': total_actual,
        'machine_breakdown': dict(sorted(machine_breakdown.items())),
        'total_power': round_to_precision(total_power) or 0.0,

        
        # Resource stats
        'base_resources': base_resources,
        'unique_base_resource_types': len(base_types),
        'total_base_resource_amount': round_to_precision(base_amount),
        
        # Graph metadata
        'total_recipe_nodes': recipe_node_count,
        'total_base_resource_nodes': base_node_count,
        'unique_recipes': len(unique_recipes),
        
        # Legacy/Extra fields for compatibility
        'algorithm_efficiency': {
            'machine_efficiency': avg_efficiency,
            'total_base_resources_per_minute': round_to_precision(base_amount)
        }
    }
