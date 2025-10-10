from pulp import LpProblem, LpVariable, LpMinimize, lpSum, LpStatusOptimal, value, PULP_CBC_CMD, LpStatus
from flask import jsonify
from collections import defaultdict


DEFAULT_SOLVER_TIME_LIMIT = 10
DEFAULT_REL_GAP = 0.0
OPTIMIZATION_STRATEGIES = [
    'resource_efficiency',
    'resource_consolidation',
    'compact_build',
    'balanced_production',
    'custom'
]

active_recipes = {}


def calculate_reqs(data, items):
    target = data.get('item')
    amt = float(data.get('amount', 0))
    strat = data.get('optimization_strategy', 'balanced_production')
    if strat not in OPTIMIZATION_STRATEGIES:
        strat = 'balanced_production'
    weights = data.get('weights') or {}
    solver_opts = data.get('solver') or {}
    time_limit = float(solver_opts.get('time_limit', DEFAULT_SOLVER_TIME_LIMIT))
    rel_gap = float(solver_opts.get('rel_gap', DEFAULT_REL_GAP))
    provided_active = data.get('active_recipes')
    if provided_active and isinstance(provided_active, dict):
        active_map = {rid: bool(v) for rid, v in provided_active.items() if rid in recipes}
    else:
        active_map = None

    if not target or amt <= 0:
        return jsonify({'error': 'Missing parameters'}), 400
    if target not in items:
        return jsonify({'error': 'Invalid item'}), 400

    try:
        graph = lp_optimize(target, amt, strat, weights, time_limit=time_limit, rel_gap=rel_gap, active_map=active_map)
        if graph is None:
            return jsonify({'error': 'No feasible solution'}), 500
        summary = calculate_summary_stats_v2(graph)
        response = {
            'production_graph': graph,
            'target_item': target,
            'target_item_name': items.get(target, {}).get('name', target),
            'amount_requested': amt,
            'optimization_strategy': strat,
            'weights_used': weights,
            'summary': summary,
            'lp': True
        }
        return jsonify(clean_nan_values(response))
    except Exception as e:
        # Generic error response; avoids leaking internal stack traces
        return jsonify({'error': str(e)}), 500

def lp_optimize(target_item: str, amount_per_min: float, strategy: str, custom_weights: dict | None = None, time_limit: float = None, rel_gap: float = 0.0, active_map=None, items):
    """MILP optimization using provided active recipe map (stateless)."""
    if active_map is None:
        active_map = active_recipes
    # Quality-focused version: multi-pass lex for non-custom, weighted single pass for custom.
    if target_item not in items:
        raise ValueError('Unknown target item')
    if time_limit is None:
        time_limit = DEFAULT_SOLVER_TIME_LIMIT                  


def calculate_summary_stats_v2(graph: dict):
    nodes = graph.get('recipe_nodes', {})
    total_theoretical = 0.0
    total_actual = 0
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
            # base resource outputs
            for k, v in nd.get('outputs', {}).items():
                base_amount += v
                base_types.add(k)
                base_resources[k] = round(base_resources.get(k, 0) + v, 4)
        else:
            recipe_node_count += 1
            total_theoretical += nd.get('machines_needed', 0) or 0
            total_actual += nd.get('actual_machines', 0) or 0
            unique_recipes.add(nd.get('recipe_id'))
            mt = nd.get('machine_type') or 'Unknown'
            machine_breakdown[mt] += nd.get('actual_machines', 0) or 0
    # Avoid div by zero
    avg_eff = f"{round((total_theoretical/total_actual)*100,1)}%" if total_actual else 'N/A'
    summary = {
        'total_machines_theoretical': round(total_theoretical, 4),
        'total_machines_actual': total_actual,
        # Compatibility fields expected by frontend
        'total_machines': round(total_theoretical),
        'total_actual_machines': total_actual,
        'machine_breakdown': {k: v for k, v in sorted(machine_breakdown.items())},
        'base_resources': base_resources,
        'total_recipe_nodes': recipe_node_count,
        'total_base_resource_nodes': base_node_count,
        'unique_base_resource_types': len(base_types),
        'total_base_resource_amount': round(base_amount, 4),
        'base_resource_amount': round(base_amount, 4),
        'base_resource_types': len(base_types),
        'unique_recipes': len(unique_recipes),
        'objective_weights': graph.get('weights_used', {}),
        'algorithm_efficiency': {
            'machines_needed': round(total_theoretical, 4),
            'actual_machines_built': total_actual,
            'machine_efficiency': avg_eff,
            'base_resource_types': len(base_types),
            'total_base_resources_per_minute': round(base_amount, 4)
        }
    }
    return summary
# ===== End added LP section =====

