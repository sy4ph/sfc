"""
Unit tests for data items accessor module.
"""

import pytest
from unittest.mock import patch, Mock
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend.data import items

class TestDataItems:
    """Test item accessor functions."""

    @pytest.fixture
    def mock_items_data(self):
        return {
            "Desc_IronIngot_C": {
                "id": "Desc_IronIngot_C",
                "name": "Iron Ingot",
                "description": "Used for crafting.",
                "stackSize": 100,
                "sinkPoints": 2
            },
            "Desc_IronPlate_C": {
                "id": "Desc_IronPlate_C",
                "name": "Iron Plate",
                "stackSize": 200
            }
        }
        
    @pytest.fixture
    def mock_all_items_data(self, mock_items_data):
        # Includes unproducible items
        all_items = mock_items_data.copy()
        all_items["Desc_UnusedItem_C"] = {
            "id": "Desc_UnusedItem_C", 
            "name": "Unused Item",
            "description": "Not used."
        }
        return all_items

    def test_get_item(self, mock_items_data):
        """Test retrieving a single item."""
        with patch('backend.data.items.get_items', return_value=mock_items_data):
            # Valid item
            item = items.get_item("Desc_IronIngot_C")
            assert item is not None
            assert item["name"] == "Iron Ingot"
            
            # Invalid item
            item = items.get_item("Invalid_ID")
            assert item is None

    def test_get_item_name(self, mock_all_items_data):
        """Test retrieving item name."""
        with patch('backend.data.items.get_all_items', return_value=mock_all_items_data):
            # Valid item with name
            assert items.get_item_name("Desc_IronIngot_C") == "Iron Ingot"
            
            # Valid item (unused)
            assert items.get_item_name("Desc_UnusedItem_C") == "Unused Item"
            
            # Invalid item (returns ID)
            assert items.get_item_name("Invalid_ID") == "Invalid_ID"

    def test_item_exists(self, mock_items_data):
        """Test checking if item exists."""
        with patch('backend.data.items.get_items', return_value=mock_items_data):
            assert items.item_exists("Desc_IronIngot_C")
            assert not items.item_exists("Invalid_ID")
            
            # Unused item shouldn't exist in get_items() scope if mocked properly
            # (items.item_exists calls get_items(), which returns producible items)
            assert not items.item_exists("Desc_Unused_Item_C")

    def test_get_all_item_ids(self, mock_items_data):
        """Test retrieving all item IDs."""
        with patch('backend.data.items.get_items', return_value=mock_items_data):
            # Clear cache
            items.get_all_item_ids.cache_clear()
            
            ids = items.get_all_item_ids()
            assert isinstance(ids, frozenset)
            assert len(ids) == 2
            assert "Desc_IronIngot_C" in ids
            assert "Desc_IronPlate_C" in ids

    def test_get_item_description(self, mock_all_items_data):
        """Test retrieving item description."""
        with patch('backend.data.items.get_all_items', return_value=mock_all_items_data):
            # Item with description
            assert items.get_item_description("Desc_IronIngot_C") == "Used for crafting."
            
            # Item without description
            assert items.get_item_description("Desc_IronPlate_C") == ""
            
            # Invalid item
            assert items.get_item_description("Invalid_ID") == ""

    def test_get_item_stack_size(self, mock_all_items_data):
        """Test retrieving item stack size."""
        with patch('backend.data.items.get_all_items', return_value=mock_all_items_data):
            # Item with stack size
            assert items.get_item_stack_size("Desc_IronPlate_C") == 200
            
            # Item with default (100)
            assert items.get_item_stack_size("Desc_UnusedItem_C") == 100
            
            # Invalid item
            assert items.get_item_stack_size("Invalid_ID") == 100

    def test_get_item_sink_points(self, mock_all_items_data):
        """Test retrieving item sink points."""
        with patch('backend.data.items.get_all_items', return_value=mock_all_items_data):
            # Item with points
            assert items.get_item_sink_points("Desc_IronIngot_C") == 2
            
            # Item without points (0)
            assert items.get_item_sink_points("Desc_IronPlate_C") == 0
            
            # Invalid item
            assert items.get_item_sink_points("Invalid_ID") == 0
