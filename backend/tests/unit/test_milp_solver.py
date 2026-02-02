"""
Unit tests for core MILP solver.
"""

import pytest
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend.solvers.milp_solver import MILPSolver

class TestMILPSolver:
    """Test MILP optimization logic."""

    @pytest.fixture
    def solver(self, sample_items, sample_recipes):
        return MILPSolver(sample_items, sample_recipes)

    def test_optimize_base_resource(self, solver):
        """Test targeting a base resource directly."""
        # Desc_OreIron_C is a base resource
        active_map = {} # No recipes needed
        result = solver.optimize("Desc_OreIron_C", 60.0, "balanced_production", active_map)
        
        assert result is not None
        assert result['is_base_only'] is True
        assert len(result['recipe_nodes']) == 1
        node = list(result['recipe_nodes'].values())[0]
        assert node['is_base_resource'] is True
        assert node['outputs']['Desc_OreIron_C'] == 60.0

    def test_optimize_simple_recipe(self, solver):
        """Test simple production chain: Ore -> Ingot."""
        # Recipe_IngotIron_C produces Desc_IronIngot_C from Desc_OreIron_C
        active_map = {"Recipe_IngotIron_C": True}
        result = solver.optimize("Desc_IronIngot_C", 30.0, "resource_efficiency", active_map)
        
        assert result is not None
        # Should have Ingot recipe node + Ore extraction node
        assert len(result['recipe_nodes']) == 2
        
        nodes = list(result['recipe_nodes'].values())
        recipe_node = next(n for n in nodes if n['recipe_id'] == "Recipe_IngotIron_C")
        extract_node = next(n for n in nodes if n['is_base_resource'])
        
        assert recipe_node['outputs']["Desc_IronIngot_C"] == 30.0
        assert extract_node['outputs']["Desc_OreIron_C"] == 30.0

    def test_optimize_strategy_impact(self, sample_items):
        """Test that different strategies yield different results."""
        # Custom recipes: Item_X can be made via:
        # A) Recipe_A: 1 Ore -> 1 X (1 machine step)
        # B) Recipe_B1: 1 Ore -> 2 Y; Recipe_B2: 1 Y -> 1 X (2 machine steps, but maybe more 'efficient' in some way)
        # However, for 'compact_build', Recipe_A is strictly better (1 recipe vs 2).
        
        custom_recipes = {
            "Recipe_A": {
                "id": "Recipe_A", "name": "Direct X", "time": 1.0,
                "ingredients": [{"item": "Desc_OreIron_C", "amount": 1}],
                "products": [{"item": "Item_X", "amount": 1}],
                "producedIn": ["Desc_SmelterMk1_C"], "alternate": False
            },
            "Recipe_B1": {
                "id": "Recipe_B1", "name": "Ore to Y", "time": 1.0,
                "ingredients": [{"item": "Desc_OreIron_C", "amount": 1}],
                "products": [{"item": "Item_Y", "amount": 2}],
                "producedIn": ["Desc_SmelterMk1_C"], "alternate": False
            },
            "Recipe_B2": {
                "id": "Recipe_B2", "name": "Y to X", "time": 1.0,
                "ingredients": [{"item": "Item_Y", "amount": 1}],
                "products": [{"item": "Item_X", "amount": 1}],
                "producedIn": ["Desc_SmelterMk1_C"], "alternate": False
            }
        }
        
        custom_items = sample_items.copy()
        custom_items.update({"Item_X": {"id": "Item_X"}, "Item_Y": {"id": "Item_Y"}})
        
        solver = MILPSolver(custom_items, custom_recipes)
        active_map = {"Recipe_A": True, "Recipe_B1": True, "Recipe_B2": True}
        
        # compact_build should pick Recipe_A (fewer recipes)
        result_compact = solver.optimize("Item_X", 10.0, "compact_build", active_map)
        assert result_compact is not None
        recipe_ids = [n['recipe_id'] for n in result_compact['recipe_nodes'].values()]
        assert "Recipe_A" in recipe_ids
        assert "Recipe_B1" not in recipe_ids
        assert "Recipe_B2" not in recipe_ids

    def test_optimize_infeasible(self, solver):
        """Test handling of infeasible requests."""
        # Deactivate all recipes for iron ingot
        active_map = {"Recipe_IngotIron_C": False}
        
        # Should raise ValueError since no recipes available
        with pytest.raises(ValueError, match="No active recipes available"):
            solver.optimize("Desc_IronIngot_C", 30.0, "resource_efficiency", active_map)

    def test_optimize_unknown_item(self, solver):
        """Test targeting unknown item."""
        with pytest.raises(ValueError, match="Unknown target item"):
            solver.optimize("Ghost_Item", 1.0, "balanced_production", {})
