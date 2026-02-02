# Testing Tasks - Satisfactory Factory Calculator

> **Owner**: Testing Agent  
> **Status**: Blocked until Backend Phase 2 complete  
> **Dependencies**: Runs AFTER each Backend phase completes

---

## Overview

This document contains testing tasks. The Testing Agent works **in sequence with the Backend Agent**, not in parallel on the same code.

**Workflow:**
1. Backend Agent completes a phase
2. Backend Agent commits and updates their task doc
3. Testing Agent creates tests for that phase
4. Testing Agent verifies tests pass
5. Backend Agent proceeds to next phase

This prevents conflicts and ensures tests are written against stable code.

---

## Task Legend

- `[ ]` Not started
- `[/]` In progress  
- `[x]` Complete
- `[!]` Blocked (waiting for Backend)

**Priority**: 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

---

## Phase 0: Test Infrastructure (Start Immediately)

### 0.1 Set Up Pytest 🔴

- [ ] Create `backend/tests/` directory
- [ ] Create `backend/tests/__init__.py`
- [ ] Create `backend/tests/conftest.py` with fixtures
- [ ] Add pytest to requirements: `pytest>=7.0.0`
- [ ] Add pytest-cov: `pytest-cov>=4.0.0`
- [ ] Verify `pytest backend/tests/` runs

---

### 0.2 Create Test Fixtures 🔴

**File**: `backend/tests/conftest.py`

```python
import pytest
import json
import os

@pytest.fixture
def sample_items():
    """Small subset of items for unit tests."""
    return {
        "Desc_OreIron_C": {"id": "Desc_OreIron_C", "name": "Iron Ore"},
        "Desc_IronIngot_C": {"id": "Desc_IronIngot_C", "name": "Iron Ingot"},
        "Desc_IronPlate_C": {"id": "Desc_IronPlate_C", "name": "Iron Plate"},
    }

@pytest.fixture
def sample_recipes():
    """Small subset of recipes for unit tests."""
    return {
        "Recipe_IngotIron_C": {
            "id": "Recipe_IngotIron_C",
            "name": "Iron Ingot",
            "time": 2.0,
            "ingredients": [{"item": "Desc_OreIron_C", "amount": 1}],
            "products": [{"item": "Desc_IronIngot_C", "amount": 1}],
            "producedIn": ["Desc_SmelterMk1_C"],
            "alternate": False
        }
    }

@pytest.fixture
def game_data():
    """Load actual game data for integration tests."""
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data1.0.json')
    with open(data_path) as f:
        return json.load(f)

@pytest.fixture
def edge_case_items():
    """Complex endgame items for solver stress tests."""
    return [
        "Desc_SpaceElevatorPart_7_C",  # Nuclear Pasta
        "Desc_SpaceElevatorPart_8_C",  # Thermal Propulsion Rocket
        "Desc_SpaceElevatorPart_5_C",  # Assembly Director System
        "Desc_SpaceElevatorPart_6_C",  # Magnetic Field Generator
        "Desc_ModularFrameFused_C",    # Fused Modular Frame
        "Desc_MotorLightweight_C",     # Turbo Motor
        "Desc_ComputerSuper_C",        # Supercomputer
        "Desc_CircuitBoardHighSpeed_C" # AI Limiter
    ]
```

- [ ] Create sample_items fixture
- [ ] Create sample_recipes fixture
- [ ] Create game_data fixture
- [ ] Create edge_case_items fixture
- [ ] Create flask test client fixture

---

## Phase 1 Tests: Config & Foundation

> **Blocked until**: Backend Phase 1 complete

### 1.1 Config Module Tests 🟢

**File**: `backend/tests/unit/test_config.py`

- [ ] Test all constants are importable
- [ ] Test `OPTIMIZATION_STRATEGIES` contains 5 strategies
- [ ] Test `DEFAULT_SOLVER_TIME_LIMIT` is reasonable (5-60)
- [ ] Test environment variable override for DEBUG

---

## Phase 2 Tests: Data Layer

> **Blocked until**: Backend Phase 2 complete

### 2.1 Loader Tests 🟠

**File**: `backend/tests/unit/test_data_loader.py`

- [ ] Test `load_game_data()` returns dict
- [ ] Test `load_game_data()` is cached (same object returned)
- [ ] Test `get_items()` returns non-empty dict
- [ ] Test `get_recipes()` returns non-empty dict

---

### 2.2 Base Resources Tests 🟠

**File**: `backend/tests/unit/test_base_resources.py`

- [ ] Test `is_base_resource("Desc_OreIron_C")` returns True
- [ ] Test `is_base_resource("Desc_IronIngot_C")` returns False
- [ ] Test `get_extraction_rate("Desc_OreIron_C")` returns 60
- [ ] Test `get_extraction_machine("Desc_LiquidOil_C")` returns "Oil Extractor"

---

### 2.3 Items Accessor Tests 🟢

**File**: `backend/tests/unit/test_data_items.py`

- [ ] Test `get_item()` for valid item
- [ ] Test `get_item()` for invalid item returns None
- [ ] Test `get_item_name()` for valid item
- [ ] Test `item_exists()` for valid and invalid items

---

### 2.4 Recipes Accessor Tests 🟠

**File**: `backend/tests/unit/test_data_recipes.py`

- [ ] Test `get_recipe()` for valid recipe
- [ ] Test `get_recipes_for_item("Desc_IronIngot_C")` returns list
- [ ] Test `is_alternate_recipe()` for standard and alternate
- [ ] Test `get_default_active_recipes()` returns dict with correct defaults

---

## Phase 3 Tests: Utilities

> **Blocked until**: Backend Phase 3 complete

### 3.1 Math Helpers Tests 🟠

**File**: `backend/tests/unit/test_math_helpers.py`

- [ ] Test `round_to_precision(1.23456789, 4)` returns 1.2346
- [ ] Test `round_to_precision(None)` returns 0.0
- [ ] Test `round_to_precision(float('nan'))` returns 0.0
- [ ] Test `round_to_precision(float('inf'))` returns 0.0
- [ ] Test `clean_nan_values()` with nested dict containing NaN
- [ ] Test `clean_nan_values()` with list containing Inf

---

### 3.2 Machine Helpers Tests 🟠

**File**: `backend/tests/unit/test_machine_helpers.py`

- [ ] Test `get_machine_display_name("Desc_SmelterMk1_C")` returns "Smelter"
- [ ] Test `get_machine_display_name("Unknown_C")` returns cleaned fallback
- [ ] Test `calculate_machine_info(2.5, "Smelter")` returns correct structure
- [ ] Test `calculate_machine_info()` actual_machines is ceiling of theoretical
- [ ] Test `calculate_machine_info()` efficiency calculation is correct

---

## Phase 4 Tests: MILP Solver

> **Blocked until**: Backend Phase 4 complete

### 4.1 Strategy Weights Tests 🟠

**File**: `backend/tests/unit/test_strategy_weights.py`

- [ ] Test `get_strategy_weights("balanced_production")` returns dict
- [ ] Test `get_strategy_weights("custom", {"base": 2.0})` overrides
- [ ] Test `get_strategy_weights("invalid")` falls back to balanced
- [ ] Test all 5 strategies have weights defined

---

### 4.2 Dependency Graph Tests 🔴

**File**: `backend/tests/unit/test_dependency_graph.py`

- [ ] Test simple dependency: Iron Plate → Iron Ingot → Iron Ore
- [ ] Test base resource has no dependencies
- [ ] Test with all recipes disabled returns empty
- [ ] Test depth limiting prevents infinite loops
- [ ] Test circular dependency doesn't hang (timeout test)

---

### 4.3 MILP Solver Tests 🔴

**File**: `backend/tests/unit/test_milp_solver.py`

- [ ] Test simple production: 60 Iron Ingots/min
- [ ] Test multi-step: 60 Iron Plates/min
- [ ] Test with `resource_efficiency` strategy
- [ ] Test with `compact_build` strategy
- [ ] Test infeasible returns None (all recipes disabled)
- [ ] Test result has required fields
- [ ] Test machines_needed is positive
- [ ] Test proven_optimal is boolean

---

## Phase 5 Tests: Services

> **Blocked until**: Backend Phase 5 complete

### 5.1 Summary Service Tests 🟠

**File**: `backend/tests/unit/test_summary_service.py`

- [ ] Test `calculate_summary_stats()` returns required fields
- [ ] Test `total_machines` is sum of recipe node machines
- [ ] Test `base_resources` dict is populated
- [ ] Test empty graph doesn't crash

---

## Phase 6 Tests: API Integration

> **Blocked until**: Backend Phase 6 complete

### 6.1 API Endpoint Tests 🔴

**File**: `backend/tests/integration/test_api.py`

```python
def test_health_endpoint(client):
    response = client.get('/api/health')
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'healthy'

def test_items_endpoint(client):
    response = client.get('/api/items')
    assert response.status_code == 200
    data = response.get_json()
    assert 'Desc_IronIngot_C' in data

def test_recipes_endpoint(client):
    response = client.get('/api/recipes')
    assert response.status_code == 200
    data = response.get_json()
    assert 'Recipe_IngotIron_C' in data
    assert 'active' in data['Recipe_IngotIron_C']

def test_calculate_valid(client):
    response = client.post('/api/calculate', json={
        'item': 'Desc_IronPlate_C',
        'amount': 60
    })
    assert response.status_code == 200
    data = response.get_json()
    assert 'production_graph' in data
    assert 'summary' in data

def test_calculate_with_active_recipes(client):
    response = client.post('/api/calculate', json={
        'item': 'Desc_IronPlate_C',
        'amount': 60,
        'active_recipes': {
            'Recipe_IronPlate_C': True,
            'Recipe_IngotIron_C': True
        }
    })
    assert response.status_code == 200

def test_calculate_missing_item(client):
    response = client.post('/api/calculate', json={
        'amount': 60
    })
    assert response.status_code == 400

def test_calculate_invalid_item(client):
    response = client.post('/api/calculate', json={
        'item': 'Desc_DoesNotExist_C',
        'amount': 60
    })
    assert response.status_code == 400
```

- [ ] Test `GET /api/health` returns 200
- [ ] Test `GET /api/items` returns valid data
- [ ] Test `GET /api/recipes` returns recipes with `active` field
- [ ] Test `POST /api/calculate` with valid input
- [ ] Test `POST /api/calculate` with active_recipes parameter
- [ ] Test `POST /api/calculate` with all strategies
- [ ] Test 400 for missing item
- [ ] Test 400 for invalid item
- [ ] Test 400 for zero/negative amount
- [ ] Test **no** POST /api/active-recipes endpoint (should 404)

---

## Edge Case Tests (Critical) 🔴

> **Blocked until**: Backend Phase 6 complete + all integration tests pass

These tests prove the solver handles the most complex production chains.

**File**: `backend/tests/test_edge_cases.py`

### Nuclear Pasta (Desc_SpaceElevatorPart_7_C)

The most complex item in the game.

```python
import pytest
import time

def test_nuclear_pasta_balanced(client):
    """Nuclear Pasta with balanced strategy."""
    start = time.time()
    response = client.post('/api/calculate', json={
        'item': 'Desc_SpaceElevatorPart_7_C',
        'amount': 1,
        'optimization_strategy': 'balanced_production'
    })
    elapsed = time.time() - start
    
    assert response.status_code == 200, f"Failed: {response.get_json()}"
    assert elapsed < 60, f"Took {elapsed:.1f}s, expected < 60s"
    
    data = response.get_json()
    assert data['production_graph']['recipe_nodes'], "Must have recipe nodes"
    assert data['summary']['total_base_resource_amount'] > 0

def test_nuclear_pasta_resource_efficiency(client):
    """Nuclear Pasta with resource efficiency."""
    response = client.post('/api/calculate', json={
        'item': 'Desc_SpaceElevatorPart_7_C',
        'amount': 1,
        'optimization_strategy': 'resource_efficiency'
    })
    assert response.status_code == 200
```

- [ ] Test Nuclear Pasta with balanced strategy (< 60s)
- [ ] Test Nuclear Pasta with resource_efficiency
- [ ] Test Nuclear Pasta with compact_build
- [ ] Verify base resources are reasonable

---

### Thermal Propulsion Rocket (Desc_SpaceElevatorPart_8_C)

- [ ] Test with balanced strategy
- [ ] Test with all strategies
- [ ] Verify unique_recipes count is reasonable

---

### Assembly Director System (Desc_SpaceElevatorPart_5_C)

- [ ] Test production of 1/min
- [ ] Verify Supercomputer is in production chain

---

### Magnetic Field Generator (Desc_SpaceElevatorPart_6_C)

- [ ] Test with resource_consolidation
- [ ] Verify base_resource_types is minimized

---

### Fused Modular Frame (Desc_ModularFrameFused_C)

- [ ] Test doesn't infinite loop (< 30s)
- [ ] Test with various recipe combinations

---

### Turbo Motor (Desc_MotorLightweight_C)

- [ ] Test resource_efficiency uses fewer resources than balanced
- [ ] Test compact_build uses fewer recipes than balanced

---

### Supercomputer (Desc_ComputerSuper_C)

- [ ] Test with standard recipes only
- [ ] Test with alternates enabled

---

### Strategy Comparison Suite 🔴

**File**: `backend/tests/test_strategy_comparison.py`

```python
import pytest

EDGE_CASE_ITEMS = [
    "Desc_SpaceElevatorPart_7_C",
    "Desc_SpaceElevatorPart_8_C",
    "Desc_SpaceElevatorPart_5_C",
    "Desc_SpaceElevatorPart_6_C",
]

@pytest.mark.parametrize("item_id", EDGE_CASE_ITEMS)
def test_all_strategies_produce_valid_output(client, item_id):
    """Every strategy must produce a valid result for every edge case item."""
    strategies = ['resource_efficiency', 'compact_build', 'resource_consolidation', 'balanced_production']
    
    for strategy in strategies:
        response = client.post('/api/calculate', json={
            'item': item_id,
            'amount': 1,
            'optimization_strategy': strategy
        })
        assert response.status_code == 200, f"{strategy} failed for {item_id}"
        data = response.get_json()
        assert data['production_graph']['recipe_nodes'], f"No nodes for {strategy}/{item_id}"
```

- [ ] Test all 4 strategies produce valid output for all edge case items
- [ ] Test resource_efficiency minimizes base resources
- [ ] Test compact_build minimizes recipe count
- [ ] Test resource_consolidation minimizes base resource types

---

## Performance Tests 🟡

**File**: `backend/tests/test_performance.py`

```python
import time
import pytest

def test_simple_item_under_1_second(client):
    """Simple items should calculate in under 1 second."""
    start = time.time()
    response = client.post('/api/calculate', json={
        'item': 'Desc_IronPlate_C',
        'amount': 60
    })
    elapsed = time.time() - start
    
    assert response.status_code == 200
    assert elapsed < 1.0, f"Simple item took {elapsed:.2f}s"

def test_medium_complexity_under_5_seconds(client):
    """Medium items (Modular Frame) should calculate in under 5 seconds."""
    start = time.time()
    response = client.post('/api/calculate', json={
        'item': 'Desc_ModularFrame_C',
        'amount': 10
    })
    elapsed = time.time() - start
    
    assert response.status_code == 200
    assert elapsed < 5.0

@pytest.mark.parametrize("item_id", [
    "Desc_SpaceElevatorPart_7_C",
    "Desc_SpaceElevatorPart_8_C",
])
def test_edge_case_under_60_seconds(client, item_id):
    """Most complex items must complete within solver time limit."""
    start = time.time()
    response = client.post('/api/calculate', json={
        'item': item_id,
        'amount': 1,
        'solver': {'time_limit': 60}
    })
    elapsed = time.time() - start
    
    assert response.status_code == 200
    assert elapsed < 65  # Allow small overhead
```

- [ ] Simple items < 1 second
- [ ] Medium complexity < 5 seconds
- [ ] Edge cases < 60 seconds
- [ ] Solver respects time_limit parameter

---

## Completion Checklist

Before deployment:

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All edge case tests pass
- [ ] All performance tests pass
- [ ] Coverage > 80% for backend
- [ ] `pytest backend/tests/ -v --cov=backend`
- [ ] No flaky tests

---

## Notes for Testing Agent

1. **Wait for Backend** - Don't write tests for unfinished modules
2. **Start with Phase 0** - Set up infrastructure immediately
3. **Run tests often** - Verify against actual code
4. **Edge cases are critical** - These prove production readiness
5. **Performance matters** - Endgame items must complete reasonably
6. **No frontend testing** - That's for Frontend Agent after migration
