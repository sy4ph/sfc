"""
Unit tests for data loader module.
"""

import pytest
from unittest.mock import patch, mock_open
import json
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend.data import loader

class TestDataLoader:
    """Test data loading functionality."""

    @pytest.fixture
    def mock_game_data(self):
        return {
            "items": {
                "Desc_IronIngot_C": {"id": "Desc_IronIngot_C", "name": "Iron Ingot"},
                "Desc_IronPlate_C": {"id": "Desc_IronPlate_C", "name": "Iron Plate"},
                "Desc_UnusedItem_C": {"id": "Desc_UnusedItem_C", "name": "Unused Item"}
            },
            "recipes": {
                "Recipe_IngotIron_C": {
                    "id": "Recipe_IngotIron_C",
                    "name": "Iron Ingot",
                    "inMachine": True,
                    "forBuilding": False,
                    "products": [{"item": "Desc_IronIngot_C", "amount": 1}]
                },
                "Recipe_IronPlate_C": {
                    "id": "Recipe_IronPlate_C",
                    "name": "Iron Plate",
                    "inMachine": True,
                    "forBuilding": False,
                    "products": [{"item": "Desc_IronPlate_C", "amount": 1}]
                },
                "Recipe_Building_C": {
                    "id": "Recipe_Building_C",
                    "name": "Building Recipe",
                    "inMachine": False,
                    "forBuilding": True,
                    "products": [{"item": "Desc_Building_C", "amount": 1}]
                }
            }
        }

    def test_load_game_data_structure(self, mock_game_data):
        """Test load_game_data returns correct tuple structure."""
        with patch('builtins.open', mock_open(read_data=json.dumps(mock_game_data))), \
             patch('json.load', return_value=mock_game_data):
            
            # Clear cache to ensure we run the function
            loader.load_game_data.cache_clear()
            
            result = loader.load_game_data()
            
            assert len(result) == 4
            all_items, all_recipes, items, recipes = result
            
            # Check all items/recipes
            assert len(all_items) == 3
            assert len(all_recipes) == 3
            
            # Check filtered recipes (only machine recipes)
            assert "Recipe_IngotIron_C" in recipes
            assert "Recipe_IronPlate_C" in recipes
            assert "Recipe_Building_C" not in recipes
            
            # Check filtered items (only producible items)
            assert "Desc_IronIngot_C" in items
            assert "Desc_IronPlate_C" in items
            # Desc_Building_C is produced by a building recipe, so it should NOT be in items 
            # if the logic filters based on *machine* recipes.
            # Let's check the logic in loader.py:
            # recipes = { ... if not recipe.get('forBuilding', False) ... }
            # produced_items = set() ... for recipe in recipes.values(): ...
            # items = { ... if item_id in produced_items }
            
            # So Desc_UnusedItem_C is definitely not there.
            assert "Desc_UnusedItem_C" not in items

    def test_caching_behavior(self, mock_game_data):
        """Test that load_game_data is cached."""
        with patch('builtins.open', mock_open(read_data=json.dumps(mock_game_data))) as mock_file:
            loader.load_game_data.cache_clear()
            
            # First call
            result1 = loader.load_game_data()
            
            # Second call
            result2 = loader.load_game_data()
            
            # Should return same object
            assert result1 is result2
            
            # File should only be opened once
            mock_file.assert_called_once()

    def test_get_items_returns_filtered(self, mock_game_data):
        """Test get_items returns only producible items."""
        with patch('backend.data.loader.load_game_data') as mock_load:
            # Mock return value of load_game_data
            mock_load.return_value = (
                mock_game_data['items'], 
                mock_game_data['recipes'], 
                {'Desc_IronIngot_C': {}}, # filtered items
                {'Recipe_IngotIron_C': {}} # filtered recipes
            )
            
            items = loader.get_items()
            assert len(items) == 1
            assert "Desc_IronIngot_C" in items

    def test_get_recipes_returns_filtered(self, mock_game_data):
        """Test get_recipes returns only machine recipes."""
        with patch('backend.data.loader.load_game_data') as mock_load:
            mock_load.return_value = (
                mock_game_data['items'], 
                mock_game_data['recipes'], 
                {}, 
                {'Recipe_IngotIron_C': {}}
            )
            
            recipes = loader.get_recipes()
            assert len(recipes) == 1
            assert "Recipe_IngotIron_C" in recipes
