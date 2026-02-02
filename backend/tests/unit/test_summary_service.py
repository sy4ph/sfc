"""
Unit tests for summary service.
"""

import pytest
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend.services import summary_service

class TestSummaryService:
    """Test graph summary calculation."""

    def test_calculate_summary_stats(self):
        """Test aggregate statistics calculation from complex graph."""
        graph = {
            'recipe_nodes': {
                'node1': {
                    'recipe_id': 'Recipe_A',
                    'machines_needed': 1.5,
                    'actual_machines': 2,
                    'machine_type': 'Assembler',
                    'is_base_resource': False
                },
                'node2': {
                    'recipe_id': 'Recipe_B',
                    'machines_needed': 0.5,
                    'actual_machines': 1,
                    'machine_type': 'Constructor',
                    'is_base_resource': False
                },
                'node3': {
                    'is_base_resource': True,
                    'outputs': {'Ore': 60.0}
                },
                'node4': {
                    'is_end_product_node': True
                }
            }
        }
        
        summary = summary_service.calculate_summary_stats(graph)
        
        # Totals
        assert summary['total_machines'] == 2.0 # 1.5 + 0.5
        assert summary['total_actual_machines'] == 3 # 2 + 1
        
        # Breakdown
        assert summary['machine_breakdown']['Assembler'] == 2
        assert summary['machine_breakdown']['Constructor'] == 1
        
        # Resources
        assert summary['base_resources']['Ore'] == 60.0
        assert summary['unique_base_resource_types'] == 1
        assert summary['total_base_resource_amount'] == 60.0
        
        # Counts
        assert summary['total_recipe_nodes'] == 2
        assert summary['total_base_resource_nodes'] == 1
        assert summary['unique_recipes'] == 2
        
        # Efficiency: (1.5+0.5)/(2+1) = 2/3 = 66.7%
        assert summary['algorithm_efficiency']['machine_efficiency'] == "66.7%"

    def test_calculate_summary_empty(self):
        """Test summary with empty graph."""
        graph = {'recipe_nodes': {}}
        summary = summary_service.calculate_summary_stats(graph)
        
        assert summary['total_machines'] == 0
        assert summary['total_actual_machines'] == 0
        assert summary['algorithm_efficiency']['machine_efficiency'] == "0%"
