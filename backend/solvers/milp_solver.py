"""
Core MILP solver for Satisfactory Factory Calculator.
Uses PuLP to find the optimal production chain based on a target item and amount.
"""

import time
from collections import defaultdict
from typing import Dict, Any, List, Set, Tuple, Optional
from ..utils.math_helpers import clean_nan_values, round_to_precision

try:
    from pulp import (
        LpProblem, LpVariable, LpMinimize, lpSum, 
        LpStatusOptimal, value, PULP_CBC_CMD, LpStatus
    )
    PULP_AVAILABLE = True
except ImportError:
    PULP_AVAILABLE = False

from ..config import (
    DEFAULT_SOLVER_TIME_LIMIT, DEFAULT_REL_GAP, 
    BIG_M_MACHINE, BIG_M_BASE, DEBUG_CALC
)
from .strategy_weights import get_strategy_weights, get_strategy_priorities
from .dependency_graph import dependency_closure_recipes
from .graph_builder import build_recipe_node, build_base_resource_node
from ..data.base_resources import is_base_resource, BASE_RESOURCE_RATES


class MILPSolver:
    """
    Mixed-Integer Linear Programming solver for factory production chains.
    Stateless implementation that takes item and recipe data as input.
    """

    def __init__(self, items_data: Dict[str, Any], recipes_data: Dict[str, Any]):
        self.items = items_data
        self.recipes = recipes_data
        
        if not PULP_AVAILABLE:
            raise RuntimeError("PuLP library is not installed in the environment.")

    def optimize(self, 
                 targets: List[Dict[str, Any]] = None,
                 strategy: str = 'balanced_production',
                 active_map: Dict[str, bool] = None,
                 custom_weights: Dict[str, float] = None, 
                 time_limit: float = None, 
                 rel_gap: float = None,
                 # Legacy single-target params (deprecated but supported)
                 target_item: str = None,
                 amount_per_min: float = None) -> Optional[Dict[str, Any]]:
        """
        Find the optimal production chain for given target(s).
        
        Args:
            targets: List of targets [{"item": str, "amount": float}, ...]
            strategy: Optimization strategy name
            active_map: Recipe enable/disable map
            custom_weights: Weights for 'custom' strategy
            time_limit: Solver time limit in seconds
            rel_gap: Relative gap tolerance
            target_item: (DEPRECATED) Single target item ID
            amount_per_min: (DEPRECATED) Single target amount
        
        Returns:
            Graph dictionary or None if infeasible.
        """
        # Handle legacy positional argument API: optimize("item", amount, "strategy", active_map)
        # In this case, targets would be a string (the old target_item)
        if isinstance(targets, str):
            # Legacy positional call: optimize(target_item, amount, strategy, active_map)
            legacy_target_item = targets
            legacy_amount = strategy  # second positional arg
            legacy_strategy = active_map if isinstance(active_map, str) else 'balanced_production'
            legacy_active_map = custom_weights if isinstance(custom_weights, dict) else {}
            
            targets = [{"item": legacy_target_item, "amount": float(legacy_amount)}]
            strategy = legacy_strategy
            active_map = legacy_active_map
            custom_weights = None
        
        # Handle legacy keyword argument API
        if targets is None:
            if target_item is not None and amount_per_min is not None:
                targets = [{"item": target_item, "amount": amount_per_min}]
            else:
                raise ValueError("Must provide 'targets' list or legacy 'target_item'/'amount_per_min' parameters")
        
        if not targets:
            raise ValueError("Must provide at least one target")
            
        if active_map is None:
            active_map = {}
            
        # Validate all target items exist
        for t in targets:
            item_id = t.get('item')
            if item_id not in self.items:
                raise ValueError(f"Unknown target item: {item_id}")

        t_limit = time_limit if time_limit is not None else DEFAULT_SOLVER_TIME_LIMIT
        gap = rel_gap if rel_gap is not None else DEFAULT_REL_GAP
        weights = get_strategy_weights(strategy, custom_weights)

        # Extract target item IDs
        target_item_ids = [t['item'] for t in targets]

        # 1. Dependency closure prune (multi-target version)
        from .dependency_graph import dependency_closure_multi
        needed_items, needed_recipes = dependency_closure_multi(target_item_ids, self.recipes, active_map)
        active_recipe_ids = list(needed_recipes)

        if not active_recipe_ids:
            # Check if ALL targets are base resources (no recipes needed)
            all_base = all(is_base_resource(t['item']) for t in targets)
            if all_base:
                recipe_nodes = {}
                for i, t in enumerate(targets):
                    node_id = f"extract_{t['item']}_{i}"
                    recipe_nodes[node_id] = build_base_resource_node(node_id, t['item'], t['amount'])
                return {
                    'recipe_nodes': recipe_nodes,
                    'targets': targets,
                    # Legacy compatibility fields
                    'target_item': targets[0]['item'] if len(targets) == 1 else None,
                    'target_amount': targets[0]['amount'] if len(targets) == 1 else None,
                    'strategy': strategy,
                    'proven_optimal': True,
                    'is_base_only': True
                }
            # Some non-base targets but no recipes available
            missing = [t['item'] for t in targets if not is_base_resource(t['item'])]
            raise ValueError(f"No active recipes available to produce: {', '.join(missing)}")

        # Base items involved in this closure
        base_items = [iid for iid in needed_items if is_base_resource(iid)]

        # 2. Main solve logic
        if strategy == 'custom':
            # Weighted single pass for custom strategy
            result = self._solve_weighted(
                targets, active_recipe_ids, base_items,
                weights, t_limit, gap
            )
        else:
            # Lexicographical solve for standard strategies
            priorities = get_strategy_priorities(strategy)
            
            # Special case for balanced: pre-pass to avoid degenerate solutions
            if strategy == 'balanced_production':
                if DEBUG_CALC:
                    print("[MILP] Running balanced pre-pass...")
            
            result = self._solve_lexicographic(
                targets, active_recipe_ids, base_items,
                priorities, t_limit, gap
            )

        if result is None:
            return None

        # 3. Extract results and build graph
        model, m_vars, y_recipe, base_use, base_used_bin, comps, proven_optimal, comp_values = result

        recipe_nodes = {}
        node_counter = 0

        # Build recipe nodes
        target_item_set = set(target_item_ids)
        for rid in active_recipe_ids:
            mv = value(m_vars[rid])
            if mv and mv > 1e-6:
                rec = self.recipes[rid]
                t = rec.get('time', 1.0) or 1.0
                cycles = 60.0 / t
                
                # Calculate flow rates with precision rounding
                inputs = {ing['item']: round_to_precision(ing['amount'] * cycles * mv) for ing in rec.get('ingredients', [])}
                outputs = {p['item']: round_to_precision(p['amount'] * cycles * mv) for p in rec.get('products', [])}
                
                # Filter to only relevant items (optional but cleaner)
                inputs = {k: v for k, v in inputs.items() if k in needed_items}
                outputs = {k: v for k, v in outputs.items() if k in (set(needed_items) | target_item_set)}

                node_id = f"recipe_{rid}_{node_counter}"
                node_counter += 1
                recipe_nodes[node_id] = build_recipe_node(
                    node_id, rid, rec, mv, cycles, inputs, outputs
                )

        # Build base resource nodes
        for iid in base_items:
            val = value(base_use[iid])
            if val and val > 1e-6:
                node_id = f"extract_{iid}_{node_counter}"
                node_counter += 1
                recipe_nodes[node_id] = build_base_resource_node(node_id, iid, val)

        return {
            'recipe_nodes': recipe_nodes,
            'targets': targets,
            # Legacy compatibility fields (for single-target requests)
            'target_item': targets[0]['item'] if len(targets) == 1 else None,
            'target_amount': targets[0]['amount'] if len(targets) == 1 else None,
            'weights_used': weights,
            'strategy': strategy,
            'objective_components': {k: float(v) for k, v in comp_values.items()},
            'solver_time_limit': t_limit,
            'solver_gap': gap,
            'proven_optimal': proven_optimal
        }

    def _build_base_model(self, targets: List[Dict[str, Any]], 
                          active_recipe_ids: List[str], base_items: List[str]) -> Tuple:
        """
        Helper to build consistent PuLP model structure.
        
        Args:
            targets: List of targets [{"item": str, "amount": float}, ...]
            active_recipe_ids: List of recipe IDs to consider
            base_items: List of base resource item IDs
        """
        model = LpProblem('production_plan', LpMinimize)
        
        # Machine variables (continuous count) and Activity variables (binary used/not)
        m_vars = {rid: LpVariable(f'm_{rid}', lowBound=0) for rid in active_recipe_ids}
        y_recipe = {rid: LpVariable(f'y_{rid}', lowBound=0, upBound=1, cat='Binary') for rid in active_recipe_ids}
        
        # Big-M constraint for production
        for rid in active_recipe_ids:
            model += m_vars[rid] <= BIG_M_MACHINE * y_recipe[rid]
            
        # Base resource variables
        base_use = {iid: LpVariable(f'base_{iid}', lowBound=0) for iid in base_items}
        base_used_bin = {iid: LpVariable(f'ub_{iid}', lowBound=0, upBound=1, cat='Binary') for iid in base_items}
        
        for iid in base_items:
            model += base_use[iid] <= BIG_M_BASE * base_used_bin[iid]

        # Build production and consumption coefficients
        prod_coeff = defaultdict(lambda: defaultdict(float))
        cons_coeff = defaultdict(lambda: defaultdict(float))
        
        for rid in active_recipe_ids:
            rec = self.recipes[rid]
            t = rec.get('time', 1.0) or 1.0
            cyc = 60.0 / t
            for p in rec.get('products', []):
                prod_coeff[p['item']][rid] += p['amount'] * cyc
            for ing in rec.get('ingredients', []):
                cons_coeff[ing['item']][rid] += ing['amount'] * cyc

        # Build targets lookup: item_id -> amount
        target_demands = {t['item']: t['amount'] for t in targets}
        target_item_ids = set(target_demands.keys())

        # Item balance constraints: Production - Consumption >= Demand
        all_relevant_items = set(prod_coeff.keys()) | set(cons_coeff.keys()) | target_item_ids
        for iid in all_relevant_items:
            if is_base_resource(iid):
                if iid in cons_coeff:
                    model += base_use[iid] >= lpSum(cons_coeff[iid][rid] * m_vars[rid] for rid in cons_coeff[iid])
            else:
                prod_expr = lpSum(prod_coeff[iid][rid] * m_vars[rid] for rid in prod_coeff.get(iid, {})) if iid in prod_coeff else 0
                cons_expr = lpSum(cons_coeff[iid][rid] * m_vars[rid] for rid in cons_coeff.get(iid, {})) if iid in cons_coeff else 0
                demand = target_demands.get(iid, 0)
                
                # Production of targets must be exactly enough (with tiny tolerance)
                if demand > 0:
                    model += prod_expr - cons_expr >= demand
                    model += prod_expr - cons_expr <= demand * 1.0000001
                else:
                    model += prod_expr - cons_expr >= 0

        # Objective components
        comps = {
            'total_base': lpSum(base_use[i] for i in base_items) if base_items else 0,
            'uniq_base_types': lpSum(base_used_bin[i] for i in base_items) if base_items else 0,
            'machines': lpSum(m_vars[r] for r in active_recipe_ids),
            'uniq_recipes': lpSum(y_recipe[r] for r in active_recipe_ids)
        }
        
        return model, m_vars, y_recipe, base_use, base_used_bin, comps

    def _solve_weighted(self, targets: List[Dict[str, Any]], 
                        active_recipe_ids: List[str], base_items: List[str], 
                        weights: Dict[str, float], time_limit: float, rel_gap: float):
        """Single-pass weighted optimization."""
        model, m_vars, y_recipe, base_use, base_used_bin, comps = self._build_base_model(
            targets, active_recipe_ids, base_items
        )
        
        # Weighted objective
        model += (
            weights['base'] * comps['total_base'] +
            weights['base_types'] * comps['uniq_base_types'] +
            weights['machines'] * comps['machines'] +
            weights['recipes'] * comps['uniq_recipes']
        )
        
        solver = PULP_CBC_CMD(
            timeLimit=max(1, int(time_limit)), 
            msg=DEBUG_CALC, 
            gapRel=rel_gap if rel_gap > 0 else None
        )
        status = model.solve(solver)
        
        if LpStatus[status] in ('Infeasible', 'Undefined'):
            return None
            
        proven_optimal = (LpStatus[status] == 'Optimal')
        comp_values = {k: value(v) for k, v in comps.items()}
        
        return model, m_vars, y_recipe, base_use, base_used_bin, comps, proven_optimal, comp_values

    def _solve_lexicographic(self, targets: List[Dict[str, Any]], 
                             active_recipe_ids: List[str], base_items: List[str], 
                             order: List[str], time_limit: float, rel_gap: float):
        """Multi-pass lexicographic optimization."""
        fixed_values = {}
        remaining_time = time_limit
        passes = len(order)
        
        last_success = None
        overall_proven_optimal = True
        
        for idx, component_name in enumerate(order):
            # Allocate time for this pass
            alloc_time = max(1, int(remaining_time / (passes - idx)))
            
            model, m_vars, y_recipe, base_use, base_used_bin, comps = self._build_base_model(
                targets, active_recipe_ids, base_items
            )
            
            # Constrain previously optimized components to their optimal values (relax slightly for precision)
            for prev_name, prev_val in fixed_values.items():
                model += comps[prev_name] <= prev_val * 1.0000001
                model += comps[prev_name] >= prev_val * 0.9999999
                
            # Current objective
            model += comps[component_name]
            
            solver = PULP_CBC_CMD(
                timeLimit=alloc_time, 
                msg=False, 
                gapRel=rel_gap if rel_gap > 0 else None
            )
            status = model.solve(solver)
            st_str = LpStatus[status]
            
            if DEBUG_CALC:
                print(f"[MILP] Lex pass {idx+1}/{passes} ({component_name}): status={st_str}, time={alloc_time}s")
                
            if st_str in ('Infeasible', 'Undefined'):
                # If the first pass is infeasible, the whole problem is infeasible.
                # If subsequent passes are infeasible, it might be due to floating point tightening.
                if idx == 0: return None
                # Otherwise, use the last successful pass
                break
                
            val = value(comps[component_name])
            fixed_values[component_name] = val
            
            is_optimal = (st_str == 'Optimal')
            if not is_optimal:
                overall_proven_optimal = False
                
            last_success = (model, m_vars, y_recipe, base_use, base_used_bin, comps, overall_proven_optimal, dict(fixed_values))
            
            remaining_time -= alloc_time
            if remaining_time <= 0:
                if idx < passes - 1:
                    overall_proven_optimal = False
                break
                
        return last_success

