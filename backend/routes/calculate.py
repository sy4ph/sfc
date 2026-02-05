"""
Calculate route for Satisfactory Factory Calculator.
"""

from flask import Blueprint, request, jsonify
from ..services.calculation_service import calculate_production
from ..config import DEFAULT_SOLVER_TIME_LIMIT, DEFAULT_REL_GAP

calculate_bp = Blueprint('calculate', __name__)

@calculate_bp.route('/api/calculate', methods=['POST'])
def calculate_route():
    """
    Calculate the optimal production chain for target item(s).
    
    Accepts either:
    - New multi-target: {"targets": [{"item": str, "amount": float}, ...]}
    - Legacy single-target: {"item": str, "amount": float}
    """
    data = request.json or {}
    
    # 1. Extraction of parameters
    targets = data.get('targets')
    strategy = data.get('optimization_strategy', 'balanced_production')
    active_recipes = data.get('active_recipes')  # Map of recipe_id -> bool
    weights = data.get('weights')                 # Custom weights
    solver_opts = data.get('solver') or {}        # time_limit, rel_gap
    
    # Legacy single-target support
    if not targets:
        target_item = data.get('item')
        amount = data.get('amount')
        
        if not target_item:
            return jsonify({'error': 'Missing "targets" or "item" parameter'}), 400
            
        if amount is None:
            return jsonify({'error': 'Missing "amount" parameter'}), 400
            
        try:
            amount = float(amount)
            if amount <= 0:
                return jsonify({'error': 'Amount must be positive'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Amount must be a number'}), 400
        
        # Convert to targets list
        targets = [{"item": target_item, "amount": amount}]
    else:
        # Validate targets structure
        if not isinstance(targets, list):
            return jsonify({'error': '"targets" must be a list'}), 400
        if len(targets) == 0:
            return jsonify({'error': '"targets" must contain at least one target'}), 400
            
        for i, t in enumerate(targets):
            if not isinstance(t, dict):
                return jsonify({'error': f'Target at index {i} must be an object'}), 400
            if 'item' not in t:
                return jsonify({'error': f'Target at index {i} missing "item"'}), 400
            if 'amount' not in t:
                return jsonify({'error': f'Target at index {i} missing "amount"'}), 400
            try:
                t['amount'] = float(t['amount'])
                if t['amount'] <= 0:
                    return jsonify({'error': f'Target at index {i}: amount must be positive'}), 400
            except (ValueError, TypeError):
                return jsonify({'error': f'Target at index {i}: amount must be a number'}), 400
        
    # 2. Execution
    try:
        response = calculate_production(
            targets=targets,
            strategy=strategy,
            active_recipes=active_recipes,
            weights=weights,
            solver_opts=solver_opts
        )
        return jsonify(response)
        
    except ValueError as ve:
        # Business logic errors (e.g. infeasible, missing item)
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        # Unexpected server errors
        return jsonify({'error': f"Internal calculation error: {str(e)}"}), 500

