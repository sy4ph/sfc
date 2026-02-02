"""
Data loader module for Satisfactory Factory Calculator.
Handles loading and caching of game data from JSON file.
"""

import os
import json
from functools import lru_cache

# Get the base directory for the backend
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, 'data1.0.json')


@lru_cache(maxsize=1)
def load_game_data():
    """
    Load game data from JSON file with caching.
    Returns tuple of (all_items, all_recipes, items, recipes).
    
    - all_items: All items from the game data
    - all_recipes: All recipes from the game data
    - items: Filtered items (only those that can be produced)
    - recipes: Filtered recipes (only machine recipes, not building recipes)
    """
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    all_items = data.get('items', {})
    all_recipes = data.get('recipes', {})
    
    # Filter recipes: only machine recipes, not building recipes
    recipes = {
        name: recipe 
        for name, recipe in all_recipes.items() 
        if not recipe.get('forBuilding', False) and recipe.get('inMachine', True)
    }
    
    # Find all items that can be produced by recipes
    produced_items = set()
    for recipe in recipes.values():
        for product in recipe.get('products', []):
            produced_items.add(product['item'])
    
    # Filter items to only those that can be produced
    items = {
        item_id: item_data 
        for item_id, item_data in all_items.items() 
        if item_id in produced_items
    }
    
    return all_items, all_recipes, items, recipes


def get_all_items():
    """Get all items from game data (unfiltered)."""
    all_items, _, _, _ = load_game_data()
    return all_items


def get_all_recipes():
    """Get all recipes from game data (unfiltered)."""
    _, all_recipes, _, _ = load_game_data()
    return all_recipes


def get_items():
    """Get filtered items (only producible items)."""
    _, _, items, _ = load_game_data()
    return items


def get_recipes():
    """Get filtered recipes (machine recipes only)."""
    _, _, _, recipes = load_game_data()
    return recipes
