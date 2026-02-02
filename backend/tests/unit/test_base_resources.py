"""
Unit tests for base resources module.
"""

import pytest
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend.data import base_resources

class TestBaseResources:
    """Test base resource definitions and helpers."""

    def test_base_resources_constants(self):
        """Verify constants are defined and populated."""
        assert len(base_resources.BASE_RESOURCE_RATES) > 10
        assert len(base_resources.BASE_RESOURCE_MACHINES) > 10
        assert len(base_resources.BASE_RESOURCES) > 10
        
        # Check specific resources exist
        assert "Desc_OreIron_C" in base_resources.BASE_RESOURCES
        assert "Desc_LiquidOil_C" in base_resources.BASE_RESOURCES
        
    def test_is_base_resource(self):
        """Test is_base_resource function."""
        # True cases
        assert base_resources.is_base_resource("Desc_OreIron_C")
        assert base_resources.is_base_resource("Desc_Water_C")
        
        # False cases
        assert not base_resources.is_base_resource("Desc_IronIngot_C")
        assert not base_resources.is_base_resource("Desc_IronPlate_C")
        assert not base_resources.is_base_resource("Unknown_Item")

    def test_get_extraction_rate(self):
        """Test get_extraction_rate function."""
        # Known rates
        assert base_resources.get_extraction_rate("Desc_OreIron_C") == 60
        assert base_resources.get_extraction_rate("Desc_LiquidOil_C") == 120
        assert base_resources.get_extraction_rate("Desc_Water_C") == 120
        
        # Default fallback
        assert base_resources.get_extraction_rate("Desc_IronIngot_C") == 60
        assert base_resources.get_extraction_rate("Unknown_Item") == 60

    def test_get_extraction_machine(self):
        """Test get_extraction_machine function."""
        # Known machines
        assert base_resources.get_extraction_machine("Desc_OreIron_C") == "Miner"
        assert base_resources.get_extraction_machine("Desc_LiquidOil_C") == "Oil Extractor"
        assert base_resources.get_extraction_machine("Desc_Water_C") == "Water Extractor"
        assert base_resources.get_extraction_machine("Desc_NitrogenGas_C") == "Resource Well Extractor"
        
        # Default fallback
        assert base_resources.get_extraction_machine("Desc_IronIngot_C") == "Miner"
        assert base_resources.get_extraction_machine("Unknown_Item") == "Miner"
    
    def test_get_all_base_resources(self):
        """Test access to all base resources set."""
        resources = base_resources.get_all_base_resources()
        assert isinstance(resources, set)
        assert len(resources) == len(base_resources.BASE_RESOURCES)
        
        # Returning copy, not reference
        resources.add("Test_Item")
        assert "Test_Item" not in base_resources.BASE_RESOURCES
