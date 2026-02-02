# Backend routes package
# Contains Flask Blueprint routes for the API

from .health import health_bp
from .items import items_bp
from .recipes import recipes_bp
from .calculate import calculate_bp

__all__ = [
    'health_bp',
    'items_bp',
    'recipes_bp',
    'calculate_bp'
]
