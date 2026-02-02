"""
Health check route for Satisfactory Factory Calculator.
"""

from flask import Blueprint, jsonify
from datetime import datetime

health_bp = Blueprint('health', __name__)

@health_bp.route('/api/health', methods=['GET'])
def health():
    """Check if the API is running and responsive."""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    })
