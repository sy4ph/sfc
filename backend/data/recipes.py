"""
Recipes accessor module for Satisfactory Factory Calculator.
Provides functions to access and query recipe data.
"""

from functools import lru_cache
from .loader import get_recipes
from ..config import SPECIAL_RESOURCE_RECIPES


def get_recipe(recipe_id: str) -> dict | None:
    """
    Get a single recipe by ID.
    Returns None if recipe doesn't exist.
    """
    recipes = get_recipes()
    return recipes.get(recipe_id)


def get_recipe_name(recipe_id: str) -> str:
    """
    Get the display name for a recipe.
    Returns the recipe_id if recipe doesn't exist or has no name.
    """
    recipes = get_recipes()
    recipe = recipes.get(recipe_id)
    if recipe:
        return recipe.get('name', recipe_id)
    return recipe_id


def recipe_exists(recipe_id: str) -> bool:
    """Check if a recipe exists."""
    recipes = get_recipes()
    return recipe_id in recipes


def is_alternate_recipe(recipe_id: str) -> bool:
    """Check if a recipe is an alternate recipe."""
    recipes = get_recipes()
    recipe = recipes.get(recipe_id)
    if recipe:
        return recipe.get('alternate', False)
    return False


def is_special_resource_recipe(recipe_id: str) -> bool:
    """Check if a recipe is a special resource recipe (disabled by default)."""
    return recipe_id in SPECIAL_RESOURCE_RECIPES


@lru_cache(maxsize=1)
def get_all_recipe_ids() -> frozenset:
    """
    Get a frozen set of all recipe IDs.
    Cached for performance.
    """
    recipes = get_recipes()
    return frozenset(recipes.keys())


def get_recipes_for_item(item_id: str, active_recipes: dict | None = None) -> list:
    """
    Find all recipes that produce a given item.
    
    Args:
        item_id: The item ID to find recipes for
        active_recipes: Optional dict of recipe_id -> bool for filtering.
                       If None, uses default active status.
    
    Returns:
        List of recipe data dicts with additional computed fields.
    """
    recipes = get_recipes()
    available_recipes = []
    
    for recipe_id, recipe in recipes.items():
        # Determine if recipe is active
        if active_recipes is not None:
            # Use provided active state
            if not active_recipes.get(recipe_id, False):
                continue
        else:
            # Use default: alternates and special resources are inactive
            if recipe.get('alternate', False):
                continue
            if recipe_id in SPECIAL_RESOURCE_RECIPES:
                continue
        
        # Skip unpackage recipes to prevent circular dependencies
        if 'unpackage' in recipe_id.lower() or 'unpack' in recipe.get('name', '').lower():
            continue
        
        # Check if this recipe produces the target item
        for product in recipe.get('products', []):
            if product['item'] == item_id:
                recipe_time = recipe.get('time', 1.0)
                if recipe_time <= 0:
                    recipe_time = 1.0
                    
                output_amount = product['amount']
                items_per_minute = (output_amount * 60) / recipe_time
                
                # Build list of all products with rates
                all_products = []
                for prod in recipe.get('products', []):
                    prod_rate = (prod['amount'] * 60) / recipe_time
                    all_products.append({
                        'item': prod['item'],
                        'amount': prod['amount'],
                        'rate_per_minute': prod_rate,
                        'is_target': prod['item'] == item_id
                    })
                
                available_recipes.append({
                    'recipe_id': recipe_id,
                    'recipe': recipe,
                    'target_product': product,
                    'items_per_minute': items_per_minute,
                    'recipe_time': recipe_time,
                    'all_products': all_products
                })
                break
    
    return available_recipes


def get_default_active_recipes() -> dict:
    """
    Get the default active recipe state.
    Standard recipes are active, alternates and special resource recipes are inactive.
    
    Returns:
        Dict of recipe_id -> bool
    """
    recipes = get_recipes()
    active_recipes = {}
    
    for recipe_id, recipe in recipes.items():
        if recipe_id in SPECIAL_RESOURCE_RECIPES:
            active_recipes[recipe_id] = False
        else:
            # Standard recipes are active, alternates are inactive
            active_recipes[recipe_id] = not recipe.get('alternate', False)
    
    return active_recipes


def get_recipe_ingredients(recipe_id: str) -> list:
    """
    Get the ingredients for a recipe.
    Returns empty list if recipe doesn't exist.
    """
    recipe = get_recipe(recipe_id)
    if recipe:
        return recipe.get('ingredients', [])
    return []


def get_recipe_products(recipe_id: str) -> list:
    """
    Get the products for a recipe.
    Returns empty list if recipe doesn't exist.
    """
    recipe = get_recipe(recipe_id)
    if recipe:
        return recipe.get('products', [])
    return []


def get_recipe_time(recipe_id: str) -> float:
    """
    Get the crafting time for a recipe in seconds.
    Returns 1.0 as default if not found.
    """
    recipe = get_recipe(recipe_id)
    if recipe:
        time = recipe.get('time', 1.0)
        return time if time > 0 else 1.0
    return 1.0


def get_recipe_machines(recipe_id: str) -> list:
    """
    Get the machines that can craft a recipe.
    Returns empty list if recipe doesn't exist.
    """
    recipe = get_recipe(recipe_id)
    if recipe:
        return recipe.get('producedIn', [])
    return []
