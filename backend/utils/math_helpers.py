"""
Math helper functions for Satisfactory Factory Calculator.
"""

import math
from ..config import PRECISION_DIGITS

def round_to_precision(value, precision=PRECISION_DIGITS):
    """
    Round a value to the specified precision.
    Returns None if value is None.
    """
    if value is None:
        return None
    return round(float(value), precision)

def clean_nan_values(obj):
    """
    Recursively clean NaN and Infinity values from a JSON-serializable object.
    Replaces NaN/Inf with None.
    """
    if isinstance(obj, dict):
        return {k: clean_nan_values(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_nan_values(item) for item in obj]
    elif isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    else:
        return obj
