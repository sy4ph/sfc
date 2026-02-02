"""
Unit tests for backend config module.

Phase 1 Tests: Verify all configuration constants are properly defined
and accessible from the config module.
"""

import pytest
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))


class TestConfigConstants:
    """Test that all required config constants are importable and valid."""
    
    def test_config_module_importable(self):
        """Verify config module can be imported."""
        from backend import config
        assert config is not None
    
    def test_solver_time_limit_exists(self):
        """Test DEFAULT_SOLVER_TIME_LIMIT is defined and reasonable."""
        from backend.config import DEFAULT_SOLVER_TIME_LIMIT
        
        assert DEFAULT_SOLVER_TIME_LIMIT is not None
        assert isinstance(DEFAULT_SOLVER_TIME_LIMIT, (int, float))
        # Should be between 5 and 60 seconds
        assert 5 <= DEFAULT_SOLVER_TIME_LIMIT <= 60, \
            f"Solver time limit {DEFAULT_SOLVER_TIME_LIMIT} outside expected range 5-60"
    
    def test_rel_gap_exists(self):
        """Test DEFAULT_REL_GAP is defined."""
        from backend.config import DEFAULT_REL_GAP
        
        assert DEFAULT_REL_GAP is not None
        assert isinstance(DEFAULT_REL_GAP, (int, float))
        # Should be 0 for exact or small positive for speed
        assert 0.0 <= DEFAULT_REL_GAP <= 0.1
    
    def test_precision_digits_exists(self):
        """Test PRECISION_DIGITS is defined and reasonable."""
        from backend.config import PRECISION_DIGITS
        
        assert PRECISION_DIGITS is not None
        assert isinstance(PRECISION_DIGITS, int)
        assert 1 <= PRECISION_DIGITS <= 10
    
    def test_big_m_machine_exists(self):
        """Test BIG_M_MACHINE is defined and large."""
        from backend.config import BIG_M_MACHINE
        
        assert BIG_M_MACHINE is not None
        assert isinstance(BIG_M_MACHINE, (int, float))
        assert BIG_M_MACHINE >= 1000, "BIG_M_MACHINE should be a large value"
    
    def test_big_m_base_exists(self):
        """Test BIG_M_BASE is defined and large."""
        from backend.config import BIG_M_BASE
        
        assert BIG_M_BASE is not None
        assert isinstance(BIG_M_BASE, (int, float))
        assert BIG_M_BASE >= 10000, "BIG_M_BASE should be a large value"
    
    def test_debug_calc_is_boolean(self):
        """Test DEBUG_CALC is a boolean."""
        from backend.config import DEBUG_CALC
        
        assert DEBUG_CALC is not None
        assert isinstance(DEBUG_CALC, bool)


class TestOptimizationStrategies:
    """Test optimization strategy configuration."""
    
    def test_optimization_strategies_exists(self):
        """Test OPTIMIZATION_STRATEGIES list exists."""
        from backend.config import OPTIMIZATION_STRATEGIES
        
        assert OPTIMIZATION_STRATEGIES is not None
        assert isinstance(OPTIMIZATION_STRATEGIES, list)
    
    def test_optimization_strategies_contains_five(self):
        """Test OPTIMIZATION_STRATEGIES contains exactly 5 strategies."""
        from backend.config import OPTIMIZATION_STRATEGIES
        
        assert len(OPTIMIZATION_STRATEGIES) == 5, \
            f"Expected 5 strategies, got {len(OPTIMIZATION_STRATEGIES)}"
    
    def test_optimization_strategies_expected_values(self):
        """Test all expected strategies are present."""
        from backend.config import OPTIMIZATION_STRATEGIES
        
        expected = [
            'resource_efficiency',
            'resource_consolidation',
            'compact_build',
            'balanced_production',
            'custom'
        ]
        
        for strategy in expected:
            assert strategy in OPTIMIZATION_STRATEGIES, \
                f"Missing strategy: {strategy}"
    
    def test_default_strategy_exists(self):
        """Test DEFAULT_STRATEGY is defined."""
        from backend.config import DEFAULT_STRATEGY
        
        assert DEFAULT_STRATEGY is not None
        assert DEFAULT_STRATEGY == 'balanced_production'
    
    def test_default_strategy_in_strategies_list(self):
        """Test DEFAULT_STRATEGY is in OPTIMIZATION_STRATEGIES."""
        from backend.config import DEFAULT_STRATEGY, OPTIMIZATION_STRATEGIES
        
        assert DEFAULT_STRATEGY in OPTIMIZATION_STRATEGIES


class TestServerConfig:
    """Test server configuration constants."""
    
    def test_port_exists(self):
        """Test PORT is defined and reasonable."""
        from backend.config import PORT
        
        assert PORT is not None
        assert isinstance(PORT, int)
        assert 1 <= PORT <= 65535, f"Port {PORT} outside valid range"
    
    def test_port_default(self):
        """Test PORT defaults to 5000."""
        # Clear env var if set, then reimport
        original = os.environ.get('PORT')
        try:
            if 'PORT' in os.environ:
                del os.environ['PORT']
            
            # Force reimport
            import importlib
            from backend import config
            importlib.reload(config)
            
            assert config.PORT == 5000
        finally:
            # Restore original
            if original is not None:
                os.environ['PORT'] = original
    
    def test_debug_exists(self):
        """Test DEBUG flag exists and is boolean."""
        from backend.config import DEBUG
        
        assert DEBUG is not None
        assert isinstance(DEBUG, bool)


class TestEnvironmentOverrides:
    """Test that environment variables override defaults."""
    
    def test_debug_calc_env_override(self):
        """Test DEBUG_CALC can be overridden by APP_DEBUG env var."""
        original = os.environ.get('APP_DEBUG')
        try:
            os.environ['APP_DEBUG'] = '1'
            
            import importlib
            from backend import config
            importlib.reload(config)
            
            assert config.DEBUG_CALC is True
        finally:
            if original is not None:
                os.environ['APP_DEBUG'] = original
            elif 'APP_DEBUG' in os.environ:
                del os.environ['APP_DEBUG']
    
    def test_port_env_override(self):
        """Test PORT can be overridden by PORT env var."""
        original = os.environ.get('PORT')
        try:
            os.environ['PORT'] = '8080'
            
            import importlib
            from backend import config
            importlib.reload(config)
            
            assert config.PORT == 8080
        finally:
            if original is not None:
                os.environ['PORT'] = original
            elif 'PORT' in os.environ:
                del os.environ['PORT']


class TestSpecialResourceRecipes:
    """Test special resource recipe configuration."""
    
    def test_special_resource_recipes_exists(self):
        """Test SPECIAL_RESOURCE_RECIPES set exists."""
        from backend.config import SPECIAL_RESOURCE_RECIPES
        
        assert SPECIAL_RESOURCE_RECIPES is not None
        assert isinstance(SPECIAL_RESOURCE_RECIPES, (set, frozenset, list, dict))
    
    def test_special_resource_recipes_not_empty(self):
        """Test SPECIAL_RESOURCE_RECIPES has entries."""
        from backend.config import SPECIAL_RESOURCE_RECIPES
        
        assert len(SPECIAL_RESOURCE_RECIPES) > 0, \
            "SPECIAL_RESOURCE_RECIPES should not be empty"
    
    def test_special_resource_recipes_contains_known_recipes(self):
        """Test SPECIAL_RESOURCE_RECIPES contains known SAM-like recipes."""
        from backend.config import SPECIAL_RESOURCE_RECIPES
        
        # These are resource conversion recipes that should be disabled by default
        expected_patterns = ['Coal_Iron', 'Bauxite', 'Sulfur']
        
        found_any = False
        for pattern in expected_patterns:
            for recipe in SPECIAL_RESOURCE_RECIPES:
                if pattern in recipe:
                    found_any = True
                    break
            if found_any:
                break
        
        assert found_any, "Expected at least one known special resource recipe"
