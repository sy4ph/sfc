"""
Unit tests for multi-target optimization in the MILP solver.
"""

import pytest
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend.solvers.milp_solver import MILPSolver


class TestMultiTargetOptimization:
    """Test multi-target optimization capabilities."""

    @pytest.fixture
    def solver(self, sample_items, sample_recipes):
        return MILPSolver(sample_items, sample_recipes)

    def test_single_target_regression(self, solver):
        """Verify single-target still works via targets list."""
        targets = [{"item": "Desc_IronIngot_C", "amount": 30.0}]
        active_map = {"Recipe_IngotIron_C": True}
        
        result = solver.optimize(targets=targets, strategy="balanced_production", active_map=active_map)
        
        assert result is not None
        assert len(result['recipe_nodes']) == 2  # Ingot recipe + Ore extraction
        
        # Verify outputs meet target
        total_ingot_output = sum(
            n.get('outputs', {}).get('Desc_IronIngot_C', 0)
            for n in result['recipe_nodes'].values()
        )
        assert total_ingot_output >= 30.0

    def test_two_targets_shared_dependencies(self, solver):
        """Test optimization with two targets that share upstream dependencies."""
        # Iron Plate and Iron Rod both require Iron Ingots
        targets = [
            {"item": "Desc_IronPlate_C", "amount": 20.0},
            {"item": "Desc_IronRod_C", "amount": 15.0}
        ]
        active_map = {
            "Recipe_IngotIron_C": True,
            "Recipe_IronPlate_C": True,
            "Recipe_IronRod_C": True
        }
        
        result = solver.optimize(targets=targets, strategy="balanced_production", active_map=active_map)
        
        assert result is not None
        
        # Verify both targets are satisfied
        nodes = list(result['recipe_nodes'].values())
        plate_output = sum(n.get('outputs', {}).get('Desc_IronPlate_C', 0) for n in nodes)
        rod_output = sum(n.get('outputs', {}).get('Desc_IronRod_C', 0) for n in nodes)
        
        assert plate_output >= 20.0, f"Iron Plate output {plate_output} < 20.0"
        assert rod_output >= 15.0, f"Iron Rod output {rod_output} < 15.0"

    def test_two_targets_no_shared_deps(self, solver):
        """Test targets with completely independent dependency trees."""
        # Iron Ingot and Copper Ingot have no shared dependencies
        targets = [
            {"item": "Desc_IronIngot_C", "amount": 30.0},
            {"item": "Desc_CopperIngot_C", "amount": 20.0}
        ]
        active_map = {
            "Recipe_IngotIron_C": True,
            "Recipe_IngotCopper_C": True
        }
        
        result = solver.optimize(targets=targets, strategy="resource_efficiency", active_map=active_map)
        
        assert result is not None
        
        # Should have 2 recipe nodes + 2 extraction nodes
        assert len(result['recipe_nodes']) == 4
        
        nodes = list(result['recipe_nodes'].values())
        iron_output = sum(n.get('outputs', {}).get('Desc_IronIngot_C', 0) for n in nodes)
        copper_output = sum(n.get('outputs', {}).get('Desc_CopperIngot_C', 0) for n in nodes)
        
        assert iron_output >= 30.0
        assert copper_output >= 20.0

    def test_targets_response_structure(self, solver):
        """Verify response structure contains all targets info."""
        targets = [
            {"item": "Desc_IronIngot_C", "amount": 30.0},
            {"item": "Desc_CopperIngot_C", "amount": 20.0}
        ]
        active_map = {
            "Recipe_IngotIron_C": True,
            "Recipe_IngotCopper_C": True
        }
        
        result = solver.optimize(targets=targets, strategy="balanced_production", active_map=active_map)
        
        assert result is not None
        assert 'targets' in result
        assert len(result['targets']) == 2
        assert any(t['item'] == 'Desc_IronIngot_C' for t in result['targets'])
        assert any(t['item'] == 'Desc_CopperIngot_C' for t in result['targets'])

    def test_empty_targets_error(self, solver):
        """Empty targets list should raise error."""
        with pytest.raises(ValueError, match="at least one target"):
            solver.optimize(targets=[], strategy="balanced_production", active_map={})

    def test_invalid_target_item_error(self, solver):
        """Unknown target item should raise error."""
        targets = [{"item": "Unknown_Item", "amount": 10.0}]
        
        with pytest.raises(ValueError, match="Unknown target item"):
            solver.optimize(targets=targets, strategy="balanced_production", active_map={})

    def test_base_resource_only_targets(self, solver):
        """Test with only base resource targets (no recipes needed)."""
        targets = [{"item": "Desc_OreIron_C", "amount": 60.0}]
        
        result = solver.optimize(targets=targets, strategy="balanced_production", active_map={})
        
        assert result is not None
        assert result.get('is_base_only', False) is True
        # Should have just extraction nodes
        for node in result['recipe_nodes'].values():
            assert node['is_base_resource'] is True


class TestMultiTargetAPI:
    """Integration tests for multi-target API endpoint."""

    def test_api_targets_parameter(self, client):
        """Test new targets parameter via API."""
        response = client.post('/api/calculate', json={
            "targets": [
                {"item": "Desc_IronPlate_C", "amount": 30},
                {"item": "Desc_IronRod_C", "amount": 15}
            ],
            "optimization_strategy": "balanced_production"
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'production_graph' in data
        assert 'targets' in data

    def test_api_legacy_compatibility(self, client):
        """Test that legacy item/amount still works."""
        response = client.post('/api/calculate', json={
            "item": "Desc_IronPlate_C",
            "amount": 60
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'production_graph' in data

    def test_api_targets_validation(self, client):
        """Test API validates targets structure."""
        response = client.post('/api/calculate', json={
            "targets": []
        })
        
        assert response.status_code == 400
