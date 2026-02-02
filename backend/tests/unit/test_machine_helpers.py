"""
Unit tests for machine helper utility functions.
"""

import pytest
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend.utils import machine_helpers

class TestMachineHelpers:
    """Test machine helper functions."""

    def test_get_machine_display_name(self):
        """Test retrieving machine display names."""
        # Known machines
        assert machine_helpers.get_machine_display_name("Desc_SmelterMk1_C") == "Smelter"
        assert machine_helpers.get_machine_display_name("Desc_ConstructorMk1_C") == "Constructor"
        
        # Unknown machines (fallback to ID)
        assert machine_helpers.get_machine_display_name("Unknown_Machine") == "Unknown_Machine"

    def test_calculate_machine_info_zero(self):
        """Test calculation with zero machines."""
        result = machine_helpers.calculate_machine_info(0.0)
        assert result['theoretical_machines'] == 0
        assert result['actual_machines'] == 0
        assert result['display_text'] == "0 machines"
        assert result['efficiency_percent'] == 0

    def test_calculate_machine_info_exact_one(self):
        """Test calculation with exactly one machine."""
        result = machine_helpers.calculate_machine_info(1.0)
        assert result['theoretical_machines'] == 1.0
        assert result['actual_machines'] == 1
        assert result['full_machines'] == 1
        assert result['partial_percent'] == 0.0
        assert result['efficiency_percent'] == 100.0
        assert result['display_text'] == "1 machines"

    def test_calculate_machine_info_fractional_less_than_one(self):
        """Test calculation with fractional machines < 1."""
        result = machine_helpers.calculate_machine_info(0.5, "Smelter")
        assert result['theoretical_machines'] == 0.5
        assert result['actual_machines'] == 1
        assert result['full_machines'] == 0
        assert result['partial_percent'] == 50.0
        # 0.5 / 1 * 100 = 50.0
        assert result['efficiency_percent'] == 50.0
        assert result['display_text'] == "1 Smelter (50.0%)"

    def test_calculate_machine_info_fractional_greater_than_one(self):
        """Test calculation with fractional machines > 1."""
        result = machine_helpers.calculate_machine_info(2.5, "Assembler")
        assert result['theoretical_machines'] == 2.5
        assert result['actual_machines'] == 3
        assert result['full_machines'] == 2
        
        # Display logic logic:
        # full_machines=2, partial=50.0
        
        # Depending on implementation:
        # "2 machines + 1 machine (50.0%)" ?
        # Code: f"{full_machines} {machine_type} + 1 {machine_type} ({partial_machine_percent:.1f}%)"
        
        # But wait, logic calls full_machines=2
        # display_text = f"2 Assembler + 1 Assembler (50.0%)"
        
        # Let's check implementation behavior
        pass # Assertions below
        
        assert "2 Assembler + 1 Assembler (50.0%)" == result['display_text']
        
        # Efficiency: 2.5 / 3 = 0.8333... -> 83.3%
        assert result['efficiency_percent'] == 83.3

    def test_calculate_machine_info_nearly_round(self):
        """Test behavior with nearly round numbers."""
        # 2.0001 machines
        result = machine_helpers.calculate_machine_info(2.0001, "Constructor")
        
        # Should result in 3 actual machines
        assert result['actual_machines'] == 3
        # Efficiency: 2.0001 / 3 = 66.67%
        assert result['efficiency_percent'] == 66.7
        
        # Display text check
        # partial percent ~ 0.01% -> likely 0.0
        # Logic: if partial > 0.1: show part
        # partial = ~0.01
        
        # Wait, 2.0001 - 2 = 0.0001 * 100 = 0.01%
        # If partial < 0.1, goes to else block
        # Code: `if partial_machine_percent > 0.1:`
        
        # So display text should be "2 Constructor"
        assert result['display_text'] == "2 Constructor"
