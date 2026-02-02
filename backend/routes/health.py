"""
Health check route for Satisfactory Factory Calculator.
"""

from flask import Blueprint, jsonify
from datetime import datetime

health_bp = Blueprint('health', __name__)

@health_bp.route('/api/health', methods=['GET'])
def health_check():
    """
    Simple health check endpoint.
    """
    import backend.services.summary_service as s
    import os
    return jsonify({
        'status': 'ok',
        'message': 'SFC Backend is running',
        'source_path': os.path.abspath(s.__file__),
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    })
