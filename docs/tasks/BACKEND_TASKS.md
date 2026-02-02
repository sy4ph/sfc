# Backend Tasks - Satisfactory Factory Calculator

> **Owner**: Backend Agent  
> **Status**: Not Started  
> **Dependencies**: None (can start immediately)

---

## Overview

This document contains tasks for modularizing the Flask backend. **Testing is NOT part of backend tasks** - this agent focuses purely on refactoring code structure.

The Testing Agent will create tests AFTER each phase is complete. Backend Agent should notify when a phase is done.

---

## Task Legend

- `[ ]` Not started
- `[/]` In progress  
- `[x]` Complete
- `[!]` Blocked

**Priority**: 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

---

## Handoff Protocol

After completing each phase:
1. Commit changes with message: `[BACKEND] Phase X complete: <description>`
2. Update this document marking tasks as `[x]`
3. Testing Agent will then create tests for completed modules

---

## Phase 1: Foundation (Est. 2 hours)

### 1.1 Create Directory Structure 🔴

```
backend/
├── config.py           # NEW
├── routes/             # NEW
│   └── __init__.py
├── services/           # NEW
│   └── __init__.py
├── solvers/            # NEW
│   └── __init__.py
├── data/               # NEW
│   └── __init__.py
└── utils/              # NEW
    └── __init__.py
```

- [x] Create all directories listed above
- [x] Create empty `__init__.py` in each directory
- [x] Verify imports work: `from backend.routes import *`

---

### 1.2 Extract Config Module 🔴

**File**: `backend/config.py`

Extract from `app.py`:
- [x] `DEFAULT_SOLVER_TIME_LIMIT = 30`
- [x] `DEFAULT_REL_GAP = 0.0`
- [x] `DEBUG_CALC = False`
- [x] `PRECISION_DIGITS = 4`
- [x] `BIG_M_MACHINE = 10000`
- [x] `BIG_M_BASE = 100000`
- [x] `OPTIMIZATION_STRATEGIES` list
- [x] `REMOVED_STRATEGY` constant
- [x] `PORT` from environment
- [x] `DEBUG` from environment

**Source**: Lines 18-30, 1054-1078 of `app.py`

---

## Phase 2: Data Layer (Est. 3 hours)

### 2.1 Data Loader 🔴

**File**: `backend/data/loader.py`

- [x] Create `load_game_data()` with `@lru_cache`
- [x] Create `get_items()` accessor
- [x] Create `get_recipes()` accessor
- [x] Handle file path relative to module

**Source**: Lines 32-45 of `app.py`

---

### 2.2 Base Resources 🔴

**File**: `backend/data/base_resources.py`

- [x] Extract `BASE_RESOURCES` set
- [x] Extract `BASE_RESOURCE_RATES` dict
- [x] Extract `BASE_RESOURCE_MACHINES` dict
- [x] Create `is_base_resource(item_id)` function
- [x] Create `get_extraction_rate(item_id)` function
- [x] Create `get_extraction_machine(item_id)` function

**Source**: Lines 100-150, 200-205 of `app.py`

---

### 2.3 Items Accessor 🟠

**File**: `backend/data/items.py`

- [x] Create `get_item(item_id)` function
- [x] Create `get_item_name(item_id)` function
- [x] Create `item_exists(item_id)` function
- [x] Create `get_all_item_ids()` with cache

---

### 2.4 Recipes Accessor 🟠

**File**: `backend/data/recipes.py`

- [x] Create `get_recipe(recipe_id)` function
- [x] Create `get_recipes_for_item(item_id)` function
- [x] Create `get_all_recipe_ids()` function
- [x] Create `is_alternate_recipe(recipe_id)` function
- [x] Create `get_default_active_recipes()` function (returns standard recipes active, alternates inactive)

**Source**: Lines 290-340 of `app.py` (`find_recipes_for_item`)

---

## Phase 3: Utilities (Est. 2 hours)

### 3.1 Math Helpers 🟠

**File**: `backend/utils/math_helpers.py`

- [x] Extract `round_to_precision(value, digits)`
- [x] Extract `clean_nan_values(obj)` (recursive JSON cleaner)
- [x] Handle None, NaN, Inf edge cases

**Source**: Lines 70-85 of `app.py`

---

### 3.2 Machine Helpers 🟠

**File**: `backend/utils/machine_helpers.py`

- [x] Extract `MACHINE_DISPLAY_NAMES` dict
- [x] Create `get_machine_display_name(machine_id)` function
- [x] Create `calculate_machine_info(theoretical, machine_type)` function
- [x] Returns: `{theoretical, actual_machines, efficiency_percent, display_text}`

**Source**: Lines 160-250 of `app.py`

---

## Phase 4: MILP Solver (Est. 6 hours)

### 4.1 Strategy Weights 🔴

**File**: `backend/solvers/strategy_weights.py`

- [x] Extract `DEFAULT_STRATEGY_WEIGHTS` dict
- [x] Extract `STRATEGY_PRIORITIES` dict
- [x] Create `get_strategy_weights(strategy, custom_weights)` function
- [x] Create `validate_strategy(strategy)` function
- [x] Add docstrings explaining each strategy

**Source**: Lines 1064-1087 of `app.py`

---

### 4.2 Dependency Graph 🔴

**File**: `backend/solvers/dependency_graph.py`

- [x] Extract `_dependency_closure_recipes(target_item, active_map)`
- [x] Add depth limiting for safety
- [x] Add caching with `@lru_cache` (hash active_map for cache key)
- [x] Handle circular dependencies gracefully

**Source**: Lines 1098-1124, 500-560 of `app.py`

---

### 4.3 Graph Builder 🟠

**File**: `backend/solvers/graph_builder.py`

- [x] Create `build_recipe_node(recipe_id, machines, inputs, outputs, ...)` function
- [x] Create `build_base_resource_node(item_id, rate)` function
- [x] Create `build_end_product_node(target_item, amount)` function
- [x] Create `build_surplus_node(item_id, amount)` function
- [x] Ensure consistent node ID generation

**Source**: Lines 1303-1360 of `app.py`

---

### 4.4 MILP Solver Core 🔴

**File**: `backend/solvers/milp_solver.py`

- [x] Create `MILPSolver` class
- [x] `__init__(self, items, recipes)` - takes data as arguments (stateless)
- [x] `optimize(target, amount, strategy, active_recipes, weights, solver_opts)` method
- [x] `_build_model()` private method
- [x] `_add_balance_constraints()` private method
- [x] `_solve_lexicographic()` for non-custom strategies
- [x] `_solve_weighted()` for custom strategy
- [x] Return None for infeasible problems
- [x] Delete old `puLP_calc_v1.py` after integration

**Source**: Lines 1126-1374 of `app.py`

---

## Phase 5: Services (Est. 3 hours)

### 5.1 Recipe Service 🟠

**File**: `backend/services/recipe_service.py`

- [x] Create `get_all_recipes_with_defaults()` - for GET /api/recipes
- [x] Create `RecipeComplexityCalculator` class (if still needed)
- [x] Refactor to use data layer

**Source**: Lines 350-500 of `app.py`

---

### 5.2 Calculation Service 🟠

**File**: `backend/services/calculation_service.py`

- [x] Create `calculate_production(target, amount, strategy, active_recipes, weights, solver_opts)` function
- [x] Instantiate MILPSolver with loaded data
- [x] Call solver.optimize()
- [x] Call summary_service for stats
- [x] Return complete response structure

---

### 5.3 Summary Service 🟠

**File**: `backend/services/summary_service.py`

- [x] Extract `calculate_summary_stats(graph)` function
- [x] Ensure all fields needed by frontend are present
- [x] Use utility functions for rounding

**Source**: Lines 1375-1428 of `app.py`

---

## Phase 6: Routes (Est. 3 hours)

### 6.1 Health Route 🟢

**File**: `backend/routes/health.py`

- [x] Create Blueprint `health_bp`
- [x] `GET /api/health` endpoint
- [x] Return `{status: "healthy", timestamp: ISO8601}`

---

### 6.2 Items Route 🟢

**File**: `backend/routes/items.py`

- [x] Create Blueprint `items_bp`
- [x] `GET /api/items` endpoint
- [x] Return all items from data layer

---

### 6.3 Recipes Route 🟠

**File**: `backend/routes/recipes.py`

- [x] Create Blueprint `recipes_bp`
- [x] `GET /api/recipes` endpoint
- [x] Return all recipes with default `active` status
- [x] **REMOVE** `POST /api/active-recipes` (stateless API)
- [x] **REMOVE** `GET /api/active-recipes` (use GET /api/recipes instead)

---

### 6.4 Calculate Route 🔴

**File**: `backend/routes/calculate.py`

- [x] Create Blueprint `calculate_bp`
- [x] `POST /api/calculate` endpoint
- [x] Parse request: item, amount, strategy, active_recipes, weights, solver
- [x] Validate inputs (return 400 for invalid)
- [x] Handle missing `active_recipes` by using defaults
- [x] Call calculation_service
- [x] Return response with clean_nan_values

---

### 6.5 App Factory 🔴

**File**: `backend/app.py` (refactor)

- [x] Create `create_app()` factory function
- [x] Register all blueprints
- [x] Configure CORS
- [x] Configure static file serving for frontend
- [x] Create `app = create_app()` for WSGI
- [x] `if __name__ == '__main__':` for development
- [x] **Target: < 60 lines**

---

## Completion Checklist

Before marking backend complete:

- [x] All phases complete
- [x] `app.py` is under 60 lines
- [x] All imports work correctly
- [x] API responses match documentation exactly
- [x] No server-side state (stateless)
- [x] `POST /api/active-recipes` removed
- [x] `calculation/puLP_calc_v1.py` deleted
- [x] Flask dev server starts and works
- [x] Gunicorn starts and works

---

## File Deletion List

After refactoring is complete, delete:
- [x] `backend/calculation/puLP_calc_v1.py`
- [x] `backend/calculation/__init__.py` (if empty)
- [x] `backend/calculation/` directory

---

## Notes for Backend Agent

1. **Work in phases** - Complete one phase fully before moving to the next
2. **Keep app.py working** - Refactor incrementally; verify after each change
3. **Signal completion** - Update this file and commit after each phase
4. **No tests** - That's the Testing Agent's job
5. **Stateless** - No server-side recipe state; everything via request params
