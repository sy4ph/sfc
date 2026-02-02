"""
Integration tests for solver handling of cyclic dependencies and complex production chains.
"""

import pytest
from backend.solvers.milp_solver import MILPSolver

class TestSolverCycles:
    """Stress test the LP algorithm with loops and complex dependencies."""

    @pytest.fixture
    def cyclic_data(self):
        """
        Setup a resource loop:
        A -> B (1:1)
        B -> A (0.5:1) - This 'returns' some A but requires B.
        Objective is to produce 10 B per minute.
        If the solver can use the loop to 'gain' efficiency, it should.
        But if it's a net loss, it should just use base resources for A.
        """
        items = {
            "Item_A": {"id": "Item_A"},
            "Item_B": {"id": "Item_B"},
            "Desc_OreIron_C": {"id": "Desc_OreIron_C"} # Base resource
        }
        recipes = {
            "Recipe_Ore_to_A": {
                "id": "Recipe_Ore_to_A", "name": "Ore to A", "time": 1.0,
                "ingredients": [{"item": "Desc_OreIron_C", "amount": 1}],
                "products": [{"item": "Item_A", "amount": 1}],
                "producedIn": ["Smelter"]
            },
            "Recipe_A_to_B": {
                "id": "Recipe_A_to_B", "name": "A to B", "time": 1.0,
                "ingredients": [{"item": "Item_A", "amount": 1}],
                "products": [{"item": "Item_B", "amount": 1}],
                "producedIn": ["Constructor"]
            },
            "Recipe_B_to_A_Loop": {
                "id": "Recipe_B_to_A_Loop", "name": "B back to A", "time": 1.0,
                "ingredients": [{"item": "Item_B", "amount": 1}],
                "products": [{"item": "Item_A", "amount": 0.5}], # Net loss logic
                "producedIn": ["Constructor"]
            }
        }
        return items, recipes

    def test_infeasible_loop(self, cyclic_data):
        """Test that a loop with net loss doesn't cause infinite cycles."""
        items, recipes = cyclic_data
        solver = MILPSolver(items, recipes)
        active_map = {r: True for r in recipes}
        
        # Target: 10 Item_B
        # To get 10 B, we need 10 A.
        # We can get A from Ore or from B (but B needs A).
        # Loop: 1 A -> 1 B -> 0.5 A. We lose 0.5 A. 
        # Optimal should be just 10 Ore -> 10 A -> 10 B.
        result = solver.optimize("Item_B", 10.0, "resource_efficiency", active_map)
        
        assert result is not None
        nodes = result['recipe_nodes']
        recipe_ids = [n.get('recipe_id') for n in nodes.values()]
        
        assert "Recipe_A_to_B" in recipe_ids
        assert "Recipe_Ore_to_A" in recipe_ids
        # Loop recipe should NOT be used because it's inefficient (loses half the A)
        assert "Recipe_B_to_A_Loop" not in recipe_ids

    def test_fused_modular_frame_chain(self, game_items, game_recipes):
        """Stress test with Fused Modular Frame (high complexity)."""
        if not game_items or not game_recipes:
            pytest.skip("Full game data not available")
            
        solver = MILPSolver(game_items, game_recipes)
        from backend.data.recipes import get_default_active_recipes
        active_map = get_default_active_recipes()
        
        # Fused Modular Frame (Desc_ModularFrameFused_C)
        # Needs Heavy Modular Frame, Aluminum Casing, Nitrogen Gas.
        # Aluminum involves its own messy chains.
        result = solver.optimize("Desc_ModularFrameFused_C", 1.0, "balanced_production", active_map)
        
        assert result is not None
        assert "recipe_nodes" in result
        # Check that we have a significant number of nodes
        assert len(result['recipe_nodes']) > 5 

    def test_aluminum_silica_loop(self, game_items, game_recipes):
        """
        Test Aluminum production which has a Silica loop.
        Aluminum Scrap produces Silica as byproduct, but process needs Silica.
        """
        if not game_items or not game_recipes:
            pytest.skip("Full game data not available")
            
        solver = MILPSolver(game_items, game_recipes)
        from backend.data.recipes import get_default_active_recipes
        active_map = get_default_active_recipes()
        
        # Aluminum Ingot
        result = solver.optimize("Desc_AluminumIngot_C", 60.0, "resource_efficiency", active_map)
        
        assert result is not None
        # Verify that we are producing some aluminum
        recipe_ids = [n.get('recipe_id') for n in result['recipe_nodes'].values()]
        assert any("Aluminum" in rid for rid in recipe_ids)

    def test_nuclear_pasta_stress(self, game_items, game_recipes):
        """Absolute stress test: Nuclear Pasta (Deepest tree)."""
        if not game_items or not game_recipes:
             pytest.skip("Full game data not available")
             
        solver = MILPSolver(game_items, game_recipes)
        from backend.data.recipes import get_default_active_recipes
        active_map = get_default_active_recipes()
        
        # Process takes time, so we set a timeout if it were real, 
        # but our solver is fast.
        result = solver.optimize("Desc_SpaceElevatorPart_7_C", 0.5, "resource_efficiency", active_map)
        assert result is not None
        assert result['proven_optimal'] is True
