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
    Calculate the optimal production chain for a target item.
    All configuration is passed in the request body (stateless).
    """
    data = request.json or {}
    
    # 1. Extraction of parameters
    target_item = data.get('item')
    amount = data.get('amount')
    strategy = data.get('optimization_strategy', 'balanced_production')
    active_recipes = data.get('active_recipes') # Map of recipe_id -> bool
    weights = data.get('weights')               # Custom weights
    solver_opts = data.get('solver') or {}      # time_limit, rel_gap
    
    # 2. Validation
    if not target_item:
        return jsonify({'error': 'Missing "item" parameter'}), 400
        
    if amount is None:
        return jsonify({'error': 'Missing "amount" parameter'}), 400
        
    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Amount must be a number'}), 400
        
    # 3. Execution
    try:
        response = calculate_production(
            target_item=target_item,
            amount=amount,
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
