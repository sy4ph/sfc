# Satisfactory Factory Calculator - API Documentation

> **Version**: 2.0 (Stateless)  
> **Base URL**: `http://localhost:5000`  
> **Content-Type**: `application/json`

---

## Design Principles

### Stateless Architecture

This API is **fully stateless**. The server does not maintain any session or user-specific state between requests. All configuration (including active recipes) must be passed with each request.

**Benefits:**
- Horizontal scaling (any server instance can handle any request)
- Simpler deployment and testing
- Clients maintain full control over state
- No session synchronization issues

---

## Table of Contents

1. [Endpoints](#endpoints)
   - [Health Check](#health-check)
   - [Items](#items)
   - [Recipes](#recipes)
   - [Calculate](#calculate)
2. [Data Types](#data-types)
3. [Error Handling](#error-handling)
4. [Examples](#examples)

---

## Endpoints

### Health Check

#### `GET /api/health`

Check if the API is running and responsive.

**Response**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-02T10:00:00Z"
}
```

| Status Code | Description |
|-------------|-------------|
| 200 | API is healthy |
| 500 | API is unhealthy |

---

### Items

#### `GET /api/items`

Retrieve all game items. This is static reference data.

**Response**
```json
{
  "Desc_IronIngot_C": {
    "id": "Desc_IronIngot_C",
    "name": "Iron Ingot",
    "description": "Used for crafting...",
    "stackSize": 100,
    "sinkPoints": 1
  }
  // ... more items
}
```

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 500 | Server error |

---

### Recipes

#### `GET /api/recipes`

Retrieve all game recipes. This is static reference data. Includes default `active` status for each recipe.

**Response**
```json
{
  "Recipe_IngotIron_C": {
    "id": "Recipe_IngotIron_C",
    "name": "Iron Ingot",
    "time": 2.0,
    "ingredients": [
      { "item": "Desc_OreIron_C", "amount": 1 }
    ],
    "products": [
      { "item": "Desc_IronIngot_C", "amount": 1 }
    ],
    "producedIn": ["Desc_SmelterMk1_C"],
    "alternate": false,
    "active": true
  }
  // ... more recipes
}
```

> **Note**: The `active` field represents the default state. Clients should maintain their own active recipe state and pass it to `/api/calculate`.

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 500 | Server error |

---

### Calculate

#### `POST /api/calculate`

Calculate the optimal production chain for a target item.

**This is the primary endpoint.** All configuration, including which recipes to use, must be passed in the request body.

**Request Body**
```json
{
  "item": "Desc_SpaceElevatorPart_1_C",
  "amount": 10,
  "optimization_strategy": "balanced_production",
  "active_recipes": {
    "Recipe_IngotIron_C": true,
    "Recipe_Alternate_IngotIron_1_C": true,
    "Recipe_IronPlate_C": true
  },
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
```

**Request Parameters**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `item` | string | **Yes** | - | Target item ID |
| `amount` | number | **Yes** | - | Items per minute to produce |
| `optimization_strategy` | string | No | `balanced_production` | Strategy name |
| `active_recipes` | object | No | All active | Map of recipe_id → boolean |
| `weights` | object | No | Strategy defaults | Custom weights for `custom` strategy |
| `solver` | object | No | See below | Solver configuration |

**Active Recipes Behavior**

The `active_recipes` parameter controls which recipes the solver can use:

| Scenario | Behavior |
|----------|----------|
| Not provided | All non-alternate recipes active, alternates inactive |
| Empty object `{}` | All recipes inactive (will fail) |
| Partial map | Only listed recipes are considered; unlisted = inactive |
| Full map | Use exactly as specified |

**Recommended**: Always send the complete `active_recipes` map to ensure predictable behavior.

**Optimization Strategies**

| Strategy | Optimizes For |
|----------|---------------|
| `resource_efficiency` | Minimize total base resource consumption |
| `resource_consolidation` | Minimize variety of base resources |
| `compact_build` | Minimize unique recipes/machines |
| `balanced_production` | Balance resources and complexity |
| `custom` | Use provided weights |

**Custom Weights** (for `custom` strategy only)

| Weight | Description | Range |
|--------|-------------|-------|
| `base` | Penalty for total base resource amount | 0.0 - 10.0 |
| `base_types` | Penalty for number of base resource types | 0.0 - 10.0 |
| `machines` | Penalty for total machines | 0.0 - 10.0 |
| `recipes` | Penalty for number of unique recipes | 0.0 - 10.0 |

**Solver Options**

| Option | Type | Default | Range | Description |
|--------|------|---------|-------|-------------|
| `time_limit` | number | 10 | 1-120 | Maximum solver time (seconds) |
| `rel_gap` | number | 0.0 | 0.0-0.1 | Acceptable gap from optimal |

**Response**
```json
{
  "production_graph": {
    "recipe_nodes": {
      "recipe_Recipe_IngotIron_C_0": {
        "node_id": "recipe_Recipe_IngotIron_C_0",
        "recipe_id": "Recipe_IngotIron_C",
        "recipe_name": "Iron Ingot",
        "machine_type": "Desc_SmelterMk1_C",
        "machines_needed": 2.5,
        "actual_machines": 3,
        "machine_efficiency": 83.33,
        "machine_display": "3 Smelter @ 83.3%",
        "recipe_time": 2.0,
        "cycles_per_minute": 30.0,
        "is_base_resource": false,
        "is_alternate": false,
        "inputs": { "Desc_OreIron_C": 75.0 },
        "outputs": { "Desc_IronIngot_C": 75.0 },
        "optimal_recipe": true
      }
    },
    "target_item": "Desc_IronIngot_C",
    "target_amount": 75.0,
    "weights_used": { "base": 1.0, "base_types": 0.2, "machines": 0.0, "recipes": 1.0 },
    "strategy": "balanced_production",
    "proven_optimal": true
  },
  "target_item": "Desc_IronIngot_C",
  "target_item_name": "Iron Ingot",
  "amount_requested": 75.0,
  "optimization_strategy": "balanced_production",
  "summary": {
    "total_machines": 2.5,
    "total_actual_machines": 3,
    "machine_breakdown": { "Smelter": 3 },
    "base_resources": { "Desc_OreIron_C": 75.0 },
    "total_recipe_nodes": 1,
    "total_base_resource_nodes": 1,
    "unique_base_resource_types": 1,
    "total_base_resource_amount": 75.0,
    "unique_recipes": 1
  },
  "lp": true
}
```

**Response Fields**

| Field | Type | Description |
|-------|------|-------------|
| `production_graph.recipe_nodes` | object | Map of node_id → node data |
| `production_graph.proven_optimal` | boolean | True if solution is proven optimal |
| `summary` | object | Aggregated statistics |
| `lp` | boolean | True (indicates MILP solver used) |

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Missing/invalid parameters |
| 500 | Solver error or infeasible |

---

## Data Types

### TypeScript Definitions

```typescript
// ===== Request Types =====

interface CalculateRequest {
  item: string;                              // Required
  amount: number;                            // Required, > 0
  optimization_strategy?: OptimizationStrategy;
  active_recipes?: Record<string, boolean>;  // recipe_id → enabled
  weights?: StrategyWeights;
  solver?: SolverOptions;
}

type OptimizationStrategy =
  | 'resource_efficiency'
  | 'resource_consolidation'
  | 'compact_build'
  | 'balanced_production'
  | 'custom';

interface StrategyWeights {
  base: number;
  base_types: number;
  machines: number;
  recipes: number;
}

interface SolverOptions {
  time_limit?: number;  // seconds
  rel_gap?: number;     // 0.0 = optimal
}

// ===== Response Types =====

interface CalculateResponse {
  production_graph: ProductionGraph;
  target_item: string;
  target_item_name: string;
  amount_requested: number;
  optimization_strategy: string;
  summary: ProductionSummary;
  lp: boolean;
}

interface ProductionGraph {
  recipe_nodes: Record<string, RecipeNode>;
  target_item: string;
  target_amount: number;
  weights_used: StrategyWeights;
  strategy: string;
  proven_optimal: boolean;
}

interface RecipeNode {
  node_id: string;
  recipe_id: string;
  recipe_name: string;
  machine_type: string;
  machines_needed: number;
  actual_machines: number;
  machine_efficiency: number;
  machine_display: string;
  recipe_time?: number;
  cycles_per_minute?: number;
  is_base_resource: boolean;
  is_alternate?: boolean;
  is_surplus_node?: boolean;
  is_end_product_node?: boolean;
  inputs: Record<string, number>;
  outputs: Record<string, number>;
}

interface ProductionSummary {
  total_machines: number;
  total_actual_machines: number;
  machine_breakdown: Record<string, number>;
  base_resources: Record<string, number>;
  total_recipe_nodes: number;
  total_base_resource_nodes: number;
  unique_base_resource_types: number;
  total_base_resource_amount: number;
  unique_recipes: number;
}

// ===== Reference Data Types =====

interface Item {
  id: string;
  name: string;
  description?: string;
  stackSize?: number;
  sinkPoints?: number;
}

interface Recipe {
  id: string;
  name: string;
  time: number;
  ingredients: { item: string; amount: number }[];
  products: { item: string; amount: number }[];
  producedIn: string[];
  alternate: boolean;
  active: boolean;  // Default state only
}
```

---

## Error Handling

All errors return JSON with an `error` field:

```json
{
  "error": "Description of what went wrong"
}
```

| HTTP Code | Error | Cause |
|-----------|-------|-------|
| 400 | "Missing parameters" | `item` or `amount` not provided |
| 400 | "Invalid item" | Item ID not in game data |
| 400 | "Amount must be positive" | `amount` ≤ 0 |
| 500 | "No feasible solution" | MILP couldn't find valid chain |
| 500 | "No active recipes" | All recipes disabled |

---

## Examples

### Minimal Request

```bash
curl -X POST http://localhost:5000/api/calculate \
  -H "Content-Type: application/json" \
  -d '{"item": "Desc_IronPlate_C", "amount": 60}'
```

### Full Request with Active Recipes

```bash
curl -X POST http://localhost:5000/api/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "item": "Desc_ModularFrame_C",
    "amount": 10,
    "optimization_strategy": "compact_build",
    "active_recipes": {
      "Recipe_ModularFrame_C": true,
      "Recipe_IronPlate_C": true,
      "Recipe_IronRod_C": true,
      "Recipe_Screw_C": true,
      "Recipe_ReinforcedIronPlate_C": true,
      "Recipe_IngotIron_C": true
    }
  }'
```

### Custom Strategy with Weights

```bash
curl -X POST http://localhost:5000/api/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "item": "Desc_SpaceElevatorPart_7_C",
    "amount": 1,
    "optimization_strategy": "custom",
    "weights": {
      "base": 2.0,
      "base_types": 0.5,
      "machines": 0.0,
      "recipes": 1.5
    },
    "solver": {"time_limit": 60}
  }'
```

---

## Removed Endpoints

The following endpoints have been **removed** to ensure stateless operation:

| Endpoint | Reason |
|----------|--------|
| ~~`POST /api/active-recipes`~~ | State should be client-side; use `active_recipes` in calculate request |
| ~~`GET /api/active-recipes`~~ | Use `GET /api/recipes` and read default `active` field |

---

## Base Resource Reference

| Resource | ID | Default Rate |
|----------|-----|--------------|
| Iron Ore | `Desc_OreIron_C` | 60/min |
| Copper Ore | `Desc_OreCopper_C` | 60/min |
| Limestone | `Desc_Stone_C` | 60/min |
| Coal | `Desc_Coal_C` | 60/min |
| Caterium Ore | `Desc_OreGold_C` | 60/min |
| Raw Quartz | `Desc_RawQuartz_C` | 60/min |
| Sulfur | `Desc_Sulfur_C` | 60/min |
| Bauxite | `Desc_OreBauxite_C` | 60/min |
| Uranium | `Desc_OreUranium_C` | 60/min |
| SAM | `Desc_SAM_C` | 60/min |
| Crude Oil | `Desc_LiquidOil_C` | 120/min |
| Nitrogen Gas | `Desc_NitrogenGas_C` | 60/min |
| Water | `Desc_Water_C` | 120/min |
