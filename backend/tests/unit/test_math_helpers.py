"""
Unit tests for math helper utility functions.
"""

import pytest
import math
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend.utils import math_helpers

class TestMathHelpers:
    """Test math utility functions."""

    def test_round_to_precision_normal(self):
        """Test rounding normal float values."""
        assert math_helpers.round_to_precision(1.23456789, 4) == 1.2346
        assert math_helpers.round_to_precision(1.23456789, 2) == 1.23
        assert math_helpers.round_to_precision(1.0, 4) == 1.0
        assert math_helpers.round_to_precision(0, 4) == 0.0

    def test_round_to_precision_none(self):
        """Test rounding None returns None."""
        assert math_helpers.round_to_precision(None) is None

    def test_round_to_precision_nan(self):
        """Test rounding NaN returns NaN."""
        val = math_helpers.round_to_precision(float('nan'))
        assert math.isnan(val)

    def test_round_to_precision_inf(self):
        """Test rounding Infinity returns Infinity."""
        assert math.isinf(math_helpers.round_to_precision(float('inf')))

    def test_clean_nan_values_simple(self):
        """Test cleaning simple values."""
        assert math_helpers.clean_nan_values(1.5) == 1.5
        assert math_helpers.clean_nan_values("string") == "string"
        assert math_helpers.clean_nan_values(None) is None

    def test_clean_nan_values_edge_cases(self):
        """Test cleaning NaN and Inf values."""
        assert math_helpers.clean_nan_values(float('nan')) is None
        assert math_helpers.clean_nan_values(float('inf')) is None
        assert math_helpers.clean_nan_values(float('-inf')) is None

    def test_clean_nan_values_nested_dict(self):
        """Test cleaning nested dictionary structure."""
        data = {
            "a": 1,
            "b": float('nan'),
            "c": {
                "d": float('inf'),
                "e": "valid"
            }
        }
        cleaned = math_helpers.clean_nan_values(data)
        
        assert cleaned["a"] == 1
        assert cleaned["b"] is None
        assert cleaned["c"]["d"] is None
        assert cleaned["c"]["e"] == "valid"

    def test_clean_nan_values_list(self):
        """Test cleaning list structure."""
        data = [1, float('nan'), float('inf'), {"a": float('-inf')}]
        cleaned = math_helpers.clean_nan_values(data)
        
        assert cleaned[0] == 1
        assert cleaned[1] is None
        assert cleaned[2] is None
        assert cleaned[3]["a"] is None
