"""
Calculation service for Satisfactory Factory Calculator.
Orchestrates the data, solver, and summary layers to produce a result.
"""

from typing import Dict, Any, Optional, List
from ..data import get_items, get_recipes, get_item_name, get_default_active_recipes
from ..solvers import MILPSolver
from .summary_service import calculate_summary_stats
from ..utils.math_helpers import clean_nan_values

def calculate_production(
    targets: List[Dict[str, Any]] = None,
    strategy: str = 'balanced_production', 
    active_recipes: Optional[Dict[str, bool]] = None,
    weights: Optional[Dict[str, float]] = None,
    solver_opts: Optional[Dict[str, Any]] = None,
    # Legacy single-target params (deprecated but supported)
    target_item: str = None,
    amount: float = None
) -> Dict[str, Any]:
    """
    High-level entry point for calculating a production plan.
    
    Args:
        targets: List of targets [{"item": str, "amount": float}, ...]
        strategy: Optimization strategy name
        active_recipes: Client-provided recipe enable map (stateless)
        weights: Custom weights for 'custom' strategy
        solver_opts: Options like time_limit and rel_gap
        target_item: (DEPRECATED) Single target item ID
        amount: (DEPRECATED) Single target amount
        
    Returns:
        Complete API response dictionary.
    """
    # Handle legacy single-target API
    if targets is None:
        if target_item is not None and amount is not None:
            targets = [{"item": target_item, "amount": amount}]
        else:
            raise ValueError("Must provide 'targets' list or legacy 'target_item'/'amount' parameters")
    
    if not targets:
        raise ValueError("Must provide at least one target")

    # 1. Load data
    items_data = get_items()
    recipes_data = get_recipes()
    
    # 2. Extract solver options
    if solver_opts is None:
        solver_opts = {}
        
    time_limit = solver_opts.get('time_limit')
    rel_gap = solver_opts.get('rel_gap')
    
    # 3. Handle active recipes (fallback to defaults if not provided)
    if active_recipes is None:
        active_map = get_default_active_recipes()
    else:
        # Filter provided map to ensure we only have valid recipe IDs
        active_map = {rid: bool(v) for rid, v in active_recipes.items() if rid in recipes_data}
        
    # 4. Run solver
    solver = MILPSolver(items_data, recipes_data)
    
    graph = solver.optimize(
        targets=targets,
        strategy=strategy,
        active_map=active_map,
        custom_weights=weights,
        time_limit=time_limit,
        rel_gap=rel_gap
    )
    
    if graph is None:
        raise ValueError("No feasible solution found for the given parameters.")
        
    # 5. Build summary
    summary = calculate_summary_stats(graph)
    
    # 6. Assemble final response
    response = {
        'production_graph': graph,
        'targets': targets,
        # Legacy single-target fields for backward compatibility
        'target_item': targets[0]['item'] if len(targets) == 1 else None,
        'target_item_name': get_item_name(targets[0]['item']) if len(targets) == 1 else None,
        'amount_requested': targets[0]['amount'] if len(targets) == 1 else None,
        'optimization_strategy': strategy,
        'weights_used': graph.get('weights_used', {}),
        'summary': summary,
        'lp': True
    }
    
    # Ensure no NaN/Inf values (important for JSON serialization)
    return clean_nan_values(response)

