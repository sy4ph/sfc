"""
Strategy weights and priorities for the MILP solver.
Defines how different optimization strategies affect the solver's objective function.
"""

from ..config import DEFAULT_STRATEGY

# Default weights for each optimization strategy
DEFAULT_STRATEGY_WEIGHT_MAP = {
    # Minimize total base resource usage foremost; slight penalty for extra types; tiny penalty for extra recipes; ignore machines.
    'resource_efficiency':    {'base': 1.0, 'base_types': 0.25, 'machines': 0.0, 'recipes': 0.05},
    # Strongly minimize distinct base types, then total base; modest recipe penalty; ignore machines.
    'resource_consolidation': {'base': 0.3, 'base_types': 3.0, 'machines': 0.0, 'recipes': 0.4},
    # Compact: prioritize minimizing distinct recipes, then base amount, then base types; no machine metric.
    'compact_build':          {'base': 0.2, 'base_types': 0.1, 'machines': 0.0, 'recipes': 3.0},
    # Balanced: focus on recipe count and base amount jointly; small weight on base types; ignore machines.
    'balanced_production':    {'base': 1.0, 'base_types': 0.2, 'machines': 0.0, 'recipes': 1.0},
    # Custom starts neutral (user will change) with zero machine importance by default.
    'custom':                 {'base': 1.0, 'base_types': 1.0, 'machines': 0.0, 'recipes': 1.0},
}

# Priorities for lexicographic optimization (for non-custom strategies)
STRATEGY_PRIORITIES = {
    'resource_efficiency': ['total_base', 'uniq_base_types', 'uniq_recipes'],
    'resource_consolidation': ['uniq_base_types', 'uniq_recipes', 'total_base'],
    'compact_build': ['uniq_recipes', 'uniq_base_types', 'total_base'],
    'balanced_production': ['uniq_recipes', 'uniq_base_types', 'total_base'],
}

def get_strategy_weights(strategy: str, custom_weights: dict | None = None) -> dict:
    """
    Get the objective weights for a given strategy.
    
    Args:
        strategy: The name of the optimization strategy.
        custom_weights: Optional dict of weights for 'custom' strategy.
        
    Returns:
        Dict of {base, base_types, machines, recipes} weights.
    """
    # Get base weights for the strategy, falling back to default
    weights = dict(DEFAULT_STRATEGY_WEIGHT_MAP.get(strategy, DEFAULT_STRATEGY_WEIGHT_MAP[DEFAULT_STRATEGY]))
    
    # If custom strategy, override with provided weights
    if strategy == 'custom' and custom_weights:
        for k in ['base', 'base_types', 'machines', 'recipes']:
            if k in custom_weights and isinstance(custom_weights[k], (int, float)):
                weights[k] = float(custom_weights[k])
                
    return weights

def get_strategy_priorities(strategy: str) -> list:
    """
    Get the lexicographic priorities for a given strategy.
    
    Args:
        strategy: The name of the optimization strategy.
        
    Returns:
        List of objective components in order of priority.
    """
    return STRATEGY_PRIORITIES.get(strategy, STRATEGY_PRIORITIES[DEFAULT_STRATEGY])

def validate_strategy(strategy: str) -> bool:
    """Check if a strategy name is valid."""
    return strategy in DEFAULT_STRATEGY_WEIGHT_MAP
