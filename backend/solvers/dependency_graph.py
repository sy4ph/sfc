"""
Dependency graph functionality for the MILP solver.
Computes the closure of items and recipes needed for a given target item.
"""

from typing import Set, Tuple, Dict, Any
from functools import lru_cache
from ..data import is_base_resource, get_recipes

def dependency_closure_recipes(target_item: str, recipes_data: Dict[str, Any], active_map: Dict[str, bool] = None) -> Tuple[Set[str], Set[str]]:
    """
    Compute dependency closure of items and recipes for a target item.
    Prunes based on active recipes provided in active_map.
    
    Args:
        target_item: The ID of the item to produce.
        recipes_data: Total recipe dictionary (from data layer).
        active_map: Map of recipe_id -> boolean indicating if recipe is enabled.
        
    Returns:
        Tuple of (needed_items_set, needed_recipes_set).
    """
    if active_map is None:
        # If no map provided, we assume we might want to consider all recipes 
        # but usually the solver will provide a map from its state.
        active_map = {}

    needed_items = set()
    needed_recipes = set()
    stack = [target_item]
    
    # Safeguard against circular dependencies or extremely deep trees
    depth_guard = 0
    max_depth = 10000
    
    while stack and depth_guard < max_depth:
        depth_guard += 1
        itm = stack.pop()
        
        if itm in needed_items:
            continue
            
        needed_items.add(itm)
        
        if is_base_resource(itm):
            continue
            
        for r_id, r in recipes_data.items():
            # Only consider recipes that are active
            if not active_map.get(r_id, False):
                continue
                
            # Check if this recipe produces the item
            produces = any(p['item'] == itm for p in r.get('products', []))
            if not produces:
                continue
                
            needed_recipes.add(r_id)
            
            # Add all ingredients to stack to explore their dependencies
            for ing in r.get('ingredients', []):
                stack.append(ing['item'])
                
    return needed_items, needed_recipes
