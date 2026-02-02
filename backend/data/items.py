"""
Items accessor module for Satisfactory Factory Calculator.
Provides functions to access and query item data.
"""

from functools import lru_cache
from .loader import get_items, get_all_items


def get_item(item_id: str) -> dict | None:
    """
    Get a single item by ID.
    Returns None if item doesn't exist.
    """
    items = get_items()
    return items.get(item_id)


def get_item_name(item_id: str) -> str:
    """
    Get the display name for an item.
    Returns the item_id if item doesn't exist or has no name.
    """
    all_items = get_all_items()
    item = all_items.get(item_id)
    if item:
        return item.get('name', item_id)
    return item_id


def item_exists(item_id: str) -> bool:
    """Check if an item exists in the game data."""
    items = get_items()
    return item_id in items


@lru_cache(maxsize=1)
def get_all_item_ids() -> frozenset:
    """
    Get a frozen set of all producible item IDs.
    Cached for performance.
    """
    items = get_items()
    return frozenset(items.keys())


def get_item_description(item_id: str) -> str:
    """
    Get the description for an item.
    Returns empty string if item doesn't exist or has no description.
    """
    all_items = get_all_items()
    item = all_items.get(item_id)
    if item:
        return item.get('description', '')
    return ''


def get_item_stack_size(item_id: str) -> int:
    """
    Get the stack size for an item.
    Returns 100 as default if not found.
    """
    all_items = get_all_items()
    item = all_items.get(item_id)
    if item:
        return item.get('stackSize', 100)
    return 100


def get_item_sink_points(item_id: str) -> int:
    """
    Get the AWESOME Sink points for an item.
    Returns 0 if not found.
    """
    all_items = get_all_items()
    item = all_items.get(item_id)
    if item:
        return item.get('sinkPoints', 0)
    return 0
