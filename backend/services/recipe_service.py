"""
Recipe service for Satisfactory Factory Calculator.
Handles recipe-related business logic and status information.
"""

from typing import Dict, Any
from ..data import get_recipes, get_default_active_recipes, SPECIAL_RESOURCE_RECIPES

def get_all_recipes_with_status() -> Dict[str, Dict[str, Any]]:
    """
    Retrieve all recipes with their default active status and metadata.
    Used by the GET /api/recipes endpoint.
    """
    recipes = get_recipes()
    active_defaults = get_default_active_recipes()
    
    recipes_with_status = {}
    for recipe_id, recipe in recipes.items():
        # Check if it's an unpackage recipe (usually disabled to prevent circular deps)
        is_unpackage = 'unpackage' in recipe_id.lower() or 'unpack' in recipe.get('name', '').lower()
        
        recipes_with_status[recipe_id] = {
            **recipe,
            'active': active_defaults.get(recipe_id, False),
            'special_resource': recipe_id in SPECIAL_RESOURCE_RECIPES,
            'is_disabled': is_unpackage,
            'disabled_reason': 'Unpackage recipes are disabled by default to prevent circular dependencies' if is_unpackage else None
        }
        
    return recipes_with_status
