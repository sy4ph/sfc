"""
Unit tests for calculation service.
"""

import pytest
from unittest.mock import patch, MagicMock
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend.services import calculation_service

class TestCalculationService:
    """Test calculation service orchestration."""

    @pytest.fixture
    def mock_graph(self):
        return {
            'recipe_nodes': {'node1': {}},
            'weights_used': {'base': 1.0}
        }

    @patch('backend.services.calculation_service.get_items')
    @patch('backend.services.calculation_service.get_recipes')
    @patch('backend.services.calculation_service.MILPSolver')
    @patch('backend.services.calculation_service.calculate_summary_stats')
    @patch('backend.services.calculation_service.get_item_name')
    def test_calculate_production_success(self, mock_get_name, mock_calc_summary, mock_solver_cls, mock_get_recipes, mock_get_items, mock_graph):
        """Test successful calculation orchestration."""
        # Setup mocks
        mock_get_items.return_value = {"item1": {}}
        mock_get_recipes.return_value = {"recipe1": {}}
        mock_get_name.return_value = "Item One"
        mock_calc_summary.return_value = {"total_machines": 5}
        
        mock_solver = MagicMock()
        mock_solver.optimize.return_value = mock_graph
        mock_solver_cls.return_value = mock_solver
        
        # Call service
        result = calculation_service.calculate_production("item1", 10.0)
        
        # Verify orchestration
        assert result['target_item'] == "item1"
        assert result['target_item_name'] == "Item One"
        assert result['amount_requested'] == 10.0
        assert result['summary'] == {"total_machines": 5}
        assert 'production_graph' in result
        
        mock_solver.optimize.assert_called_once()

    @patch('backend.services.calculation_service.get_items')
    @patch('backend.services.calculation_service.get_recipes')
    @patch('backend.services.calculation_service.MILPSolver')
    def test_calculate_production_infeasible(self, mock_solver_cls, mock_get_recipes, mock_get_items):
        """Test calculation when solver fails."""
        mock_get_items.return_value = {"item1": {}}
        mock_get_recipes.return_value = {"recipe1": {}}
        
        mock_solver = MagicMock()
        mock_solver.optimize.return_value = None
        mock_solver_cls.return_value = mock_solver
        
        with pytest.raises(ValueError, match="No feasible solution found"):
            calculation_service.calculate_production("item1", 10.0)

    @patch('backend.services.calculation_service.get_items')
    @patch('backend.services.calculation_service.get_recipes')
    @patch('backend.services.calculation_service.get_default_active_recipes')
    @patch('backend.services.calculation_service.MILPSolver')
    @patch('backend.services.calculation_service.calculate_summary_stats')
    def test_calculate_production_default_recipes(self, mock_summary, mock_solver_cls, mock_get_defaults, mock_get_recipes, mock_get_items, mock_graph):
        """Test fallback to default active recipes."""
        mock_get_items.return_value = {"item1": {}}
        mock_get_recipes.return_value = {"recipe1": {}}
        mock_get_defaults.return_value = {"recipe1": True}
        
        mock_solver = MagicMock()
        mock_solver.optimize.return_value = mock_graph
        mock_solver_cls.return_value = mock_solver
        
        calculation_service.calculate_production("item1", 10.0, active_recipes=None)
        
        mock_get_defaults.assert_called_once()
        # Should be called with the active map from defaults
        mock_solver.optimize.assert_called_once()
        args, kwargs = mock_solver.optimize.call_args
        assert kwargs['active_map'] == {"recipe1": True}
