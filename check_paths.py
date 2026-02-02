
import sys
import os
import backend.services.summary_service as s

print(f"Summary Service Path: {s.__file__}")

try:
    from backend.data.recipes import get_recipe_power_data
    print("get_recipe_power_data imported successfully")
except ImportError:
    print("ERROR: get_recipe_power_data NOT found in backend.data.recipes")

import backend.data.recipes as r
print(f"Recipes Path: {r.__file__}")
