"""
Recipes route for Satisfactory Factory Calculator.
"""

from flask import Blueprint, jsonify
from ..services.recipe_service import get_all_recipes_with_status

recipes_bp = Blueprint('recipes', __name__)

@recipes_bp.route('/api/recipes', methods=['GET'])
def get_recipes_route():
    """Retrieve all recipes with their default status and metadata."""
    recipes = get_all_recipes_with_status()
    return jsonify(recipes)

# Note: POST /api/active-recipes and GET /api/active-recipes were REMOVED 
# to ensure a stateless API. Clients should pass active_recipes in the 
# calculate request instead.
