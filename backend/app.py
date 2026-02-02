"""
Satisfactory Factory Calculator - Backend API
Modularized Flask application using an app factory pattern.
"""

import os
from flask import Flask
from flask_cors import CORS

from .routes import health_bp, items_bp, recipes_bp, calculate_bp
from .config import PORT, DEBUG

def create_app(test_config=None):
    """
    Application factory to create and configure the Flask app.
    """
    app = Flask(__name__)
    
    # Configure CORS (allow all for development, restrict in production)
    CORS(app)
    
    # Load configuration
    if test_config:
        app.config.update(test_config)
    
    # Register Blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(items_bp)
    app.register_blueprint(recipes_bp)
    app.register_blueprint(calculate_bp)
    
    return app

if __name__ == '__main__':
    # For local development run: python app.py
    app = create_app()
    app.run(host='0.0.0.0', port=PORT, debug=DEBUG)