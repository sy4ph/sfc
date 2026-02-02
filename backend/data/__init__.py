# Backend data package
# Contains data loading and accessor functions

from .loader import load_game_data, get_items, get_recipes, get_all_items, get_all_recipes
from .base_resources import (
    is_base_resource,
    get_extraction_rate,
    get_extraction_machine,
    get_all_base_resources,
    BASE_RESOURCE_RATES,
    BASE_RESOURCE_MACHINES,
    BASE_RESOURCES
)
from .items import (
    get_item,
    get_item_name,
    item_exists,
    get_all_item_ids,
    get_item_description,
    get_item_stack_size,
    get_item_sink_points
)
from .recipes import (
    get_recipe,
    get_recipe_name,
    recipe_exists,
    is_alternate_recipe,
    is_special_resource_recipe,
    get_all_recipe_ids,
    get_recipes_for_item,
    get_default_active_recipes,
    get_recipe_ingredients,
    get_recipe_products,
    get_recipe_time,
    get_recipe_machines
)

__all__ = [
    # Loader
    'load_game_data', 'get_items', 'get_recipes', 'get_all_items', 'get_all_recipes',
    # Base resources
    'is_base_resource', 'get_extraction_rate', 'get_extraction_machine',
    'get_all_base_resources', 'BASE_RESOURCE_RATES', 'BASE_RESOURCE_MACHINES', 'BASE_RESOURCES',
    # Items
    'get_item', 'get_item_name', 'item_exists', 'get_all_item_ids',
    'get_item_description', 'get_item_stack_size', 'get_item_sink_points',
    # Recipes
    'get_recipe', 'get_recipe_name', 'recipe_exists', 'is_alternate_recipe',
    'is_special_resource_recipe', 'get_all_recipe_ids', 'get_recipes_for_item',
    'get_default_active_recipes', 'get_recipe_ingredients', 'get_recipe_products',
    'get_recipe_time', 'get_recipe_machines'
]
