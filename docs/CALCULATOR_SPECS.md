# Calculator Enhancements Technical Specification

## Overview
This document outlines the technical design for adding Multi-Target Optimization, Calculation Tabs, and Comparison capabilities to the SFC Calculator.

## 1. Multi-Target Optimization (Backend)

### Mathematical Model (MILP)
Currently, the solver optimizes for a single `target_item` with amount `A`.
New demand: Optimize for set of items $T = \{(i_1, a_1), (i_2, a_2), ...\}$.

**Constraints**:
For each target tuple $(item, amount)$ in $T$:
$$ Production(item) - Consumption(item) \ge amount $$

**Objective Function Upgrades**:
- **Resource Efficiency**: Minimize $\sum (resource\_weight_r \times input_r)$.
- **Balanced**: Minimize combination of machines and resources.
- **Weights**: Ensure the solver prioritizes fulfilling ALL targets. Logic remains mostly similar, just the demand constraints change from single to multiple equality/inequality constraints.

### Backend Refactoring
1.  **`milp_solver.py`**:
    -   Change `optimize(target_item, amount, ...)` to `optimize(targets: List[Dict], ...)`.
    -   Loop through `targets` to add `prob += ...` constraints.
2.  **`graph_builder.py`**:
    -   Update `build_end_product_node` to handle multiple end nodes.
    -   Maybe rename to `build_target_node(item, amount)`.
    -   Graph will have multiple "sink" nodes.
3.  **API (`calculate.py`)**:
    -   Accept `{"targets": [{"item": "iron-plate", "amount": 10}, ...]}`.
    -   Deprecate top-level `item` and `amount` (support them via compat layer).

## 2. Calculation Tabs (Frontend)

### State Structure
We need to move from a singleton state to a tab-based state.

```typescript
type TabId = string;

interface CalculationTab {
  id: TabId;
  name: string; // "Tab 1", "Iron Plate Factory", etc.
  // Independent Calculation State
  targets: { item: string, amount: number }[]; // Replaces single targetItem/Amount
  strategy: OptimizationStrategy;
  result: CalculateResponse | null;
  isCalculating: boolean;
}

interface CalculationStore {
  tabs: CalculationTab[];
  activeTabId: TabId;
  
  // Actions
  addTab: () => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabTarget: (id: string, targets: Target[]) => void;
  // ... other setters operate on *active* tab
}
```

### UI Components
- **`CalculatorTabs.tsx`**: A horizontal scrollable list of tabs at the top of the request panel.
- **Actions**: "+ New Tab", "x Close Tab", "Double click to rename".

## 3. Multi-Target Input UI

### Component: `TargetInputList.tsx`
- Replaces the single Item Select + Amount Input.
- **Layout**:
  - List of rows: `[Item Select] [Amount Input] [x Remove]`
  - "+ Add Product" button at bottom.
- **Validation**: Ensure at least one target exists.

## 4. Comparison View

### Concept
Allow users to compare the results of different tabs side-by-side. Useful for comparing "Resource Efficient" vs "Balanced" strategies for the same output.

### UI Implementation
- **Button**: "Compare Tabs" (enabled if >1 tab has results).
- **View**: Modal or split screen.
- **Metrics to Compare**:
  - Total Power (MW).
  - Total Buildings Count.
  - Resource Usage (Table/Chart).
    - Iron Ore: 100 vs 120
    - Copper Ore: 50 vs 0
  - Complexity Score (unique recipes/nodes).

### Data Source
- Use `useCalculationStore.tabs` to iterate over tabs with `result !== null`.
