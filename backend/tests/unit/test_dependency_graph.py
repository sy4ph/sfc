"""
Unit tests for dependency graph module.
"""

import pytest
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend.solvers import dependency_graph

class TestDependencyGraph:
    """Test dependency closure calculation logic."""

    @pytest.fixture
    def sample_recipes(self):
        return {
            "Recipe_Plate": {
                "ingredients": [{"item": "Item_Ingot", "amount": 2}],
                "products": [{"item": "Item_Plate", "amount": 1}]
            },
            "Recipe_Ingot": {
                "ingredients": [{"item": "Desc_OreIron_C", "amount": 1}],
                "products": [{"item": "Item_Ingot", "amount": 1}]
            },
            "Recipe_Screw": {
                "ingredients": [{"item": "Item_Ingot", "amount": 1}],
                "products": [{"item": "Item_Screw", "amount": 4}]
            },
            "Recipe_Alt_Screw": {
                "ingredients": [{"item": "Item_Plate", "amount": 1}],
                "products": [{"item": "Item_Screw", "amount": 5}],
                "alternate": True
            }
        }

    def test_closure_simple(self, sample_recipes):
        """Test simple linear dependency."""
        active_map = {"Recipe_Plate": True, "Recipe_Ingot": True}
        needed_items, needed_recipes = dependency_graph.dependency_closure_recipes(
            "Item_Plate", sample_recipes, active_map
        )
        
        assert "Item_Plate" in needed_items
        assert "Item_Ingot" in needed_items
        assert "Desc_OreIron_C" in needed_items
        assert "Recipe_Plate" in needed_recipes
        assert "Recipe_Ingot" in needed_recipes
        assert len(needed_recipes) == 2

    def test_closure_pruning(self, sample_recipes):
        """Test that inactive recipes are pruned from closure."""
        # Only normal screw recipe active
        active_map = {"Recipe_Screw": True, "Recipe_Ingot": True, "Recipe_Plate": False}
        needed_items, needed_recipes = dependency_graph.dependency_closure_recipes(
            "Item_Screw", sample_recipes, active_map
        )
        
        assert "Item_Screw" in needed_items
        assert "Item_Ingot" in needed_items
        assert "Recipe_Screw" in needed_recipes
        assert "Recipe_Plate" not in needed_recipes
        assert "Item_Plate" not in needed_items # Because it's only needed for Alt Screw

    def test_closure_multiple_paths(self, sample_recipes):
        """Test multiple active recipes for same item."""
        active_map = {
            "Recipe_Plate": True, 
            "Recipe_Ingot": True, 
            "Recipe_Screw": True, 
            "Recipe_Alt_Screw": True
        }
        needed_items, needed_recipes = dependency_graph.dependency_closure_recipes(
            "Item_Screw", sample_recipes, active_map
        )
        
        assert "Item_Screw" in needed_items
        assert "Item_Ingot" in needed_items
        assert "Item_Plate" in needed_items
        assert "Recipe_Screw" in needed_recipes
        assert "Recipe_Alt_Screw" in needed_recipes

    def test_closure_base_resource_stop(self, sample_recipes):
        """Test that exploration stops at base resources."""
        # Using a real base resource ID
        active_map = {"Recipe_Ingot": True}
        needed_items, needed_recipes = dependency_graph.dependency_closure_recipes(
            "Item_Ingot", sample_recipes, active_map
        )
        
        assert "Desc_OreIron_C" in needed_items
        # Closure logic calls is_base_resource. 
        # Since Desc_OreIron_C is a base resource, it shouldn't look for recipes for it.
        assert len(needed_recipes) == 1
        assert "Recipe_Ingot" in needed_recipes
