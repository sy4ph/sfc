"""
Items route for Satisfactory Factory Calculator.
"""

from flask import Blueprint, jsonify
from ..data import get_items

items_bp = Blueprint('items', __name__)

@items_bp.route('/api/items', methods=['GET'])
def get_items_route():
    """Retrieve all producible items."""
    items = get_items()
    return jsonify(items)
