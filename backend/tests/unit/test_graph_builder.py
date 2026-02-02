"""
Unit tests for graph builder module.
"""

import pytest
from unittest.mock import patch
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend.solvers import graph_builder

class TestGraphBuilder:
    """Test production graph node construction."""

    def test_build_recipe_node(self):
        """Test standard recipe node construction."""
        recipe_data = {
            'name': 'Iron Plate',
            'producedIn': ['Desc_ConstructorMk1_C'],
            'time': 6.0,
            'alternate': False
        }
        inputs = {'Desc_IronIngot_C': 30.0}
        outputs = {'Desc_IronPlate_C': 20.0}
        
        node = graph_builder.build_recipe_node(
            "node1", "Recipe_Plate", recipe_data, 1.5, 10.0, inputs, outputs
        )
        
        assert node['node_id'] == "node1"
        assert node['recipe_id'] == "Recipe_Plate"
        assert node['machine_type'] == 'Desc_ConstructorMk1_C'
        assert node['machines_needed'] == 1.5
        assert node['actual_machines'] == 2
        assert node['machine_efficiency'] == 75.0
        assert "1 Constructor + 1 Constructor (50.0%)" in node['machine_display']
        assert node['inputs'] == inputs
        assert node['outputs'] == outputs

    def test_build_base_resource_node(self):
        """Test base resource node construction."""
        with patch('backend.solvers.graph_builder.get_item_name', return_value="Iron Ore"):
            node = graph_builder.build_base_resource_node("ext1", "Desc_OreIron_C", 90.0)
            
            assert node['is_base_resource'] is True
            assert node['recipe_id'] == 'extract_Desc_OreIron_C'
            # 90 / 60 = 1.5 machines
            assert node['machines_needed'] == 1.5
            assert node['actual_machines'] == 2
            assert node['outputs']['Desc_OreIron_C'] == 90.0

    def test_build_end_product_node(self):
        """Test end product node construction."""
        with patch('backend.solvers.graph_builder.get_item_name', return_value="Modular Frame"):
            node = graph_builder.build_end_product_node("end1", "Desc_ModularFrame_C", 5.0)
            
            assert node['is_end_product_node'] is True
            assert node['machine_type'] == 'End Product'
            assert node['inputs']['Desc_ModularFrame_C'] == 5.0
            assert node['target_amount'] == 5.0

    def test_build_surplus_node(self):
        """Test surplus node construction."""
        with patch('backend.solvers.graph_builder.get_item_name', return_value="Screw"):
            node = graph_builder.build_surplus_node("surp1", "Desc_Screw_C", 12.5)
            
            assert node['is_surplus_node'] is True
            assert node['machine_type'] == 'Surplus Output'
            assert node['inputs']['Desc_Screw_C'] == 12.5
            assert node['surplus_amount'] == 12.5
