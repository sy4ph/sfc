# Backend configuration constants
# Extracted from app.py for modularization

import os

# Solver configuration defaults
DEFAULT_SOLVER_TIME_LIMIT = 20  # seconds total budget for optimization
DEFAULT_REL_GAP = 0.02          # 2% gap allows faster exit on complex recipes

# Precision settings
PRECISION_DIGITS = 4

# Big-M constants for MILP solver
BIG_M_MACHINE = 10000
BIG_M_BASE = 100000

# Debug flag for calculation verbosity
DEBUG_CALC = os.environ.get('APP_DEBUG', '0') == '1'

# Optimization strategies available
OPTIMIZATION_STRATEGIES = [
    'resource_efficiency',
    'resource_consolidation', 
    'compact_build',
    'balanced_production',
    'custom'
]

# Default optimization strategy
DEFAULT_STRATEGY = 'balanced_production'

# Server configuration
PORT = int(os.environ.get('PORT', 5000))
DEBUG = os.environ.get('FLASK_DEBUG', '0') == '1'

# Special resource recipes that should be disabled by default
SPECIAL_RESOURCE_RECIPES = {
    'Recipe_Bauxite_Caterium_C',      # Bauxite (Caterium)
    'Recipe_Bauxite_Copper_C',        # Bauxite (Copper)
    'Recipe_Caterium_Copper_C',       # Caterium Ore (Copper)
    'Recipe_Caterium_Quartz_C',       # Caterium Ore (Quartz)
    'Recipe_Coal_Iron_C',             # Coal (Iron)
    'Recipe_Coal_Limestone_C',        # Coal (Limestone)
    'Recipe_Copper_Quartz_C',         # Copper Ore (Quartz)
    'Recipe_Copper_Sulfur_C',         # Copper Ore (Sulfur)
    'Recipe_Iron_Limestone_C',        # Iron Ore (Limestone)
    'Recipe_Limestone_Sulfur_C',      # Limestone (Sulfur)
    'Recipe_Nitrogen_Bauxite_C',      # Nitrogen Gas (Bauxite)
    'Recipe_Nitrogen_Caterium_C',     # Nitrogen Gas (Caterium)
    'Recipe_Quartz_Bauxite_C',        # Raw Quartz (Bauxite)
    'Recipe_Quartz_Coal_C',           # Raw Quartz (Coal)
    'Recipe_Sulfur_Coal_C',           # Sulfur (Coal)
    'Recipe_Sulfur_Iron_C',           # Sulfur (Iron)
    'Recipe_Uranium_Bauxite_C'        # Uranium Ore (Bauxite)
}
