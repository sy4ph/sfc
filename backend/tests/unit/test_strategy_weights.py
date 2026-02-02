"""
Unit tests for strategy weights module.
"""

import pytest
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend.solvers import strategy_weights
from backend.config import DEFAULT_STRATEGY

class TestStrategyWeights:
    """Test strategy weights and priority logic."""

    def test_get_strategy_weights_standard(self):
        """Test retrieving weights for standard strategies."""
        for strategy in ['resource_efficiency', 'compact_build', 'balanced_production']:
            weights = strategy_weights.get_strategy_weights(strategy)
            assert isinstance(weights, dict)
            assert all(k in weights for k in ['base', 'base_types', 'machines', 'recipes'])
            assert weights['base'] >= 0
            
    def test_get_strategy_weights_fallback(self):
        """Test fallback to default strategy for invalid names."""
        default_weights = strategy_weights.get_strategy_weights(DEFAULT_STRATEGY)
        fallback_weights = strategy_weights.get_strategy_weights("invalid_strategy_xyz")
        assert fallback_weights == default_weights

    def test_get_strategy_weights_custom(self):
        """Test custom weight overrides."""
        custom = {'base': 2.5, 'recipes': 0.1, 'machines': 5.0}
        weights = strategy_weights.get_strategy_weights('custom', custom)
        
        assert weights['base'] == 2.5
        assert weights['recipes'] == 0.1
        assert weights['machines'] == 5.0
        assert weights['base_types'] == 1.0 # Default from custom map if not provided

    def test_get_strategy_weights_custom_invalid_types(self):
        """Test custom weights ignore invalid value types."""
        custom = {'base': "large", 'recipes': [1.0]}
        weights = strategy_weights.get_strategy_weights('custom', custom)
        
        # Should retain default custom weights for invalid inputs
        assert weights['base'] == 1.0
        assert weights['recipes'] == 1.0

    def test_get_strategy_priorities(self):
        """Test priority list retrieval."""
        priorities = strategy_weights.get_strategy_priorities('resource_efficiency')
        assert isinstance(priorities, list)
        assert 'total_base' in priorities
        
        # Fallback
        default_priorities = strategy_weights.get_strategy_priorities(DEFAULT_STRATEGY)
        assert strategy_weights.get_strategy_priorities('unknown') == default_priorities

    def test_validate_strategy(self):
        """Test strategy validation helper."""
        assert strategy_weights.validate_strategy('balanced_production')
        assert strategy_weights.validate_strategy('custom')
        assert not strategy_weights.validate_strategy('chaos_mode')
