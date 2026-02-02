"""
Unit tests for data recipes accessor module.
"""

import pytest
from unittest.mock import patch
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend.data import recipes

class TestDataRecipes:
    """Test recipe accessor functions."""

    @pytest.fixture
    def mock_recipes_data(self):
        return {
            "Recipe_IngotIron_C": {
                "id": "Recipe_IngotIron_C",
                "name": "Iron Ingot",
                "time": 2.0,
                "ingredients": [{"item": "Desc_OreIron_C", "amount": 1}],
                "products": [{"item": "Desc_IronIngot_C", "amount": 1}],
                "producedIn": ["Desc_SmelterMk1_C"],
                "alternate": False,
                "inMachine": True
            },
            "Recipe_Alternate_PureIronIngot_C": {
                "id": "Recipe_Alternate_PureIronIngot_C",
                "name": "Pure Iron Ingot",
                "time": 12.0,
                "ingredients": [{"item": "Desc_OreIron_C", "amount": 7}, {"item": "Desc_Water_C", "amount": 4}],
                "products": [{"item": "Desc_IronIngot_C", "amount": 13}],
                "producedIn": ["Desc_Refinery_C"],
                "alternate": True,
                "inMachine": True
            },
            "Recipe_IronPlate_C": {
                "id": "Recipe_IronPlate_C",
                "name": "Iron Plate",
                "time": 6.0,
                "products": [{"item": "Desc_IronPlate_C", "amount": 2}],
                "alternate": False
            },
            "Recipe_Special_Resource_C": {
                "id": "Recipe_Special_Resource_C",
                "name": "Special Resource",
                "products": [{"item": "Desc_Special_C", "amount": 1}],
                "alternate": False
            }
        }

    def test_get_recipe(self, mock_recipes_data):
        """Test retrieving a single recipe."""
        with patch('backend.data.recipes.get_recipes', return_value=mock_recipes_data):
            # Valid recipe
            recipe = recipes.get_recipe("Recipe_IngotIron_C")
            assert recipe is not None
            assert recipe["name"] == "Iron Ingot"
            
            # Invalid recipe
            recipe = recipes.get_recipe("Invalid_ID")
            assert recipe is None

    def test_get_recipe_name(self, mock_recipes_data):
        """Test retrieving recipe name."""
        with patch('backend.data.recipes.get_recipes', return_value=mock_recipes_data):
            assert recipes.get_recipe_name("Recipe_IngotIron_C") == "Iron Ingot"
            assert recipes.get_recipe_name("Invalid_ID") == "Invalid_ID"

    def test_recipe_exists(self, mock_recipes_data):
        """Test checking if recipe exists."""
        with patch('backend.data.recipes.get_recipes', return_value=mock_recipes_data):
            assert recipes.recipe_exists("Recipe_IngotIron_C")
            assert not recipes.recipe_exists("Invalid_ID")

    def test_is_alternate_recipe(self, mock_recipes_data):
        """Test identifying alternate recipes."""
        with patch('backend.data.recipes.get_recipes', return_value=mock_recipes_data):
            assert not recipes.is_alternate_recipe("Recipe_IngotIron_C")
            assert recipes.is_alternate_recipe("Recipe_Alternate_PureIronIngot_C")
            assert not recipes.is_alternate_recipe("Invalid_ID")

    def test_get_default_active_recipes(self, mock_recipes_data):
        """Test default active recipe state."""
        with patch('backend.data.recipes.get_recipes', return_value=mock_recipes_data), \
             patch('backend.data.recipes.SPECIAL_RESOURCE_RECIPES', {"Recipe_Special_Resource_C"}):
            
            active = recipes.get_default_active_recipes()
            
            # Standard recipes should be active
            assert active.get("Recipe_IngotIron_C") is True
            assert active.get("Recipe_IronPlate_C") is True
            
            # Alternate recipes should be inactive
            assert active.get("Recipe_Alternate_PureIronIngot_C") is False
            
            # Special resource recipes should be inactive
            assert active.get("Recipe_Special_Resource_C") is False

    def test_get_recipes_for_item_default(self, mock_recipes_data):
        """Test finding recipes for an item (default behavior)."""
        with patch('backend.data.recipes.get_recipes', return_value=mock_recipes_data), \
             patch('backend.data.recipes.SPECIAL_RESOURCE_RECIPES', set()):
            
            # Should only return standard recipes by default
            found = recipes.get_recipes_for_item("Desc_IronIngot_C")
            assert len(found) == 1
            assert found[0]["recipe_id"] == "Recipe_IngotIron_C"

    def test_get_recipes_for_item_with_active_map(self, mock_recipes_data):
        """Test finding recipes with explicit active map."""
        with patch('backend.data.recipes.get_recipes', return_value=mock_recipes_data):
            
            active_map = {
                "Recipe_IngotIron_C": True,
                "Recipe_Alternate_PureIronIngot_C": True
            }
            
            found = recipes.get_recipes_for_item("Desc_IronIngot_C", active_recipes=active_map)
            assert len(found) == 2
            ids = [r["recipe_id"] for r in found]
            assert "Recipe_IngotIron_C" in ids
            assert "Recipe_Alternate_PureIronIngot_C" in ids

    def test_get_recipe_details_functions(self, mock_recipes_data):
        """Test helper functions for recipe details."""
        with patch('backend.data.recipes.get_recipes', return_value=mock_recipes_data):
            # Ingredients
            ingredients = recipes.get_recipe_ingredients("Recipe_IngotIron_C")
            assert len(ingredients) == 1
            assert ingredients[0]["item"] == "Desc_OreIron_C"
            
            # Products
            products = recipes.get_recipe_products("Recipe_IngotIron_C")
            assert len(products) == 1
            assert products[0]["item"] == "Desc_IronIngot_C"
            
            # Time
            assert recipes.get_recipe_time("Recipe_IngotIron_C") == 2.0
            
            # Machines
            machines = recipes.get_recipe_machines("Recipe_IngotIron_C")
            assert machines == ["Desc_SmelterMk1_C"]
