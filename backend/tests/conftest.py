"""
Pytest configuration and shared fixtures for Satisfactory Factory Calculator tests.

This module provides:
- Minimal sample data fixtures for unit tests
- Full game data fixture for integration tests
- Flask test client fixture for API testing
- Edge case item fixtures for complex solver tests
"""

import pytest
import json
import os
import sys

# Add project root to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))


# =============================================================================
# Sample Data Fixtures (Minimal - for unit tests)
# =============================================================================

@pytest.fixture
def sample_items():
    """Small subset of items for unit tests."""
    return {
        "Desc_OreIron_C": {
            "id": "Desc_OreIron_C",
            "name": "Iron Ore",
            "description": "Used as a crafting material",
            "stackSize": 100,
            "sinkPoints": 1
        },
        "Desc_IronIngot_C": {
            "id": "Desc_IronIngot_C",
            "name": "Iron Ingot",
            "description": "Used for crafting",
            "stackSize": 100,
            "sinkPoints": 2
        },
        "Desc_IronPlate_C": {
            "id": "Desc_IronPlate_C",
            "name": "Iron Plate",
            "description": "A standard crafting component",
            "stackSize": 200,
            "sinkPoints": 6
        },
        "Desc_IronRod_C": {
            "id": "Desc_IronRod_C",
            "name": "Iron Rod",
            "description": "A standard crafting component",
            "stackSize": 200,
            "sinkPoints": 4
        },
        "Desc_Screw_C": {
            "id": "Desc_Screw_C",
            "name": "Screw",
            "description": "A standard crafting component",
            "stackSize": 500,
            "sinkPoints": 2
        },
        "Desc_OreCopper_C": {
            "id": "Desc_OreCopper_C",
            "name": "Copper Ore",
            "description": "Used as a crafting material",
            "stackSize": 100,
            "sinkPoints": 3
        },
        "Desc_CopperIngot_C": {
            "id": "Desc_CopperIngot_C",
            "name": "Copper Ingot",
            "description": "Used for crafting",
            "stackSize": 100,
            "sinkPoints": 6
        },
    }


@pytest.fixture
def sample_recipes():
    """Small subset of recipes for unit tests."""
    return {
        "Recipe_IngotIron_C": {
            "id": "Recipe_IngotIron_C",
            "name": "Iron Ingot",
            "time": 2.0,
            "ingredients": [
                {"item": "Desc_OreIron_C", "amount": 1}
            ],
            "products": [
                {"item": "Desc_IronIngot_C", "amount": 1}
            ],
            "producedIn": ["Desc_SmelterMk1_C"],
            "alternate": False
        },
        "Recipe_IronPlate_C": {
            "id": "Recipe_IronPlate_C",
            "name": "Iron Plate",
            "time": 6.0,
            "ingredients": [
                {"item": "Desc_IronIngot_C", "amount": 3}
            ],
            "products": [
                {"item": "Desc_IronPlate_C", "amount": 2}
            ],
            "producedIn": ["Desc_ConstructorMk1_C"],
            "alternate": False
        },
        "Recipe_IronRod_C": {
            "id": "Recipe_IronRod_C",
            "name": "Iron Rod",
            "time": 4.0,
            "ingredients": [
                {"item": "Desc_IronIngot_C", "amount": 1}
            ],
            "products": [
                {"item": "Desc_IronRod_C", "amount": 1}
            ],
            "producedIn": ["Desc_ConstructorMk1_C"],
            "alternate": False
        },
        "Recipe_Screw_C": {
            "id": "Recipe_Screw_C",
            "name": "Screw",
            "time": 6.0,
            "ingredients": [
                {"item": "Desc_IronRod_C", "amount": 1}
            ],
            "products": [
                {"item": "Desc_Screw_C", "amount": 4}
            ],
            "producedIn": ["Desc_ConstructorMk1_C"],
            "alternate": False
        },
        "Recipe_IngotCopper_C": {
            "id": "Recipe_IngotCopper_C",
            "name": "Copper Ingot",
            "time": 2.0,
            "ingredients": [
                {"item": "Desc_OreCopper_C", "amount": 1}
            ],
            "products": [
                {"item": "Desc_CopperIngot_C", "amount": 1}
            ],
            "producedIn": ["Desc_SmelterMk1_C"],
            "alternate": False
        },
        "Recipe_Alternate_IngotIron_1_C": {
            "id": "Recipe_Alternate_IngotIron_1_C",
            "name": "Pure Iron Ingot",
            "time": 12.0,
            "ingredients": [
                {"item": "Desc_OreIron_C", "amount": 7},
                {"item": "Desc_Water_C", "amount": 4}
            ],
            "products": [
                {"item": "Desc_IronIngot_C", "amount": 13}
            ],
            "producedIn": ["Desc_FoundryMk1_C"],
            "alternate": True
        },
    }


@pytest.fixture
def sample_active_recipes():
    """Default active recipe map for unit tests."""
    return {
        "Recipe_IngotIron_C": True,
        "Recipe_IronPlate_C": True,
        "Recipe_IronRod_C": True,
        "Recipe_Screw_C": True,
        "Recipe_IngotCopper_C": True,
        "Recipe_Alternate_IngotIron_1_C": False,  # Alternate disabled by default
    }


# =============================================================================
# Game Data Fixture (Full - for integration tests)
# =============================================================================

@pytest.fixture(scope="session")
def game_data():
    """
    Load actual game data for integration tests.
    
    Uses session scope to load only once for performance.
    """
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data1.0.json')
    if not os.path.exists(data_path):
        pytest.skip(f"Game data file not found: {data_path}")
    
    with open(data_path, encoding='utf-8') as f:
        return json.load(f)


@pytest.fixture(scope="session")
def game_items(game_data):
    """Extract items from game data."""
    return game_data.get('items', {})


@pytest.fixture(scope="session")
def game_recipes(game_data):
    """Extract recipes from game data."""
    return game_data.get('recipes', {})


# =============================================================================
# Edge Case Fixtures (Endgame complexity testing)
# =============================================================================

@pytest.fixture
def edge_case_items():
    """
    Complex endgame items for solver stress tests.
    
    These items have deep dependency trees, multiple recipe paths,
    and are critical for proving production readiness.
    """
    return [
        "Desc_SpaceElevatorPart_7_C",   # Nuclear Pasta - deepest dependency tree
        "Desc_SpaceElevatorPart_8_C",   # Thermal Propulsion Rocket - many alternates
        "Desc_SpaceElevatorPart_5_C",   # Assembly Director System - complex electronics
        "Desc_SpaceElevatorPart_6_C",   # Magnetic Field Generator - resource diversity
        "Desc_ModularFrameFused_C",     # Fused Modular Frame - potential circular deps
        "Desc_MotorLightweight_C",      # Turbo Motor - resource intensive
        "Desc_ComputerSuper_C",         # Supercomputer - multiple paths
        "Desc_CircuitBoardHighSpeed_C"  # AI Limiter - alternate impact
    ]


@pytest.fixture
def edge_case_item_names():
    """Human-readable names for edge case items."""
    return {
        "Desc_SpaceElevatorPart_7_C": "Nuclear Pasta",
        "Desc_SpaceElevatorPart_8_C": "Thermal Propulsion Rocket",
        "Desc_SpaceElevatorPart_5_C": "Assembly Director System",
        "Desc_SpaceElevatorPart_6_C": "Magnetic Field Generator",
        "Desc_ModularFrameFused_C": "Fused Modular Frame",
        "Desc_MotorLightweight_C": "Turbo Motor",
        "Desc_ComputerSuper_C": "Supercomputer",
        "Desc_CircuitBoardHighSpeed_C": "AI Limiter"
    }


@pytest.fixture
def optimization_strategies():
    """All available optimization strategies."""
    return [
        'resource_efficiency',
        'resource_consolidation',
        'compact_build',
        'balanced_production',
        'custom'
    ]


# =============================================================================
# Flask Test Client Fixture
# =============================================================================

@pytest.fixture(scope="session")
def app():
    """
    Create Flask application for testing.
    
    Uses session scope so the app is created once per test session.
    """
    try:
        from backend.app import app as flask_app
    except ImportError:
        # Try alternative import for modular structure
        try:
            from backend.app import create_app
            flask_app = create_app()
        except ImportError as e:
            pytest.skip(f"Flask app not available: {str(e)}")
    
    # Configure for testing
    flask_app.config.update({
        "TESTING": True,
    })
    
    return flask_app


@pytest.fixture(scope="session")
def client(app):
    """
    Flask test client for making HTTP requests.
    
    Usage in tests:
        def test_health(client):
            response = client.get('/api/health')
            assert response.status_code == 200
    """
    return app.test_client()


@pytest.fixture(scope="session")
def runner(app):
    """Flask CLI test runner."""
    return app.test_cli_runner()


# =============================================================================
# Base Resource Fixtures
# =============================================================================

@pytest.fixture
def base_resources():
    """Set of all base resource IDs."""
    return {
        "Desc_OreIron_C",
        "Desc_OreCopper_C",
        "Desc_Stone_C",
        "Desc_Coal_C",
        "Desc_OreGold_C",      # Caterium
        "Desc_RawQuartz_C",
        "Desc_Sulfur_C",
        "Desc_OreBauxite_C",
        "Desc_OreUranium_C",
        "Desc_SAM_C",
        "Desc_LiquidOil_C",    # Crude Oil
        "Desc_NitrogenGas_C",
        "Desc_Water_C"
    }


@pytest.fixture
def base_resource_rates():
    """Default extraction rates for base resources (per minute)."""
    return {
        "Desc_OreIron_C": 60,
        "Desc_OreCopper_C": 60,
        "Desc_Stone_C": 60,
        "Desc_Coal_C": 60,
        "Desc_OreGold_C": 60,
        "Desc_RawQuartz_C": 60,
        "Desc_Sulfur_C": 60,
        "Desc_OreBauxite_C": 60,
        "Desc_OreUranium_C": 60,
        "Desc_SAM_C": 60,
        "Desc_LiquidOil_C": 120,
        "Desc_NitrogenGas_C": 60,
        "Desc_Water_C": 120
    }


# =============================================================================
# API Request Fixtures
# =============================================================================

@pytest.fixture
def minimal_calculate_request():
    """Minimal valid calculate request."""
    return {
        "item": "Desc_IronPlate_C",
        "amount": 60
    }


@pytest.fixture
def full_calculate_request(sample_active_recipes):
    """Full calculate request with all optional parameters."""
    return {
        "item": "Desc_IronPlate_C",
        "amount": 60,
        "optimization_strategy": "balanced_production",
        "active_recipes": sample_active_recipes,
        "weights": {
            "base": 1.0,
            "base_types": 0.2,
            "machines": 0.0,
            "recipes": 1.0
        },
        "solver": {
            "time_limit": 30,
            "rel_gap": 0.0
        }
    }


@pytest.fixture
def custom_strategy_request():
    """Calculate request using custom strategy."""
    return {
        "item": "Desc_IronPlate_C",
        "amount": 60,
        "optimization_strategy": "custom",
        "weights": {
            "base": 2.0,
            "base_types": 0.5,
            "machines": 0.0,
            "recipes": 1.5
        }
    }


# =============================================================================
# Utility Fixtures
# =============================================================================

@pytest.fixture
def math_edge_cases():
    """Edge case values for math helper tests."""
    return {
        "zero": 0,
        "negative": -1.5,
        "small_positive": 0.000001,
        "large_positive": 1000000.123456789,
        "nan": float('nan'),
        "inf": float('inf'),
        "neg_inf": float('-inf'),
        "none": None
    }


@pytest.fixture
def nested_dict_with_nan():
    """Nested dictionary containing NaN/Inf values for clean_nan_values tests."""
    return {
        "level1": {
            "valid": 1.5,
            "nan_value": float('nan'),
            "level2": {
                "list": [1, float('inf'), 3],
                "inf_value": float('-inf')
            }
        },
        "normal": 42
    }
