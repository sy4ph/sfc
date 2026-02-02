"""
Unit tests for recipe service.
"""

import pytest
from unittest.mock import patch
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend.services import recipe_service

class TestRecipeService:
    """Test recipe service logic."""

    @patch('backend.services.recipe_service.get_recipes')
    @patch('backend.services.recipe_service.get_default_active_recipes')
    @patch('backend.services.recipe_service.SPECIAL_RESOURCE_RECIPES', ['Recipe_Nuclear'])
    def test_get_all_recipes_with_status(self, mock_get_defaults, mock_get_recipes):
        """Test augmenting recipes with status and metadata."""
        mock_get_recipes.return_value = {
            "Recipe_Iron": {"name": "Iron Ingot"},
            "Recipe_Nuclear": {"name": "Uranium Fuel Cell"},
            "Recipe_Unpackage_Water": {"name": "Unpackage Water"}
        }
        mock_get_defaults.return_value = {
            "Recipe_Iron": True,
            "Recipe_Nuclear": False,
            "Recipe_Unpackage_Water": False
        }
        
        result = recipe_service.get_all_recipes_with_status()
        
        # Check normal recipe
        assert result["Recipe_Iron"]["active"] is True
        assert result["Recipe_Iron"]["special_resource"] is False
        assert result["Recipe_Iron"]["is_disabled"] is False
        
        # Check special resource
        assert result["Recipe_Nuclear"]["special_resource"] is True
        
        # Check unpackage (disabled by logic)
        assert result["Recipe_Unpackage_Water"]["is_disabled"] is True
        assert "prevent circular dependencies" in result["Recipe_Unpackage_Water"]["disabled_reason"]
